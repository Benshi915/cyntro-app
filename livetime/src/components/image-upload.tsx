"use client";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { getBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";

const MAX_MB = 8;

/** Uploads straight from the browser to Supabase Storage (media/<uid>/...) and stores the public URL in a hidden input. */
export function ImageUpload({
  name,
  initialUrl,
  shape = "wide",
  label,
}: {
  name: string;
  initialUrl?: string | null;
  shape?: "wide" | "round" | "square";
  label: string;
}) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File) {
    setError(null);
    if (!isSupabaseConfigured) return setError("העלאת תמונות זמינה אחרי חיבור Supabase.");
    if (!file.type.startsWith("image/")) return setError("אפשר להעלות רק תמונות.");
    if (file.size > MAX_MB * 1024 * 1024) return setError(`עד ${MAX_MB}MB.`);
    setBusy(true);
    try {
      const supabase = getBrowserClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("not signed in");
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${auth.user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("media").upload(path, file, { cacheControl: "31536000" });
      if (upErr) throw upErr;
      setUrl(supabase.storage.from("media").getPublicUrl(path).data.publicUrl);
    } catch {
      setError("ההעלאה נכשלה. נסו שוב.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-fog">{label}</span>
      <div
        className={cn(
          "relative flex cursor-pointer items-center justify-center overflow-hidden border border-dashed border-line bg-night-2 text-fog transition hover:border-spot hover:text-spot",
          shape === "wide" && "h-36 w-full rounded-2xl",
          shape === "round" && "size-28 rounded-full",
          shape === "square" && "aspect-square w-full rounded-2xl",
        )}
        onClick={() => inputRef.current?.click()}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="absolute inset-0 size-full object-cover" />
        ) : busy ? (
          <Loader2 className="size-6 animate-spin" />
        ) : (
          <ImagePlus className="size-6" />
        )}
        {url && !busy && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setUrl("");
            }}
            className="absolute end-2 top-2 rounded-full bg-ink/80 p-1 text-cream"
            aria-label="הסרה"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      {error && <span className="text-xs text-live">{error}</span>}
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      <input type="hidden" name={name} value={url} />
    </div>
  );
}
