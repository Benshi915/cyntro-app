import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

const AS = [
  { handle: "basement.yermi", label: "מקום" },
  { handle: "noa.band", label: "אמן" },
  { handle: "dana.live", label: "קהל" },
];

/** Demo-mode strip: switch which sample profile you're viewing the app as. */
export function DemoBar({ profile }: { profile: Profile | null }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 border-b border-spot/20 bg-spot/10 px-4 py-2 text-xs text-spot">
      <span>מצב הדגמה · צפייה בתור:</span>
      <div className="flex flex-wrap gap-1.5">
        {AS.map((a) => (
          <Link
            key={a.handle}
            href={`/demo?as=${a.handle}`}
            prefetch={false}
            className={cn(
              "rounded-full border px-2.5 py-0.5 transition",
              profile?.handle === a.handle ? "border-spot bg-spot text-ink" : "border-spot/40 hover:bg-spot/20",
            )}
          >
            {a.label}
          </Link>
        ))}
        <Link
          href="/demo?as="
          prefetch={false}
          className={cn("rounded-full border px-2.5 py-0.5 transition", !profile ? "border-spot bg-spot text-ink" : "border-spot/40 hover:bg-spot/20")}
        >
          אורח
        </Link>
      </div>
    </div>
  );
}
