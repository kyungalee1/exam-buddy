-- Supabase SQL Editor 에서 실행하세요.
-- Authentication → Providers → Anonymous sign-in 을 켜 주세요.

create table if not exists public.exam_records (
  user_id uuid primary key references auth.users (id) on delete cascade,
  -- 앱 전체 상태(JSON): version, me { name, photo, exams[], activeExamId, ... }
  subjects jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.exam_records enable row level security;

drop policy if exists "exam_records_select_own" on public.exam_records;
drop policy if exists "exam_records_insert_own" on public.exam_records;
drop policy if exists "exam_records_update_own" on public.exam_records;

create policy "exam_records_select_own"
  on public.exam_records for select
  using (auth.uid() = user_id);

create policy "exam_records_insert_own"
  on public.exam_records for insert
  with check (auth.uid() = user_id);

create policy "exam_records_update_own"
  on public.exam_records for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.set_exam_records_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists exam_records_updated_at on public.exam_records;

create trigger exam_records_updated_at
  before update on public.exam_records
  for each row
  execute function public.set_exam_records_updated_at();
