import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TZ = "Asia/Jerusalem";

export function formatShekels(amount: number | null | undefined) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatEventDate(iso: string) {
  return new Intl.DateTimeFormat("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TZ,
  }).format(new Date(iso));
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(iso));
}

/** Poster-style date block: { day: "18", month: "אוק׳", weekday: "ש׳" } */
export function dateBlock(iso: string) {
  const d = new Date(iso);
  const part = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("he-IL", { ...opts, timeZone: TZ }).format(d);
  return {
    day: part({ day: "numeric" }),
    month: part({ month: "short" }),
    weekday: part({ weekday: "short" }),
  };
}

export function relativeTime(iso: string) {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("he", { numeric: "auto" });
  const abs = Math.abs(diff);
  if (abs < 60) return "עכשיו";
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 7) return rtf.format(Math.round(diff / 86400), "day");
  return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short", timeZone: TZ }).format(
    new Date(iso),
  );
}

/** Deterministic hue from a string — used for generative covers/avatars. Well-mixed so similar ids differ. */
export function hueFrom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return (h >>> 0) % 360;
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

/** Israel local wall-clock time → ISO string. Asks Intl for the offset, so DST is handled. */
export function jerusalemToIso(date: string, time: string) {
  const naive = new Date(`${date}T${time}:00Z`);
  const tzName = new Intl.DateTimeFormat("en-US", { timeZone: TZ, timeZoneName: "longOffset" })
    .formatToParts(naive)
    .find((p) => p.type === "timeZoneName")?.value; // e.g. "GMT+03:00"
  const m = tzName?.match(/GMT([+-])(\d{2}):(\d{2})/);
  const offsetMin = m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 120;
  return new Date(naive.getTime() - offsetMin * 60_000).toISOString();
}

/** Today's date in Israel as YYYY-MM-DD. */
export function todayInIsrael(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
}
