-- GoTrue (admin.createUser) chèn auth.users trước rồi mới ghi app_metadata, nên lúc INSERT
-- chưa có app_metadata.role. Sửa: tài khoản thuộc miền học sinh chỉ có hồ sơ khi
-- app_metadata.role = 'student' (chỉ service role đặt được) — tạo ở INSERT hoặc UPDATE.
-- Ai tự đăng ký bằng email miền học sinh sẽ không có hồ sơ ⇒ không có quyền gì (RLS).
create or replace function public.ensure_profile(u auth.users) returns void
language plpgsql security definer set search_path = '' as $$
declare
  is_student_domain boolean := coalesce(u.email, '') ilike '%@hocsinh.khoahoc4.app';
  is_student boolean := is_student_domain and coalesce(u.raw_app_meta_data->>'role', '') = 'student';
  dname text := left(btrim(coalesce(u.raw_user_meta_data->>'display_name', '')), 80);
begin
  if exists (select 1 from public.profiles where id = u.id) then return; end if;
  if is_student_domain and not is_student then return; end if;
  if dname = '' then
    dname := case when is_student then coalesce(u.raw_app_meta_data->>'username', 'Học sinh')
                  else split_part(coalesce(u.email, 'Giáo viên'), '@', 1) end;
  end if;
  insert into public.profiles (id, role, status, display_name, username, email)
  values (
    u.id,
    case when is_student then 'student' else 'teacher' end,
    case when is_student then 'active' else 'pending' end,
    dname,
    case when is_student then lower(u.raw_app_meta_data->>'username') else null end,
    case when is_student then null else u.email end
  );
end $$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.ensure_profile(new);
  return new;
end $$;

create or replace function public.handle_user_meta_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.raw_app_meta_data is distinct from old.raw_app_meta_data then
    perform public.ensure_profile(new);
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_meta_updated on auth.users;
create trigger on_auth_user_meta_updated
  after update of raw_app_meta_data on auth.users
  for each row execute function public.handle_user_meta_update();

revoke execute on function public.ensure_profile(auth.users) from public, anon, authenticated;
