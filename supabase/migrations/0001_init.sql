-- =====================================================================
-- Phòng Thí Nghiệm Khoa Học Thông Minh — lược đồ cơ sở dữ liệu (Giai đoạn 3)
-- Chạy trên Supabase (Postgres 17). Mọi bảng đều bật RLS.
-- Nguyên tắc: tối thiểu dữ liệu trẻ em — học sinh chỉ có tên hiển thị + tên đăng nhập.
-- =====================================================================

-- ---------- Hồ sơ người dùng ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'teacher' check (role in ('student','teacher','admin')),
  status text not null default 'pending' check (status in ('pending','active','locked')),
  display_name text not null check (char_length(display_name) between 1 and 80),
  username text unique check (username is null or username ~ '^[a-z0-9]{3,32}$'),
  email text,               -- chỉ lưu cho giáo viên/quản trị (để quản trị duyệt); học sinh để trống
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (role <> 'student' or username is not null)
);

-- ---------- Danh mục tĩnh (nội dung chi tiết nằm ở frontend src/data/scienceData.ts) ----------
create table public.experiments (
  id text primary key check (id ~ '^[a-z0-9-]{2,80}$'),
  title text not null,
  topic_id text not null,
  created_at timestamptz not null default now()
);

create table public.quizzes (
  id text primary key check (id ~ '^[a-z0-9_-]{2,80}$'),
  title text not null,
  topic_id text not null,
  created_at timestamptz not null default now()
);

create table public.achievements (
  id text primary key,
  icon text not null,
  name text not null,
  description text not null
);

-- ---------- Lớp học ----------
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  school_year text check (school_year is null or school_year ~ '^\d{4}-\d{4}$'),
  join_code text not null unique check (join_code ~ '^[A-Z0-9]{5}$'),
  created_at timestamptz not null default now()
);
create index on public.classes(teacher_id);

create table public.class_members (
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  number int not null check (number between 1 and 999),
  group_name text check (group_name is null or char_length(group_name) <= 40),
  created_at timestamptz not null default now(),
  primary key (class_id, student_id),
  unique (class_id, number)
);
create index on public.class_members(student_id);

-- ---------- Tiến độ & kết quả của học sinh ----------
create table public.experiment_progress (
  student_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  experiment_id text not null references public.experiments(id),
  xp_awarded int not null default 0 check (xp_awarded between 0 and 1000),
  completed_at timestamptz not null default now(),
  primary key (student_id, experiment_id)
);

create table public.experiment_results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  experiment_id text not null references public.experiments(id),
  prediction_id text,
  prediction_correct boolean not null default false,
  correct int not null check (correct >= 0),
  total int not null check (total > 0 and total <= 100),
  wrong_question_ids text[] not null default '{}',
  answers jsonb not null default '{}'::jsonb,   -- { "<questionId>": chỉ số đáp án đã chọn }
  actions jsonb not null default '[]'::jsonb,   -- nhật kí thao tác mô phỏng
  observation text check (observation is null or char_length(observation) <= 4000),
  created_at timestamptz not null default now(),
  check (correct <= total)
);
create index on public.experiment_results(student_id, created_at desc);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  quiz_id text not null references public.quizzes(id),
  score int not null check (score >= 0),
  total int not null check (total > 0 and total <= 200),
  xp_awarded int not null default 0 check (xp_awarded between 0 and 2000),
  wrong_question_ids text[] not null default '{}',
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (score <= total)
);
create index on public.quiz_attempts(student_id, created_at desc);

create table public.lab_notebooks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  experiment_id text references public.experiments(id),
  experiment_title text not null check (char_length(experiment_title) between 1 and 200),
  entry_date text not null check (char_length(entry_date) <= 40),
  hypothesis text not null default '' check (char_length(hypothesis) <= 4000),
  operations text not null default '' check (char_length(operations) <= 8000),
  observation text not null default '' check (char_length(observation) <= 4000),
  conclusion text not null default '' check (char_length(conclusion) <= 4000),
  student_notes text not null default '' check (char_length(student_notes) <= 4000),
  questions_explored text check (questions_explored is null or char_length(questions_explored) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.lab_notebooks(student_id, created_at desc);

create table public.student_achievements (
  student_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  achievement_id text not null references public.achievements(id),
  earned_at timestamptz not null default now(),
  primary key (student_id, achievement_id)
);

-- Yêu thích video / tài liệu cần xem lại (id dạng text vì có cả video có sẵn trong frontend)
create table public.favorites (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  item_type text not null check (item_type in ('video','resource')),
  item_id text not null check (char_length(item_id) <= 80),
  created_at timestamptz not null default now(),
  primary key (user_id, item_type, item_id)
);

-- ---------- Nhiệm vụ ----------
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  created_by uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  experiment_id text references public.experiments(id),
  quiz_id text references public.quizzes(id),
  title text not null check (char_length(title) between 1 and 160),
  instructions text check (instructions is null or char_length(instructions) <= 2000),
  due_at timestamptz,
  mode text not null default 'individual' check (mode in ('individual','group')),
  group_name text check (group_name is null or char_length(group_name) <= 40),
  created_at timestamptz not null default now(),
  check ((experiment_id is null) <> (quiz_id is null)),
  check (due_at is null or due_at > created_at - interval '1 day')
);
create index on public.assignments(class_id);

create table public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  experiment_result_id uuid references public.experiment_results(id) on delete set null,
  quiz_attempt_id uuid references public.quiz_attempts(id) on delete set null,
  score int check (score is null or score >= 0),
  total int check (total is null or total > 0),
  submitted_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);
create index on public.assignment_submissions(student_id);

-- ---------- Tài liệu & video ----------
create table public.learning_resources (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '' check (char_length(description) <= 2000),
  topic_id text not null,
  file_type text not null check (file_type in ('pdf','docx','pptx','image','link')),
  kind text not null check (kind in ('file','link')),
  storage_path text unique,
  url text check (url is null or url ~ '^https?://'),
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes between 1 and 52428800),
  visibility text not null default 'public' check (visibility in ('public','teacher_only')),
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((kind = 'file' and storage_path is not null and url is null)
      or (kind = 'link' and url is not null and storage_path is null))
);

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  url text check (url is null or url ~ '^https?://'),
  storage_path text unique,
  size_bytes bigint check (size_bytes is null or size_bytes between 1 and 52428800),
  topic_id text not null,
  description text not null default '' check (char_length(description) <= 2000),
  duration text check (duration is null or duration ~ '^\d{1,3}:[0-5]\d$'),
  level text not null default 'Lớp 4',
  pre_question text not null default '' check (char_length(pre_question) <= 500),
  post_question text not null default '' check (char_length(post_question) <= 500),
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((url is null) <> (storage_path is null))
);

-- =====================================================================
-- Hàm trợ giúp (SECURITY DEFINER, search_path rỗng) — tránh đệ quy RLS
-- =====================================================================
create or replace function public.is_active_user() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'active');
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.role = 'admin' and p.status = 'active');
$$;

-- Giáo viên đang hoạt động (quản trị viên cũng có quyền giáo viên)
create or replace function public.is_active_teacher() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.role in ('teacher','admin') and p.status = 'active');
$$;

create or replace function public.owns_class(cid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_active_teacher()
     and exists (select 1 from public.classes c where c.id = cid and c.teacher_id = auth.uid());
$$;

create or replace function public.is_class_member(cid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_active_user()
     and exists (select 1 from public.class_members m where m.class_id = cid and m.student_id = auth.uid());
$$;

create or replace function public.teaches_student(sid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_active_teacher()
     and exists (select 1 from public.class_members m
                 join public.classes c on c.id = m.class_id
                 where m.student_id = sid and c.teacher_id = auth.uid());
$$;

create or replace function public.can_submit(aid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_active_user()
     and exists (select 1 from public.assignments a
                 join public.class_members m on m.class_id = a.class_id
                 where a.id = aid and m.student_id = auth.uid());
$$;

-- Hồ sơ của chính mình (kể cả khi đang chờ duyệt/bị khóa) để giao diện hiển thị trạng thái
create or replace function public.my_profile()
returns table (id uuid, role text, status text, display_name text, username text, email text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select p.id, p.role, p.status, p.display_name, p.username, p.email, p.created_at
  from public.profiles p where p.id = auth.uid();
$$;

-- =====================================================================
-- Trigger: tạo hồ sơ khi có tài khoản mới; tài khoản ĐẦU TIÊN thành quản trị viên
-- =====================================================================
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  is_student boolean := coalesce(new.raw_app_meta_data->>'role', '') = 'student';
  dname text := left(btrim(coalesce(new.raw_user_meta_data->>'display_name', '')), 80);
begin
  -- Chỉ Edge Function (service role) mới đặt được app_metadata.role = 'student'.
  if not is_student and new.email ilike '%@hocsinh.khoahoc4.app' then
    raise exception 'Tên miền email này dành riêng cho tài khoản học sinh';
  end if;
  if dname = '' then
    dname := case when is_student then coalesce(new.raw_app_meta_data->>'username', 'Học sinh')
                  else split_part(coalesce(new.email, 'Giáo viên'), '@', 1) end;
  end if;
  insert into public.profiles (id, role, status, display_name, username, email)
  values (
    new.id,
    case when is_student then 'student' else 'teacher' end,
    case when is_student then 'active' else 'pending' end,
    dname,
    case when is_student then lower(new.raw_app_meta_data->>'username') else null end,
    case when is_student then null else new.email end
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.profiles_first_admin() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(4242);
  if new.role <> 'student' and not exists (select 1 from public.profiles) then
    new.role := 'admin';
    new.status := 'active';
  end if;
  return new;
end $$;

create trigger profiles_first_admin
  before insert on public.profiles
  for each row execute function public.profiles_first_admin();

-- Chặn người dùng tự đổi vai trò/trạng thái/tên đăng nhập
create or replace function public.profiles_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  if (new.role is distinct from old.role or new.status is distinct from old.status
      or new.username is distinct from old.username or new.email is distinct from old.email
      or new.id is distinct from old.id) then
    -- service role (Edge Function) và quản trị viên (qua hàm admin_*) được phép
    if coalesce(auth.role(), '') <> 'service_role' and current_user not in ('postgres','supabase_admin')
       and not public.is_admin() then
      raise exception 'Không có quyền thay đổi vai trò hoặc trạng thái tài khoản';
    end if;
  end if;
  return new;
end $$;

create trigger profiles_guard
  before update on public.profiles
  for each row execute function public.profiles_guard();

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;

create trigger lab_notebooks_touch before update on public.lab_notebooks
  for each row execute function public.touch_updated_at();
create trigger learning_resources_touch before update on public.learning_resources
  for each row execute function public.touch_updated_at();
create trigger videos_touch before update on public.videos
  for each row execute function public.touch_updated_at();

-- Không cho học sinh đổi chủ sở hữu bản ghi khi cập nhật
create or replace function public.keep_owner() returns trigger
language plpgsql set search_path = '' as $$
begin
  if to_jsonb(new) ? 'student_id' and (to_jsonb(new)->>'student_id') is distinct from (to_jsonb(old)->>'student_id') then
    raise exception 'Không được đổi chủ sở hữu';
  end if;
  if to_jsonb(new) ? 'owner_id' and (to_jsonb(new)->>'owner_id') is distinct from (to_jsonb(old)->>'owner_id') then
    raise exception 'Không được đổi chủ sở hữu';
  end if;
  return new;
end $$;
create trigger lab_notebooks_owner before update on public.lab_notebooks for each row execute function public.keep_owner();
create trigger submissions_owner before update on public.assignment_submissions for each row execute function public.keep_owner();
create trigger resources_owner before update on public.learning_resources for each row execute function public.keep_owner();
create trigger videos_owner before update on public.videos for each row execute function public.keep_owner();

create or replace function public.classes_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.teacher_id is distinct from old.teacher_id or new.join_code is distinct from old.join_code then
    raise exception 'Không được đổi giáo viên phụ trách hoặc mã lớp';
  end if;
  return new;
end $$;
create trigger classes_guard before update on public.classes for each row execute function public.classes_guard();

-- =====================================================================
-- Hàm quản trị
-- =====================================================================
create or replace function public.admin_set_user(target uuid, new_role text default null, new_status text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare cur_role text;
begin
  if not public.is_admin() then raise exception 'Chỉ quản trị viên được thực hiện'; end if;
  if target = auth.uid() then raise exception 'Không thể tự đổi vai trò/trạng thái của chính mình'; end if;
  select role into cur_role from public.profiles where id = target;
  if cur_role is null then raise exception 'Không tìm thấy tài khoản'; end if;
  if new_role is not null then
    if new_role not in ('teacher','admin') or cur_role = 'student' then
      raise exception 'Chỉ đổi vai trò giữa giáo viên và quản trị viên';
    end if;
    update public.profiles set role = new_role where id = target;
  end if;
  if new_status is not null then
    if new_status not in ('pending','active','locked') then raise exception 'Trạng thái không hợp lệ'; end if;
    update public.profiles set status = new_status where id = target;
  end if;
end $$;

-- Tạo lớp: sinh mã tham gia ngẫu nhiên 5 kí tự (không dùng 0/O/1/I/L)
create or replace function public.create_class(p_name text, p_school_year text default null)
returns public.classes language plpgsql security definer set search_path = '' as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text; r public.classes; i int;
begin
  if not public.is_active_teacher() then raise exception 'Tài khoản giáo viên chưa được duyệt'; end if;
  loop
    code := '';
    for i in 1..5 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.classes where join_code = code);
  end loop;
  insert into public.classes (teacher_id, name, school_year, join_code)
  values (auth.uid(), btrim(p_name), nullif(btrim(coalesce(p_school_year, '')), ''), code)
  returning * into r;
  return r;
end $$;

-- =====================================================================
-- Quyền & RLS
-- =====================================================================
revoke all on all functions in schema public from anon;
grant execute on function public.my_profile() to authenticated;
grant execute on function public.admin_set_user(uuid, text, text) to authenticated;
grant execute on function public.create_class(text, text) to authenticated;
grant execute on function public.is_active_user(), public.is_admin(), public.is_active_teacher(),
  public.owns_class(uuid), public.is_class_member(uuid), public.teaches_student(uuid), public.can_submit(uuid)
  to authenticated;

alter table public.profiles enable row level security;
alter table public.experiments enable row level security;
alter table public.quizzes enable row level security;
alter table public.achievements enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.experiment_progress enable row level security;
alter table public.experiment_results enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.lab_notebooks enable row level security;
alter table public.student_achievements enable row level security;
alter table public.favorites enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_submissions enable row level security;
alter table public.learning_resources enable row level security;
alter table public.videos enable row level security;

-- Khách (anon) không đọc được bảng nào. Danh mục thí nghiệm/câu đố/huy hiệu đã có sẵn ở frontend.
revoke all on all tables in schema public from anon;

-- profiles
create policy profiles_select on public.profiles for select to authenticated
  using ((id = auth.uid() and public.is_active_user()) or public.teaches_student(id) or public.is_admin());
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid() and public.is_active_user()) with check (id = auth.uid());
create policy profiles_admin_update on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- danh mục: người dùng đang hoạt động đọc được, chỉ quản trị viên sửa
create policy experiments_read on public.experiments for select to authenticated using (public.is_active_user());
create policy experiments_admin on public.experiments for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy quizzes_read on public.quizzes for select to authenticated using (public.is_active_user());
create policy quizzes_admin on public.quizzes for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy achievements_read on public.achievements for select to authenticated using (public.is_active_user());
create policy achievements_admin on public.achievements for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- classes (tạo lớp qua hàm create_class để sinh mã)
create policy classes_select on public.classes for select to authenticated
  using (public.owns_class(id) or public.is_class_member(id) or public.is_admin());
create policy classes_update on public.classes for update to authenticated
  using (public.owns_class(id) or public.is_admin()) with check (public.owns_class(id) or public.is_admin());
create policy classes_delete on public.classes for delete to authenticated
  using (public.owns_class(id) or public.is_admin());

-- class_members: học sinh chỉ thấy dòng của chính mình (không thấy tên bạn cùng lớp).
-- Thêm/xóa học sinh qua Edge Function manage-students (service role).
create policy members_select on public.class_members for select to authenticated
  using ((student_id = auth.uid() and public.is_active_user()) or public.owns_class(class_id) or public.is_admin());
create policy members_update on public.class_members for update to authenticated
  using (public.owns_class(class_id) or public.is_admin()) with check (public.owns_class(class_id) or public.is_admin());
create policy members_delete on public.class_members for delete to authenticated
  using (public.owns_class(class_id) or public.is_admin());

-- Bảng dữ liệu cá nhân của học sinh: chính chủ, giáo viên của lớp (chỉ đọc), quản trị viên
create policy progress_select on public.experiment_progress for select to authenticated
  using ((student_id = auth.uid() and public.is_active_user()) or public.teaches_student(student_id) or public.is_admin());
create policy progress_insert on public.experiment_progress for insert to authenticated
  with check (student_id = auth.uid() and public.is_active_user());
create policy progress_delete on public.experiment_progress for delete to authenticated using (public.is_admin());

create policy results_select on public.experiment_results for select to authenticated
  using ((student_id = auth.uid() and public.is_active_user()) or public.teaches_student(student_id) or public.is_admin());
create policy results_insert on public.experiment_results for insert to authenticated
  with check (student_id = auth.uid() and public.is_active_user());
create policy results_delete on public.experiment_results for delete to authenticated using (public.is_admin());

create policy attempts_select on public.quiz_attempts for select to authenticated
  using ((student_id = auth.uid() and public.is_active_user()) or public.teaches_student(student_id) or public.is_admin());
create policy attempts_insert on public.quiz_attempts for insert to authenticated
  with check (student_id = auth.uid() and public.is_active_user());
create policy attempts_delete on public.quiz_attempts for delete to authenticated using (public.is_admin());

create policy notebooks_select on public.lab_notebooks for select to authenticated
  using ((student_id = auth.uid() and public.is_active_user()) or public.teaches_student(student_id) or public.is_admin());
create policy notebooks_insert on public.lab_notebooks for insert to authenticated
  with check (student_id = auth.uid() and public.is_active_user());
create policy notebooks_update on public.lab_notebooks for update to authenticated
  using (student_id = auth.uid() and public.is_active_user()) with check (student_id = auth.uid());
create policy notebooks_delete on public.lab_notebooks for delete to authenticated
  using ((student_id = auth.uid() and public.is_active_user()) or public.is_admin());

create policy stach_select on public.student_achievements for select to authenticated
  using ((student_id = auth.uid() and public.is_active_user()) or public.teaches_student(student_id) or public.is_admin());
create policy stach_insert on public.student_achievements for insert to authenticated
  with check (student_id = auth.uid() and public.is_active_user());

create policy fav_select on public.favorites for select to authenticated
  using (user_id = auth.uid() and public.is_active_user());
create policy fav_insert on public.favorites for insert to authenticated
  with check (user_id = auth.uid() and public.is_active_user());
create policy fav_delete on public.favorites for delete to authenticated
  using (user_id = auth.uid() and public.is_active_user());

-- assignments
create policy asg_select on public.assignments for select to authenticated
  using (public.owns_class(class_id) or public.is_class_member(class_id) or public.is_admin());
create policy asg_insert on public.assignments for insert to authenticated
  with check ((public.owns_class(class_id) or public.is_admin()) and created_by = auth.uid());
create policy asg_update on public.assignments for update to authenticated
  using (public.owns_class(class_id) or public.is_admin()) with check (public.owns_class(class_id) or public.is_admin());
create policy asg_delete on public.assignments for delete to authenticated
  using (public.owns_class(class_id) or public.is_admin());

-- submissions
create policy sub_select on public.assignment_submissions for select to authenticated
  using ((student_id = auth.uid() and public.is_active_user())
         or exists (select 1 from public.assignments a where a.id = assignment_id and public.owns_class(a.class_id))
         or public.is_admin());
create policy sub_insert on public.assignment_submissions for insert to authenticated
  with check (student_id = auth.uid() and public.can_submit(assignment_id));
create policy sub_update on public.assignment_submissions for update to authenticated
  using (student_id = auth.uid() and public.can_submit(assignment_id))
  with check (student_id = auth.uid() and public.can_submit(assignment_id));

-- learning_resources
create policy res_select on public.learning_resources for select to authenticated
  using (
    public.is_admin()
    or (owner_id = auth.uid() and public.is_active_teacher())
    or (not hidden and public.is_active_teacher())
    or (not hidden and visibility = 'public' and public.is_active_user()
        and (class_id is null or public.is_class_member(class_id)))
  );
create policy res_insert on public.learning_resources for insert to authenticated
  with check (owner_id = auth.uid() and public.is_active_teacher()
              and (class_id is null or public.owns_class(class_id) or public.is_admin()));
create policy res_update on public.learning_resources for update to authenticated
  using ((owner_id = auth.uid() and public.is_active_teacher()) or public.is_admin())
  with check ((owner_id = auth.uid() and public.is_active_teacher()) or public.is_admin());
create policy res_delete on public.learning_resources for delete to authenticated
  using ((owner_id = auth.uid() and public.is_active_teacher()) or public.is_admin());

-- videos
create policy vid_select on public.videos for select to authenticated
  using (public.is_admin() or (owner_id = auth.uid() and public.is_active_teacher())
         or (not hidden and public.is_active_user()));
create policy vid_insert on public.videos for insert to authenticated
  with check (owner_id = auth.uid() and public.is_active_teacher());
create policy vid_update on public.videos for update to authenticated
  using ((owner_id = auth.uid() and public.is_active_teacher()) or public.is_admin())
  with check ((owner_id = auth.uid() and public.is_active_teacher()) or public.is_admin());
create policy vid_delete on public.videos for delete to authenticated
  using ((owner_id = auth.uid() and public.is_active_teacher()) or public.is_admin());

-- Quyền bảng cho vai trò authenticated (RLS vẫn lọc từng dòng)
grant select, insert, update, delete on all tables in schema public to authenticated;
-- Hồ sơ: chỉ được sửa tên hiển thị trực tiếp; vai trò/trạng thái đi qua admin_set_user / Edge Function
revoke insert, delete, update on public.profiles from authenticated;
grant update (display_name) on public.profiles to authenticated;
revoke insert on public.classes from authenticated;
revoke insert on public.class_members from authenticated;
