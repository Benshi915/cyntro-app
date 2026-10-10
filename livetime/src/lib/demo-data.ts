/**
 * Sample network used in demo mode (no Supabase configured) and as the source for
 * supabase/seed.sql. All names are fictional.
 */
import type { LiveEvent, Post, Profile } from "./types";

type Seed = Partial<Profile> & Pick<Profile, "id" | "role" | "handle" | "display_name">;

const base: Omit<Profile, "id" | "role" | "handle" | "display_name"> = {
  owner_id: null,
  tagline: null,
  bio: null,
  avatar_url: null,
  cover_url: null,
  city: null,
  lat: null,
  lng: null,
  genres: [],
  links: {},
  verified: false,
  act_type: null,
  members_count: null,
  fee_min: null,
  fee_max: null,
  set_length_min: null,
  open_to_door_deals: null,
  tech_needs: null,
  venue_type: null,
  capacity: null,
  address: null,
  has_stage: null,
  has_sound_system: null,
  has_piano: null,
  equipment: null,
  budget_min: null,
  budget_max: null,
  music_nights: null,
  followers_count: 0,
  bring_count: 0,
  created_at: "2026-09-01T10:00:00Z",
};

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

const seeds: Seed[] = [
  // ── Artists ──
  {
    id: id(1), role: "artist", handle: "noa.band", display_name: "נועה והלהקה",
    tagline: "סול ישראלי חם עם כלי נשיפה", city: "תל אביב", lat: 32.07, lng: 34.78,
    genres: ["soul", "israeli"], act_type: "band", members_count: 5, fee_min: 2500, fee_max: 6000,
    set_length_min: 90, open_to_door_deals: true, verified: true, followers_count: 1840, bring_count: 312,
    bio: "חמישה נגנים, זמרת אחת ואהבה גדולה לסול של שנות ה־70. מנגנים חומרים מקוריים בעברית ומחווה לגדולים.",
    tech_needs: "מערכת הגברה ל־5 ערוצים, 2 מוניטורים",
  },
  {
    id: id(2), role: "artist", handle: "maya.kol", display_name: "מאיה קול",
    tagline: "שירים שקטים לערבים רועשים", city: "תל אביב", lat: 32.06, lng: 34.77,
    genres: ["singer_songwriter", "acoustic"], act_type: "solo", members_count: 1, fee_min: 800, fee_max: 1800,
    set_length_min: 60, open_to_door_deals: true, followers_count: 920, bring_count: 141,
    bio: "יוצרת, גיטרה ופסנתר. מופיעה בבתי קפה ובסלונים קטנים, אוהבת קהל שמקשיב.",
  },
  {
    id: id(3), role: "artist", handle: "port.trio", display_name: "שלישיית הנמל",
    tagline: "ג׳אז סטנדרטים ומקור", city: "יפו", lat: 32.05, lng: 34.75,
    genres: ["jazz"], act_type: "ensemble", members_count: 3, fee_min: 1500, fee_max: 3500,
    set_length_min: 120, open_to_door_deals: false, verified: true, followers_count: 1310, bring_count: 98,
    bio: "פסנתר, קונטרבס ותופים. שני סטים של 50 דקות, מתאים למסעדות ולברים עם אווירה.",
    tech_needs: "פסנתר (או קלידים 88), נקודת חשמל, פינה של 3x2 מטר",
  },
  {
    id: id(4), role: "artist", handle: "dj.orna", display_name: "DJ אורנה",
    tagline: "גרוב, דיסקו ופאנק מהוויניל", city: "תל אביב", lat: 32.08, lng: 34.77,
    genres: ["electronic", "soul"], act_type: "dj", members_count: 1, fee_min: 1200, fee_max: 3000,
    set_length_min: 180, open_to_door_deals: true, followers_count: 2650, bring_count: 207,
    bio: "סטים של ויניל בלבד. גרוב, דיסקו ופאנק — לברים, גגות ומסיבות שקיעה.",
  },
  {
    id: id(5), role: "artist", handle: "roi.acoustic", display_name: "רועי אקוסטי",
    tagline: "קאברים ישראליים בגיטרה וקול", city: "חיפה", lat: 32.81, lng: 34.99,
    genres: ["israeli", "acoustic"], act_type: "solo", members_count: 1, fee_min: 600, fee_max: 1400,
    set_length_min: 90, open_to_door_deals: true, followers_count: 470, bring_count: 64,
    bio: "שירים שכולם מכירים, בעיבודים שעוד לא שמעתם. מושלם לערבי שישי.",
  },
  {
    id: id(6), role: "artist", handle: "lia.margalit", display_name: "ליה ומרגלית",
    tagline: "דואו פולק בהרמוניות", city: "ירושלים", lat: 31.77, lng: 35.21,
    genres: ["folk", "singer_songwriter"], act_type: "duo", members_count: 2, fee_min: 1000, fee_max: 2200,
    set_length_min: 75, open_to_door_deals: true, followers_count: 680, bring_count: 120,
    bio: "שתי גיטרות, שני קולות, הרבה סיפורים. שירים מקוריים בעברית ובאנגלית.",
  },
  {
    id: id(7), role: "artist", handle: "jaffa.nights", display_name: "הלילות של יפו",
    tagline: "מזרחית־ים־תיכונית לרקוד", city: "יפו", lat: 32.052, lng: 34.755,
    genres: ["mizrahi", "world"], act_type: "band", members_count: 6, fee_min: 3500, fee_max: 8000,
    set_length_min: 120, open_to_door_deals: true, verified: true, followers_count: 3120, bring_count: 455,
    bio: "עוד, כינור, דרבוקה ובס. מהפיוטים ועד ההיטים — מופע שמרים את כל האולם.",
  },
  {
    id: id(8), role: "artist", handle: "bluebird.blues", display_name: "בלובירד",
    tagline: "בלוז חשמלי מהדלתא לדרום תל אביב", city: "תל אביב", lat: 32.055, lng: 34.775,
    genres: ["blues", "rock"], act_type: "band", members_count: 4, fee_min: 2000, fee_max: 4500,
    set_length_min: 90, open_to_door_deals: true, followers_count: 760, bring_count: 88,
  },
  // ── Venues ──
  {
    id: id(101), role: "venue", handle: "basement.yermi", display_name: "המרתף של ירמי",
    tagline: "בר מרתף עם במה קטנה ואוזניים גדולות", city: "תל אביב", lat: 32.0628, lng: 34.7725,
    address: "רחוב הרצל 12, תל אביב", genres: ["jazz", "blues", "rock"], venue_type: "bar", capacity: 80,
    has_stage: true, has_sound_system: true, has_piano: false, budget_min: 1000, budget_max: 3500,
    music_nights: "רביעי–שבת", verified: true, followers_count: 1430,
    bio: "בר מרתף אינטימי. הופעות חיות 4 ערבים בשבוע, קהל שבא לשמוע.",
    equipment: "מערכת 2kW, מיקסר 12 ערוצים, 3 מוניטורים, ערכת תופים בסיסית",
  },
  {
    id: id(102), role: "venue", handle: "harbor.loft", display_name: "לופט הנמל",
    tagline: "לופט תעשייתי מול הים", city: "יפו", lat: 32.0545, lng: 34.7505,
    address: "שדרות הנמל 3, יפו", genres: ["electronic", "world", "indie"], venue_type: "loft", capacity: 220,
    has_stage: true, has_sound_system: true, has_piano: false, budget_min: 3000, budget_max: 9000,
    music_nights: "חמישי–שבת", followers_count: 2210,
    bio: "חלל של 300 מ״ר עם תקרה גבוהה ונוף לים. מתאים להשקות, מסיבות והופעות גדולות.",
  },
  {
    id: id(103), role: "venue", handle: "alma.teahouse", display_name: "בית התה של אלמה",
    tagline: "תה, עוגה ושירים בשקט", city: "תל אביב", lat: 32.0735, lng: 34.7812,
    address: "רחוב שיינקין 40, תל אביב", genres: ["acoustic", "singer_songwriter", "folk"], venue_type: "cafe",
    capacity: 40, has_stage: false, has_sound_system: true, has_piano: true, budget_min: 500, budget_max: 1500,
    music_nights: "שלישי, שישי בצהריים", followers_count: 640,
    bio: "בית קפה קטן עם פסנתר עומד. הופעות אקוסטיות בלבד.",
  },
  {
    id: id(104), role: "venue", handle: "carmel.roof", display_name: "גג הכרמל",
    tagline: "שקיעה, קוקטיילים ו־DJ", city: "חיפה", lat: 32.8136, lng: 34.9893,
    address: "שדרות הנשיא 120, חיפה", genres: ["electronic", "soul", "pop"], venue_type: "bar", capacity: 150,
    has_stage: false, has_sound_system: true, has_piano: false, budget_min: 1500, budget_max: 4000,
    music_nights: "חמישי–שבת", followers_count: 980,
  },
  {
    id: id(105), role: "venue", handle: "nachlaot.porch", display_name: "מרפסת נחלאות",
    tagline: "מסעדה שכונתית עם חצר", city: "ירושלים", lat: 31.7795, lng: 35.2085,
    address: "רחוב בצלאל 8, ירושלים", genres: ["folk", "world", "jazz"], venue_type: "restaurant", capacity: 70,
    has_stage: false, has_sound_system: true, has_piano: false, budget_min: 800, budget_max: 2500,
    music_nights: "חמישי", followers_count: 520,
  },
  {
    id: id(106), role: "venue", handle: "zehava.salon", display_name: "סלון זהבה",
    tagline: "סלון תרבות בדירה ישנה", city: "תל אביב", lat: 32.0668, lng: 34.7741,
    address: "רחוב לילינבלום 25, תל אביב", genres: ["singer_songwriter", "classical", "jazz"], venue_type: "gallery",
    capacity: 50, has_stage: false, has_sound_system: false, has_piano: true, budget_min: 0, budget_max: 1200,
    music_nights: "ראשון, רביעי", followers_count: 410,
    bio: "סלון ביתי לתרבות. ישיבה על כריות, קהל קשוב, כניסה בכרטיסים.",
  },
  // ── Fans ──
  { id: id(201), role: "fan", handle: "dana.live", display_name: "דנה", city: "תל אביב", genres: ["jazz", "soul", "indie"] },
];

export const demoProfiles: Profile[] = seeds.map((s) => ({ ...base, ...s }) as Profile);

const P = (handle: string) => demoProfiles.find((p) => p.handle === handle)!;

/** Events relative to "today" so the demo always looks alive. */
const eventSeeds: {
  n: number;
  artist: string;
  venue: string;
  day: number;
  time: string;
  title?: string;
  price: number | null;
  tips?: boolean;
  going: number;
  description?: string;
}[] = [
  { n: 1, artist: "port.trio", venue: "basement.yermi", day: 0, time: "21:30", price: 50, going: 46, description: "שני סטים של ג׳אז, סטנדרטים וחומרים חדשים מהאלבום הקרוב." },
  { n: 2, artist: "maya.kol", venue: "alma.teahouse", day: 1, time: "20:00", price: null, tips: true, going: 28 },
  { n: 3, artist: "dj.orna", venue: "carmel.roof", day: 2, time: "18:30", title: "שקיעת ויניל עם DJ אורנה", price: null, going: 112 },
  { n: 4, artist: "noa.band", venue: "harbor.loft", day: 3, time: "22:00", title: "נועה והלהקה — מופע השקה", price: 90, going: 187, description: "מופע השקה לסינגל החדש, עם אורחים מפתיעים." },
  { n: 5, artist: "lia.margalit", venue: "nachlaot.porch", day: 4, time: "20:30", price: 40, going: 35 },
  { n: 6, artist: "jaffa.nights", venue: "harbor.loft", day: 6, time: "22:30", price: 80, going: 240 },
  { n: 7, artist: "bluebird.blues", venue: "basement.yermi", day: 7, time: "21:00", price: 60, going: 51 },
  { n: 8, artist: "roi.acoustic", venue: "carmel.roof", day: 9, time: "20:00", price: null, tips: true, going: 39 },
  { n: 9, artist: "maya.kol", venue: "zehava.salon", day: 11, time: "20:30", price: 70, going: 33 },
  { n: 10, artist: "port.trio", venue: "zehava.salon", day: 13, time: "20:00", price: 80, going: 41 },
  { n: 11, artist: "noa.band", venue: "basement.yermi", day: 16, time: "22:00", price: 70, going: 64 },
];

function atJerusalem(dayOffset: number, time: string) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + dayOffset);
  const [h, m] = time.split(":").map(Number);
  // Israel is UTC+2/+3; +3 keeps demo times stable enough for display purposes.
  d.setUTCHours(h - 3, m, 0, 0);
  return d.toISOString();
}

export function buildDemoEvents(): LiveEvent[] {
  return eventSeeds.map((e) => {
    const a = P(e.artist);
    const v = P(e.venue);
    return {
      id: `00000000-0000-4000-9000-${String(e.n).padStart(12, "0")}`,
      created_by: v.id,
      venue_id: v.id,
      artist_id: a.id,
      offer_id: null,
      title: e.title ?? `${a.display_name} ב${v.display_name}`,
      description: e.description ?? null,
      starts_at: atJerusalem(e.day, e.time),
      ends_at: null,
      cover_url: null,
      venue_name: null,
      artist_name: null,
      address: v.address,
      city: v.city,
      lat: v.lat,
      lng: v.lng,
      genres: a.genres,
      ticket_price: e.price,
      tips_enabled: Boolean(e.tips),
      capacity: v.capacity,
      status: "published",
      going_count: e.going,
      interested_count: Math.round(e.going * 1.7),
    };
  });
}

export const demoEventSeeds = eventSeeds;

const postSeeds: { n: number; by: string; body: string; hoursAgo: number; encores: number; embed?: string }[] = [
  { n: 1, by: "noa.band", body: "חזרות אחרונות לפני ההשקה בלופט הנמל. הכלי נשיפה נשמעים כמו חלום 🎺", hoursAgo: 3, encores: 214 },
  { n: 2, by: "basement.yermi", body: "מחפשים להקת בלוז/רוק לחמישי בסוף החודש. דיל ׳הגבוה מביניהם׳, קהל של 80. שלחו הצעה!", hoursAgo: 6, encores: 57 },
  { n: 3, by: "maya.kol", body: "שיר חדש נולד הלילה. אנגן אותו לראשונה מחר בבית התה של אלמה.", hoursAgo: 20, encores: 133 },
  { n: 4, by: "dj.orna", body: "ארגז ויניל חדש הגיע מברלין. נתראה על הגג בחיפה 🌅", hoursAgo: 30, encores: 301 },
  { n: 5, by: "zehava.salon", body: "פתחנו את לוח הסלונים לחודש הבא — יש 3 ערבים פנויים לאמנים אקוסטיים.", hoursAgo: 50, encores: 44 },
  { n: 6, by: "jaffa.nights", body: "240 איש אמרו שמגיעים. לופט הנמל, תתכוננו לרעוד 🥁", hoursAgo: 72, encores: 389 },
];

export function buildDemoPosts(): Post[] {
  return postSeeds.map((p) => {
    const author = P(p.by);
    return {
      id: `00000000-0000-4000-a000-${String(p.n).padStart(12, "0")}`,
      profile_id: author.id,
      body: p.body,
      media_url: null,
      media_type: null,
      embed_url: p.embed ?? null,
      encore_count: p.encores,
      created_at: new Date(Date.now() - p.hoursAgo * 3600_000).toISOString(),
      author,
    };
  });
}

export const demoPostSeeds = postSeeds;
