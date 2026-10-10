import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { EventPoster, isLiveNow } from "@/components/cards";
import { PostCard } from "@/components/post-card";
import { ButtonLink, Card, Chip, EmptyState, SectionTitle } from "@/components/ui";
import { CITIES, GENRES } from "@/lib/constants";
import { getFollowingIds, getMyReactions, getViewer, listEvents, listPosts } from "@/lib/data";
import { jerusalemToIso, todayInIsrael } from "@/lib/utils";

export const metadata: Metadata = { title: "מה קורה" };

export default async function FeedPage({ searchParams }: PageProps<"/feed">) {
  const sp = await searchParams;
  const city = typeof sp.city === "string" ? sp.city : undefined;
  const genre = typeof sp.genre === "string" ? sp.genre : undefined;
  const viewer = await getViewer();
  const me = viewer?.profile ?? null;

  const following = me ? await getFollowingIds() : [];
  const [events, posts] = await Promise.all([
    listEvents({ city, genre, limit: 24 }),
    listPosts(following.length && me ? { profileIds: [...following, me.id], limit: 20 } : { limit: 20 }),
  ]);
  const reactions = await getMyReactions(posts.map((p) => p.id));

  const startOfTomorrow = new Date(jerusalemToIso(todayInIsrael(1), "05:00")); // the night runs until early morning
  const tonight = events.filter((e) => new Date(e.starts_at) < startOfTomorrow);
  const later = events.filter((e) => new Date(e.starts_at) >= startOfTomorrow);
  const liveCount = events.filter(isLiveNow).length;

  const href = (patch: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const next = { city, genre, ...patch };
    Object.entries(next).forEach(([k, v]) => v && q.set(k, v));
    const s = q.toString();
    return s ? `/feed?${s}` : "/feed";
  };

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="display text-6xl sm:text-7xl">
          {me ? `היי ${me.role === "fan" ? me.display_name.split(" ")[0] : me.display_name},` : "מה מנגנים"}
          <br />
          <span className="text-spot">{liveCount > 0 ? `${liveCount} הופעות עכשיו` : "הערב בעיר?"}</span>
        </h1>
        {/* Role-specific nudge */}
        {me?.role === "venue" && (
          <Link href="/discover?type=artist" className="mt-5 block">
            <Card className="flex items-center justify-between gap-4 border-venue/30 p-4 transition hover:border-venue">
              <div>
                <div className="font-semibold text-venue">יש לכם ערב פנוי?</div>
                <div className="text-sm text-fog">מצאו אמן לפי סגנון, מחיר וביקוש קהל באזור.</div>
              </div>
              <Search className="size-5 text-venue" />
            </Card>
          </Link>
        )}
        {me?.role === "artist" && (
          <Link href="/discover?type=venue" className="mt-5 block">
            <Card className="flex items-center justify-between gap-4 border-artist/30 p-4 transition hover:border-artist">
              <div>
                <div className="font-semibold text-artist">מחפשים במה?</div>
                <div className="text-sm text-fog">מקומות שמתאימים לסגנון שלכם — שלחו הצעה ישירות.</div>
              </div>
              <ArrowLeft className="size-5 text-artist" />
            </Card>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 [&>*]:shrink-0">
          <Link href={href({ city: undefined })}>
            <Chip active={!city}>כל הארץ</Chip>
          </Link>
          {CITIES.slice(0, 8).map((c) => (
            <Link key={c.name} href={href({ city: c.name })}>
              <Chip active={city === c.name}>{c.name}</Chip>
            </Link>
          ))}
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 [&>*]:shrink-0">
          <Link href={href({ genre: undefined })}>
            <Chip active={!genre}>כל הסגנונות</Chip>
          </Link>
          {GENRES.map((g) => (
            <Link key={g.id} href={href({ genre: g.id })}>
              <Chip active={genre === g.id}>{g.label}</Chip>
            </Link>
          ))}
        </div>
      </div>

      {tonight.length > 0 && (
        <section>
          <SectionTitle>הערב</SectionTitle>
          <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
            {tonight.map((e) => (
              <EventPoster key={e.id} event={e} className="w-60 shrink-0 snap-start" />
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionTitle action={<Link href="/map" className="text-sm text-spot hover:underline">על המפה</Link>}>
          {tonight.length ? "בהמשך" : "בקרוב"}
        </SectionTitle>
        {later.length ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {later.map((e) => (
              <EventPoster key={e.id} event={e} />
            ))}
          </div>
        ) : (
          <EmptyState title="שקט על הבמה" action={me && me.role !== "fan" ? <ButtonLink href="/events/new">יצירת אירוע</ButtonLink> : undefined}>
            אין עדיין הופעות לפי הסינון הזה.
          </EmptyState>
        )}
      </section>

      <section className="max-w-2xl">
        <SectionTitle>{following.length ? "מהאנשים שלך" : "מאחורי הקלעים"}</SectionTitle>
        <div className="flex flex-col gap-4">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} encored={reactions.has(`${p.id}:encore`)} signedIn={Boolean(me)} />
          ))}
          {posts.length === 0 && <EmptyState title="עוד אין פוסטים">עקבו אחרי אמנים ומקומות כדי לראות כאן מה חדש.</EmptyState>}
        </div>
      </section>
    </div>
  );
}
