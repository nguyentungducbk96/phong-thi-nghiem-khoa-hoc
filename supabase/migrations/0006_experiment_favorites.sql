-- Giai đoạn 2 (mục XIV): cho phép học sinh đánh dấu yêu thích THÍ NGHIỆM (ngoài video, tài liệu).
-- CHƯA CHẠY trên dự án thật. Khi chưa chạy, ứng dụng tự lưu yêu thích thí nghiệm của học sinh
-- trên thiết bị (localStorage, theo từng tài khoản) và không báo lỗi; chạy xong thì lưu lên máy chủ.
-- Chính sách RLS fav_select / fav_insert / fav_delete hiện có đã áp dụng cho mọi item_type.

alter table public.favorites drop constraint if exists favorites_item_type_check;
alter table public.favorites
  add constraint favorites_item_type_check check (item_type in ('video', 'resource', 'experiment'));

-- Tên hiển thị của hai thử thách được mở rộng thêm chủ đề cây xanh / nam châm (id giữ nguyên,
-- nên không cần thêm dòng mới; câu hỏi chi tiết nằm ở frontend).
update public.quizzes set title = 'Thử thách: Không khí, Nước và Cây xanh' where id = 'quiz_khong_khi_nuoc';
update public.quizzes set title = 'Thử thách: Ánh sáng, Âm thanh, Điện và Nam châm' where id = 'quiz_nang_luong_am_thanh';
