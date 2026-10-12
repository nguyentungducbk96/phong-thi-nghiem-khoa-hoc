-- Hàm trong schema public mặc định cho PUBLIC quyền EXECUTE: thu hồi, chỉ cấp cho authenticated
-- những hàm giao diện cần gọi (và các hàm trợ giúp mà chính sách RLS dùng).
revoke execute on all functions in schema public from public, anon;
grant execute on function public.my_profile() to authenticated;
grant execute on function public.admin_set_user(uuid, text, text) to authenticated;
grant execute on function public.create_class(text, text) to authenticated;
grant execute on function public.is_active_user(), public.is_admin(), public.is_active_teacher(),
  public.owns_class(uuid), public.is_class_member(uuid), public.teaches_student(uuid), public.can_submit(uuid)
  to authenticated;
alter default privileges in schema public revoke execute on functions from public, anon;
alter default privileges in schema public revoke all on tables from anon;
