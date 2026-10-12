-- Kho tệp riêng tư "tai-lieu": tài liệu (PDF/DOCX/PPTX/ảnh) và video MP4 do giáo viên tải lên.
-- Quy ước đường dẫn: resources/<owner_uid>/<tên tệp>  hoặc  videos/<owner_uid>/<tên tệp>
-- Xem/tải bằng signed URL; quyền đọc tệp đi theo quyền đọc dòng tương ứng trong
-- learning_resources / videos (RLS của các bảng đó áp dụng trong truy vấn con).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tai-lieu', 'tai-lieu', false, 52428800, array[
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png', 'image/jpeg', 'image/gif', 'image/webp',
  'video/mp4'
])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy tailieu_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'tai-lieu'
    and public.is_active_teacher()
    and (storage.foldername(name))[1] in ('resources', 'videos')
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy tailieu_update on storage.objects for update to authenticated
  using (bucket_id = 'tai-lieu' and ((public.is_active_teacher() and (storage.foldername(name))[2] = auth.uid()::text) or public.is_admin()))
  with check (bucket_id = 'tai-lieu' and ((public.is_active_teacher() and (storage.foldername(name))[2] = auth.uid()::text) or public.is_admin()));

create policy tailieu_delete on storage.objects for delete to authenticated
  using (bucket_id = 'tai-lieu' and ((public.is_active_teacher() and (storage.foldername(name))[2] = auth.uid()::text) or public.is_admin()));

create policy tailieu_select on storage.objects for select to authenticated
  using (
    bucket_id = 'tai-lieu' and (
      public.is_admin()
      or (public.is_active_teacher() and (storage.foldername(name))[2] = auth.uid()::text)
      or exists (select 1 from public.learning_resources r where r.storage_path = name)
      or exists (select 1 from public.videos v where v.storage_path = name)
    )
  );
