"use client";
import { useActionState, useState } from "react";
import { counterOffer, createOffer, type ActionState } from "@/app/actions";
import { DEALS, DEAL_BY_TYPE, FEES, projectDeal, ticketBuyerPrice } from "@/lib/deals";
import type { DealTerms, DealType, Offer } from "@/lib/types";
import { cn, formatShekels } from "@/lib/utils";
import { Button, Card, Field, FormError, Input, Textarea } from "./ui";

interface Props {
  mode: "create" | "counter";
  /** create: the other party's profile id; counter: the offer being countered */
  otherId?: string;
  offer?: Offer;
  minDate: string;
  capacity?: number | null;
  /** Artist's own fee range, as a hint for the venue. */
  feeHint?: string | null;
  /** Starting amount for a new offer (the artist's minimum fee), so the projection opens with real numbers. */
  defaultFee?: number | null;
  viewerRole: "artist" | "venue";
}

const toNum = (v: string) => (v === "" ? null : Number(v));

/**
 * The deal builder: choose a money model, fill in only what that model needs,
 * and watch a live projection of what each side walks away with.
 */
export function DealBuilder({ mode, otherId, offer, minDate, capacity, feeHint, defaultFee, viewerRole }: Props) {
  const [state, action, pending] = useActionState<ActionState, FormData>(mode === "create" ? createOffer : counterOffer, undefined);
  const [dealType, setDealType] = useState<DealType>(offer?.deal_type ?? "fixed_fee");
  const [fee, setFee] = useState((offer?.fee_amount ?? defaultFee)?.toString() ?? "");
  const [ticket, setTicket] = useState(offer?.ticket_price?.toString() ?? (mode === "create" ? "50" : ""));
  const [share, setShare] = useState(offer?.artist_share_pct?.toString() ?? "70");
  const [bonusAt, setBonusAt] = useState(offer?.bonus_threshold?.toString() ?? "");
  const [bonus, setBonus] = useState(offer?.bonus_amount?.toString() ?? "");
  const cap = capacity ?? 80;
  const [attendance, setAttendance] = useState(Math.round(cap * 0.6));

  const info = DEAL_BY_TYPE[dealType];
  const terms: DealTerms = {
    deal_type: dealType,
    fee_amount: info.needs.fee ? toNum(fee) : null,
    ticket_price: info.needs.ticket || dealType === "fixed_fee" ? toNum(ticket) : null,
    artist_share_pct: info.needs.share ? toNum(share) : null,
    bonus_threshold: info.needs.bonus ? toNum(bonusAt) : null,
    bonus_amount: info.needs.bonus ? toNum(bonus) : null,
  };
  const projection = projectDeal(terms, attendance);
  const hasTickets = (terms.ticket_price ?? 0) > 0;

  return (
    <form action={action} className="flex flex-col gap-5">
      {otherId && <input type="hidden" name="other_id" value={otherId} />}
      {offer && <input type="hidden" name="offer_id" value={offer.id} />}
      <input type="hidden" name="deal_type" value={dealType} />

      {/* When */}
      <Card className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3">
        <Field label="תאריך">
          <Input name="event_date" type="date" required min={minDate} defaultValue={offer?.event_date} />
        </Field>
        <Field label="שעת עלייה">
          <Input name="start_time" type="time" required defaultValue={offer?.start_time?.slice(0, 5) ?? "21:00"} />
        </Field>
        <Field label="אורך (דקות)" className="col-span-2 sm:col-span-1">
          <Input name="set_length_min" type="number" min={15} max={600} step={15} defaultValue={offer?.set_length_min ?? 90} />
        </Field>
      </Card>

      {/* Model */}
      <div>
        <h2 className="display mb-3 text-3xl">איך מתחלק הכסף?</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {DEALS.map((d) => (
            <button
              type="button"
              key={d.type}
              onClick={() => setDealType(d.type)}
              className={cn(
                "rounded-2xl border p-4 text-start transition",
                dealType === d.type ? "border-spot bg-spot/10" : "border-line bg-night/60 hover:border-fog",
              )}
            >
              <div className={cn("font-semibold", dealType === d.type && "text-spot")}>{d.title}</div>
              <div className="mt-1 text-sm text-fog">{d.short}</div>
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-dim">{info.explain}</p>
      </div>

      {/* Terms */}
      {dealType !== "free_tips" && (
        <Card className="grid gap-4 p-5 sm:grid-cols-2">
          {info.needs.fee && (
            <Field label={`${info.feeLabel} (₪)`} hint={feeHint ?? undefined}>
              <Input name="fee_amount" type="number" min={0} step={50} required value={fee} onChange={(e) => setFee(e.target.value)} />
            </Field>
          )}
          {(info.needs.ticket || dealType === "fixed_fee") && (
            <Field
              label="מחיר כרטיס (₪)"
              hint={
                dealType === "fixed_fee"
                  ? "אופציונלי — הכנסות הכרטיסים למקום"
                  : hasTickets
                    ? `הקהל משלם ${formatShekels(ticketBuyerPrice(terms.ticket_price!))} כולל דמי שירות`
                    : undefined
              }
            >
              <Input name="ticket_price" type="number" min={0} step={5} required={info.needs.ticket} value={ticket} onChange={(e) => setTicket(e.target.value)} />
            </Field>
          )}
          {info.needs.share && (
            <Field label={`אחוז לאמן: ${share || 0}%`}>
              <input
                name="artist_share_pct"
                type="range"
                min={0}
                max={100}
                step={5}
                value={share}
                onChange={(e) => setShare(e.target.value)}
                className="mt-3 accent-[var(--color-spot)]"
              />
            </Field>
          )}
          {info.needs.bonus && (
            <>
              <Field label="יעד כרטיסים לבונוס">
                <Input name="bonus_threshold" type="number" min={1} required value={bonusAt} onChange={(e) => setBonusAt(e.target.value)} />
              </Field>
              <Field label="גובה הבונוס (₪)">
                <Input name="bonus_amount" type="number" min={0} step={50} required value={bonus} onChange={(e) => setBonus(e.target.value)} />
              </Field>
            </>
          )}
        </Card>
      )}

      {/* Live projection */}
      {dealType !== "free_tips" && (
        <Card className="border-spot/30 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="display text-3xl">מה כל צד מקבל</h3>
            {hasTickets && (
              <span className="text-sm text-fog">
                אם יגיעו <span className="font-semibold text-cream">{attendance}</span> איש
              </span>
            )}
          </div>
          {hasTickets && (
            <input
              type="range"
              min={0}
              max={cap}
              value={attendance}
              onChange={(e) => setAttendance(Number(e.target.value))}
              className="mt-3 w-full accent-[var(--color-spot)]"
              aria-label="כמות קהל משוערת"
            />
          )}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-artist/10 p-4">
              <div className="text-xs text-artist">האמן מקבל</div>
              <div className="display text-4xl">{formatShekels(projection.artistGets)}</div>
            </div>
            <div className="rounded-2xl bg-venue/10 p-4">
              <div className="text-xs text-venue">{projection.venuePays > 0 ? "המקום משלם" : "המקום מקבל מכרטיסים"}</div>
              <div className="display text-4xl">{formatShekels(projection.venuePays > 0 ? projection.venuePays : projection.venueTicketShare)}</div>
            </div>
          </div>
          <ul className="mt-3 space-y-1 text-sm text-fog">
            {projection.lines.map((l) => (
              <li key={l}>• {l}</li>
            ))}
            {info.needs.fee && (
              <li className="text-dim">
                • עמלת LiveTime: {FEES.bookingVenuePct}% מהמקום + {FEES.bookingArtistPct}% מהאמן על הסכום המובטח
              </li>
            )}
          </ul>
        </Card>
      )}

      <Field label={viewerRole === "venue" ? "הודעה לאמן" : "הודעה למקום"}>
        <Textarea name="message" maxLength={2000} defaultValue={mode === "counter" ? "" : undefined} placeholder="כמה מילים על הערב, הקהל, הציוד..." className="min-h-24" />
      </Field>

      <FormError message={state?.error} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "שולחים..." : mode === "create" ? "שליחת ההצעה" : "שליחת הצעה נגדית"}
      </Button>
    </form>
  );
}
