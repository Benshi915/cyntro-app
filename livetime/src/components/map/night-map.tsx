"use client";
import "maplibre-gl/dist/maplibre-gl.css";
import * as maplibregl from "maplibre-gl";
import { useState } from "react";
import Map, { Marker, NavigationControl, Popup, type MapProps } from "react-map-gl/maplibre";
import { NIGHT_STYLE } from "./style";

export { Marker, Popup };

// Worker is served from /public (copied by scripts/copy-maplibre-worker.mjs).
maplibregl.setWorkerUrl(`/maplibre-gl-worker.mjs?v=${maplibregl.getVersion()}`);

/** Base map with the LiveTime night style. */
export function NightMap({ children, ...props }: MapProps & { children?: React.ReactNode }) {
  const [failed, setFailed] = useState(false);
  return (
    <Map
      mapStyle={NIGHT_STYLE}
      attributionControl={{ compact: true, customAttribution: "© OpenFreeMap © OpenStreetMap" }}
      onError={() => setFailed(true)}
      style={{ width: "100%", height: "100%" }}
      {...props}
    >
      <NavigationControl position="top-left" showCompass={false} />
      {failed && (
        <div className="absolute inset-x-0 bottom-3 mx-auto w-fit rounded-full bg-night-3 px-3 py-1 text-xs text-fog">
          חלק מהמפה לא נטען — הסימונים עדיין זמינים
        </div>
      )}
      {children}
    </Map>
  );
}
