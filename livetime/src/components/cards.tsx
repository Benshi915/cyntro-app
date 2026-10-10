import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import { ACT_TYPE_LABEL, GENRE_LABEL, VENUE_TYPE_LABEL } from "@/lib/constants";
import type { LiveEvent, Profile } from "@/lib/types";
import { cn, dateBlock, formatShekels, formatTime } from "@/lib/utils";
import { Avatar, Cover, LiveDot, RoleBadge, VerifiedMark } from "./ui";

export function isLiveNow(e: Pick<LiveEvent, "starts_at" | "ends_at">) {
  const now = Date.now();
  const start = new Date(e.starts_at).getTime();
  const end = e.ends_at ? new Date(e.ends_at).getTime() : start + 2.5 * 3600_000;
  return now >= start && now <= end;
}

export function PriceTag({ event, className }: { event: Pick<LiveEvent, "ticket_price" | "tips_enabled">; className?: string }) {
  const label = event.ticket_price ? formatShekels(event.ticket_price) : event.tips_enabled ? "חופשי + טיפים" : "כניסה חופשית";
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-semibold",
        event.ticket_price ? "bg-cream text-ink" : "bg-venue/15 text-venue",
        className,
      )}
    >
      {label}
    </span>
  );
}

function eventPlace(e: LiveEvent) {
  return e.venue?.display_name ?? e.venue_name ?? "";
}
function eventArtist(e: LiveEvent) {
  return e.artist?.display_name ?? e.artist_name ?? "";
}

/** Poster card — for rails and grids. */
export function EventPoster({ event, className }: { event: LiveEvent; className?: string }) {
  const d = dateBlock(event.starts_at);
  const live = isLiveNow(event);
  return (
    <Link href={`/events/${event.id}`} className={cn("group block animate-rise", className)}>
      <Cover seed={event.id} src={event.cover_url} className="aspect-[4/5] rounded-card border border-line transition group-hover:border-spot/50">
        <div className="flex h-full flex-col justify-between p-4">
          <div className="flex items-start justify-between">
            <div className="rounded-2xl bg-ink/70 px-3 py-2 text-center backdrop-blur">
              <div className="text-[11px] text-fog">{d.weekday}</div>
              <div className="display text-4xl leading-none">{d.day}</div>
              <div className="text-[11px] text-spot">{d.month}</div>
            </div>
            {live ? (
              <span className="flex items-center gap-1.5 rounded-full bg-live px-2.5 py-1 text-xs font-bold text-white">
                <LiveDot className="size-1.5 bg-white" /> LIVE
              </span>
            ) : (
              <PriceTag event={event} />
            )}
          </div>
          <div>
            <div className="mb-1 text-xs text-spot">{formatTime(event.starts_at)} · {event.city}</div>
            <h3 className="display text-[2.1rem] leading-[0.95] text-balance">{eventArtist(event) || event.title}</h3>
            <div className="mt-1 truncate text-sm text-fog">{eventPlace(event)}</div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-fog">
              <Users className="size-3.5" /> {event.going_count} מגיעים
            </div>
          </div>
        </div>
      </Cover>
    </Link>
  );
}

/** Compact row — for lists, profile pages and the map sheet. */
export function EventRow({ event }: { event: LiveEvent }) {
  const d = dateBlock(event.starts_at);
  return (
    <Link
      href={`/events/${event.id}`}
      className="flex items-center gap-4 rounded-2xl border border-transparent p-2 transition hover:border-line hover:bg-night-2/60"
    >
      <div className="w-14 shrink-0 rounded-xl bg-night-2 py-2 text-center">
        <div className="text-[10px] text-fog">{d.weekday}</div>
        <div className="display text-3xl leading-none">{d.day}</div>
        <div className="text-[10px] text-spot">{d.month}</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{event.title}</div>
        <div className="mt-0.5 flex items-center gap-1 truncate text-sm text-fog">
          <MapPin className="size-3.5 shrink-0" />
          {eventPlace(event)} · {formatTime(event.starts_at)}
        </div>
      </div>
      <PriceTag event={event} className="shrink-0" />
    </Link>
  );
}

export function ProfileCard({ profile }: { profile: Profile }) {
  const meta =
    profile.role === "artist"
      ? [
          profile.act_type && ACT_TYPE_LABEL[profile.act_type],
          profile.fee_min != null && `מ־${formatShekels(profile.fee_min)}`,
          profile.bring_count > 0 && `${profile.bring_count} מבקשים`,
        ]
      : profile.role === "venue"
        ? [profile.venue_type && VENUE_TYPE_LABEL[profile.venue_type], profile.capacity && `עד ${profile.capacity} איש`]
        : [];
  return (
    <Link
      href={`/p/${profile.handle}`}
      className="group flex animate-rise flex-col overflow-hidden rounded-card border border-line bg-night/80 transition hover:border-spot/40"
    >
      <Cover seed={profile.id} src={profile.cover_url} className="h-24" />
      <div className="relative -mt-8 flex flex-1 flex-col gap-2 p-4 pt-0">
        <Avatar name={profile.display_name} src={profile.avatar_url} seed={profile.id} role={profile.role} size={56} className="ring-4 ring-offset-0" />
        <div className="flex items-center gap-1.5">
          <span className="truncate text-lg font-semibold">{profile.display_name}</span>
          {profile.verified && <VerifiedMark />}
        </div>
        {profile.tagline && <p className="line-clamp-2 text-sm text-fog">{profile.tagline}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1 text-xs text-dim">
          <RoleBadge role={profile.role} />
          {profile.city && <span>{profile.city}</span>}
          {meta.filter(Boolean).map((m) => (
            <span key={String(m)}>· {m}</span>
          ))}
        </div>
        {profile.genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {profile.genres.slice(0, 3).map((g) => (
              <span key={g} className="rounded-full bg-night-3 px-2 py-0.5 text-[11px] text-fog">
                {GENRE_LABEL[g] ?? g}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
