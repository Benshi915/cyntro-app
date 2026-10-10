-- LiveTime — initial schema
-- Three sides (artist / venue / fan) share one `profiles` table, with role-specific
-- nullable columns. Business rules for bookings live in SECURITY DEFINER functions
-- so the client can never move an offer through an illegal state.

-- ─────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────
create type public.user_role as enum ('artist', 'venue', 'fan');

create type public.act_type as enum ('solo', 'duo', 'band', 'dj', 'ensemble');

create type public.venue_type as enum (
  'cafe', 'bar', 'restaurant', 'club', 'hall', 'loft', 'gallery', 'outdoor', 'other'
);

-- How the money flows for a gig. See src/lib/deals.ts for the product copy.
create type public.deal_type as enum (
  'fixed_fee',            -- venue pays the artist a flat fee
  'door_to_artist',       -- artist keeps ticket sales, venue keeps the bar
  'ticket_split',         -- ticket revenue split by percentage
  'versus',               -- guarantee OR % of tickets, whichever is higher
  'guarantee_plus_bonus', -- flat fee + bonus above a ticket threshold
  'free_tips'             -- free entry, audience tips digitally
);

create type public.offer_status as enum ('pending', 'accepted', 'declined', 'cancelled', 'completed');

create type public.event_status as enum ('published', 'cancelled');

create type public.reaction_kind as enum (
  'encore',     -- the LiveTime "like" on posts
  'going',      -- fan is coming to an event
  'interested', -- fan is interested in an event
  'bring',      -- fan wants this artist to play near them (demand signal for venues)
  'save'        -- shortlist a profile (venues/artists scouting each other)
);

create type public.reaction_target as enum ('post', 'event', 'profile');

-- ─────────────────────────────────────────────────────────────
-- Profiles
-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  id            uuid primary key default gen_random_uuid(),
  -- null = a profile the team created by hand (concierge onboarding), claimable later
  owner_id      uuid unique references auth.users (id) on delete set null,
  role          public.user_role not null,
  handle        text not null unique check (handle ~ '^[a-z0-9_.]{3,30}$'),
  display_name  text not null check (char_length(display_name) between 1 and 80),
  tagline       text check (char_length(tagline) <= 120),
  bio           text check (char_length(bio) <= 2000),
  avatar_url    text,
  cover_url     text,
  city          text,
  lat           double precision,
  lng           double precision,
  genres        text[] not null default '{}',
  links         jsonb not null default '{}'::jsonb, -- {instagram, spotify, youtube, website}
  verified      boolean not null default false,

  -- artist
  act_type        public.act_type,
  members_count   int check (members_count > 0),
  fee_min         int check (fee_min >= 0),
  fee_max         int check (fee_max >= 0),
  set_length_min  int check (set_length_min > 0),
  open_to_door_deals boolean,
  tech_needs      text,

  -- venue
  venue_type      public.venue_type,
  capacity        int check (capacity > 0),
  address         text,
  has_stage       boolean,
  has_sound_system boolean,
  has_piano       boolean,
  equipment       text,
  budget_min      int check (budget_min >= 0),
  budget_max      int check (budget_max >= 0),
  music_nights    text, -- free text for now, e.g. "חמישי–שבת"

  -- denormalised counters (maintained by triggers)
  followers_count int not null default 0,
  bring_count     int not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);
create index profiles_city_idx on public.profiles (city);
create index profiles_geo_idx on public.profiles (lat, lng);
create index profiles_genres_idx on public.profiles using gin (genres);

-- The caller's profile id (one profile per auth user for the MVP).
create or replace function public.current_profile_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select id from public.profiles where owner_id = auth.uid()
$$;

create or replace function public.current_profile_role()
returns public.user_role
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where owner_id = auth.uid()
$$;

-- ─────────────────────────────────────────────────────────────
-- Social graph & content
-- ─────────────────────────────────────────────────────────────
create table public.follows (
  follower_id  uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index follows_following_idx on public.follows (following_id);

create table public.posts (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  body        text check (char_length(body) <= 2000),
  media_url   text,
  media_type  text check (media_type in ('image', 'video', 'audio')),
  embed_url   text, -- YouTube / Spotify / SoundCloud link
  encore_count int not null default 0,
  created_at  timestamptz not null default now(),
  check (body is not null or media_url is not null or embed_url is not null)
);
create index posts_profile_idx on public.posts (profile_id, created_at desc);
create index posts_created_idx on public.posts (created_at desc);

-- ─────────────────────────────────────────────────────────────
-- Events
-- ─────────────────────────────────────────────────────────────
create table public.events (
  id           uuid primary key default gen_random_uuid(),
  created_by   uuid not null references public.profiles (id) on delete cascade,
  venue_id     uuid references public.profiles (id) on delete set null,
  artist_id    uuid references public.profiles (id) on delete set null,
  offer_id     uuid unique, -- fk added after offers table
  title        text not null check (char_length(title) between 2 and 120),
  description  text check (char_length(description) <= 3000),
  starts_at    timestamptz not null,
  ends_at      timestamptz,
  cover_url    text,
  -- off-platform venue/artist (when the other side isn't on LiveTime yet)
  venue_name   text,
  artist_name  text,
  address      text,
  city         text,
  lat          double precision,
  lng          double precision,
  genres       text[] not null default '{}',
  ticket_price int check (ticket_price >= 0), -- null/0 = free entry
  tips_enabled boolean not null default false,
  capacity     int check (capacity > 0),
  status       public.event_status not null default 'published',
  going_count      int not null default 0,
  interested_count int not null default 0,
  created_at   timestamptz not null default now(),
  check (venue_id is not null or venue_name is not null),
  check (artist_id is not null or artist_name is not null)
);
create index events_starts_idx on public.events (starts_at);
create index events_geo_idx on public.events (lat, lng);
create index events_venue_idx on public.events (venue_id, starts_at);
create index events_artist_idx on public.events (artist_id, starts_at);

-- ─────────────────────────────────────────────────────────────
-- Messaging
-- ─────────────────────────────────────────────────────────────
create table public.conversations (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  profile_id      uuid not null references public.profiles (id) on delete cascade,
  last_read_at    timestamptz not null default to_timestamp(0),
  primary key (conversation_id, profile_id)
);
create index conversation_members_profile_idx on public.conversation_members (profile_id);

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid references public.profiles (id) on delete set null,
  body            text check (char_length(body) <= 4000),
  -- system messages about a booking offer render as an offer card in the chat
  offer_id        uuid,
  kind            text not null default 'text' check (kind in ('text', 'offer')),
  offer_event     text check (offer_event in ('created', 'countered', 'accepted', 'declined', 'cancelled')),
  created_at      timestamptz not null default now(),
  check (body is not null or offer_id is not null)
);
create index messages_conversation_idx on public.messages (conversation_id, created_at);

create or replace function public.is_conversation_member(conv uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = conv and profile_id = public.current_profile_id()
  )
$$;

-- Find or create the 1:1 conversation between two profiles.
create or replace function public.conversation_between(a uuid, b uuid)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  conv uuid;
begin
  select m1.conversation_id into conv
  from public.conversation_members m1
  join public.conversation_members m2 on m2.conversation_id = m1.conversation_id
  where m1.profile_id = a and m2.profile_id = b
    and (select count(*) from public.conversation_members m where m.conversation_id = m1.conversation_id) = 2
  limit 1;

  if conv is null then
    insert into public.conversations default values returning id into conv;
    insert into public.conversation_members (conversation_id, profile_id) values (conv, a), (conv, b);
  end if;
  return conv;
end;
$$;
revoke execute on function public.conversation_between(uuid, uuid) from public, anon, authenticated;

-- Client-facing: open a chat with someone.
create or replace function public.start_conversation(other uuid)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  me uuid := public.current_profile_id();
begin
  if me is null then raise exception 'profile required'; end if;
  if other = me then raise exception 'cannot message yourself'; end if;
  if not exists (select 1 from public.profiles where id = other) then
    raise exception 'profile not found';
  end if;
  return public.conversation_between(me, other);
end;
$$;

create or replace function public.mark_conversation_read(conv uuid)
returns void
language sql security definer set search_path = public
as $$
  update public.conversation_members
  set last_read_at = now()
  where conversation_id = conv and profile_id = public.current_profile_id()
$$;

create or replace function public.touch_conversation()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;
create trigger messages_touch_conversation
after insert on public.messages
for each row execute function public.touch_conversation();

-- ─────────────────────────────────────────────────────────────
-- Booking offers (the heart of the marketplace)
-- ─────────────────────────────────────────────────────────────
create table public.offers (
  id              uuid primary key default gen_random_uuid(),
  venue_id        uuid not null references public.profiles (id) on delete cascade,
  artist_id       uuid not null references public.profiles (id) on delete cascade,
  created_by      uuid not null references public.profiles (id) on delete cascade,
  -- whoever proposed the current terms; the other side is the one who must respond
  proposed_by     uuid not null references public.profiles (id) on delete cascade,
  status          public.offer_status not null default 'pending',
  conversation_id uuid references public.conversations (id) on delete set null,
  event_id        uuid references public.events (id) on delete set null,

  event_date      date not null,
  start_time      time not null,
  set_length_min  int not null default 90 check (set_length_min between 15 and 600),

  deal_type         public.deal_type not null,
  fee_amount        int check (fee_amount >= 0),         -- ₪, fixed fee / guarantee
  ticket_price      int check (ticket_price >= 0),       -- ₪ per ticket (null = free entry)
  artist_share_pct  int check (artist_share_pct between 0 and 100),
  bonus_threshold   int check (bonus_threshold > 0),     -- tickets sold
  bonus_amount      int check (bonus_amount >= 0),       -- ₪
  message           text check (char_length(message) <= 2000),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (venue_id <> artist_id),
  check (proposed_by in (venue_id, artist_id)),
  check (deal_type not in ('fixed_fee', 'versus', 'guarantee_plus_bonus') or fee_amount is not null),
  check (deal_type not in ('ticket_split', 'versus') or artist_share_pct is not null),
  check (deal_type <> 'guarantee_plus_bonus' or (bonus_threshold is not null and bonus_amount is not null)),
  check (deal_type not in ('door_to_artist', 'ticket_split', 'versus') or ticket_price > 0)
);
create index offers_venue_idx on public.offers (venue_id, created_at desc);
create index offers_artist_idx on public.offers (artist_id, created_at desc);

alter table public.events
  add constraint events_offer_fk foreign key (offer_id) references public.offers (id) on delete set null;
alter table public.messages
  add constraint messages_offer_fk foreign key (offer_id) references public.offers (id) on delete cascade;

-- Validate parties + attach the conversation before insert.
create or replace function public.offers_before_insert()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if (select role from public.profiles where id = new.venue_id) <> 'venue' then
    raise exception 'venue_id must be a venue profile';
  end if;
  if (select role from public.profiles where id = new.artist_id) <> 'artist' then
    raise exception 'artist_id must be an artist profile';
  end if;
  if new.event_date < current_date then
    raise exception 'event date is in the past';
  end if;
  new.status := 'pending';
  new.proposed_by := new.created_by;
  new.conversation_id := public.conversation_between(new.venue_id, new.artist_id);
  return new;
end;
$$;
create trigger offers_before_insert
before insert on public.offers
for each row execute function public.offers_before_insert();

create or replace function public.offers_after_insert()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.messages (conversation_id, sender_id, offer_id, kind, offer_event, body)
  values (new.conversation_id, new.created_by, new.id, 'offer', 'created', new.message);
  return new;
end;
$$;
create trigger offers_after_insert
after insert on public.offers
for each row execute function public.offers_after_insert();

-- accept / decline / cancel
create or replace function public.respond_to_offer(p_offer uuid, p_action text)
returns public.offers
language plpgsql security definer set search_path = public
as $$
declare
  me uuid := public.current_profile_id();
  o public.offers;
  v public.profiles;
  a public.profiles;
  new_event uuid;
begin
  select * into o from public.offers where id = p_offer for update;
  if o.id is null then raise exception 'offer not found'; end if;
  if me is null or me not in (o.venue_id, o.artist_id) then raise exception 'not a party to this offer'; end if;

  if p_action in ('accept', 'decline') then
    if o.status <> 'pending' then raise exception 'offer is not pending'; end if;
    if o.proposed_by = me then raise exception 'waiting for the other side to respond'; end if;
  elsif p_action = 'cancel' then
    if o.status not in ('pending', 'accepted') then raise exception 'offer cannot be cancelled'; end if;
  else
    raise exception 'unknown action %', p_action;
  end if;

  if p_action = 'accept' then
    select * into v from public.profiles where id = o.venue_id;
    select * into a from public.profiles where id = o.artist_id;
    insert into public.events (
      created_by, venue_id, artist_id, offer_id, title, starts_at, ends_at,
      address, city, lat, lng, genres, ticket_price, tips_enabled, capacity
    ) values (
      me, v.id, a.id, o.id,
      a.display_name || ' ב' || v.display_name,
      (o.event_date + o.start_time) at time zone 'Asia/Jerusalem',
      ((o.event_date + o.start_time) at time zone 'Asia/Jerusalem') + make_interval(mins => o.set_length_min),
      v.address, v.city, v.lat, v.lng, a.genres,
      nullif(o.ticket_price, 0), o.deal_type = 'free_tips', v.capacity
    ) returning id into new_event;
    update public.offers set status = 'accepted', event_id = new_event, updated_at = now()
    where id = o.id returning * into o;
  elsif p_action = 'decline' then
    update public.offers set status = 'declined', updated_at = now() where id = o.id returning * into o;
  else
    update public.offers set status = 'cancelled', updated_at = now() where id = o.id returning * into o;
    if o.event_id is not null then
      update public.events set status = 'cancelled' where id = o.event_id;
    end if;
  end if;

  insert into public.messages (conversation_id, sender_id, offer_id, kind, offer_event, body)
  values (
    o.conversation_id, me, o.id, 'offer',
    case p_action when 'accept' then 'accepted' when 'decline' then 'declined' else 'cancelled' end,
    null
  );
  return o;
end;
$$;

-- Counter-offer: the responding side proposes new terms.
create or replace function public.counter_offer(
  p_offer uuid,
  p_event_date date,
  p_start_time time,
  p_set_length_min int,
  p_deal_type public.deal_type,
  p_fee_amount int,
  p_ticket_price int,
  p_artist_share_pct int,
  p_bonus_threshold int,
  p_bonus_amount int,
  p_message text
)
returns public.offers
language plpgsql security definer set search_path = public
as $$
declare
  me uuid := public.current_profile_id();
  o public.offers;
begin
  select * into o from public.offers where id = p_offer for update;
  if o.id is null then raise exception 'offer not found'; end if;
  if me is null or me not in (o.venue_id, o.artist_id) then raise exception 'not a party to this offer'; end if;
  if o.status <> 'pending' then raise exception 'offer is not pending'; end if;
  if o.proposed_by = me then raise exception 'waiting for the other side to respond'; end if;
  if p_event_date < current_date then raise exception 'event date is in the past'; end if;

  update public.offers set
    event_date = p_event_date,
    start_time = p_start_time,
    set_length_min = p_set_length_min,
    deal_type = p_deal_type,
    fee_amount = p_fee_amount,
    ticket_price = p_ticket_price,
    artist_share_pct = p_artist_share_pct,
    bonus_threshold = p_bonus_threshold,
    bonus_amount = p_bonus_amount,
    message = p_message,
    proposed_by = me,
    updated_at = now()
  where id = o.id
  returning * into o;

  insert into public.messages (conversation_id, sender_id, offer_id, kind, offer_event, body)
  values (o.conversation_id, me, o.id, 'offer', 'countered', p_message);
  return o;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Reactions (custom "likes") + counters
-- ─────────────────────────────────────────────────────────────
create table public.reactions (
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  target_type public.reaction_target not null,
  target_id   uuid not null,
  kind        public.reaction_kind not null,
  created_at  timestamptz not null default now(),
  primary key (profile_id, target_id, kind),
  check (
    (kind = 'encore' and target_type = 'post') or
    (kind in ('going', 'interested') and target_type = 'event') or
    (kind in ('bring', 'save') and target_type = 'profile')
  )
);
create index reactions_target_idx on public.reactions (target_id, kind);

create or replace function public.reactions_counter()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  r public.reactions;
  d int := case when tg_op = 'INSERT' then 1 else -1 end;
begin
  if tg_op = 'INSERT' then r := new; else r := old; end if;
  if r.kind = 'encore' then
    update public.posts set encore_count = greatest(encore_count + d, 0) where id = r.target_id;
  elsif r.kind = 'going' then
    update public.events set going_count = greatest(going_count + d, 0) where id = r.target_id;
  elsif r.kind = 'interested' then
    update public.events set interested_count = greatest(interested_count + d, 0) where id = r.target_id;
  elsif r.kind = 'bring' then
    update public.profiles set bring_count = greatest(bring_count + d, 0) where id = r.target_id;
  end if;
  return null;
end;
$$;
create trigger reactions_counter
after insert or delete on public.reactions
for each row execute function public.reactions_counter();

create or replace function public.follows_counter()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  d int := case when tg_op = 'INSERT' then 1 else -1 end;
begin
  update public.profiles set followers_count = greatest(followers_count + d, 0)
  where id = coalesce(new.following_id, old.following_id);
  return null;
end;
$$;
create trigger follows_counter
after insert or delete on public.follows
for each row execute function public.follows_counter();

-- Where do the fans who want this artist live? (shown to venues on artist profiles)
create or replace function public.artist_demand(p_artist uuid)
returns table (city text, fans bigint)
language sql stable security definer set search_path = public
as $$
  select coalesce(p.city, 'לא צוין') as city, count(*) as fans
  from public.reactions r
  join public.profiles p on p.id = r.profile_id
  where r.target_id = p_artist and r.kind = 'bring'
  group by 1
  order by 2 desc
  limit 10
$$;

-- keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger profiles_touch before update on public.profiles
for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.follows enable row level security;
alter table public.posts enable row level security;
alter table public.events enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.offers enable row level security;
alter table public.reactions enable row level security;

-- profiles: public read, own write
create policy "profiles are public" on public.profiles for select using (true);
create policy "create own profile" on public.profiles for insert to authenticated
  with check (owner_id = auth.uid() and public.current_profile_id() is null);
create policy "update own profile" on public.profiles for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- follows
create policy "follows are public" on public.follows for select using (true);
create policy "follow as self" on public.follows for insert to authenticated
  with check (follower_id = public.current_profile_id());
create policy "unfollow as self" on public.follows for delete to authenticated
  using (follower_id = public.current_profile_id());

-- posts
create policy "posts are public" on public.posts for select using (true);
create policy "post as self" on public.posts for insert to authenticated
  with check (profile_id = public.current_profile_id());
create policy "edit own posts" on public.posts for update to authenticated
  using (profile_id = public.current_profile_id());
create policy "delete own posts" on public.posts for delete to authenticated
  using (profile_id = public.current_profile_id());

-- events: published events are public; parties see their own cancelled ones too
create policy "events are public" on public.events for select
  using (status = 'published' or public.current_profile_id() in (created_by, venue_id, artist_id));
create policy "create own events" on public.events for insert to authenticated
  with check (
    created_by = public.current_profile_id()
    and public.current_profile_id() in (venue_id, artist_id)
    and offer_id is null
  );
create policy "edit own events" on public.events for update to authenticated
  using (public.current_profile_id() in (created_by, venue_id, artist_id));

-- conversations / messages: members only
create policy "members read conversations" on public.conversations for select to authenticated
  using (public.is_conversation_member(id));
create policy "members read membership" on public.conversation_members for select to authenticated
  using (public.is_conversation_member(conversation_id));
create policy "members read messages" on public.messages for select to authenticated
  using (public.is_conversation_member(conversation_id));
create policy "members send messages" on public.messages for insert to authenticated
  with check (
    sender_id = public.current_profile_id()
    and kind = 'text'
    and offer_id is null
    and offer_event is null
    and public.is_conversation_member(conversation_id)
  );

-- offers: the two parties only; create directly, change state through the functions above
create policy "parties read offers" on public.offers for select to authenticated
  using (public.current_profile_id() in (venue_id, artist_id));
create policy "parties create offers" on public.offers for insert to authenticated
  with check (
    created_by = public.current_profile_id()
    and created_by in (venue_id, artist_id)
  );

-- reactions
create policy "reactions are public" on public.reactions for select using (true);
create policy "react as self" on public.reactions for insert to authenticated
  with check (profile_id = public.current_profile_id());
create policy "unreact as self" on public.reactions for delete to authenticated
  using (profile_id = public.current_profile_id());

-- ─────────────────────────────────────────────────────────────
-- Realtime (chat + offer updates)
-- ─────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.messages;

-- ─────────────────────────────────────────────────────────────
-- Storage: public media bucket, users write only under their own uid folder
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media is public" on storage.objects for select
  using (bucket_id = 'media');
create policy "upload own media" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "update own media" on storage.objects for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "delete own media" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
