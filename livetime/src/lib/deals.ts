import type { DealTerms, DealType } from "./types";
import { formatShekels } from "./utils";

/**
 * Platform economics. Kept in one place so pricing experiments are a one-line change.
 * - Bookings with a fixed component: commission on the guaranteed amount, split between
 *   the venue (added on top) and the artist (deducted from payout).
 * - Ticketed shows: a service fee paid by the buyer, so neither side "pays" LiveTime.
 * - Tips: a small cut of digital tips.
 */
export const FEES = {
  bookingVenuePct: 5,
  bookingArtistPct: 5,
  ticketServicePct: 7,
  ticketServiceFixed: 2,
  tipsPct: 5,
} as const;

export interface DealInfo {
  type: DealType;
  title: string;
  short: string;
  explain: string;
  /** Which terms the form needs. */
  needs: {
    fee?: boolean;
    ticket?: boolean;
    share?: boolean;
    bonus?: boolean;
  };
  feeLabel?: string;
}

export const DEALS: DealInfo[] = [
  {
    type: "fixed_fee",
    title: "מחיר קבוע",
    short: "המקום משלם לאמן סכום קבוע",
    explain: "הכי פשוט. המקום יודע כמה זה עולה, האמן יודע כמה ירוויח. הכניסה לקהל חופשית או בכרטיס לטובת המקום.",
    needs: { fee: true },
    feeLabel: "שכר האמן",
  },
  {
    type: "door_to_artist",
    title: "הכרטיסים לאמן",
    short: "האמן מוכר כרטיסים, המקום מרוויח מהבר",
    explain: "אין עלות למקום. כל הכנסות הכרטיסים הולכות לאמן — המקום מרוויח מהקהל שמגיע ומזמין.",
    needs: { ticket: true },
  },
  {
    type: "ticket_split",
    title: "חלוקת קופה",
    short: "הכנסות הכרטיסים מתחלקות באחוזים",
    explain: "שני הצדדים שותפים להצלחה. מגדירים מחיר כרטיס ואחוז שהולך לאמן.",
    needs: { ticket: true, share: true },
  },
  {
    type: "versus",
    title: "הגבוה מביניהם",
    short: "מינימום מובטח או אחוז מהקופה — מה שגבוה יותר",
    explain: "המודל המקובל בתעשייה: האמן מוגן בסכום מינימלי, ואם ההופעה מצליחה — מקבל אחוז מהכרטיסים.",
    needs: { fee: true, ticket: true, share: true },
    feeLabel: "מינימום מובטח",
  },
  {
    type: "guarantee_plus_bonus",
    title: "קבוע + בונוס",
    short: "סכום קבוע, ובונוס מעל יעד כרטיסים",
    explain: "תמריץ משותף להביא קהל: שכר קבוע, ואם עוברים יעד — בונוס.",
    needs: { fee: true, ticket: true, bonus: true },
    feeLabel: "שכר קבוע",
  },
  {
    type: "free_tips",
    title: "כניסה חופשית + טיפים",
    short: "הקהל נכנס בחינם ומטפ באפליקציה",
    explain: "מעולה להופעות בית קפה ומקומות קטנים. הקהל סורק QR ומשאיר טיפ לאמן.",
    needs: {},
  },
];

export const DEAL_BY_TYPE = Object.fromEntries(DEALS.map((d) => [d.type, d])) as Record<
  DealType,
  DealInfo
>;

export function ticketBuyerPrice(ticketPrice: number) {
  return Math.round(
    ticketPrice + (ticketPrice * FEES.ticketServicePct) / 100 + FEES.ticketServiceFixed,
  );
}

export interface DealProjection {
  ticketsSold: number;
  venuePays: number;
  artistGets: number;
  venueTicketShare: number;
  platformFee: number;
  lines: string[];
}

/**
 * What each side ends up with at a given attendance — shown live in the deal builder
 * so both sides understand the deal before they send it.
 */
export function projectDeal(terms: DealTerms, ticketsSold: number): DealProjection {
  const fee = terms.fee_amount ?? 0;
  const price = terms.ticket_price ?? 0;
  const share = (terms.artist_share_pct ?? 0) / 100;
  const gross = price * ticketsSold;
  const ticketFees = price > 0 ? ticketsSold * (ticketBuyerPrice(price) - price) : 0;
  const bookingFee = (amount: number) => ({
    venue: Math.round((amount * FEES.bookingVenuePct) / 100),
    artist: Math.round((amount * FEES.bookingArtistPct) / 100),
  });

  let venuePays = 0;
  let artistGets = 0;
  let venueTicketShare = 0;
  let platformFee = ticketFees;
  const lines: string[] = [];

  switch (terms.deal_type) {
    case "fixed_fee": {
      const b = bookingFee(fee);
      venuePays = fee + b.venue;
      artistGets = fee - b.artist;
      venueTicketShare = gross;
      platformFee += b.venue + b.artist;
      lines.push(`המקום משלם ${formatShekels(fee)} + עמלה ${formatShekels(b.venue)}`);
      break;
    }
    case "door_to_artist": {
      artistGets = gross;
      lines.push(`כל ${formatShekels(gross)} מהכרטיסים הולכים לאמן`);
      break;
    }
    case "ticket_split": {
      artistGets = Math.round(gross * share);
      venueTicketShare = gross - artistGets;
      lines.push(`${terms.artist_share_pct}% לאמן, ${100 - (terms.artist_share_pct ?? 0)}% למקום`);
      break;
    }
    case "versus": {
      const pct = Math.round(gross * share);
      const guaranteed = pct < fee;
      const b = bookingFee(fee);
      if (guaranteed) {
        venuePays = fee - pct + b.venue;
        artistGets = fee - b.artist;
        platformFee += b.venue + b.artist;
        lines.push(`האחוז (${formatShekels(pct)}) נמוך מהמינימום — המקום משלים`);
      } else {
        artistGets = pct;
        lines.push(`האחוז (${formatShekels(pct)}) עבר את המינימום`);
      }
      venueTicketShare = gross - pct;
      break;
    }
    case "guarantee_plus_bonus": {
      const b = bookingFee(fee);
      const bonus =
        terms.bonus_threshold && ticketsSold >= terms.bonus_threshold ? (terms.bonus_amount ?? 0) : 0;
      venuePays = fee + bonus + b.venue;
      artistGets = fee + bonus - b.artist;
      venueTicketShare = gross;
      platformFee += b.venue + b.artist;
      lines.push(bonus ? `היעד הושג — בונוס ${formatShekels(bonus)}` : "היעד לא הושג — ללא בונוס");
      break;
    }
    case "free_tips": {
      lines.push("הכנסות מטיפים — תלוי בקהל");
      break;
    }
  }

  return { ticketsSold, venuePays, artistGets, venueTicketShare, platformFee, lines };
}

/** One-line summary for cards and chat bubbles. */
export function summarizeTerms(t: DealTerms) {
  switch (t.deal_type) {
    case "fixed_fee":
      return `${formatShekels(t.fee_amount)} קבוע`;
    case "door_to_artist":
      return `כרטיס ${formatShekels(t.ticket_price)} — הכל לאמן`;
    case "ticket_split":
      return `כרטיס ${formatShekels(t.ticket_price)} · ${t.artist_share_pct}% לאמן`;
    case "versus":
      return `${formatShekels(t.fee_amount)} או ${t.artist_share_pct}% מהקופה`;
    case "guarantee_plus_bonus":
      return `${formatShekels(t.fee_amount)} + ${formatShekels(t.bonus_amount)} מעל ${t.bonus_threshold} כרטיסים`;
    case "free_tips":
      return "כניסה חופשית + טיפים";
  }
}
