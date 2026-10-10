import type { ActType, Role, VenueType } from "./types";

export const ROLE_LABEL: Record<Role, string> = {
  artist: "אמן/ית",
  venue: "מקום",
  fan: "קהל",
};

export const GENRES: { id: string; label: string }[] = [
  { id: "jazz", label: "ג׳אז" },
  { id: "indie", label: "אינדי" },
  { id: "rock", label: "רוק" },
  { id: "pop", label: "פופ" },
  { id: "acoustic", label: "אקוסטי" },
  { id: "singer_songwriter", label: "יוצרים" },
  { id: "blues", label: "בלוז" },
  { id: "soul", label: "סול / פאנק" },
  { id: "hiphop", label: "היפ־הופ" },
  { id: "electronic", label: "אלקטרוני" },
  { id: "world", label: "וורלד" },
  { id: "mizrahi", label: "מזרחית" },
  { id: "israeli", label: "שירים ישראליים" },
  { id: "classical", label: "קלאסי" },
  { id: "latin", label: "לטיני" },
  { id: "folk", label: "פולק" },
];

export const GENRE_LABEL: Record<string, string> = Object.fromEntries(
  GENRES.map((g) => [g.id, g.label]),
);

export const ACT_TYPE_LABEL: Record<ActType, string> = {
  solo: "סולו",
  duo: "דואו",
  band: "להקה",
  dj: "DJ",
  ensemble: "הרכב גדול",
};

export const VENUE_TYPE_LABEL: Record<VenueType, string> = {
  cafe: "בית קפה",
  bar: "בר",
  restaurant: "מסעדה",
  club: "מועדון",
  hall: "אולם",
  loft: "לופט",
  gallery: "גלריה",
  outdoor: "חלל פתוח",
  other: "אחר",
};

/** Launch cities with map centres. */
export const CITIES: { name: string; lat: number; lng: number }[] = [
  { name: "תל אביב", lat: 32.0809, lng: 34.7806 },
  { name: "ירושלים", lat: 31.7683, lng: 35.2137 },
  { name: "חיפה", lat: 32.794, lng: 34.9896 },
  { name: "באר שבע", lat: 31.252, lng: 34.7915 },
  { name: "רמת גן", lat: 32.0684, lng: 34.8248 },
  { name: "הרצליה", lat: 32.1624, lng: 34.8447 },
  { name: "רעננה", lat: 32.1848, lng: 34.8713 },
  { name: "נתניה", lat: 32.3215, lng: 34.8532 },
  { name: "ראשון לציון", lat: 31.973, lng: 34.7925 },
  { name: "יפו", lat: 32.0504, lng: 34.7522 },
  { name: "אילת", lat: 29.5577, lng: 34.9519 },
  { name: "צפת", lat: 32.9646, lng: 35.496 },
];

export const DEFAULT_CENTER = { lat: 32.0809, lng: 34.7806 };
