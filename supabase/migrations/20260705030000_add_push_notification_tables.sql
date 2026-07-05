create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  expo_push_token text not null unique,
  platform text not null default 'unknown',
  preferences jsonb not null default '{"wanted": true, "bounties": true, "news": true, "safety": true}'::jsonb,
  is_active boolean not null default true,
  last_registered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.push_tracking_subscriptions (
  id uuid primary key default gen_random_uuid(),
  expo_push_token text not null references public.push_tokens(expo_push_token) on delete cascade,
  tracking_type text not null check (tracking_type in ('report', 'bounty')),
  tracking_id text not null,
  display_label text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (expo_push_token, tracking_type, tracking_id)
);

create table if not exists public.push_delivery_logs (
  id uuid primary key default gen_random_uuid(),
  notification_type text not null,
  category text,
  target_id text,
  route text,
  recipient_count integer not null default 0,
  expo_response jsonb,
  created_at timestamptz not null default now()
);

alter table public.push_tokens enable row level security;
alter table public.push_tracking_subscriptions enable row level security;
alter table public.push_delivery_logs enable row level security;

create index if not exists push_tokens_active_idx on public.push_tokens (is_active);
create index if not exists push_tracking_subscriptions_lookup_idx
  on public.push_tracking_subscriptions (tracking_type, tracking_id, is_active);
create index if not exists push_delivery_logs_target_idx
  on public.push_delivery_logs (notification_type, target_id, created_at desc);
