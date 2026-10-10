import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Camera, CirclePlay, Globe, Handshake, MapPin, Music2, Pencil } from "lucide-react";
import { EventRow } from "@/components/cards";
import { PostCard } from "@/components/post-card";
import { FollowButton, MessageButton, ReactionButton } from "@/components/social";
import { Avatar, ButtonLink, Card, Cover, EmptyState, RoleBadge, VerifiedMark } from "@/components/ui";
import { ACT_TYPE_LABEL, GENRE_LABEL, VENUE_TYPE_LABEL } from "@/lib/constants";
import { getArtistDemand, getFollowingIds, getMyReactions, getProfileByHandle, getViewer, listEvents, listPosts } from "@/lib/data";
import type { Profile } from "@/lib/types";
import { formatShekels } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/p/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  const p = await getProfileByHandle(handle);
  return p ? { title: p.display_name, description: p.tagline ?? undefined } : {};
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div>
      <div className="display text-3xl leading-none">{value}</div>
      <div className="text-xs text-fog">{label}</div>
    </div>
  );
}

function Details({ p }: { p: Profile }) {
  const rows: [string, React.ReactNode][] =
    p.role === "artist"
      ? [
          ["הרכב", p.act_type && `${ACT_TYPE_LABEL[p.act_type]}${p.members_count && p.members_count > 1 ? ` · ${p.members_count} נגנים` : ""}`],
          ["טווח מחיר", p.fee_min != null ? `${formatShekels(p.fee_min)}${p.fee_max ? ` – ${formatShekels(p.fee_max)}` : "+"}` : null],
          ["אורך סט", p.set_length_min && `${p.set_length_min} דקות`],
          ["דילים על כרטיסים", p.open_to_door_deals == null ? null : p.open_to_door_deals ? "פתוחים" : "רק שכר קבוע"],
          ["טכני", p.tech_needs],
        ]
      : p.role === "venue"
        ? [
            ["סוג", p.venue_type && VENUE_TYPE_LABEL[p.venue_type]],
            ["קיבולת", p.capacity && `עד ${p.capacity} איש`],
            ["כתובת", p.address],
            ["ערבי מוזיקה", p.music_nights],
            ["תקציב להופעה", p.budget_max ? `${formatShekels(p.budget_min ?? 0)} – ${formatShekels(p.budget_max)}` : null],
            [
              "במקום",
              [p.has_stage && "במה", p.has_sound_system && "הגברה", p.has_piano && "פסנתר"].filter(Boolean).join(" · ") || null,
            ],
            ["ציוד", p.equipment],
          ]
        : [];
  const shown = rows.filter(([, v]) => v);
  if (!shown.length) return null;
  return (
    <Card className="p-5">
      <h3 className="display mb-3 text-3xl">{p.role === "artist" ? "על ההופעה" : "על המקום"}</h3>
      <dl className="flex flex-col divide-y divide-line">
        {shown.map(([k, v]) => (
          <div key={k} className="flex gap-4 py-2.5 text-sm">
            <dt className="w-28 shrink-0 text-fog">{k}</dt>
            <dd className="whitespace-pre-line">{v}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

const LINK_ICON = { instagram: Camera, youtube: CirclePlay, spotify: Music2, website: Globe } as const;

export default async function ProfilePage({ params }: PageProps<"/p/[handle]">) {
  const { handle } = await params;
  const profile = await getProfileByHandle(handle);
  if (!profile) notFound();

  const viewer = await getViewer();
  const me = viewer?.profile ?? null;
  const isMe = me?.id === profile.id;
  const signedIn = Boolean(me);

  const [events, posts, following, demand] = await Promise.all([
    profile.role === "fan" ? Promise.resolve([]) : listEvents({ profileId: profile.id, limit: 20 }),
    listPosts({ profileId: profile.id, limit: 20 }),
    getFollowingIds(),
    profile.role === "artist" ? getArtistDemand(profile.id) : Promise.resolve([]),
  ]);
  const reactions = await getMyReactions([profile.id, ...posts.map((p) => p.id)]);
  const canBook =
    me && ((me.role === "venue" && profile.role === "artist") || (me.role === "artist" && profile.role === "venue"));
  const maxDemand = Math.max(1, ...demand.map((d) => d.fans));

  return (
    <div className="-mx-4 -mt-5 sm:-mx-6 lg:-mx-10 lg:-mt-8">
      <Cover seed={profile.id} src={profile.cover_url} className="h-48 sm:h-64" />
      <div className="relative px-4 sm:px-6 lg:px-10">
        <div className="-mt-14 flex flex-wrap items-end justify-between gap-4">
          <Avatar
            name={profile.display_name}
            src={profile.avatar_url}
            seed={profile.id}
            role={profile.role}
            size={112}
            className="ring-4"
          />
          <div className="flex flex-wrap gap-2">
            {isMe ? (
              <ButtonLink href="/settings" variant="secondary">
                <Pencil className="size-4" /> עריכת פרופיל
              </ButtonLink>
            ) : (
              <>
                {canBook && (
                  <ButtonLink href={`/bookings/new?with=${profile.handle}`}>
                    <Handshake className="size-4" /> {me?.role === "venue" ? "שליחת הצעה" : "הצעת הופעה"}
                  </ButtonLink>
                )}
                <FollowButton profileId={profile.id} initialActive={following.includes(profile.id)} signedIn={signedIn} />
                {profile.role !== "fan" && <MessageButton profileId={profile.id} signedIn={signedIn} />}
              </>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="display text-5xl sm:text-6xl">{profile.display_name}</h1>
            {profile.verified && <VerifiedMark />}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-fog">
            <RoleBadge role={profile.role} />
            <span dir="ltr">@{profile.handle}</span>
            {profile.city && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" /> {profile.city}
              </span>
            )}
          </div>
          {profile.tagline && <p className="text-lg">{profile.tagline}</p>}
          {profile.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {profile.genres.map((g) => (
                <span key={g} className="rounded-full bg-night-3 px-2.5 py-1 text-xs text-fog">
                  {GENRE_LABEL[g] ?? g}
                </span>
              ))}
            </div>
          )}
          <div className="mt-3 flex gap-8">
            <Stat value={profile.followers_count.toLocaleString("he-IL")} label="עוקבים" />
            {profile.role !== "fan" && <Stat value={events.length} label="הופעות קרובות" />}
            {profile.role === "artist" && <Stat value={profile.bring_count.toLocaleString("he-IL")} label="מבקשים אותם" />}
          </div>
          {!isMe && profile.role === "artist" && me?.role === "fan" && (
            <div className="mt-3">
              <ReactionButton
                targetType="profile"
                targetId={profile.id}
                kind="bring"
                size="md"
                initialActive={reactions.has(`${profile.id}:bring`)}
                signedIn={signedIn}
              />
            </div>
          )}
          {!isMe && canBook && (
            <div className="mt-3">
              <ReactionButton targetType="profile" targetId={profile.id} kind="save" initialActive={reactions.has(`${profile.id}:save`)} signedIn={signedIn} />
            </div>
          )}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-8">
            {profile.role !== "fan" && (
              <section>
                <h2 className="display mb-3 text-4xl">הופעות קרובות</h2>
                {events.length ? (
                  <div className="flex flex-col gap-1">
                    {events.map((e) => (
                      <EventRow key={e.id} event={e} />
                    ))}
                  </div>
                ) : (
                  <EmptyState title="אין הופעות קרובות">
                    {canBook ? "זה הזמן לשלוח הצעה." : "עקבו כדי לדעת כשתעלה הופעה חדשה."}
                  </EmptyState>
                )}
              </section>
            )}
            <section>
              <h2 className="display mb-3 text-4xl">פוסטים</h2>
              <div className="flex flex-col gap-4">
                {posts.map((p) => (
                  <PostCard key={p.id} post={{ ...p, author: p.author ?? profile }} encored={reactions.has(`${p.id}:encore`)} signedIn={signedIn} />
                ))}
                {posts.length === 0 && <p className="text-sm text-dim">עוד לא פורסם כלום.</p>}
              </div>
            </section>
          </div>

          <aside className="flex flex-col gap-4">
            {profile.bio && (
              <Card className="p-5">
                <h3 className="display mb-2 text-3xl">קצת עלינו</h3>
                <p className="whitespace-pre-line leading-relaxed text-fog">{profile.bio}</p>
              </Card>
            )}
            <Details p={profile} />
            {demand.length > 0 && (
              <Card className="p-5">
                <h3 className="display text-3xl">איפה מבקשים אותם</h3>
                <p className="mb-4 text-xs text-dim">קהל שלחץ ״תביאו אותם!״ לפי עיר</p>
                <div className="flex flex-col gap-2.5">
                  {demand.map((d) => (
                    <div key={d.city} className="text-sm">
                      <div className="mb-1 flex justify-between">
                        <span>{d.city}</span>
                        <span className="tabular-nums text-fog">{d.fans}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-night-3">
                        <div className="h-full rounded-full bg-fan" style={{ width: `${(d.fans / maxDemand) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            {Object.keys(profile.links ?? {}).length > 0 && (
              <Card className="flex flex-wrap gap-2 p-4">
                {Object.entries(profile.links).map(([k, url]) => {
                  const Icon = LINK_ICON[k as keyof typeof LINK_ICON] ?? Globe;
                  return (
                    <a key={k} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm text-fog hover:text-cream">
                      <Icon className="size-4" /> {k}
                    </a>
                  );
                })}
              </Card>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
