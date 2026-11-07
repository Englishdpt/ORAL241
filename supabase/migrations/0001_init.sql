-- RealRecorder / MIKOLONGO Voice Trainer: schema, security (RLS) and RPC functions.
-- Run in Supabase SQL Editor, or: supabase db push

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  series text not null,                       -- e.g. A1, A2, B, C, D (free text)
  join_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  teacher_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'student' check (role in ('student','teacher')),
  first_name text not null,
  last_name text not null,
  class_id uuid references public.classes(id) on delete set null,
  credits int not null default 0 check (credits >= 0),
  created_at timestamptz not null default now()
);

create table public.texts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  series text[] not null default '{}',        -- empty = visible to every series
  body text not null,
  analysis jsonb not null default '[]',       -- [{"title": "...", "content": "..."}]
  vocabulary jsonb not null default '[]',     -- [{"word": "...", "meaning": "...", "example": "..."}]
  grammar_tips jsonb not null default '[]',   -- [{"title": "...", "content": "..."}]
  published boolean not null default true,
  owner_id uuid references auth.users(id) on delete cascade,  -- null = official text, set = student upload
  created_at timestamptz not null default now()
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  text_id uuid not null references public.texts(id) on delete cascade,
  kind text not null check (kind in ('vocab','grammar')),
  title text not null,
  items jsonb not null default '[]'           -- [{"q": "...", "choices": ["a","b"], "answer": 0, "explain": "..."}]
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  text_id uuid not null references public.texts(id) on delete cascade,
  mode text not null check (mode in ('text','analysis')),
  segment int not null,
  transcript text,
  score numeric(4,3) not null,
  passed boolean not null,
  created_at timestamptz not null default now()
);
create index on public.attempts (student_id, created_at desc);
create index on public.attempts (text_id);

create table public.exercise_results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  text_id uuid not null references public.texts(id) on delete cascade,
  kind text not null check (kind in ('vocab','grammar')),
  score int not null,
  total int not null check (total > 0),
  created_at timestamptz not null default now()
);
create index on public.exercise_results (student_id, created_at desc);

create table public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  delta int not null,
  reason text not null,                        -- teacher_grant | upload_text
  note text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

-- Failed student logins (used by the student-auth Edge Function only).
create table public.login_attempts (
  id bigint generated always as identity primary key,
  email text not null,
  at timestamptz not null default now()
);
create index on public.login_attempts (email, at);

-- ---------- Helper functions (SECURITY DEFINER avoids RLS recursion) ----------
create function public.is_teacher() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'teacher')
$$;

create function public.my_class_id() returns uuid
language sql stable security definer set search_path = public as $$
  select class_id from profiles where id = auth.uid()
$$;

create function public.owns_class(p_class uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from classes where id = p_class and teacher_id = auth.uid())
$$;

create function public.teaches_student(p_student uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles p join classes c on c.id = p.class_id
    where p.id = p_student and c.teacher_id = auth.uid()
  )
$$;

-- ---------- Row Level Security ----------
alter table public.classes enable row level security;
alter table public.profiles enable row level security;
alter table public.texts enable row level security;
alter table public.exercises enable row level security;
alter table public.attempts enable row level security;
alter table public.exercise_results enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.login_attempts enable row level security;  -- no policy: service role only

create policy classes_read on public.classes for select to authenticated
  using (teacher_id = auth.uid() or id = public.my_class_id());
create policy classes_insert on public.classes for insert to authenticated
  with check (public.is_teacher() and teacher_id = auth.uid());
create policy classes_update on public.classes for update to authenticated
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
create policy classes_delete on public.classes for delete to authenticated
  using (teacher_id = auth.uid());

-- Profiles: read-only from the client. Credits, role and class change only through RPC / Edge Functions.
create policy profiles_read on public.profiles for select to authenticated
  using (id = auth.uid() or public.teaches_student(id));

create policy texts_read on public.texts for select to authenticated
  using ((published and owner_id is null) or owner_id = auth.uid() or public.is_teacher());
create policy texts_teacher_write on public.texts for all to authenticated
  using (public.is_teacher()) with check (public.is_teacher());
create policy texts_owner_delete on public.texts for delete to authenticated
  using (owner_id = auth.uid());

create policy exercises_read on public.exercises for select to authenticated using (true);
create policy exercises_teacher_write on public.exercises for all to authenticated
  using (public.is_teacher()) with check (public.is_teacher());

create policy attempts_insert on public.attempts for insert to authenticated
  with check (student_id = auth.uid());
create policy attempts_read on public.attempts for select to authenticated
  using (student_id = auth.uid() or public.teaches_student(student_id));

create policy results_insert on public.exercise_results for insert to authenticated
  with check (student_id = auth.uid());
create policy results_read on public.exercise_results for select to authenticated
  using (student_id = auth.uid() or public.teaches_student(student_id));

create policy ledger_read on public.credit_ledger for select to authenticated
  using (student_id = auth.uid() or public.teaches_student(student_id));

-- ---------- RPC functions ----------
-- Teacher adds (or corrects) credits after a WhatsApp payment.
create function public.grant_credits(p_student uuid, p_amount int, p_note text default null)
returns int language plpgsql security definer set search_path = public as $$
declare v int;
begin
  if not public.teaches_student(p_student) then raise exception 'not allowed'; end if;
  if p_amount = 0 then raise exception 'amount must not be 0'; end if;
  update profiles set credits = credits + p_amount where id = p_student returning credits into v;
  insert into credit_ledger (student_id, delta, reason, note) values (p_student, p_amount, 'teacher_grant', p_note);
  return v;
end $$;

-- Premium: save a photographed/uploaded text and spend exactly one credit, atomically.
create function public.add_uploaded_text(p_title text, p_body text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if length(trim(coalesce(p_body, ''))) < 20 then raise exception 'text too short'; end if;
  if length(p_body) > 8000 then raise exception 'text too long'; end if;
  update profiles set credits = credits - 1
    where id = auth.uid() and role = 'student' and credits >= 1;
  if not found then raise exception 'no credit'; end if;
  insert into texts (title, body, owner_id)
    values (left(trim(coalesce(nullif(p_title, ''), 'Mon texte')), 120), p_body, auth.uid())
    returning id into v_id;
  insert into credit_ledger (student_id, delta, reason, note) values (auth.uid(), -1, 'upload_text', v_id::text);
  return v_id;
end $$;

-- Student joins (or changes) class with the teacher's class code.
create function public.join_class(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  update profiles set class_id = c.id
    from classes c
    where profiles.id = auth.uid() and c.join_code = upper(trim(p_code))
    returning c.id into v;
  if v is null then raise exception 'unknown class code'; end if;
  return v;
end $$;

-- Ranking + steadfastness. Teachers see full names; students see "Firstname L.".
create function public.class_leaderboard(p_class uuid)
returns table (student_id uuid, display_name text, passed_segments bigint, avg_score numeric,
               active_days_14 bigint, last_active timestamptz, exercise_avg numeric)
language sql stable security definer set search_path = public as $$
  select p.id,
    case when public.owns_class(p_class) then p.first_name || ' ' || p.last_name
         else p.first_name || ' ' || left(p.last_name, 1) || '.' end,
    count(distinct (a.text_id, a.mode, a.segment)) filter (where a.passed),
    round(avg(a.score), 3),
    count(distinct a.created_at::date) filter (where a.created_at > now() - interval '14 days'),
    max(a.created_at),
    (select round(avg(r.score::numeric / r.total), 3) from public.exercise_results r where r.student_id = p.id)
  from public.profiles p
  left join public.attempts a on a.student_id = p.id
  where p.class_id = p_class and p.role = 'student'
    and (public.owns_class(p_class) or p_class = public.my_class_id())
  group by p.id
  order by 3 desc, 4 desc nulls last
$$;

-- Lock down function execution: signed-in users only.
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;

-- Live updates for the teacher dashboard (Realtime respects RLS).
alter publication supabase_realtime add table public.attempts, public.exercise_results;
