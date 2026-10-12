# Phòng Thí Nghiệm Khoa Học Thông Minh (Smart Science Lab)

Ứng dụng React + TypeScript + Tailwind (Vite) cho môn Khoa học lớp 4.

## Chạy trên máy

1. `npm install --legacy-peer-deps`
2. Sao chép `.env.example` thành `.env.local` và điền `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   (chỉ URL dự án và khóa anon — **không bao giờ** đặt service_role key ở frontend).
   Để trống → ứng dụng chạy chế độ ngoại tuyến (localStorage), không lỗi.
3. `npm run dev`

## Triển khai (Vercel)

- Đặt 2 biến môi trường `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` trong Project Settings → Environment Variables, rồi build lại.
- Ứng dụng là một trang (không có định tuyến URL), ảnh dùng đường dẫn tương đối `./images/...`, nên chạy được với base `/` (Vercel) lẫn `--base=./` (GitHub Pages).
- Sau khi có địa chỉ Vercel: cập nhật **Site URL** trong Supabase → Authentication → URL Configuration (TODO).

## Máy chủ (Supabase)

- `supabase/migrations/*.sql` — toàn bộ lược đồ, hàm, RLS, kho tệp, dữ liệu danh mục; chạy theo thứ tự số.
- `supabase/functions/manage-students` — Edge Function (service role nằm trong môi trường function) để giáo viên đã duyệt tạo tài khoản học sinh (tên đăng nhập + PIN 6 số, email tổng hợp `@hocsinh.khoahoc4.app`, không gửi thư), đặt lại PIN, khóa/mở khóa, đổi tên, xếp nhóm, xóa; quản trị viên xóa tài khoản.
- Tài khoản đăng ký **đầu tiên** tự thành quản trị viên; giáo viên đăng ký sau ở trạng thái chờ duyệt.
- Danh mục thí nghiệm/thử thách/huy hiệu: nội dung chi tiết nằm ở frontend (`src/data/scienceData.ts`, `src/utils/progress.ts`); bảng `experiments`, `quizzes`, `achievements` chỉ giữ id + tên để làm khóa ngoại. Thêm thí nghiệm mới thì thêm cả dòng trong migration seed.
- Dữ liệu học tập cá nhân đi qua một điểm chuyển duy nhất `src/utils/storage.ts` (`getStudentStore`): khách → localStorage, học sinh đăng nhập → Supabase.
- Kiểm thử phân quyền: `node scripts/rls-test.mjs` (chỉ chạy trên dự án chưa có người dùng thật, vì tài khoản đầu tiên thành quản trị viên; cuối script tự dọn, riêng tài khoản admin thử nghiệm cần xóa bằng SQL).
