import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarPlus, PenSquare } from "lucide-react";
import { DemoBar } from "@/components/demo-bar";
import { BottomNav, SideNav } from "@/components/nav";
import { Avatar, ButtonLink, Logo, RoleBadge } from "@/components/ui";
import { countUnread, getViewer } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (viewer && !viewer.profile) redirect("/onboarding");
  const profile = viewer?.profile ?? null;
  const unread = profile ? await countUnread() : 0;

  return (
    <div className="mx-auto flex min-h-dvh max-w-7xl">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-8 border-e border-line px-4 py-6 lg:flex">
        <Link href="/feed" className="px-3">
          <Logo />
        </Link>
        <SideNav role={profile?.role} unread={unread} />
        {profile && profile.role !== "fan" && (
          <div className="flex flex-col gap-2 px-1">
            <ButtonLink href="/posts/new" size="md">
              <PenSquare className="size-4" /> פוסט חדש
            </ButtonLink>
            <ButtonLink href="/events/new" variant="secondary" size="md">
              <CalendarPlus className="size-4" /> אירוע חדש
            </ButtonLink>
          </div>
        )}
        <div className="mt-auto">
          {profile ? (
            <Link href={`/p/${profile.handle}`} className="flex items-center gap-3 rounded-2xl p-2 hover:bg-night-2">
              <Avatar name={profile.display_name} src={profile.avatar_url} seed={profile.id} role={profile.role} size={40} />
              <div className="min-w-0">
                <div className="truncate font-medium">{profile.display_name}</div>
                <RoleBadge role={profile.role} />
              </div>
            </Link>
          ) : (
            <div className="flex flex-col gap-2">
              <ButtonLink href="/signup">הצטרפות</ButtonLink>
              <ButtonLink href="/login" variant="ghost">
                כניסה
              </ButtonLink>
            </div>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-ink/85 px-4 backdrop-blur-xl lg:hidden">
          <Link href="/feed">
            <Logo className="scale-90 origin-right" />
          </Link>
          {profile ? (
            <Link href={`/p/${profile.handle}`}>
              <Avatar name={profile.display_name} src={profile.avatar_url} seed={profile.id} role={profile.role} size={34} />
            </Link>
          ) : (
            <ButtonLink href="/signup" size="sm">
              הצטרפות
            </ButtonLink>
          )}
        </header>

        {!isSupabaseConfigured && <DemoBar profile={profile} />}

        <main className="flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">{children}</main>
      </div>

      <BottomNav role={profile?.role} unread={unread} />
    </div>
  );
}
