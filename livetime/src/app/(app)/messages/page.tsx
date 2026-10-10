import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar, EmptyState, RoleBadge } from "@/components/ui";
import { getViewer, listConversations } from "@/lib/data";
import { cn, relativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "הודעות" };

export default async function MessagesPage() {
  const viewer = await getViewer();
  if (!viewer?.profile) redirect("/login?next=/messages");
  const conversations = await listConversations();
  const me = viewer.profile.id;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="display mb-6 text-6xl">הודעות</h1>
      {conversations.length === 0 ? (
        <EmptyState title="שקט כאן">שיחות מתחילות מכפתור ״הודעה״ בפרופיל של אמן או מקום.</EmptyState>
      ) : (
        <div className="flex flex-col gap-1">
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`/messages/${c.id}`}
              className="flex items-center gap-3 rounded-2xl p-3 transition hover:bg-night-2"
            >
              <Avatar name={c.other.display_name} src={c.other.avatar_url} seed={c.other.id} role={c.other.role} size={52} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn("truncate", c.unread ? "font-bold" : "font-medium")}>{c.other.display_name}</span>
                  <RoleBadge role={c.other.role} />
                  <span className="ms-auto shrink-0 text-xs text-dim">{relativeTime(c.last_message_at)}</span>
                </div>
                <div className={cn("truncate text-sm", c.unread ? "text-cream" : "text-fog")}>
                  {c.last_message?.sender_id === me && "את/ה: "}
                  {c.last_message?.kind === "offer" ? "🤝 הצעת הופעה" : (c.last_message?.body ?? "")}
                </div>
              </div>
              {c.unread && <span className="size-2.5 shrink-0 rounded-full bg-live" />}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
