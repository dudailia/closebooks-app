-- Production subscription columns for Stripe + access control

alter table public.subscriptions add column if not exists firm_id uuid references public.firms(id) on delete set null;
alter table public.subscriptions add column if not exists stripe_price_id text;
alter table public.subscriptions add column if not exists billing_interval text;
alter table public.subscriptions add column if not exists current_period_end timestamptz;
alter table public.subscriptions add column if not exists trial_end timestamptz;
alter table public.subscriptions add column if not exists cancel_at_period_end boolean default false;
alter table public.subscriptions add column if not exists payment_failed_at timestamptz;
alter table public.subscriptions add column if not exists grace_period_end timestamptz;

create index if not exists idx_subscriptions_firm on public.subscriptions (firm_id);
create index if not exists idx_subscriptions_email on public.subscriptions (customer_email);

alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions_select_own_firm" on public.subscriptions;
drop policy if exists "subscriptions_select_own_email" on public.subscriptions;

-- JWT email must match subscription row (middleware / client reads)
create policy "subscriptions_select_own_email" on public.subscriptions
  for select using (
    customer_email is not null
    and lower(trim(customer_email)) = lower(trim((auth.jwt() ->> 'email')::text))
  );
