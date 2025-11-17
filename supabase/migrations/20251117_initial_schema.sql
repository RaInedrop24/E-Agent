-- Estate Portal - Initial Database Schema
-- Created: 2025-11-17
-- Description: Complete schema with tables, RLS policies, triggers, and storage setup

-- Enable UUID support
create extension if not exists "uuid-ossp";

-- ============================================================================
-- TABLES
-- ============================================================================

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  preferred_language text not null default 'en' check (preferred_language in ('en','it','de','fr','es')),
  role text not null check (role in ('agent','buyer')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'User profiles linked to auth.users';
comment on column public.profiles.role is 'User role: agent (creates transactions) or buyer (invited to transactions)';
comment on column public.profiles.preferred_language is 'Preferred language for UI and translations';

-- Transactions table
create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  property_address text,
  status text not null default 'active' check (status in ('active','archived','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_transactions_created_by on public.transactions(created_by);
create index if not exists idx_transactions_status on public.transactions(status);

comment on table public.transactions is 'Property transactions managed by agents';
comment on column public.transactions.created_by is 'Agent who created this transaction';
comment on column public.transactions.status is 'Transaction status: active, archived, or completed';

-- Transaction participants table (many-to-many relationship)
create table if not exists public.transaction_participants (
  id uuid primary key default uuid_generate_v4(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  participant_role text not null check (participant_role in ('agent','buyer')),
  invited_at timestamptz not null default now(),
  unique (transaction_id, profile_id)
);

create index if not exists idx_tp_tx on public.transaction_participants(transaction_id);
create index if not exists idx_tp_profile on public.transaction_participants(profile_id);

comment on table public.transaction_participants is 'Links users to transactions they can access';
comment on column public.transaction_participants.participant_role is 'Role of this participant in the transaction';

-- Milestones table
create table if not exists public.milestones (
  id uuid primary key default uuid_generate_v4(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  order_index int not null,
  code text not null,
  label_en text not null,
  label_it text,
  label_de text,
  label_fr text,
  label_es text,
  completed boolean not null default false,
  completed_at timestamptz,
  completed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (transaction_id, code)
);

create index if not exists idx_milestones_tx on public.milestones(transaction_id);
create index if not exists idx_milestones_order on public.milestones(transaction_id, order_index);

comment on table public.milestones is 'Predefined milestones for tracking transaction progress';
comment on column public.milestones.code is 'Unique code for the milestone (e.g., OFFER_ACCEPTED)';
comment on column public.milestones.label_en is 'English label';
comment on column public.milestones.label_it is 'Italian label';

-- Messages table
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  author_profile_id uuid not null references public.profiles(id) on delete set null,
  original_language text not null,
  content_original text not null,
  content_translated text,
  translated_language text,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_tx on public.messages(transaction_id);
create index if not exists idx_messages_author on public.messages(author_profile_id);
create index if not exists idx_messages_created on public.messages(transaction_id, created_at desc);

comment on table public.messages is 'Messages exchanged within a transaction';
comment on column public.messages.original_language is 'Language code of the original message';
comment on column public.messages.content_translated is 'Auto-translated content (DeepL, future feature)';

-- Files table
create table if not exists public.files (
  id uuid primary key default uuid_generate_v4(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  uploaded_by_profile_id uuid not null references public.profiles(id) on delete set null,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  file_size int,
  created_at timestamptz not null default now()
);

create index if not exists idx_files_tx on public.files(transaction_id);
create index if not exists idx_files_uploader on public.files(uploaded_by_profile_id);

comment on table public.files is 'Documents and files attached to transactions';
comment on column public.files.storage_path is 'Path in Supabase Storage';

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for profiles.updated_at
create trigger set_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

-- Trigger for transactions.updated_at
create trigger set_updated_at
  before update on public.transactions
  for each row
  execute function public.handle_updated_at();

-- Function to create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, preferred_language, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'preferred_language', 'en'),
    coalesce(new.raw_user_meta_data->>'role', 'buyer')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create profile when user signs up
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Function to auto-add creator as participant when transaction is created
create or replace function public.handle_new_transaction()
returns trigger as $$
begin
  insert into public.transaction_participants (transaction_id, profile_id, participant_role)
  values (new.id, new.created_by, 'agent');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-add creator as participant
create trigger on_transaction_created
  after insert on public.transactions
  for each row
  execute function public.handle_new_transaction();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_participants enable row level security;
alter table public.milestones enable row level security;
alter table public.messages enable row level security;
alter table public.files enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can view profiles of transaction participants"
  on public.profiles for select
  using (
    id in (
      select profile_id from public.transaction_participants
      where transaction_id in (
        select transaction_id from public.transaction_participants
        where profile_id = auth.uid()
      )
    )
  );

-- Transactions policies
create policy "Users can view transactions they participate in"
  on public.transactions for select
  using (
    id in (
      select transaction_id from public.transaction_participants
      where profile_id = auth.uid()
    )
  );

create policy "Agents can create transactions"
  on public.transactions for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'agent'
    )
  );

create policy "Transaction creators can update their transactions"
  on public.transactions for update
  using (created_by = auth.uid());

-- Transaction participants policies
create policy "Users can view participants of their transactions"
  on public.transaction_participants for select
  using (
    transaction_id in (
      select transaction_id from public.transaction_participants
      where profile_id = auth.uid()
    )
  );

create policy "Transaction creators can add participants"
  on public.transaction_participants for insert
  with check (
    exists (
      select 1 from public.transactions
      where id = transaction_id and created_by = auth.uid()
    )
  );

create policy "Transaction creators can remove participants"
  on public.transaction_participants for delete
  using (
    exists (
      select 1 from public.transactions
      where id = transaction_id and created_by = auth.uid()
    )
  );

-- Milestones policies
create policy "Users can view milestones of their transactions"
  on public.milestones for select
  using (
    transaction_id in (
      select transaction_id from public.transaction_participants
      where profile_id = auth.uid()
    )
  );

create policy "Agents can update milestones of their transactions"
  on public.milestones for update
  using (
    exists (
      select 1 from public.transactions
      where id = transaction_id and created_by = auth.uid()
    )
  );

create policy "Agents can create milestones for their transactions"
  on public.milestones for insert
  with check (
    exists (
      select 1 from public.transactions
      where id = transaction_id and created_by = auth.uid()
    )
  );

-- Messages policies
create policy "Users can view messages in their transactions"
  on public.messages for select
  using (
    transaction_id in (
      select transaction_id from public.transaction_participants
      where profile_id = auth.uid()
    )
  );

create policy "Participants can send messages in their transactions"
  on public.messages for insert
  with check (
    transaction_id in (
      select transaction_id from public.transaction_participants
      where profile_id = auth.uid()
    )
    and author_profile_id = auth.uid()
  );

-- Files policies
create policy "Users can view files in their transactions"
  on public.files for select
  using (
    transaction_id in (
      select transaction_id from public.transaction_participants
      where profile_id = auth.uid()
    )
  );

create policy "Participants can upload files to their transactions"
  on public.files for insert
  with check (
    transaction_id in (
      select transaction_id from public.transaction_participants
      where profile_id = auth.uid()
    )
    and uploaded_by_profile_id = auth.uid()
  );

create policy "Uploaders can delete their own files"
  on public.files for delete
  using (uploaded_by_profile_id = auth.uid());

-- ============================================================================
-- STORAGE BUCKETS (to be created via Supabase Dashboard or API)
-- ============================================================================

-- Bucket: avatars
-- Policy: authenticated users can upload to their own folder (user_id/*)
-- Public read access

-- Bucket: transaction_files
-- Policy: authenticated users can upload to transactions they participate in
-- Private read access (only participants)

-- Note: Storage policies must be created via Supabase Dashboard or Storage API
-- as they cannot be created via SQL migrations directly.

-- ============================================================================
-- UTILITY VIEWS (Optional but useful)
-- ============================================================================

-- View: User's transactions with participant count
create or replace view public.user_transactions as
select
  t.*,
  p.full_name as creator_name,
  (select count(*) from public.transaction_participants where transaction_id = t.id) as participant_count,
  (select count(*) from public.milestones where transaction_id = t.id and completed = true) as completed_milestones,
  (select count(*) from public.milestones where transaction_id = t.id) as total_milestones
from public.transactions t
join public.profiles p on p.id = t.created_by;

comment on view public.user_transactions is 'Transactions with aggregated participant and milestone data';

-- ============================================================================
-- DEFAULT MILESTONE TEMPLATES
-- ============================================================================

-- Function to create default milestones for a new transaction
create or replace function public.create_default_milestones(p_transaction_id uuid)
returns void as $$
begin
  insert into public.milestones (transaction_id, order_index, code, label_en, label_it)
  values
    (p_transaction_id, 1, 'OFFER_ACCEPTED', 'Offer Accepted', 'Offerta Accettata'),
    (p_transaction_id, 2, 'PRELIM_CONTRACT', 'Preliminary Contract Signed', 'Compromesso Firmato'),
    (p_transaction_id, 3, 'DEPOSIT_PAID', 'Deposit Paid', 'Caparra Versata'),
    (p_transaction_id, 4, 'SURVEY_COMPLETE', 'Survey Complete', 'Perizia Completata'),
    (p_transaction_id, 5, 'FINAL_DEED', 'Final Deed (Rogito)', 'Rogito Finale');
end;
$$ language plpgsql security definer;

comment on function public.create_default_milestones is 'Creates the 5 standard milestones for an Italian property purchase';

-- ============================================================================
-- COMPLETION
-- ============================================================================

-- Grant necessary permissions (Supabase typically handles this, but explicit grants for safety)
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;

-- Success message
do $$
begin
  raise notice 'Estate Portal schema created successfully!';
  raise notice 'Tables: profiles, transactions, transaction_participants, milestones, messages, files';
  raise notice 'RLS policies: enabled and configured';
  raise notice 'Triggers: auto-create profile, auto-add transaction creator as participant';
  raise notice 'Next steps: 1) Create storage buckets (avatars, transaction_files) 2) Apply storage policies 3) Seed test data';
end $$;
