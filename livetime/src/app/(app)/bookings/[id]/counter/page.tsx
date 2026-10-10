import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DealBuilder } from "@/components/deal-builder";
import { EmptyState } from "@/components/ui";
import { getOffer, getProfileByHandle, getViewer } from "@/lib/data";
import { todayInIsrael } from "@/lib/utils";

export const metadata: Metadata = { title: "הצעה נגדית" };

export default async function CounterOfferPage({ params }: PageProps<"/bookings/[id]/counter">) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer?.profile) redirect("/login");
  const offer = await getOffer(id);
  if (!offer) notFound();
  const me = viewer.profile;
  if (offer.status !== "pending" || offer.proposed_by === me.id) {
    return <EmptyState title="אי אפשר להגיש הצעה נגדית כרגע">ההצעה כבר לא ממתינה לתשובה שלך.</EmptyState>;
  }
  const venue = offer.venue ? await getProfileByHandle(offer.venue.handle) : null;
  const other = offer.venue_id === me.id ? offer.artist : offer.venue;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <div className="text-sm text-fog">הצעה נגדית ל</div>
        <h1 className="display text-5xl">{other?.display_name}</h1>
      </div>
      <DealBuilder
        mode="counter"
        offer={offer}
        minDate={todayInIsrael()}
        capacity={venue?.capacity}
        viewerRole={me.role as "artist" | "venue"}
      />
    </div>
  );
}
