import type { StyleSpecification } from "maplibre-gl";

/**
 * A minimal night map in the LiveTime palette, on OpenFreeMap's free OpenMapTiles
 * vector tiles (no API key, commercial use allowed). Streets fade back so the
 * stage markers carry the colour.
 */
export const NIGHT_STYLE: StyleSpecification = {
  version: 8,
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  sources: {
    omt: { type: "vector", url: "https://tiles.openfreemap.org/planet" },
  },
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#0d0b12" } },
    {
      id: "landuse",
      type: "fill",
      source: "omt",
      "source-layer": "landuse",
      paint: { "fill-color": "#13111a" },
    },
    {
      id: "park",
      type: "fill",
      source: "omt",
      "source-layer": "park",
      paint: { "fill-color": "#111a17", "fill-opacity": 0.8 },
    },
    {
      id: "water",
      type: "fill",
      source: "omt",
      "source-layer": "water",
      paint: { "fill-color": "#0a1420" },
    },
    {
      id: "building",
      type: "fill",
      source: "omt",
      "source-layer": "building",
      minzoom: 14,
      paint: { "fill-color": "#1a1722", "fill-opacity": 0.8 },
    },
    {
      id: "roads-minor",
      type: "line",
      source: "omt",
      "source-layer": "transportation",
      filter: ["in", ["get", "class"], ["literal", ["minor", "service", "street", "tertiary"]]],
      paint: { "line-color": "#221f2c", "line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.5, 16, 4] },
    },
    {
      id: "roads-major",
      type: "line",
      source: "omt",
      "source-layer": "transportation",
      filter: ["in", ["get", "class"], ["literal", ["primary", "secondary", "trunk", "motorway"]]],
      paint: { "line-color": "#2f2a3b", "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.6, 16, 7] },
    },
    {
      id: "road-names",
      type: "symbol",
      source: "omt",
      "source-layer": "transportation_name",
      minzoom: 14,
      layout: {
        "symbol-placement": "line",
        "text-field": ["coalesce", ["get", "name:he"], ["get", "name"]],
        "text-font": ["Noto Sans Regular"],
        "text-size": 11,
      },
      paint: { "text-color": "#6f6880", "text-halo-color": "#0d0b12", "text-halo-width": 1.2 },
    },
    {
      id: "places",
      type: "symbol",
      source: "omt",
      "source-layer": "place",
      filter: ["in", ["get", "class"], ["literal", ["city", "town", "suburb", "neighbourhood", "quarter"]]],
      layout: {
        "text-field": ["coalesce", ["get", "name:he"], ["get", "name"]],
        "text-font": ["Noto Sans Regular"],
        "text-size": ["match", ["get", "class"], "city", 15, "town", 13, 11],
      },
      paint: { "text-color": "#a39cb3", "text-halo-color": "#0d0b12", "text-halo-width": 1.5 },
    },
  ],
};
