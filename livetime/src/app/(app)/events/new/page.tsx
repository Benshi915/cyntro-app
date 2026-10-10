import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/ui";
import { getViewer } from "@/lib/data";
import { todayInIsrael } from "@/lib/utils";
import { EventForm } from "./event-form";

export const metadata: Metadata = { title: "אירוע חדש" };

export default async function NewEventPage() {
  const viewer = await getViewer();
  if (!viewer?.profile) redirect("/login?next=/events/new");
  const p = viewer.profile;
  if (p.role === "fan") return <EmptyState title="רק אמנים ומקומות יוצרים אירועים" />;
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="display text-5xl">אירוע חדש</h1>
      <p className="mb-6 mt-2 text-fog">
        הופעה שנסגרה מחוץ לרשת? פרסמו אותה כאן. הופעה עם אמן/מקום שכבר ברשת — עדיף לשלוח הצעה, והאירוע ייווצר אוטומטית.
      </p>
      <EventForm role={p.role} minDate={todayInIsrael()} defaultGenres={p.genres} />
    </div>
  );
}
