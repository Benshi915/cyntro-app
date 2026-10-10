import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, Handshake } from "lucide-react";
import { Avatar, ButtonLink, RoleBadge } from "@/components/ui";
import { getConversation, getViewer } from "@/lib/data";
import { ChatThread } from "./chat-thread";

export const metadata: Metadata = { title: "שיחה" };

export default async function ConversationPage({ params }: PageProps<"/messages/[id]">) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer?.profile) redirect(`/login?next=/messages/${id}`);
  const conv = await getConversation(id);
  if (!conv) notFound();
  const { me, other } = conv;
  const canBook = (me.role === "venue" && other.role === "artist") || (me.role === "artist" && other.role === "venue");

  return (
    <div className="mx-auto flex h-[calc(100dvh-11rem)] max-w-3xl flex-col lg:h-[calc(100dvh-5rem)]">
      <div className="flex items-center gap-3 border-b border-line pb-3">
        <Link href="/messages" className="text-fog hover:text-cream" aria-label="חזרה">
          <ArrowRight className="size-5" />
        </Link>
        <Link href={`/p/${other.handle}`} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar name={other.display_name} src={other.avatar_url} seed={other.id} role={other.role} size={42} />
          <div className="min-w-0">
            <div className="truncate font-semibold">{other.display_name}</div>
            <RoleBadge role={other.role} />
          </div>
        </Link>
        {canBook && (
          <ButtonLink href={`/bookings/new?with=${other.handle}`} size="sm">
            <Handshake className="size-4" /> הצעה
          </ButtonLink>
        )}
      </div>
      <ChatThread conversationId={id} meId={me.id} initialMessages={conv.messages} offers={conv.offers} other={other} />
    </div>
  );
}
