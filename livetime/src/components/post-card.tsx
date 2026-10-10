import Link from "next/link";
import { embedFor } from "@/lib/embed";
import type { Post } from "@/lib/types";
import { relativeTime } from "@/lib/utils";
import { ReactionButton } from "./social";
import { Avatar, Card, RoleBadge, VerifiedMark } from "./ui";

export function PostCard({ post, encored, signedIn }: { post: Post; encored: boolean; signedIn: boolean }) {
  const a = post.author;
  const embed = post.embed_url ? embedFor(post.embed_url) : null;
  return (
    <Card className="animate-rise p-4 sm:p-5">
      {a && (
        <Link href={`/p/${a.handle}`} className="flex items-center gap-3">
          <Avatar name={a.display_name} src={a.avatar_url} seed={a.id} role={a.role} size={42} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-semibold">{a.display_name}</span>
              {a.verified && <VerifiedMark />}
              <RoleBadge role={a.role} />
            </div>
            <div className="text-xs text-dim">{relativeTime(post.created_at)}</div>
          </div>
        </Link>
      )}
      {post.body && <p className="mt-3 whitespace-pre-line leading-relaxed">{post.body}</p>}
      {post.media_url && post.media_type === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.media_url} alt="" className="mt-3 max-h-[520px] w-full rounded-2xl object-cover" loading="lazy" />
      )}
      {post.media_url && post.media_type === "video" && (
        <video src={post.media_url} controls playsInline className="mt-3 w-full rounded-2xl" />
      )}
      {embed && (
        <iframe
          src={embed.src}
          className={`mt-3 w-full rounded-2xl border-0 ${embed.kind === "video" ? "aspect-video" : "h-[152px]"}`}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title="media"
        />
      )}
      <div className="mt-4">
        <ReactionButton targetType="post" targetId={post.id} kind="encore" initialActive={encored} initialCount={post.encore_count} signedIn={signedIn} />
      </div>
    </Card>
  );
}
