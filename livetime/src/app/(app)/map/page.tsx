import type { Metadata } from "next";
import { EventRow } from "@/components/cards";
import { EventsMap } from "@/components/map";
import { CITIES } from "@/lib/constants";
import { getViewer, listEvents, listProfiles } from "@/lib/data";

export const metadata: Metadata = { title: "מפה" };

export default async function MapPage({ searchParams }: PageProps<"/map">) {
  const sp = await searchParams;
  const viewer = await getViewer();
  const [events, venues] = await Promise.all([listEvents({ limit: 200 }), listProfiles({ role: "venue", limit: 300 })]);
  const home = CITIES.find((c) => c.name === viewer?.profile?.city);
  const center =
    viewer?.profile?.lat != null && viewer.profile.lng != null ? { lat: viewer.profile.lat, lng: viewer.profile.lng } : home;

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="h-[calc(100dvh-13rem)] min-h-[420px] lg:h-[calc(100dvh-4rem)] lg:flex-1">
        <EventsMap events={events} venues={venues} initialLayer={sp.layer === "venues" ? "venues" : "events"} center={center} />
      </div>
      <aside className="lg:w-80">
        <h2 className="display mb-3 text-4xl">הקרובים</h2>
        <div className="flex flex-col gap-1">
          {events.slice(0, 12).map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </div>
      </aside>
    </div>
  );
}
