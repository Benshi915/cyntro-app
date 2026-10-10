"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getViewer } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { ReactionKind, ReactionTarget } from "@/lib/types";
import { jerusalemToIso } from "@/lib/utils";

export type ActionState = { error?: string; ok?: boolean } | undefined;

const DEMO_ERROR = "מצב הדגמה: חברו את Supabase כדי לשמור נתונים.";

async function requireProfile() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (!viewer.profile) redirect("/onboarding");
  return { viewer, profile: viewer.profile, supabase: await createClient() };
}

/** Translate DB errors into something a person can act on. */
function friendly(message: string) {
  if (message.includes("profiles_handle_key")) return "שם המשתמש הזה כבר תפוס — נסו אחר.";
  if (message.includes("handle")) return "שם משתמש: 3–30 תווים, אותיות באנגלית קטנות, ספרות, נקודה או קו תחתון.";
  if (message.includes("event date is in the past")) return "התאריך כבר עבר.";
  if (message.includes("waiting for the other side")) return "ממתינים לתשובה מהצד השני.";
  if (message.includes("offer is not pending")) return "ההצעה כבר לא פתוחה.";
  if (message.includes("must be a venue profile") || message.includes("must be an artist profile"))
    return "הצעות נשלחות בין מקום לאמן.";
  return "משהו השתבש. נסו שוב.";
}

// ─────────────────────────────────────────────────────────────
// Profile (onboarding + settings)
// ─────────────────────────────────────────────────────────────
const num = z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().min(0).nullable());
const bool = z.preprocess((v) => v === "on" || v === "true", z.boolean());
const text = (max: number) => z.preprocess((v) => (typeof v === "string" && v.trim() ? v.trim() : null), z.string().max(max).nullable());

const profileSchema = z.object({
  role: z.enum(["artist", "venue", "fan"]),
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_.]{3,30}$/, "שם משתמש: 3–30 תווים באנגלית קטנה, ספרות, נקודה או קו תחתון."),
  display_name: z.string().trim().min(1, "מה השם?").max(80),
  tagline: text(120),
  bio: text(2000),
  city: text(60),
  lat: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().min(-90).max(90).nullable()),
  lng: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().min(-180).max(180).nullable()),
  genres: z.array(z.string()).max(8),
  avatar_url: text(500),
  cover_url: text(500),
  instagram: text(200),
  spotify: text(300),
  youtube: text(300),
  website: text(300),
  // artist
  act_type: z.preprocess((v) => v || null, z.enum(["solo", "duo", "band", "dj", "ensemble"]).nullable()),
  members_count: num,
  fee_min: num,
  fee_max: num,
  set_length_min: num,
  open_to_door_deals: bool,
  tech_needs: text(1000),
  // venue
  venue_type: z.preprocess(
    (v) => v || null,
    z.enum(["cafe", "bar", "restaurant", "club", "hall", "loft", "gallery", "outdoor", "other"]).nullable(),
  ),
  capacity: num,
  address: text(200),
  has_stage: bool,
  has_sound_system: bool,
  has_piano: bool,
  equipment: text(1000),
  budget_min: num,
  budget_max: num,
  music_nights: text(120),
});

export async function saveProfile(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured) return { error: DEMO_ERROR };
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const raw = Object.fromEntries(formData);
  const parsed = profileSchema.safeParse({ ...raw, genres: formData.getAll("genres") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "בדקו את הפרטים." };
  const { instagram, spotify, youtube, website, ...p } = parsed.data;

  const isArtist = p.role === "artist";
  const isVenue = p.role === "venue";
  const row = {
    ...p,
    links: Object.fromEntries(Object.entries({ instagram, spotify, youtube, website }).filter(([, v]) => v)),
    act_type: isArtist ? p.act_type : null,
    members_count: isArtist ? p.members_count : null,
    fee_min: isArtist ? p.fee_min : null,
    fee_max: isArtist ? p.fee_max : null,
    set_length_min: isArtist ? p.set_length_min : null,
    open_to_door_deals: isArtist ? p.open_to_door_deals : null,
    tech_needs: isArtist ? p.tech_needs : null,
    venue_type: isVenue ? p.venue_type : null,
    capacity: isVenue ? p.capacity : null,
    address: isVenue ? p.address : null,
    has_stage: isVenue ? p.has_stage : null,
    has_sound_system: isVenue ? p.has_sound_system : null,
    has_piano: isVenue ? p.has_piano : null,
    equipment: isVenue ? p.equipment : null,
    budget_min: isVenue ? p.budget_min : null,
    budget_max: isVenue ? p.budget_max : null,
    music_nights: isVenue ? p.music_nights : null,
  };

  const supabase = await createClient();
  const { error } = viewer.profile
    ? await supabase.from("profiles").update({ ...row, role: viewer.profile.role }).eq("id", viewer.profile.id)
    : await supabase.from("profiles").insert({ ...row, owner_id: viewer.userId });
  if (error) return { error: friendly(error.message) };

  revalidatePath("/", "layout");
  redirect(`/p/${row.handle}`);
}

// ─────────────────────────────────────────────────────────────
// Social
// ─────────────────────────────────────────────────────────────
export async function toggleReaction(targetType: ReactionTarget, targetId: string, kind: ReactionKind) {
  if (!isSupabaseConfigured) return { error: DEMO_ERROR };
  const { profile, supabase } = await requireProfile();
  const key = { profile_id: profile.id, target_id: targetId, kind };
  const { data: existing } = await supabase.from("reactions").select("kind").match(key).maybeSingle();
  if (existing) {
    await supabase.from("reactions").delete().match(key);
  } else {
    await supabase.from("reactions").insert({ ...key, target_type: targetType });
    // going & interested are mutually exclusive
    if (kind === "going" || kind === "interested") {
      await supabase
        .from("reactions")
        .delete()
        .match({ profile_id: profile.id, target_id: targetId, kind: kind === "going" ? "interested" : "going" });
    }
  }
  return { active: !existing };
}

export async function toggleFollow(profileId: string) {
  if (!isSupabaseConfigured) return { error: DEMO_ERROR };
  const { profile, supabase } = await requireProfile();
  const key = { follower_id: profile.id, following_id: profileId };
  const { data: existing } = await supabase.from("follows").select("follower_id").match(key).maybeSingle();
  if (existing) await supabase.from("follows").delete().match(key);
  else await supabase.from("follows").insert(key);
  return { active: !existing };
}

export async function openConversation(profileId: string) {
  if (!isSupabaseConfigured) return { error: DEMO_ERROR };
  const { supabase } = await requireProfile();
  const { data, error } = await supabase.rpc("start_conversation", { other: profileId });
  if (error) return { error: friendly(error.message) };
  redirect(`/messages/${data}`);
}

export async function sendMessage(conversationId: string, body: string) {
  if (!isSupabaseConfigured) return { error: DEMO_ERROR };
  const { profile, supabase } = await requireProfile();
  const trimmed = body.trim().slice(0, 4000);
  if (!trimmed) return { error: "ההודעה ריקה" };
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: profile.id, body: trimmed })
    .select()
    .single();
  if (error) return { error: friendly(error.message) };
  return { message: data };
}

export async function markConversationRead(conversationId: string) {
  if (!isSupabaseConfigured) return;
  const supabase = await createClient();
  await supabase.rpc("mark_conversation_read", { conv: conversationId });
}

// ─────────────────────────────────────────────────────────────
// Content
// ─────────────────────────────────────────────────────────────
const postSchema = z.object({
  body: text(2000),
  media_url: text(500),
  media_type: z.preprocess((v) => v || null, z.enum(["image", "video", "audio"]).nullable()),
  embed_url: z.preprocess((v) => (typeof v === "string" && v.trim() ? v.trim() : null), z.string().url("קישור לא תקין").nullable()),
});

export async function createPost(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured) return { error: DEMO_ERROR };
  const { profile, supabase } = await requireProfile();
  const parsed = postSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const p = parsed.data;
  if (!p.body && !p.media_url && !p.embed_url) return { error: "כתבו משהו או צרפו מדיה." };
  const { error } = await supabase.from("posts").insert({ ...p, profile_id: profile.id });
  if (error) return { error: friendly(error.message) };
  revalidatePath("/feed");
  redirect(`/p/${profile.handle}`);
}

const eventSchema = z.object({
  title: z.string().trim().min(2, "שם לאירוע?").max(120),
  description: text(3000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "בחרו תאריך"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "בחרו שעה"),
  other_name: text(80),
  address: text(200),
  city: text(60),
  ticket_price: num,
  tips_enabled: bool,
  capacity: num,
  genres: z.array(z.string()).max(8),
  cover_url: text(500),
});

export async function createEvent(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured) return { error: DEMO_ERROR };
  const { profile, supabase } = await requireProfile();
  if (profile.role === "fan") return { error: "רק אמנים ומקומות יכולים ליצור אירועים." };
  const parsed = eventSchema.safeParse({ ...Object.fromEntries(formData), genres: formData.getAll("genres") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const e = parsed.data;
  const startsAt = jerusalemToIso(e.date, e.time);
  if (new Date(startsAt).getTime() < Date.now() - 3600_000) return { error: "התאריך כבר עבר." };

  const isVenue = profile.role === "venue";
  if (!isVenue && !e.other_name) return { error: "איפה ההופעה? כתבו את שם המקום." };
  const row = {
    created_by: profile.id,
    venue_id: isVenue ? profile.id : null,
    artist_id: isVenue ? null : profile.id,
    venue_name: isVenue ? null : e.other_name,
    artist_name: isVenue ? (e.other_name ?? "ערב מוזיקה חיה") : null,
    title: e.title,
    description: e.description,
    starts_at: startsAt,
    address: isVenue ? profile.address : e.address,
    city: isVenue ? profile.city : e.city,
    lat: isVenue ? profile.lat : null,
    lng: isVenue ? profile.lng : null,
    genres: e.genres.length ? e.genres : profile.genres,
    ticket_price: e.ticket_price || null,
    tips_enabled: e.tips_enabled,
    capacity: e.capacity ?? (isVenue ? profile.capacity : null),
    cover_url: e.cover_url,
  };
  const { data, error } = await supabase.from("events").insert(row).select("id").single();
  if (error) return { error: friendly(error.message) };
  revalidatePath("/feed");
  redirect(`/events/${data.id}`);
}

// ─────────────────────────────────────────────────────────────
// Booking offers
// ─────────────────────────────────────────────────────────────
const termsSchema = z
  .object({
    event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "בחרו תאריך"),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, "בחרו שעה"),
    set_length_min: z.preprocess((v) => Number(v || 90), z.number().int().min(15).max(600)),
    deal_type: z.enum(["fixed_fee", "door_to_artist", "ticket_split", "versus", "guarantee_plus_bonus", "free_tips"]),
    fee_amount: num,
    ticket_price: num,
    artist_share_pct: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().min(0).max(100).nullable()),
    bonus_threshold: num,
    bonus_amount: num,
    message: text(2000),
  })
  .superRefine((t, ctx) => {
    const need = (cond: boolean, msg: string) => cond || ctx.addIssue({ code: "custom", message: msg });
    if (["fixed_fee", "versus", "guarantee_plus_bonus"].includes(t.deal_type)) need(t.fee_amount != null, "מה הסכום?");
    if (["door_to_artist", "ticket_split", "versus"].includes(t.deal_type)) need((t.ticket_price ?? 0) > 0, "מה מחיר הכרטיס?");
    if (["ticket_split", "versus"].includes(t.deal_type)) need(t.artist_share_pct != null, "כמה אחוז לאמן?");
    if (t.deal_type === "guarantee_plus_bonus") need(t.bonus_threshold != null && t.bonus_amount != null, "הגדירו יעד ובונוס.");
  });

/** Keep only the fields relevant to the chosen deal so stale inputs don't leak into the offer. */
function cleanTerms(t: z.infer<typeof termsSchema>) {
  const usesFee = ["fixed_fee", "versus", "guarantee_plus_bonus"].includes(t.deal_type);
  const usesShare = ["ticket_split", "versus"].includes(t.deal_type);
  const usesBonus = t.deal_type === "guarantee_plus_bonus";
  return {
    ...t,
    fee_amount: usesFee ? t.fee_amount : null,
    ticket_price: t.deal_type === "free_tips" ? null : t.ticket_price || null,
    artist_share_pct: usesShare ? t.artist_share_pct : null,
    bonus_threshold: usesBonus ? t.bonus_threshold : null,
    bonus_amount: usesBonus ? t.bonus_amount : null,
  };
}

export async function createOffer(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured) return { error: DEMO_ERROR };
  const { profile, supabase } = await requireProfile();
  const otherId = String(formData.get("other_id") ?? "");
  const parsed = termsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  if (profile.role === "fan") return { error: "הצעות נשלחות בין מקום לאמן." };

  const terms = cleanTerms(parsed.data);
  const parties = profile.role === "venue" ? { venue_id: profile.id, artist_id: otherId } : { venue_id: otherId, artist_id: profile.id };
  const { data, error } = await supabase
    .from("offers")
    .insert({ ...terms, ...parties, created_by: profile.id, proposed_by: profile.id })
    .select("conversation_id")
    .single();
  if (error) return { error: friendly(error.message) };
  revalidatePath("/bookings");
  redirect(`/messages/${data.conversation_id}`);
}

export async function respondToOffer(offerId: string, action: "accept" | "decline" | "cancel") {
  if (!isSupabaseConfigured) return { error: DEMO_ERROR };
  const { supabase } = await requireProfile();
  const { error } = await supabase.rpc("respond_to_offer", { p_offer: offerId, p_action: action });
  if (error) return { error: friendly(error.message) };
  revalidatePath("/bookings");
  revalidatePath("/feed");
  return { ok: true };
}

export async function counterOffer(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured) return { error: DEMO_ERROR };
  const { supabase } = await requireProfile();
  const offerId = String(formData.get("offer_id") ?? "");
  const parsed = termsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const t = cleanTerms(parsed.data);
  const { data, error } = await supabase
    .rpc("counter_offer", {
      p_offer: offerId,
      p_event_date: t.event_date,
      p_start_time: t.start_time,
      p_set_length_min: t.set_length_min,
      p_deal_type: t.deal_type,
      p_fee_amount: t.fee_amount,
      p_ticket_price: t.ticket_price,
      p_artist_share_pct: t.artist_share_pct,
      p_bonus_threshold: t.bonus_threshold,
      p_bonus_amount: t.bonus_amount,
      p_message: t.message,
    })
    .single();
  if (error) return { error: friendly(error.message) };
  revalidatePath("/bookings");
  redirect(`/messages/${(data as { conversation_id: string }).conversation_id}`);
}
