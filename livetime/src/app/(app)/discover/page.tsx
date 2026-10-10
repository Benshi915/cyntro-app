import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { ProfileCard } from "@/components/cards";
import { Button, Chip, EmptyState, Input, Select } from "@/components/ui";
import { CITIES, GENRES } from "@/lib/constants";
import { getViewer, listProfiles } from "@/lib/data";
import type { Role } from "@/lib/types";

export const metadata: Metadata = { title: "גילוי" };

const TABS: { type: Role; label: string }[] = [
  { type: "artist", label: "אמנים" },
  { type: "venue", label: "מקומות" },
];

export default async function DiscoverPage({ searchParams }: PageProps<"/discover">) {
  const sp = await searchParams;
  const viewer = await getViewer();
  const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);
  // Default to "the other side": venues scout artists, artists scout venues.
  const type: Role = sp.type === "venue" || sp.type === "artist" ? sp.type : viewer?.profile?.role === "artist" ? "venue" : "artist";
  const q = str(sp.q);
  const genre = str(sp.genre);
  const city = str(sp.city);
  const profiles = await listProfiles({ role: type, q, genre, city });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="display text-6xl">גילוי</h1>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <Link key={t.type} href={`/discover?type=${t.type}`}>
            <Chip active={type === t.type} className="h-10 px-5 text-base">
              {t.label}
            </Chip>
          </Link>
        ))}
      </div>

      <form className="grid gap-2 sm:grid-cols-[1fr_180px_180px_auto]" action="/discover">
        <input type="hidden" name="type" value={type} />
        <div className="relative">
          <Search className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-dim" />
          <Input name="q" defaultValue={q} placeholder={type === "artist" ? "שם, סגנון, להקה..." : "שם המקום..."} className="ps-11" />
        </div>
        <Select name="genre" defaultValue={genre ?? ""}>
          <option value="">כל הסגנונות</option>
          {GENRES.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </Select>
        <Select name="city" defaultValue={city ?? ""}>
          <option value="">כל הערים</option>
          {CITIES.map((c) => (
            <option key={c.name}>{c.name}</option>
          ))}
        </Select>
        <Button type="submit" variant="secondary" className="h-12">
          חיפוש
        </Button>
      </form>

      {profiles.length ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {profiles.map((p) => (
            <ProfileCard key={p.id} profile={p} />
          ))}
        </div>
      ) : (
        <EmptyState title="לא מצאנו">נסו לשנות את החיפוש או להסיר סינון.</EmptyState>
      )}
    </div>
  );
}
