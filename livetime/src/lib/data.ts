import "server-only";
import { connection } from "next/server";
import { cache } from "react";
import { buildDemoEvents, buildDemoPosts, demoProfiles } from "./demo-data";
import { isSupabaseConfigured } from "./supabase/env";
import { createClient } from "./supabase/server";
import type {
  ConversationPreview,
  LiveEvent,
  Message,
  Offer,
  Post,
  Profile,
  ProfileSummary,
  ReactionKind,
  Role,
} from "./types";

export const SUMMARY = "id, role, handle, display_name, avatar_url, city, verified, genres";
const EVENT_SELECT = `*, venue:profiles!events_venue_id_fkey(${SUMMARY}), artist:profiles!events_artist_id_fkey(${SUMMARY})`;
const OFFER_SELECT = `*, venue:profiles!offers_venue_id_fkey(${SUMMARY}), artist:profiles!offers_artist_id_fkey(${SUMMARY})`;

const summary = (p: Profile): ProfileSummary => ({
  id: p.id,
  role: p.role,
  handle: p.handle,
  display_name: p.display_name,
  avatar_url: p.avatar_url,
  city: p.city,
  verified: p.verified,
  genres: p.genres,
});

const demoEventsWithJoins = () =>
  buildDemoEvents().map((e) => ({
    ...e,
    venue: e.venue_id ? summary(demoProfiles.find((p) => p.id === e.venue_id)!) : null,
    artist: e.artist_id ? summary(demoProfiles.find((p) => p.id === e.artist_id)!) : null,
  }));

// ─────────────────────────────────────────────────────────────
// Viewer
// ─────────────────────────────────────────────────────────────
export interface Viewer {
  userId: string;
  email: string | null;
  profile: Profile | null;
}

export const getViewer = cache(async (): Promise<Viewer | null> => {
  // Everything in LiveTime is per-request (session, "tonight", live-now badges).
  await connection();
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("owner_id", claims.sub).maybeSingle();
  return { userId: claims.sub, email: (claims.email as string) ?? null, profile: profile as Profile | null };
});

// ─────────────────────────────────────────────────────────────
// Events
// ─────────────────────────────────────────────────────────────
export async function listEvents(opts: {
  city?: string;
  genre?: string;
  profileId?: string;
  limit?: number;
  includePast?: boolean;
} = {}): Promise<LiveEvent[]> {
  const limit = opts.limit ?? 50;
  const from = new Date(Date.now() - 3 * 3600_000).toISOString(); // keep tonight's shows visible

  if (!isSupabaseConfigured) {
    return demoEventsWithJoins()
      .filter((e) => opts.includePast || e.starts_at >= from)
      .filter((e) => !opts.city || e.city === opts.city)
      .filter((e) => !opts.genre || e.genres.includes(opts.genre))
      .filter((e) => !opts.profileId || e.venue_id === opts.profileId || e.artist_id === opts.profileId)
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
      .slice(0, limit);
  }

  const supabase = await createClient();
  let q = supabase.from("events").select(EVENT_SELECT).eq("status", "published");
  if (!opts.includePast) q = q.gte("starts_at", from);
  if (opts.city) q = q.eq("city", opts.city);
  if (opts.genre) q = q.contains("genres", [opts.genre]);
  if (opts.profileId) q = q.or(`venue_id.eq.${opts.profileId},artist_id.eq.${opts.profileId}`);
  const { data } = await q.order("starts_at").limit(limit);
  return (data ?? []) as LiveEvent[];
}

export async function getEvent(id: string): Promise<LiveEvent | null> {
  if (!isSupabaseConfigured) return demoEventsWithJoins().find((e) => e.id === id) ?? null;
  const supabase = await createClient();
  const { data } = await supabase.from("events").select(EVENT_SELECT).eq("id", id).maybeSingle();
  return data as LiveEvent | null;
}

// ─────────────────────────────────────────────────────────────
// Profiles
// ─────────────────────────────────────────────────────────────
export async function listProfiles(opts: {
  role?: Role;
  q?: string;
  genre?: string;
  city?: string;
  limit?: number;
} = {}): Promise<Profile[]> {
  const limit = opts.limit ?? 60;
  if (!isSupabaseConfigured) {
    const q = opts.q?.trim().toLowerCase();
    return demoProfiles
      .filter((p) => (opts.role ? p.role === opts.role : p.role !== "fan"))
      .filter((p) => !opts.genre || p.genres.includes(opts.genre))
      .filter((p) => !opts.city || p.city === opts.city)
      .filter(
        (p) =>
          !q ||
          p.display_name.toLowerCase().includes(q) ||
          p.handle.includes(q) ||
          (p.tagline ?? "").toLowerCase().includes(q),
      )
      .sort((a, b) => b.followers_count - a.followers_count)
      .slice(0, limit);
  }

  const supabase = await createClient();
  let q = supabase.from("profiles").select("*");
  q = opts.role ? q.eq("role", opts.role) : q.neq("role", "fan");
  if (opts.genre) q = q.contains("genres", [opts.genre]);
  if (opts.city) q = q.eq("city", opts.city);
  if (opts.q?.trim()) {
    const term = opts.q.trim().replace(/[%,()]/g, " ");
    q = q.or(`display_name.ilike.%${term}%,handle.ilike.%${term}%,tagline.ilike.%${term}%`);
  }
  const { data } = await q.order("followers_count", { ascending: false }).limit(limit);
  return (data ?? []) as Profile[];
}

export async function getProfileByHandle(handle: string): Promise<Profile | null> {
  if (!isSupabaseConfigured) return demoProfiles.find((p) => p.handle === handle) ?? null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("handle", handle).maybeSingle();
  return data as Profile | null;
}

export async function getArtistDemand(artistId: string): Promise<{ city: string; fans: number }[]> {
  if (!isSupabaseConfigured) {
    const p = demoProfiles.find((x) => x.id === artistId);
    if (!p?.bring_count) return [];
    const n = p.bring_count;
    return [
      { city: "תל אביב", fans: Math.round(n * 0.55) },
      { city: "חיפה", fans: Math.round(n * 0.2) },
      { city: "ירושלים", fans: Math.round(n * 0.15) },
    ];
  }
  const supabase = await createClient();
  const { data } = await supabase.rpc("artist_demand", { p_artist: artistId });
  return ((data ?? []) as { city: string; fans: number }[]).map((r) => ({ ...r, fans: Number(r.fans) }));
}

// ─────────────────────────────────────────────────────────────
// Posts
// ─────────────────────────────────────────────────────────────
export async function listPosts(opts: { profileId?: string; profileIds?: string[]; limit?: number } = {}): Promise<Post[]> {
  const limit = opts.limit ?? 30;
  if (!isSupabaseConfigured) {
    return buildDemoPosts()
      .filter((p) => !opts.profileId || p.profile_id === opts.profileId)
      .filter((p) => !opts.profileIds || opts.profileIds.includes(p.profile_id))
      .slice(0, limit);
  }
  const supabase = await createClient();
  let q = supabase.from("posts").select(`*, author:profiles!posts_profile_id_fkey(${SUMMARY})`);
  if (opts.profileId) q = q.eq("profile_id", opts.profileId);
  if (opts.profileIds) q = q.in("profile_id", opts.profileIds.length ? opts.profileIds : ["00000000-0000-0000-0000-000000000000"]);
  const { data } = await q.order("created_at", { ascending: false }).limit(limit);
  return (data ?? []) as Post[];
}

// ─────────────────────────────────────────────────────────────
// Social state for the viewer
// ─────────────────────────────────────────────────────────────
export async function getMyReactions(targetIds: string[]): Promise<Set<string>> {
  const viewer = await getViewer();
  if (!viewer?.profile || targetIds.length === 0) return new Set();
  const supabase = await createClient();
  const { data } = await supabase
    .from("reactions")
    .select("target_id, kind")
    .eq("profile_id", viewer.profile.id)
    .in("target_id", targetIds);
  return new Set((data ?? []).map((r: { target_id: string; kind: ReactionKind }) => `${r.target_id}:${r.kind}`));
}

export async function getFollowingIds(): Promise<string[]> {
  const viewer = await getViewer();
  if (!viewer?.profile) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("follows").select("following_id").eq("follower_id", viewer.profile.id);
  return (data ?? []).map((r: { following_id: string }) => r.following_id);
}

// ─────────────────────────────────────────────────────────────
// Messaging
// ─────────────────────────────────────────────────────────────
interface ConversationRow {
  id: string;
  last_message_at: string;
  conversation_members: { profile_id: string; last_read_at: string; profile: ProfileSummary }[];
  messages: Pick<Message, "body" | "kind" | "sender_id" | "created_at">[];
}

export async function listConversations(): Promise<ConversationPreview[]> {
  const viewer = await getViewer();
  if (!viewer?.profile) return [];
  const me = viewer.profile.id;
  const supabase = await createClient();
  const { data } = await supabase
    .from("conversations")
    .select(
      `id, last_message_at,
       conversation_members(profile_id, last_read_at, profile:profiles(${SUMMARY})),
       messages(body, kind, sender_id, created_at)`,
    )
    .order("last_message_at", { ascending: false })
    .order("created_at", { referencedTable: "messages", ascending: false })
    .limit(1, { referencedTable: "messages" })
    .limit(100);

  return ((data ?? []) as unknown as ConversationRow[]).flatMap((c) => {
    const other = c.conversation_members.find((m) => m.profile_id !== me)?.profile;
    const mine = c.conversation_members.find((m) => m.profile_id === me);
    if (!other) return [];
    const last = c.messages[0] ?? null;
    return [
      {
        id: c.id,
        last_message_at: c.last_message_at,
        other,
        last_message: last,
        unread: Boolean(last && last.sender_id !== me && mine && last.created_at > mine.last_read_at),
      },
    ];
  });
}

export async function getConversation(id: string) {
  const viewer = await getViewer();
  if (!viewer?.profile) return null;
  const supabase = await createClient();
  const [{ data: members }, { data: messages }, { data: offers }] = await Promise.all([
    supabase.from("conversation_members").select(`profile_id, profile:profiles(${SUMMARY})`).eq("conversation_id", id),
    supabase.from("messages").select("*").eq("conversation_id", id).order("created_at").limit(500),
    supabase.from("offers").select(OFFER_SELECT).eq("conversation_id", id),
  ]);
  if (!members?.length) return null;
  const other = (members as unknown as { profile_id: string; profile: ProfileSummary }[]).find(
    (m) => m.profile_id !== viewer.profile!.id,
  )?.profile;
  if (!other) return null;
  return {
    id,
    me: viewer.profile,
    other,
    messages: (messages ?? []) as Message[],
    offers: (offers ?? []) as Offer[],
  };
}

export async function countUnread(): Promise<number> {
  const conversations = await listConversations();
  return conversations.filter((c) => c.unread).length;
}

// ─────────────────────────────────────────────────────────────
// Offers
// ─────────────────────────────────────────────────────────────
export async function listOffers(): Promise<Offer[]> {
  const viewer = await getViewer();
  if (!viewer?.profile) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("offers").select(OFFER_SELECT).order("updated_at", { ascending: false }).limit(200);
  return (data ?? []) as Offer[];
}

export async function getOffer(id: string): Promise<Offer | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("offers").select(OFFER_SELECT).eq("id", id).maybeSingle();
  return data as Offer | null;
}
