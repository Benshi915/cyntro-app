"use client";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { Flame, Megaphone, MessageCircle, Star, UserCheck, UserPlus, Bookmark } from "lucide-react";
import { openConversation, toggleFollow, toggleReaction } from "@/app/actions";
import type { ReactionKind, ReactionTarget } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "./ui";

function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const show = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 3500);
  };
  const node = msg ? (
    <div className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-sm animate-rise rounded-2xl border border-line bg-night-3 px-4 py-3 text-center text-sm shadow-2xl lg:bottom-8">
      {msg}
    </div>
  ) : null;
  return { show, node };
}

const REACTION_UI: Record<ReactionKind, { icon: typeof Flame; on: string; off: string; activeClass: string }> = {
  encore: { icon: Flame, on: "הדרן!", off: "הדרן", activeClass: "text-spot border-spot/50 bg-spot/10" },
  going: { icon: Star, on: "מגיע/ה ✓", off: "מגיע/ה", activeClass: "text-ink bg-spot border-spot" },
  interested: { icon: Star, on: "מעניין אותי ✓", off: "מעניין אותי", activeClass: "text-cream border-fog bg-night-3" },
  bring: { icon: Megaphone, on: "ביקשת אותם ✓", off: "תביאו אותם!", activeClass: "text-fan border-fan/50 bg-fan/10" },
  save: { icon: Bookmark, on: "נשמר ✓", off: "שמירה", activeClass: "text-venue border-venue/50 bg-venue/10" },
};

/** The LiveTime "likes" — each content type gets its own meaningful reaction. */
export function ReactionButton({
  targetType,
  targetId,
  kind,
  initialActive,
  initialCount,
  signedIn,
  size = "sm",
  className,
}: {
  targetType: ReactionTarget;
  targetId: string;
  kind: ReactionKind;
  initialActive: boolean;
  initialCount?: number;
  signedIn: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const [state, setState] = useState({ active: initialActive, count: initialCount ?? 0 });
  const [optimistic, setOptimistic] = useOptimistic(state);
  const [, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const ui = REACTION_UI[kind];
  const Icon = ui.icon;

  function onClick() {
    if (!signedIn) {
      router.push(`/signup?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    const next = { active: !state.active, count: state.count + (state.active ? -1 : 1) };
    startTransition(async () => {
      setOptimistic(next);
      const res = await toggleReaction(targetType, targetId, kind);
      if ("error" in res && res.error) return toast.show(res.error);
      setState(next);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        aria-pressed={optimistic.active}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-line font-medium transition active:scale-95",
          size === "sm" ? "h-9 px-3.5 text-sm" : "h-11 px-5",
          optimistic.active ? ui.activeClass : "text-fog hover:border-fog hover:text-cream",
          className,
        )}
      >
        <Icon className={cn("size-4", optimistic.active && kind === "encore" && "fill-spot")} />
        {optimistic.active ? ui.on : ui.off}
        {initialCount != null && <span className="tabular-nums opacity-70">{optimistic.count}</span>}
      </button>
      {toast.node}
    </>
  );
}

export function FollowButton({ profileId, initialActive, signedIn }: { profileId: string; initialActive: boolean; signedIn: boolean }) {
  const [active, setActive] = useState(initialActive);
  const [optimistic, setOptimistic] = useOptimistic(active);
  const [, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <>
      <Button
        variant={optimistic ? "secondary" : "primary"}
        onClick={() => {
          if (!signedIn) return router.push("/signup");
          startTransition(async () => {
            setOptimistic(!active);
            const res = await toggleFollow(profileId);
            if ("error" in res && res.error) return toast.show(res.error);
            setActive(!active);
          });
        }}
      >
        {optimistic ? <UserCheck className="size-4" /> : <UserPlus className="size-4" />}
        {optimistic ? "עוקב/ת" : "מעקב"}
      </Button>
      {toast.node}
    </>
  );
}

export function MessageButton({ profileId, signedIn }: { profileId: string; signedIn: boolean }) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <>
      <Button
        variant="secondary"
        disabled={pending}
        onClick={() => {
          if (!signedIn) return router.push("/signup");
          startTransition(async () => {
            const res = await openConversation(profileId);
            if (res?.error) toast.show(res.error);
          });
        }}
      >
        <MessageCircle className="size-4" /> הודעה
      </Button>
      {toast.node}
    </>
  );
}

/** Going / Interested are mutually exclusive, so they share one piece of state. */
export function RsvpButtons({
  eventId,
  initial,
  signedIn,
}: {
  eventId: string;
  initial: "going" | "interested" | null;
  signedIn: boolean;
}) {
  const [value, setValue] = useState(initial);
  const [optimistic, setOptimistic] = useOptimistic(value);
  const [, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  function choose(kind: "going" | "interested") {
    if (!signedIn) {
      router.push(`/signup?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    const next = value === kind ? null : kind;
    startTransition(async () => {
      setOptimistic(next);
      const res = await toggleReaction("event", eventId, kind);
      if ("error" in res && res.error) return toast.show(res.error);
      setValue(next);
    });
  }

  return (
    <div className="flex gap-2">
      {(["going", "interested"] as const).map((kind) => {
        const ui = REACTION_UI[kind];
        const active = optimistic === kind;
        return (
          <button
            key={kind}
            type="button"
            onClick={() => choose(kind)}
            aria-pressed={active}
            className={cn(
              "flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full border border-line font-medium transition active:scale-95",
              active ? ui.activeClass : "text-fog hover:border-fog hover:text-cream",
            )}
          >
            <ui.icon className="size-4" />
            {active ? ui.on : ui.off}
          </button>
        );
      })}
      {toast.node}
    </div>
  );
}
