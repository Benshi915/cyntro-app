import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LiveTime",
    short_name: "LiveTime",
    description: "הרשת שמחברת אמנים, מקומות וקהל להופעות חיות",
    start_url: "/feed",
    display: "standalone",
    dir: "rtl",
    lang: "he",
    background_color: "#09080d",
    theme_color: "#09080d",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
