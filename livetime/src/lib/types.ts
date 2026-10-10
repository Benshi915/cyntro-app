export type Role = "artist" | "venue" | "fan";
export type ActType = "solo" | "duo" | "band" | "dj" | "ensemble";
export type VenueType =
  | "cafe"
  | "bar"
  | "restaurant"
  | "club"
  | "hall"
  | "loft"
  | "gallery"
  | "outdoor"
  | "other";
export type DealType =
  | "fixed_fee"
  | "door_to_artist"
  | "ticket_split"
  | "versus"
  | "guarantee_plus_bonus"
  | "free_tips";
export type OfferStatus = "pending" | "accepted" | "declined" | "cancelled" | "completed";
export type ReactionKind = "encore" | "going" | "interested" | "bring" | "save";
export type ReactionTarget = "post" | "event" | "profile";

export interface Profile {
  id: string;
  owner_id: string | null;
  role: Role;
  handle: string;
  display_name: string;
  tagline: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  genres: string[];
  links: Partial<Record<"instagram" | "spotify" | "youtube" | "website", string>>;
  verified: boolean;
  act_type: ActType | null;
  members_count: number | null;
  fee_min: number | null;
  fee_max: number | null;
  set_length_min: number | null;
  open_to_door_deals: boolean | null;
  tech_needs: string | null;
  venue_type: VenueType | null;
  capacity: number | null;
  address: string | null;
  has_stage: boolean | null;
  has_sound_system: boolean | null;
  has_piano: boolean | null;
  equipment: string | null;
  budget_min: number | null;
  budget_max: number | null;
  music_nights: string | null;
  followers_count: number;
  bring_count: number;
  created_at: string;
}

export type ProfileSummary = Pick<
  Profile,
  "id" | "role" | "handle" | "display_name" | "avatar_url" | "city" | "verified" | "genres"
>;

export interface Post {
  id: string;
  profile_id: string;
  body: string | null;
  media_url: string | null;
  media_type: "image" | "video" | "audio" | null;
  embed_url: string | null;
  encore_count: number;
  created_at: string;
  author?: ProfileSummary;
}

export interface LiveEvent {
  id: string;
  created_by: string;
  venue_id: string | null;
  artist_id: string | null;
  offer_id: string | null;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  cover_url: string | null;
  venue_name: string | null;
  artist_name: string | null;
  address: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  genres: string[];
  ticket_price: number | null;
  tips_enabled: boolean;
  capacity: number | null;
  status: "published" | "cancelled";
  going_count: number;
  interested_count: number;
  venue?: ProfileSummary | null;
  artist?: ProfileSummary | null;
}

export interface DealTerms {
  deal_type: DealType;
  fee_amount: number | null;
  ticket_price: number | null;
  artist_share_pct: number | null;
  bonus_threshold: number | null;
  bonus_amount: number | null;
}

export interface Offer extends DealTerms {
  id: string;
  venue_id: string;
  artist_id: string;
  created_by: string;
  proposed_by: string;
  status: OfferStatus;
  conversation_id: string | null;
  event_id: string | null;
  event_date: string;
  start_time: string;
  set_length_min: number;
  message: string | null;
  created_at: string;
  updated_at: string;
  venue?: ProfileSummary;
  artist?: ProfileSummary;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  body: string | null;
  offer_id: string | null;
  kind: "text" | "offer";
  offer_event: "created" | "countered" | "accepted" | "declined" | "cancelled" | null;
  created_at: string;
}

export interface ConversationPreview {
  id: string;
  last_message_at: string;
  other: ProfileSummary;
  last_message: Pick<Message, "body" | "kind" | "sender_id" | "created_at"> | null;
  unread: boolean;
}
