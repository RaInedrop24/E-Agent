-- Add milestone association to files
alter table public.files
  add column if not exists milestone_id uuid references public.milestones(id) on delete set null;

create index if not exists idx_files_milestone on public.files(milestone_id);

