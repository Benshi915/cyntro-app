import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, MapPin, Navigation, Ticket, Users } from "lucide-react";
import { isLiveNow, PriceTag } from "@/components/cards";
import { RsvpButtons } from "@/components/social";
import { Avatar, Card, Cover, LiveDot, RoleBadge } from "@/components/ui";
import { GENRE_LABEL } from "@/lib/constants";
import { ticketBuyerPrice } from "@/lib/deals";
import { getEvent, getMyReactions, getViewer } from "@/lib/data";
import type { ProfileSummary } from "@/lib/types";
import { formatEventDate, formatShekels, formatTime } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/events/[id]">): Promise<Metadata> {
  const { id } = await params;
  const e = await getEvent(id);
  return e ? { title: e.title, description: `${formatEventDate(e.starts_at)} · ${e.city ?? ""}` } : {};
}

function PartyCard({ p, fallbackName, label }: { p: ProfileSummary | null | undefined; fallbackName: string | null; label: string }) {
  const name = p?.display_name ?? fallbackName;
  if (!name) return null;
  const inner = (
    <Card className="flex items-center gap-3 p-4 transition hover:border-fog">
      <Avatar name={name} src={p?.avatar_url} seed={p?.id ?? name} role={p?.role} size={52} />
      <div className="min-w-0">
        <div className="text-xs text-fog">{label}</div>
        <div className="truncate text-lg font-semibold">{name}</div>
        {p && <RoleBadge role={p.role} />}
      </div>
    </Card>
  );
  return p ? <Link href={`/p/${p.handle}`}>{inner}</Link> : inner;
}

export default async function EventPage({ params }: PageProps<"/events/[id]">) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();
  const viewer = await getViewer();
  const signedIn = Boolean(viewer?.profile);
  const reactions = await getMyReactions([event.id]);
  const live = isLiveNow(event);
  const cancelled = event.status === "cancelled";
  const place = event.venue?.display_name ?? event.venue_name;

  return (
    <div className="-mx-4 -mt-5 sm:-mx-6 lg:-mx-10 lg:-mt-8">
      <Cover seed={event.id} src={event.cover_url} className="h-[52vh] min-h-80">
        <div className="mx-auto flex h-full max-w-5xl flex-col justify-end px-4 pb-8 sm:px-6 lg:px-10">
          {live && (
            <span className="mb-3 flex w-fit items-center gap-2 rounded-full bg-live px-3 py-1 text-sm font-bold text-white">
              <LiveDot className="bg-white" /> מתנגן עכשיו
            </span>
          )}
          {cancelled && <span className="mb-3 w-fit rounded-full bg-live/20 px-3 py-1 text-sm font-bold text-live">האירוע בוטל</span>}
          <div className="text-spot">{event.genres.map((g) => GENRE_LABEL[g] ?? g).join(" · ")}</div>
          <h1 className="display text-[clamp(3rem,9vw,6.5rem)] text-balance">{event.title}</h1>
          <div className="mt-2 text-lg text-fog">{place}</div>
        </div>
      </Cover>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-10">
        <div className="flex flex-col gap-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="flex items-center gap-3 p-4">
              <CalendarDays className="size-5 text-spot" />
              <span>{formatEventDate(event.starts_at)}</span>
            </Card>
            <Card className="flex items-center gap-3 p-4">
              <Clock className="size-5 text-spot" />
              <span>{formatTime(event.starts_at)}</span>
            </Card>
            <Card className="flex items-center gap-3 p-4">
              <Users className="size-5 text-spot" />
              <span>
                {event.going_count} מגיעים · {event.interested_count} מתעניינים
              </span>
            </Card>
          </div>

          {event.description && <p className="whitespace-pre-line text-lg leading-relaxed text-fog">{event.description}</p>}

          <div className="grid gap-3 sm:grid-cols-2">
            <PartyCard p={event.artist} fallbackName={event.artist_name} label="על הבמה" />
            <PartyCard p={event.venue} fallbackName={event.venue_name} label="איפה" />
          </div>

          {(event.address || event.lat) && (
            <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-2 text-fog">
                <MapPin className="size-5 text-spot" /> {event.address ?? event.city}
              </div>
              {event.lat != null && event.lng != null && (
                <div className="flex gap-2">
                  <a
                    href={`https://waze.com/ul?ll=${event.lat},${event.lng}&navigate=yes`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm hover:border-fog"
                  >
                    <Navigation className="size-4" /> Waze
                  </a>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${event.lat},${event.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm hover:border-fog"
                  >
                    <MapPin className="size-4" /> Google Maps
                  </a>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Ticket box */}
        <aside>
          <Card className="sticky top-20 flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
              <span className="text-fog">כניסה</span>
              <PriceTag event={event} className="text-sm" />
            </div>
            {event.ticket_price ? (
              <>
                <div className="text-sm text-dim">
                  מחיר לקונה כולל דמי שירות: <span className="text-cream">{formatShekels(ticketBuyerPrice(event.ticket_price))}</span>
                </div>
                <button disabled className="flex h-12 items-center justify-center gap-2 rounded-full bg-night-3 text-fog">
                  <Ticket className="size-4" /> מכירת כרטיסים נפתחת בקרוב
                </button>
              </>
            ) : event.tips_enabled ? (
              <p className="text-sm text-fog">הכניסה חופשית. בזמן ההופעה אפשר יהיה להשאיר טיפ לאמן דרך האפליקציה.</p>
            ) : null}
            {!cancelled && (
              <RsvpButtons
                eventId={event.id}
                initial={reactions.has(`${event.id}:going`) ? "going" : reactions.has(`${event.id}:interested`) ? "interested" : null}
                signedIn={signedIn}
              />
            )}
            {event.capacity && <div className="text-xs text-dim">עד {event.capacity} מקומות</div>}
          </Card>
        </aside>
      </div>
    </div>
  );
}
