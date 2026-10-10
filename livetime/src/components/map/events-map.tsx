"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Avatar, Chip, RoleBadge } from "@/components/ui";
import { DEFAULT_CENTER, VENUE_TYPE_LABEL } from "@/lib/constants";
import type { LiveEvent, Profile } from "@/lib/types";
import { cn, dateBlock, formatShekels, formatTime } from "@/lib/utils";
import { Marker, NightMap } from "./night-map";

type Layer = "events" | "venues";
type Selected = { kind: "event"; item: LiveEvent } | { kind: "venue"; item: Profile } | null;

export default function EventsMap({
  events,
  venues,
  initialLayer = "events",
  center,
}: {
  events: LiveEvent[];
  venues: Profile[];
  initialLayer?: Layer;
  center?: { lat: number; lng: number };
}) {
  const [layer, setLayer] = useState<Layer>(initialLayer);
  const [selected, setSelected] = useState<Selected>(null);
  const start = center ?? DEFAULT_CENTER;

  // Several events at one venue → one pin showing the next show.
  const eventPins = useMemo(() => {
    const byPlace = new Map<string, LiveEvent[]>();
    for (const e of events) {
      if (e.lat == null || e.lng == null) continue;
      const key = `${e.lat.toFixed(4)},${e.lng.toFixed(4)}`;
      byPlace.set(key, [...(byPlace.get(key) ?? []), e]);
    }
    return [...byPlace.values()].map((list) => ({ next: list[0], count: list.length }));
  }, [events]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-card border border-line">
      <NightMap
        initialViewState={{ latitude: start.lat, longitude: start.lng, zoom: 12.3 }}
        onClick={() => setSelected(null)}
      >
        {layer === "events" &&
          eventPins.map(({ next, count }) => {
            const d = dateBlock(next.starts_at);
            return (
              <Marker
                key={next.id}
                latitude={next.lat!}
                longitude={next.lng!}
                anchor="bottom"
                onClick={(ev) => {
                  ev.originalEvent.stopPropagation();
                  setSelected({ kind: "event", item: next });
                }}
              >
                <button className="group flex flex-col items-center" aria-label={next.title}>
                  <span
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1 text-xs font-bold shadow-lg transition group-hover:scale-110",
                      selected?.item.id === next.id ? "border-cream bg-cream text-ink" : "border-spot bg-ink text-spot",
                    )}
                  >
                    <span className="display text-base leading-none">{d.day}</span>
                    <span>{d.month}</span>
                    {count > 1 && <span className="rounded-full bg-spot px-1.5 text-[10px] text-ink">+{count - 1}</span>}
                  </span>
                  <span className="h-2 w-0.5 bg-spot" />
                  <span className="size-2 rounded-full bg-live animate-live" />
                </button>
              </Marker>
            );
          })}
        {layer === "venues" &&
          venues
            .filter((v) => v.lat != null && v.lng != null)
            .map((v) => (
              <Marker
                key={v.id}
                latitude={v.lat!}
                longitude={v.lng!}
                anchor="center"
                onClick={(ev) => {
                  ev.originalEvent.stopPropagation();
                  setSelected({ kind: "venue", item: v });
                }}
              >
                <button
                  aria-label={v.display_name}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full border-2 border-venue bg-ink text-xs font-bold text-venue shadow-lg transition hover:scale-110",
                    selected?.item.id === v.id && "bg-venue text-ink",
                  )}
                >
                  {v.capacity ? (v.capacity > 99 ? "99+" : v.capacity) : "♪"}
                </button>
              </Marker>
            ))}
      </NightMap>

      {/* Layer switch */}
      <div className="absolute start-3 top-3 flex gap-1.5 rounded-full bg-ink/80 p-1 backdrop-blur">
        <button onClick={() => setLayer("events")}>
          <Chip active={layer === "events"}>הופעות</Chip>
        </button>
        <button onClick={() => setLayer("venues")}>
          <Chip active={layer === "venues"}>מקומות</Chip>
        </button>
      </div>

      {/* Selection sheet */}
      {selected && (
        <div className="absolute inset-x-3 bottom-3 animate-rise rounded-2xl border border-line bg-night-2/95 p-4 shadow-2xl backdrop-blur sm:inset-x-auto sm:end-3 sm:w-96">
          <button onClick={() => setSelected(null)} className="absolute end-3 top-3 text-fog hover:text-cream" aria-label="סגירה">
            <X className="size-4" />
          </button>
          {selected.kind === "event" ? (
            <Link href={`/events/${selected.item.id}`} className="block pe-6">
              <div className="text-xs text-spot">
                {dateBlock(selected.item.starts_at).weekday} {dateBlock(selected.item.starts_at).day}{" "}
                {dateBlock(selected.item.starts_at).month} · {formatTime(selected.item.starts_at)}
              </div>
              <div className="display mt-1 text-3xl">{selected.item.title}</div>
              <div className="mt-1 text-sm text-fog">
                {selected.item.address ?? selected.item.city} ·{" "}
                {selected.item.ticket_price ? formatShekels(selected.item.ticket_price) : "כניסה חופשית"}
              </div>
              <div className="mt-3 text-sm font-medium text-spot">לפרטים ←</div>
            </Link>
          ) : (
            <Link href={`/p/${selected.item.handle}`} className="flex items-center gap-3 pe-6">
              <Avatar name={selected.item.display_name} src={selected.item.avatar_url} seed={selected.item.id} role="venue" size={52} />
              <div className="min-w-0">
                <div className="truncate text-lg font-semibold">{selected.item.display_name}</div>
                <div className="text-sm text-fog">
                  {selected.item.venue_type && VENUE_TYPE_LABEL[selected.item.venue_type]}
                  {selected.item.capacity && ` · עד ${selected.item.capacity}`}
                </div>
                <RoleBadge role="venue" className="mt-1" />
              </div>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
