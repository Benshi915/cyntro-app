export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Without Supabase credentials the app runs in read-only demo mode on sample data. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
