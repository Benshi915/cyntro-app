/** Turn a shared YouTube / Spotify / SoundCloud link into an embeddable player URL. */
export function embedFor(url: string): { src: string; kind: "video" | "audio" } | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtube.com" || host === "youtu.be") {
      const id = host === "youtu.be" ? u.pathname.slice(1) : u.searchParams.get("v") ?? u.pathname.split("/").filter(Boolean).pop();
      return id ? { src: `https://www.youtube-nocookie.com/embed/${id}`, kind: "video" } : null;
    }
    if (host === "open.spotify.com") {
      const [type, id] = u.pathname.split("/").filter(Boolean).slice(-2);
      return type && id ? { src: `https://open.spotify.com/embed/${type}/${id}`, kind: "audio" } : null;
    }
    if (host === "soundcloud.com") {
      return { src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ffb23e`, kind: "audio" };
    }
  } catch {
    return null;
  }
  return null;
}
