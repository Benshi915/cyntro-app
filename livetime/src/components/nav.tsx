"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarHeart, Compass, Handshake, Map, MessageCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

const items = [
  { href: "/feed", label: "מה קורה", icon: CalendarHeart },
  { href: "/discover", label: "גילוי", icon: Compass },
  { href: "/map", label: "מפה", icon: Map },
  { href: "/messages", label: "הודעות", icon: MessageCircle, badge: "unread" as const },
  { href: "/bookings", label: "הופעות", icon: Handshake, roles: ["artist", "venue"] as Role[] },
];

function useActive() {
  const path = usePathname();
  return (href: string) => path === href || path.startsWith(href + "/");
}

export function SideNav({ role, unread }: { role?: Role; unread: number }) {
  const isActive = useActive();
  return (
    <nav className="flex flex-col gap-1">
      {items
        .filter((i) => !i.roles || (role && i.roles.includes(role)))
        .map(({ href, label, icon: Icon, badge }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "group flex h-12 items-center gap-3 rounded-full px-4 text-[0.95rem] transition",
              isActive(href) ? "bg-night-2 text-cream" : "text-fog hover:bg-night-2/60 hover:text-cream",
            )}
          >
            <Icon className={cn("size-5", isActive(href) && "text-spot")} />
            <span>{label}</span>
            {badge && unread > 0 && (
              <span className="ms-auto rounded-full bg-live px-2 text-xs font-semibold leading-5 text-white">{unread}</span>
            )}
          </Link>
        ))}
    </nav>
  );
}

export function BottomNav({ role, unread }: { role?: Role; unread: number }) {
  const isActive = useActive();
  const shown = items.filter((i) => !i.roles || (role && i.roles.includes(role)));
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {shown.map(({ href, label, icon: Icon, badge }) => (
          <Link
            key={href}
            href={href}
            className={cn("relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px]", isActive(href) ? "text-spot" : "text-fog")}
          >
            <Icon className="size-[22px]" />
            {label}
            {badge && unread > 0 && <span className="absolute top-2 start-1/2 ms-2 size-2 rounded-full bg-live" />}
          </Link>
        ))}
        {role && role !== "fan" && (
          <Link href="/posts/new" className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] text-fog">
            <span className="flex size-[22px] items-center justify-center rounded-md bg-spot text-ink">
              <Plus className="size-4" />
            </span>
            פרסום
          </Link>
        )}
      </div>
    </nav>
  );
}
