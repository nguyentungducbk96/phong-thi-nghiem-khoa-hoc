# Phòng Thí Nghiệm Khoa Học Thông Minh (Smart Science Lab)

Ứng dụng React + TypeScript + Tailwind (Vite) cho môn Khoa học lớp 4.

## Chạy trên máy

1. `npm install --legacy-peer-deps`
2. Sao chép `.env.example` thành `.env.local` và điền `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   (chỉ URL dự án và khóa anon — **không bao giờ** đặt service_role key ở frontend).
   Để trống → ứng dụng chạy chế độ ngoại tuyến (localStorage), không lỗi.
3. `npm run dev`

## Đưa lên Vercel

1. Đưa mã nguồn lên GitHub, vào [vercel.com](https://vercel.com) → **Add New… → Project** → chọn kho GitHub này → **Import**.
   Vercel tự đọc `vercel.json` (Vite, lệnh `npm run build`, thư mục `dist`), không cần chỉnh gì thêm.
2. Trước khi bấm Deploy, mở **Environment Variables** và thêm 2 biến (lấy ở Supabase → Project Settings → API):
   - `VITE_SUPABASE_URL` — địa chỉ dự án, dạng `https://xxxx.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` — khóa **anon (public)**. Tuyệt đối không dùng khóa `service_role`.
3. Bấm **Deploy**. Xong sẽ có địa chỉ dạng `https://ten-du-an.vercel.app`. (Đổi biến môi trường thì phải **Redeploy** mới có hiệu lực.)
4. Vào Supabase → **Authentication → URL Configuration**:
   - **Site URL**: địa chỉ Vercel ở trên, ví dụ `https://ten-du-an.vercel.app`
   - **Redirect URLs**: thêm `https://ten-du-an.vercel.app/**` (và tên miền riêng nếu có).

Ghi chú: ứng dụng là một trang, chuyển màn hình bằng trạng thái (không có đường dẫn con như `/thi-nghiem`),
nên không cần luật rewrite. Ảnh nằm ở `public/images/` và được gọi bằng đường dẫn tương đối `./images/...`,
chạy đúng khi phục vụ ở gốc tên miền (Vercel, `base: '/'`) lẫn khi build `--base=./` (GitHub Pages).
Các màn nặng (mô phỏng, góc giáo viên, quản trị...) được tách gói và chỉ tải khi mở tới.

## Máy chủ (Supabase)

- `supabase/migrations/*.sql` — toàn bộ lược đồ, hàm, RLS, kho tệp, dữ liệu danh mục; chạy theo thứ tự số.
- `supabase/functions/manage-students` — Edge Function (service role nằm trong môi trường function) để giáo viên đã duyệt tạo tài khoản học sinh (tên đăng nhập + PIN 6 số, email tổng hợp `@hocsinh.khoahoc4.app`, không gửi thư), đặt lại PIN, khóa/mở khóa, đổi tên, xếp nhóm, xóa; quản trị viên xóa tài khoản.
- Tài khoản đăng ký **đầu tiên** tự thành quản trị viên; giáo viên đăng ký sau ở trạng thái chờ duyệt.
- Danh mục thí nghiệm/thử thách/huy hiệu: nội dung chi tiết nằm ở frontend (`src/data/scienceData.ts`, `src/utils/progress.ts`); bảng `experiments`, `quizzes`, `achievements` chỉ giữ id + tên để làm khóa ngoại. Thêm thí nghiệm mới thì thêm cả dòng trong migration seed.
- Dữ liệu học tập cá nhân đi qua một điểm chuyển duy nhất `src/utils/storage.ts` (`getStudentStore`): khách → localStorage, học sinh đăng nhập → Supabase.
- Kiểm thử phân quyền: `node scripts/rls-test.mjs` (chỉ chạy trên dự án chưa có người dùng thật, vì tài khoản đầu tiên thành quản trị viên; cuối script tự dọn, riêng tài khoản admin thử nghiệm cần xóa bằng SQL).
