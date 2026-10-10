"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CalendarDays, Check, Clock, Repeat2, X } from "lucide-react";
import { respondToOffer } from "@/app/actions";
import { DEAL_BY_TYPE, summarizeTerms } from "@/lib/deals";
import type { Offer, OfferStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Avatar, Button } from "./ui";

export const STATUS_UI: Record<OfferStatus, { label: string; className: string }> = {
  pending: { label: "ממתין לתשובה", className: "bg-spot/15 text-spot" },
  accepted: { label: "נסגר! 🎉", className: "bg-venue/15 text-venue" },
  declined: { label: "נדחה", className: "bg-night-3 text-fog" },
  cancelled: { label: "בוטל", className: "bg-live/15 text-live" },
  completed: { label: "הסתיים", className: "bg-night-3 text-fog" },
};

function formatOfferDate(date: string, time: string) {
  const d = new Date(`${date}T12:00:00Z`);
  return {
    date: new Intl.DateTimeFormat("he-IL", { weekday: "short", day: "numeric", month: "long", timeZone: "UTC" }).format(d),
    time: time.slice(0, 5),
  };
}

/** Booking offer with the actions available to the viewer. Used in the chat and in /bookings. */
export function OfferCard({ offer, meId, compact }: { offer: Offer; meId: string; compact?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const other = offer.venue_id === meId ? offer.artist : offer.venue;
  const myTurn = offer.status === "pending" && offer.proposed_by !== meId;
  const { date, time } = formatOfferDate(offer.event_date, offer.start_time);
  const status = STATUS_UI[offer.status];

  const act = (action: "accept" | "decline" | "cancel") =>
    startTransition(async () => {
      if (action === "cancel" && !confirm("לבטל את ההופעה?")) return;
      const res = await respondToOffer(offer.id, action);
      if (res?.error) return setError(res.error);
      router.refresh();
    });

  return (
    <div className={cn("rounded-2xl border bg-night-2 p-4", myTurn ? "border-spot/50" : "border-line")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {other && <Avatar name={other.display_name} src={other.avatar_url} seed={other.id} role={other.role} size={40} />}
          <div>
            <div className="text-xs text-fog">הצעת הופעה · {DEAL_BY_TYPE[offer.deal_type].title}</div>
            <div className="font-semibold">{other?.display_name}</div>
          </div>
        </div>
        <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold", status.className)}>
          {offer.status === "pending" ? (myTurn ? "מחכה לך" : "נשלח, ממתין") : status.label}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="size-4 text-spot" /> {date}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="size-4 text-spot" /> {time} · {offer.set_length_min} דק׳
        </span>
      </div>
      <div className="display mt-2 text-3xl text-spot">{summarizeTerms(offer)}</div>
      {!compact && offer.message && <p className="mt-2 whitespace-pre-line text-sm text-fog">{offer.message}</p>}

      {error && <p className="mt-2 text-sm text-live">{error}</p>}

      {myTurn && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" disabled={pending} onClick={() => act("accept")}>
            <Check className="size-4" /> אישור
          </Button>
          <Link href={`/bookings/${offer.id}/counter`} className="contents">
            <Button size="sm" variant="secondary" disabled={pending}>
              <Repeat2 className="size-4" /> הצעה נגדית
            </Button>
          </Link>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => act("decline")}>
            <X className="size-4" /> דחייה
          </Button>
        </div>
      )}
      {offer.status === "pending" && !myTurn && (
        <div className="mt-3 flex items-center justify-between text-xs text-dim">
          <span>ממתינים לתשובה מ{other?.display_name}</span>
          <button onClick={() => act("cancel")} disabled={pending} className="hover:text-live">
            ביטול ההצעה
          </button>
        </div>
      )}
      {offer.status === "accepted" && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {offer.event_id && (
            <Link href={`/events/${offer.event_id}`} className="text-sm font-medium text-venue hover:underline">
              לעמוד האירוע ←
            </Link>
          )}
          <button onClick={() => act("cancel")} disabled={pending} className="ms-auto text-xs text-dim hover:text-live">
            ביטול ההופעה
          </button>
        </div>
      )}
    </div>
  );
}
