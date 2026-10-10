import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ROLE_LABEL } from "@/lib/constants";
import type { Role } from "@/lib/types";
import { cn, hueFrom, initials } from "@/lib/utils";

// ─── Brand ───────────────────────────────────────────────────
export function LiveDot({ className }: { className?: string }) {
  return <span className={cn("inline-block size-2.5 rounded-full bg-live animate-live", className)} />;
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 select-none", className)} dir="ltr">
      <LiveDot />
      <span className="display text-[1.9rem] tracking-wide">
        LIVE<span className="text-spot">TIME</span>
      </span>
    </span>
  );
}

// ─── Buttons ─────────────────────────────────────────────────
const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";
const buttonVariants = {
  primary: "bg-spot text-ink hover:bg-[#ffc266] shadow-[0_8px_30px_-8px_rgb(255_178_62/0.6)]",
  secondary: "bg-night-3 text-cream hover:bg-[#2e2a3b] border border-line",
  ghost: "text-fog hover:text-cream hover:bg-night-2",
  outline: "border border-line text-cream hover:border-fog",
  danger: "bg-live/15 text-live hover:bg-live/25 border border-live/30",
};
const buttonSizes = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[0.95rem]",
  lg: "h-13 px-7 text-base",
  icon: "size-10",
};
type ButtonStyle = { variant?: keyof typeof buttonVariants; size?: keyof typeof buttonSizes };

export function buttonClass({ variant = "primary", size = "md" }: ButtonStyle = {}, className?: string) {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size], className);
}

export function Button({ variant, size, className, ...props }: ComponentProps<"button"> & ButtonStyle) {
  return <button className={buttonClass({ variant, size }, className)} {...props} />;
}

export function ButtonLink({ variant, size, className, ...props }: ComponentProps<typeof Link> & ButtonStyle) {
  return <Link className={buttonClass({ variant, size }, className)} {...props} />;
}

// ─── Surfaces ────────────────────────────────────────────────
export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-card border border-line bg-night/80 backdrop-blur", className)} {...props} />;
}

export function SectionTitle({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-4", className)}>
      <h2 className="display text-4xl">{children}</h2>
      {action}
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="display text-3xl text-fog">{title}</div>
      {children && <p className="max-w-sm text-sm text-dim">{children}</p>}
      {action}
    </Card>
  );
}

// ─── Chips & badges ──────────────────────────────────────────
export function Chip({ active, className, ...props }: ComponentProps<"span"> & { active?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-sm transition",
        active ? "border-spot bg-spot/15 text-spot" : "border-line text-fog hover:border-fog hover:text-cream",
        className,
      )}
      {...props}
    />
  );
}

export const ROLE_COLOR: Record<Role, string> = {
  artist: "text-artist border-artist/40 bg-artist/10",
  venue: "text-venue border-venue/40 bg-venue/10",
  fan: "text-fan border-fan/40 bg-fan/10",
};

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", ROLE_COLOR[role], className)}>
      {ROLE_LABEL[role]}
    </span>
  );
}

export function VerifiedMark() {
  return (
    <svg viewBox="0 0 20 20" className="inline size-4 fill-spot" aria-label="מאומת">
      <path d="M10 1l2.4 1.8 3-.2.9 2.9 2.5 1.7-1 2.8 1 2.8-2.5 1.7-.9 2.9-3-.2L10 19l-2.4-1.8-3 .2-.9-2.9L1.2 12.8l1-2.8-1-2.8 2.5-1.7.9-2.9 3 .2z" />
      <path d="M6.5 10.2l2.3 2.3 4.7-4.8" stroke="#09080d" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// ─── Generative imagery (no stock photos needed) ─────────────
export function Avatar({
  name,
  src,
  seed,
  size = 44,
  role,
  className,
}: {
  name: string;
  src?: string | null;
  seed?: string;
  size?: number;
  role?: Role;
  className?: string;
}) {
  const ring = role ? { artist: "ring-artist", venue: "ring-venue", fan: "ring-fan" }[role] : "ring-line";
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className={cn("shrink-0 rounded-full object-cover ring-2", ring, className)}
        style={{ width: size, height: size }}
      />
    );
  }
  const h = hueFrom(seed ?? name);
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-ink ring-2", ring, className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(135deg, hsl(${h} 90% 70%), hsl(${(h + 50) % 360} 85% 55%))`,
      }}
      aria-label={name}
    >
      {initials(name)}
    </span>
  );
}

/** Gig-poster style cover: spotlight cone + sound rings, coloured from a seed. */
export function Cover({ seed, src, className, children }: { seed: string; src?: string | null; className?: string; children?: ReactNode }) {
  const h = hueFrom(seed);
  const h2 = (h + 40) % 360;
  return (
    <div className={cn("grain relative overflow-hidden bg-night-2", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <svg className="absolute inset-0 size-full" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <defs>
            <linearGradient id={`bg-${seed}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={`hsl(${h} 70% 22%)`} />
              <stop offset="1" stopColor={`hsl(${h2} 60% 8%)`} />
            </linearGradient>
            <radialGradient id={`spot-${seed}`} cx="0.7" cy="0" r="0.9">
              <stop offset="0" stopColor={`hsl(${h} 95% 70%)`} stopOpacity="0.75" />
              <stop offset="1" stopColor={`hsl(${h} 95% 70%)`} stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="400" height="240" fill={`url(#bg-${seed})`} />
          <path d="M290 -20 L150 260 L420 260 Z" fill={`url(#spot-${seed})`} />
          {[40, 70, 100, 130, 160].map((r, i) => (
            <circle key={r} cx="90" cy="200" r={r} fill="none" stroke={`hsl(${h2} 90% 70%)`} strokeOpacity={0.22 - i * 0.035} strokeWidth="2" />
          ))}
        </svg>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
      {children && <div className="relative h-full">{children}</div>}
    </div>
  );
}

// ─── Forms ───────────────────────────────────────────────────
const fieldBase =
  "w-full rounded-xl border border-line bg-night-2 px-4 text-cream placeholder:text-dim outline-none transition focus:border-spot focus:ring-2 focus:ring-spot/20";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(fieldBase, "h-12", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(fieldBase, "min-h-28 py-3 leading-relaxed", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(fieldBase, "h-12 appearance-none", className)} {...props} />;
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-medium text-fog">{label}</span>
      {children}
      {hint && <span className="text-xs text-dim">{hint}</span>}
    </label>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p className="rounded-xl border border-live/30 bg-live/10 px-4 py-3 text-sm text-live">{message}</p>;
}
