-- Danh mục tham chiếu (nội dung chi tiết vẫn nằm ở frontend: src/data/scienceData.ts, src/utils/progress.ts).
-- Khi thêm thí nghiệm/thử thách/huy hiệu mới ở frontend, thêm dòng tương ứng ở đây.
insert into public.experiments (id, title, topic_id) values
  ('khong-khi-chiem-cho', 'Không khí có chiếm chỗ không?', 'khong-khi-nuoc'),
  ('nam-cham-hut-vat-nao', 'Nam châm hút những vật nào?', 'nang-luong'),
  ('nuoc-bay-hoi-ngung-tu', 'Nước bay hơi và ngưng tụ', 'khong-khi-nuoc'),
  ('anh-sang-truyen-nhu-the-nao', 'Ánh sáng truyền như thế nào?', 'anh-sang-am-thanh'),
  ('mach-dien-don-gian', 'Mạch điện đơn giản', 'nang-luong'),
  ('am-thanh-tao-ra-nhu-the-nao', 'Âm thanh được tạo ra như thế nào?', 'anh-sang-am-thanh'),
  ('cay-can-gi-de-song', 'Cây cần gì để sống và phát triển?', 'thuc-vat-dong-vat')
on conflict (id) do update set title = excluded.title, topic_id = excluded.topic_id;

insert into public.quizzes (id, title, topic_id) values
  ('quiz_khong_khi_nuoc', 'Thử thách: Khám phá Không khí và Nước', 'khong-khi-nuoc'),
  ('quiz_nang_luong_am_thanh', 'Thử thách: Ánh sáng, Âm thanh và Điện', 'anh-sang-am-thanh')
on conflict (id) do update set title = excluded.title, topic_id = excluded.topic_id;

insert into public.achievements (id, icon, name, description) values
  ('first_exp', '🧪', 'Bước chân đầu tiên', 'Hoàn thành thí nghiệm đầu tiên'),
  ('air', '⭐', 'Thám tử không khí', 'Hoàn thành thí nghiệm không khí chiếm chỗ'),
  ('magnet', '🧲', 'Bậc thầy nam châm', 'Hoàn thành thí nghiệm nam châm'),
  ('circuit', '💡', 'Kỹ sư điện nhí', 'Hoàn thành thí nghiệm mạch điện'),
  ('notebook', '📒', 'Người ghi chép chăm chỉ', 'Có từ 3 bài ghi chép trong sổ tay'),
  ('quiz', '🏅', 'Thợ săn tri thức', 'Đúng từ 80% trở lên trong một thử thách'),
  ('all', '🏆', 'Nhà khoa học toàn năng', 'Hoàn thành tất cả thí nghiệm')
on conflict (id) do update set icon = excluded.icon, name = excluded.name, description = excluded.description;
