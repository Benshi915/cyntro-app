import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Guitar, Store, Ticket } from "lucide-react";
import { EventPoster } from "@/components/cards";
import { ButtonLink, Card, LiveDot, Logo } from "@/components/ui";
import { getViewer, listEvents } from "@/lib/data";
import { DEALS } from "@/lib/deals";

const SIDES = [
  {
    role: "artist",
    icon: Guitar,
    color: "text-artist",
    ring: "hover:border-artist/50",
    title: "אמנים",
    cta: "אני מנגן/ת",
    points: ["פרופיל עם מוזיקה, וידאו והופעות", "מקומות פונים אליכם — או אתם אליהם", "חוזה ברור ותשלום מובטח"],
  },
  {
    role: "venue",
    icon: Store,
    color: "text-venue",
    ring: "hover:border-venue/50",
    title: "מקומות",
    cta: "יש לי מקום",
    points: ["מוצאים אמנים לפי סגנון, מחיר ותאריך", "רואים כמה קהל מבקש כל אמן באזור", "מודל עסקה שמתאים לכם"],
  },
  {
    role: "fan",
    icon: Ticket,
    color: "text-fan",
    ring: "hover:border-fan/50",
    title: "קהל",
    cta: "אני בא/ה לשמוע",
    points: ["כל ההופעות הקטנות על מפה אחת", "עוקבים אחרי אמנים ומקומות", "מבקשים את האמנים שאתם אוהבים"],
  },
] as const;

export default async function Landing() {
  const viewer = await getViewer();
  if (viewer) redirect(viewer.profile ? "/feed" : "/onboarding");
  const events = await listEvents({ limit: 8 });

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-1">
          <ButtonLink href="/feed" variant="ghost" size="sm" className="hidden sm:inline-flex">
            להופעות
          </ButtonLink>
          <ButtonLink href="/login" variant="ghost" size="sm">
            כניסה
          </ButtonLink>
          <ButtonLink href="/signup" size="sm">
            הצטרפות
          </ButtonLink>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl overflow-hidden px-4 pb-16 pt-10 sm:px-6 sm:pt-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-32 h-[560px] bg-[radial-gradient(ellipse_40%_60%_at_70%_0%,rgb(255_178_62/0.16),transparent_70%)]"
        />
        <div className="relative max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-night/70 px-3 py-1.5 text-sm text-fog">
            <LiveDot className="size-2" /> {events.length} הופעות קרובות ברשת
          </div>
          <h1 className="display text-[clamp(4rem,13vw,9.5rem)]">
            המוזיקה החיה
            <br />
            <span className="text-spot">של העיר.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-fog sm:text-xl">
            LiveTime מחברת בין אמנים, מקומות וקהל. מקומות מוצאים את האמן הבא שלהם, אמנים סוגרים הופעות בתנאים ברורים —
            והקהל יודע איפה מנגנים הערב.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/signup?role=artist" size="lg">
              אני אמן/ית
            </ButtonLink>
            <ButtonLink href="/signup?role=venue" size="lg" variant="secondary">
              יש לי מקום
            </ButtonLink>
            <ButtonLink href="/feed" size="lg" variant="ghost">
              מה מנגנים הערב? <ArrowLeft className="size-4" />
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Upcoming rail */}
      {events.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="display text-5xl">בקרוב על הבמה</h2>
            <Link href="/feed" className="text-sm text-spot hover:underline">
              לכל ההופעות
            </Link>
          </div>
          <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
            {events.map((e) => (
              <EventPoster key={e.id} event={e} className="w-60 shrink-0 snap-start sm:w-64" />
            ))}
          </div>
        </section>
      )}

      {/* Three sides */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <h2 className="display mb-8 text-5xl sm:text-6xl">
          שלושה צדדים. <span className="text-spot">במה אחת.</span>
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {SIDES.map((s) => (
            <Link key={s.role} href={`/signup?role=${s.role}`} className="group">
              <Card className={`h-full p-6 transition ${s.ring}`}>
                <s.icon className={`size-8 ${s.color}`} />
                <h3 className="display mt-4 text-4xl">{s.title}</h3>
                <ul className="mt-4 space-y-2 text-fog">
                  {s.points.map((p) => (
                    <li key={p} className="flex gap-2">
                      <span className={s.color}>●</span> {p}
                    </li>
                  ))}
                </ul>
                <div className={`mt-6 inline-flex items-center gap-1 font-medium ${s.color}`}>
                  {s.cta} <ArrowLeft className="size-4 transition group-hover:-translate-x-1" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Deal models */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="mb-8 max-w-2xl">
          <h2 className="display text-5xl sm:text-6xl">כל דיל אפשרי.</h2>
          <p className="mt-3 text-lg text-fog">
            מחיר קבוע, כרטיסים, חלוקת קופה או טיפים — בוחרים מודל, רואים מראש כמה כל צד מרוויח, וסוגרים בלחיצה.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DEALS.map((d, i) => (
            <Card key={d.type} className="p-5">
              <div className="flex items-baseline gap-3">
                <span className="display text-3xl text-spot">0{i + 1}</span>
                <h3 className="text-lg font-semibold">{d.title}</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-fog">{d.explain}</p>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-dim sm:px-6">
          <Logo className="opacity-70" />
          <span>נבנה בישראל, למוזיקה חיה בכל מקום.</span>
        </div>
      </footer>
    </div>
  );
}
