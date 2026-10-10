"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; sent?: boolean; email?: string } | undefined;

const credentials = z.object({
  email: z.string().trim().email("כתובת מייל לא תקינה"),
  password: z.string().min(8, "סיסמה של 8 תווים לפחות"),
});

function safeNext(next: unknown) {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

async function origin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function signUp(_: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) return { error: "מצב הדגמה: חברו את Supabase כדי לאפשר הרשמה." };
  const parsed = credentials.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const role = formData.get("role");
  const next = `/onboarding${role ? `?role=${role}` : ""}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) {
    if (error.message.toLowerCase().includes("already")) return { error: "המייל הזה כבר רשום — נסו להתחבר." };
    return { error: "ההרשמה נכשלה. נסו שוב." };
  }
  // Email confirmation disabled → we already have a session.
  if (data.session) redirect(next);
  return { sent: true, email: parsed.data.email };
}

export async function signIn(_: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) return { error: "מצב הדגמה: חברו את Supabase כדי לאפשר כניסה." };
  const parsed = credentials.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.message.toLowerCase().includes("not confirmed")) return { error: "צריך לאשר את המייל קודם — בדקו את תיבת הדואר." };
    return { error: "מייל או סיסמה לא נכונים." };
  }
  redirect(safeNext(formData.get("next")) ?? "/feed");
}
