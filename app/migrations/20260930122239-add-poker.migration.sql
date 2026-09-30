-- add poker

create or replace function touchUpdatedAt()
returns trigger
language plpgsql
as $$
begin
  new.updatedAt = now();
  return new;
end;
$$;

-- A Date crosses the wire as { $type, $value } so the browser gets a Date,
-- not a string. Null stays null.
create or replace function jsDate(t timestamptz)
returns json
language sql
immutable
as $$
  select case
    when t is null then null
    else json_build_object('$type', 'Date', '$value', (extract(epoch from t) * 1000)::bigint)
  end;
$$;

create table users (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  name text not null
);

create trigger usersTouchUpdatedAt
  before update on users
  for each row execute function touchUpdatedAt();

create table rooms (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  code text not null unique default substr(md5(random()::text), 1, 8),
  name text not null,
  facilitatorId uuid not null references users(id),
  currentStoryId uuid
);

create trigger roomsTouchUpdatedAt
  before update on rooms
  for each row execute function touchUpdatedAt();

create table participants (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  roomId uuid not null references rooms(id) on delete cascade,
  userId uuid not null references users(id) on delete cascade,
  name text not null,
  unique (roomId, userId)
);

create trigger participantsTouchUpdatedAt
  before update on participants
  for each row execute function touchUpdatedAt();

create table stories (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  roomId uuid not null references rooms(id) on delete cascade,
  title text not null,
  url text not null default '',
  status text not null default 'pending' check (status in ('pending', 'voting', 'revealed', 'estimated')),
  round integer not null default 1,
  estimate text,
  average double precision,
  voteCount integer not null default 0,
  estimatedAt timestamptz
);

create index storiesRoomIdx on stories (roomId, createdAt);

create trigger storiesTouchUpdatedAt
  before update on stories
  for each row execute function touchUpdatedAt();

alter table rooms
  add constraint roomsCurrentStoryFk
  foreign key (currentStoryId) references stories(id) on delete set null;

create table votes (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  roomId uuid not null references rooms(id) on delete cascade,
  storyId uuid not null references stories(id) on delete cascade,
  userId uuid not null references users(id) on delete cascade,
  round integer not null,
  card text not null check (card in ('1', '2', '3', '5', '8', '13', '21', '?', 'coffee')),
  revealed boolean not null default false,
  unique (storyId, userId, round)
);

create index votesRoomIdx on votes (roomId, storyId);

create trigger votesTouchUpdatedAt
  before update on votes
  for each row execute function touchUpdatedAt();

-- Every write to these tables is a broadcast to the room it belongs to, so a
-- vote cast through an rpc reaches every open page. NOTIFY caps a payload at
-- 8000 bytes; a larger row goes as its id and the server reads it back.
create or replace function pokerNotify(channel text, op text, id uuid, data json)
returns void
language plpgsql
as $$
declare
  payload text;
begin
  payload := json_build_object('op', op, 'data', data)::text;

  if octet_length(payload) >= 8000 then
    payload := json_build_object('op', op, 'id', id)::text;
  end if;

  perform pg_notify(channel_name(channel), payload);
end;
$$;

create or replace function roomsNotify() returns trigger
language plpgsql as $$
declare
  r record;
begin
  r := coalesce(new, old);

  perform pokerNotify('rooms:id=' || r.id, lower(tg_op), r.id, json_build_object(
    'id', r.id,
    'createdAt', jsDate(r.createdAt),
    'code', r.code,
    'name', r.name,
    'facilitatorId', r.facilitatorId,
    'currentStoryId', r.currentStoryId
  ));

  return r;
end;
$$;

create trigger roomsNotifyTrigger
  after insert or update or delete on rooms
  for each row execute function roomsNotify();

create or replace function participantsNotify() returns trigger
language plpgsql as $$
declare
  r record;
begin
  r := coalesce(new, old);

  perform pokerNotify('participants:roomId=' || r.roomId, lower(tg_op), r.id, json_build_object(
    'id', r.id,
    'createdAt', jsDate(r.createdAt),
    'roomId', r.roomId,
    'userId', r.userId,
    'name', r.name
  ));

  return r;
end;
$$;

create trigger participantsNotifyTrigger
  after insert or update or delete on participants
  for each row execute function participantsNotify();

create or replace function storiesNotify() returns trigger
language plpgsql as $$
declare
  r record;
begin
  r := coalesce(new, old);

  perform pokerNotify('stories:roomId=' || r.roomId, lower(tg_op), r.id, json_build_object(
    'id', r.id,
    'createdAt', jsDate(r.createdAt),
    'roomId', r.roomId,
    'title', r.title,
    'url', r.url,
    'status', r.status,
    'round', r.round,
    'estimate', r.estimate,
    'average', r.average,
    'voteCount', r.voteCount,
    'estimatedAt', jsDate(r.estimatedAt)
  ));

  return r;
end;
$$;

create trigger storiesNotifyTrigger
  after insert or update or delete on stories
  for each row execute function storiesNotify();

-- A card stays face down: until the facilitator reveals, the broadcast says
-- who voted and never what.
create or replace function votesNotify() returns trigger
language plpgsql as $$
declare
  r record;
begin
  r := coalesce(new, old);

  perform pokerNotify('votes:roomId=' || r.roomId, lower(tg_op), r.id, json_build_object(
    'id', r.id,
    'createdAt', jsDate(r.createdAt),
    'roomId', r.roomId,
    'storyId', r.storyId,
    'userId', r.userId,
    'round', r.round,
    'card', case when r.revealed then r.card end,
    'revealed', r.revealed
  ));

  return r;
end;
$$;

create trigger votesNotifyTrigger
  after insert or update or delete on votes
  for each row execute function votesNotify();
