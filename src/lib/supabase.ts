// Kết nối Supabase. Frontend chỉ chứa URL dự án và khóa anon (công khai, bị RLS giới hạn).
// Thiếu cấu hình → supabase = null và ứng dụng chạy chế độ ngoại tuyến (localStorage).
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

const looksValid = !!url && /^https:\/\/.+/.test(url) && !!anonKey && anonKey.length > 20;

export const supabase: SupabaseClient | null = looksValid
  ? createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'ssl_v2_auth' }
    })
  : null;

export const isSupabaseConfigured = supabase !== null;

// Học sinh không có email thật: tên đăng nhập ↔ email tổng hợp (không bao giờ gửi thư)
export const STUDENT_EMAIL_DOMAIN = 'hocsinh.khoahoc4.app';
export const usernameToEmail = (username: string) =>
  `${username.trim().toLowerCase()}@${STUDENT_EMAIL_DOMAIN}`;

export const STORAGE_BUCKET = 'tai-lieu';
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

// Chuyển lỗi kĩ thuật thành câu tiếng Việt dễ hiểu
export const friendlyError = (e: unknown): string => {
  const msg = e instanceof Error ? e.message : typeof e === 'string' ? e : (e as { message?: string })?.message || '';
  if (!msg) return 'Có lỗi xảy ra. Em/thầy cô thử lại nhé.';
  if (/Failed to fetch|NetworkError|network/i.test(msg)) return 'Không kết nối được máy chủ. Hãy kiểm tra mạng Internet rồi thử lại.';
  if (/Invalid login credentials/i.test(msg)) return 'Tên đăng nhập hoặc mật khẩu/mã PIN chưa đúng.';
  if (/User is banned/i.test(msg)) return 'Tài khoản này đang bị khóa. Hãy liên hệ thầy cô.';
  if (/already registered|already been registered/i.test(msg)) return 'Email này đã được đăng ký.';
  if (/Password should be at least/i.test(msg)) return 'Mật khẩu cần ít nhất 8 kí tự.';
  if (/row-level security|permission denied|not authorized/i.test(msg)) return 'Tài khoản chưa có quyền thực hiện thao tác này.';
  if (/rate limit|too many/i.test(msg)) return 'Thao tác quá nhanh, hãy đợi một chút rồi thử lại.';
  if (/Payload too large|exceeded the maximum allowed size/i.test(msg)) return 'Tệp quá lớn (tối đa 50 MB).';
  if (/mime type|invalid_mime_type/i.test(msg)) return 'Loại tệp này không được hỗ trợ.';
  return msg;
};
