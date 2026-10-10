import { NextResponse, type NextRequest } from "next/server";
import { DEMO_COOKIE } from "@/lib/data";
import { demoProfiles } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** Demo mode only: /demo?as=<handle> views the app as a sample profile; /demo?as= signs out. */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  if (isSupabaseConfigured) return NextResponse.redirect(new URL("/login", url));
  const handle = url.searchParams.get("as") ?? "";
  const next = url.searchParams.get("next");
  const dest = next?.startsWith("/") && !next.startsWith("//") ? next : handle ? "/feed" : "/";
  const res = NextResponse.redirect(new URL(dest, url));
  if (demoProfiles.some((p) => p.handle === handle)) {
    res.cookies.set(DEMO_COOKIE, handle, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
  } else {
    res.cookies.delete(DEMO_COOKIE);
  }
  return res;
}
