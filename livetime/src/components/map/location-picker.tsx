"use client";
import { useState } from "react";
import { MapPin } from "lucide-react";
import { DEFAULT_CENTER } from "@/lib/constants";
import { Marker, NightMap } from "./night-map";

/** Tap the map to place your venue. Writes hidden lat/lng inputs for the form. */
export default function LocationPicker({
  initial,
  center,
}: {
  initial?: { lat: number | null; lng: number | null };
  center?: { lat: number; lng: number };
}) {
  const [pos, setPos] = useState(initial?.lat != null && initial?.lng != null ? { lat: initial.lat, lng: initial.lng } : null);
  const start = pos ?? center ?? DEFAULT_CENTER;
  return (
    <div className="flex flex-col gap-2">
      <div className="relative h-64 overflow-hidden rounded-2xl border border-line">
        <NightMap
          key={`${center?.lat}-${center?.lng}`}
          initialViewState={{ latitude: start.lat, longitude: start.lng, zoom: pos ? 15 : 12.5 }}
          onClick={(e) => setPos({ lat: e.lngLat.lat, lng: e.lngLat.lng })}
          cursor="crosshair"
        >
          {pos && (
            <Marker
              latitude={pos.lat}
              longitude={pos.lng}
              anchor="bottom"
              draggable
              onDragEnd={(e) => setPos({ lat: e.lngLat.lat, lng: e.lngLat.lng })}
            >
              <MapPin className="size-9 fill-venue text-ink drop-shadow-lg" />
            </Marker>
          )}
        </NightMap>
      </div>
      <p className="text-xs text-dim">{pos ? "המיקום נשמר. אפשר לגרור את הסיכה לדיוק." : "לחצו על המפה כדי לסמן איפה המקום נמצא."}</p>
      <input type="hidden" name="lat" value={pos?.lat ?? ""} />
      <input type="hidden" name="lng" value={pos?.lng ?? ""} />
    </div>
  );
}
