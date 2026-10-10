"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { SendHorizontal } from "lucide-react";
import { markConversationRead, sendMessage } from "@/app/actions";
import { OfferCard } from "@/components/offer-card";
import { getBrowserClient } from "@/lib/supabase/client";
import type { Message, Offer, ProfileSummary } from "@/lib/types";
import { cn, formatTime } from "@/lib/utils";

const OFFER_EVENT_TEXT: Record<NonNullable<Message["offer_event"]>, string> = {
  created: "שלח/ה הצעת הופעה",
  countered: "שלח/ה הצעה נגדית",
  accepted: "אישר/ה את ההופעה 🎉",
  declined: "דחה/תה את ההצעה",
  cancelled: "ביטל/ה",
};

export function ChatThread({
  conversationId,
  meId,
  initialMessages,
  offers,
  other,
}: {
  conversationId: string;
  meId: string;
  initialMessages: Message[];
  offers: Offer[];
  other: ProfileSummary;
}) {
  const router = useRouter();
  // Messages that arrived after the server render (realtime or sent from here).
  const [live, setLive] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const offerById = new Map(offers.map((o) => [o.id, o]));
  const seen = new Set(initialMessages.map((m) => m.id));
  const messages = [...initialMessages, ...live.filter((m) => !seen.has(m.id))].sort((x, y) =>
    x.created_at.localeCompare(y.created_at),
  );
  const addLive = (m: Message) => setLive((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));

  // Realtime: new messages in this conversation.
  useEffect(() => {
    const supabase = getBrowserClient();
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload: { new: Message }) => {
          const m = payload.new as Message;
          addLive(m);
          // Offer state changed → refetch offers from the server.
          if (m.kind === "offer") router.refresh();
          if (m.sender_id !== meId) markConversationRead(conversationId);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, meId, router]);

  useEffect(() => {
    markConversationRead(conversationId);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  // The full offer card renders once, at the latest message about that offer.
  const lastIndexForOffer = new Map<string, number>();
  messages.forEach((m, i) => m.offer_id && lastIndexForOffer.set(m.offer_id, i));

  function send() {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    setError(null);
    startSending(async () => {
      const res = await sendMessage(conversationId, body);
      if ("error" in res && res.error) {
        setError(res.error);
        setDraft(body);
        return;
      }
      if ("message" in res && res.message) {
        addLive(res.message as Message);
      }
    });
  }

  return (
    <>
      <div className="no-scrollbar flex flex-1 flex-col gap-2 overflow-y-auto py-4">
        {messages.length === 0 && (
          <p className="m-auto max-w-xs text-center text-sm text-dim">זו תחילת השיחה עם {other.display_name}. תגידו שלום 👋</p>
        )}
        {messages.map((m, i) => {
          const mine = m.sender_id === meId;
          if (m.kind === "offer" && m.offer_id) {
            const offer = offerById.get(m.offer_id);
            const isLatest = lastIndexForOffer.get(m.offer_id) === i;
            return (
              <div key={m.id} className="my-1 flex flex-col gap-2">
                <div className="text-center text-xs text-dim">
                  {mine ? "את/ה" : other.display_name} {m.offer_event ? OFFER_EVENT_TEXT[m.offer_event] : ""} · {formatTime(m.created_at)}
                </div>
                {m.body && (
                  <div className={cn("max-w-[80%] rounded-2xl px-4 py-2.5", mine ? "self-start bg-spot text-ink" : "self-end bg-night-3")}>
                    {m.body}
                  </div>
                )}
                {isLatest && offer && (
                  <div className="mx-auto w-full max-w-md">
                    <OfferCard offer={offer} meId={meId} />
                  </div>
                )}
              </div>
            );
          }
          return (
            <div
              key={m.id}
              className={cn(
                "max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2.5",
                mine ? "self-start rounded-ss-md bg-spot text-ink" : "self-end rounded-se-md bg-night-3",
              )}
            >
              {m.body}
              <div className={cn("mt-1 text-[10px]", mine ? "text-ink/60" : "text-dim")}>{formatTime(m.created_at)}</div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && <p className="pb-2 text-sm text-live">{error}</p>}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-end gap-2 border-t border-line pt-3"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="כתבו הודעה..."
          className="max-h-32 min-h-12 flex-1 resize-none rounded-2xl border border-line bg-night-2 px-4 py-3 outline-none focus:border-spot"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-spot text-ink transition active:scale-95 disabled:opacity-40"
          aria-label="שליחה"
        >
          <SendHorizontal className="size-5 -scale-x-100" />
        </button>
      </form>
    </>
  );
}
