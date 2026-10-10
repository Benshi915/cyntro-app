// MapLibre 6 loads its web worker from a URL next to its own module, which bundling breaks.
// Serve the worker from /public instead (see src/components/map/night-map.tsx).
import { copyFileSync, existsSync } from "node:fs";

const src = "node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs";
if (existsSync(src)) copyFileSync(src, "public/maplibre-gl-worker.mjs");
