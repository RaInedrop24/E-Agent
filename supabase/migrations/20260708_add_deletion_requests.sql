-- GDPR Article 17 (right to erasure): self-service deletion requests.
-- Users file a request from Settings; a super admin reviews and processes it
-- (manual confirmation step is deliberate for the pilot phase).

create table if not exists public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text,
  status text not null default 'pending'
    check (status in ('pending', 'cancelled', 'completed')),
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid references auth.users(id) on delete set null
);

-- Only one open request per user; historical (cancelled/completed) rows kept
-- for audit purposes.
create unique index if not exists deletion_requests_one_pending_per_user
  on public.deletion_requests (user_id)
  where status = 'pending';

create index if not exists deletion_requests_status_idx
  on public.deletion_requests (status);

alter table public.deletion_requests enable row level security;

-- Users can see their own requests.
create policy "Users can view own deletion requests"
  on public.deletion_requests
  for select
  using ((select auth.uid()) = user_id);

-- Users can file a request for themselves.
create policy "Users can create own deletion request"
  on public.deletion_requests
  for insert
  with check ((select auth.uid()) = user_id and status = 'pending');

-- Users can cancel their own pending request (no other transitions).
create policy "Users can cancel own pending deletion request"
  on public.deletion_requests
  for update
  using ((select auth.uid()) = user_id and status = 'pending')
  with check ((select auth.uid()) = user_id and status = 'cancelled');

comment on table public.deletion_requests is
  'GDPR Art. 17 account deletion requests; processed manually by a super admin during pilot.';
