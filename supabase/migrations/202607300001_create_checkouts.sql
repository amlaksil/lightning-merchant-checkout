create extension if not exists pgcrypto;

create table if not exists public.checkouts (
  id uuid primary key default gen_random_uuid(),
  amount_sats integer not null check (amount_sats > 0),
  display_currency text not null check (display_currency in ('ETB', 'SAT')),
  display_amount numeric(18, 2) not null check (display_amount > 0),
  btc_etb_rate numeric(20, 8) not null check (btc_etb_rate > 0),
  rate_source text not null,
  memo text,
  merchant_ref text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'expired')),
  payment_request text not null,
  r_hash text not null unique,
  payment_addr text,
  expires_at timestamptz not null,
  paid_at timestamptz,
  settlement_ms integer check (settlement_ms is null or settlement_ms >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_checkouts_created_at
  on public.checkouts (created_at desc);

create index if not exists idx_checkouts_status_created_at
  on public.checkouts (status, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_checkouts_updated_at on public.checkouts;

create trigger set_checkouts_updated_at
before update on public.checkouts
for each row
execute function public.set_updated_at();
