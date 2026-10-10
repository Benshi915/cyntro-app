import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DealBuilder } from "@/components/deal-builder";
import { Avatar, EmptyState, RoleBadge } from "@/components/ui";
import { getProfileByHandle, getViewer } from "@/lib/data";
import { formatShekels, todayInIsrael } from "@/lib/utils";

export const metadata: Metadata = { title: "הצעת הופעה" };

export default async function NewOfferPage({ searchParams }: PageProps<"/bookings/new">) {
  const { with: handle } = await searchParams;
  const viewer = await getViewer();
  if (!viewer?.profile) redirect(`/login?next=/bookings/new?with=${handle ?? ""}`);
  const me = viewer.profile;
  const other = typeof handle === "string" ? await getProfileByHandle(handle) : null;
  if (!other) notFound();

  const valid = (me.role === "venue" && other.role === "artist") || (me.role === "artist" && other.role === "venue");
  if (!valid) return <EmptyState title="הצעות נשלחות בין מקום לאמן" />;

  const venue = me.role === "venue" ? me : other;
  const artist = me.role === "artist" ? me : other;
  const feeHint =
    artist.fee_min != null ? `טווח המחיר של ${artist.display_name}: ${formatShekels(artist.fee_min)}${artist.fee_max ? `–${formatShekels(artist.fee_max)}` : "+"}` : null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-4">
        <Avatar name={other.display_name} src={other.avatar_url} seed={other.id} role={other.role} size={64} />
        <div>
          <div className="text-sm text-fog">הצעת הופעה ל</div>
          <h1 className="display text-5xl">{other.display_name}</h1>
          <RoleBadge role={other.role} />
        </div>
      </div>
      <DealBuilder
        mode="create"
        otherId={other.id}
        minDate={todayInIsrael()}
        capacity={venue.capacity}
        feeHint={feeHint}
        defaultFee={artist.fee_min}
        viewerRole={me.role as "artist" | "venue"}
      />
    </div>
  );
}
