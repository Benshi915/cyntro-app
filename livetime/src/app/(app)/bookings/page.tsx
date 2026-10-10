import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OfferCard } from "@/components/offer-card";
import { ButtonLink, EmptyState, SectionTitle } from "@/components/ui";
import { getViewer, listOffers } from "@/lib/data";

export const metadata: Metadata = { title: "הופעות והצעות" };

export default async function BookingsPage() {
  const viewer = await getViewer();
  if (!viewer?.profile) redirect("/login?next=/bookings");
  const me = viewer.profile;
  if (me.role === "fan") redirect("/feed");
  const offers = await listOffers();

  const groups = [
    { title: "מחכות לך", items: offers.filter((o) => o.status === "pending" && o.proposed_by !== me.id) },
    { title: "נסגרו", items: offers.filter((o) => o.status === "accepted") },
    { title: "ממתינות לצד השני", items: offers.filter((o) => o.status === "pending" && o.proposed_by === me.id) },
    { title: "ארכיון", items: offers.filter((o) => ["declined", "cancelled", "completed"].includes(o.status)) },
  ].filter((g) => g.items.length);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="display text-6xl">הופעות</h1>
        <p className="mt-2 text-fog">כל ההצעות שלך — שנשלחו, שהתקבלו ושנסגרו.</p>
      </div>
      {groups.length === 0 && (
        <EmptyState
          title="עוד אין הצעות"
          action={<ButtonLink href={`/discover?type=${me.role === "venue" ? "artist" : "venue"}`}>{me.role === "venue" ? "מציאת אמנים" : "מציאת מקומות"}</ButtonLink>}
        >
          {me.role === "venue" ? "מצאו אמן ושלחו לו הצעה מהפרופיל שלו." : "מצאו מקום שמתאים לכם והציעו הופעה."}
        </EmptyState>
      )}
      {groups.map((g) => (
        <section key={g.title}>
          <SectionTitle>
            {g.title} <span className="text-fog">({g.items.length})</span>
          </SectionTitle>
          <div className="flex flex-col gap-3">
            {g.items.map((o) => (
              <div key={o.id}>
                <OfferCard offer={o} meId={me.id} compact />
                {o.conversation_id && (
                  <Link href={`/messages/${o.conversation_id}`} className="mt-1 block px-2 text-xs text-dim hover:text-cream">
                    לשיחה ←
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
