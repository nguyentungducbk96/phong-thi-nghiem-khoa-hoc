// Edge Function: manage-students
// Giáo viên (đã được duyệt) tạo/quản lí tài khoản học sinh của lớp mình.
// Học sinh không có email thật: mỗi em có email tổng hợp <username>@hocsinh.khoahoc4.app
// (email_confirm = true nên không bao giờ gửi thư) và mật khẩu là mã PIN 6 số.
// Khóa service role chỉ có trong môi trường của function (tự động), không bao giờ ra frontend.
//
// Hành động (POST JSON { action, ... }):
//   create_students { class_id, names: string[] }      -> { students: [{ id, name, username, pin }] }
//   reset_pin       { student_id }                     -> { username, pin }
//   set_locked      { student_id, locked: boolean }    -> { ok }
//   rename          { student_id, display_name }       -> { ok }
//   set_group       { class_id, student_id, group_name } -> { ok }
//   delete_student  { student_id }                     -> { ok }
//   delete_user     { user_id }   (chỉ quản trị viên; xóa tài khoản giáo viên/học sinh) -> { ok }
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

const STUDENT_DOMAIN = 'hocsinh.khoahoc4.app';
const MAX_BATCH = 60;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const randomPin = (): string => {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return String(a[0] % 1_000_000).padStart(6, '0');
};

const cleanName = (s: unknown): string =>
  typeof s === 'string' ? s.replace(/\s+/g, ' ').trim().slice(0, 80) : '';

interface Caller {
  id: string;
  role: 'teacher' | 'admin';
}

async function getCaller(admin: SupabaseClient, req: Request): Promise<Caller> {
  const auth = req.headers.get('Authorization') || '';
  const jwt = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!jwt) throw new HttpError(401, 'Chưa đăng nhập');
  const { data, error } = await admin.auth.getUser(jwt);
  if (error || !data.user) throw new HttpError(401, 'Phiên đăng nhập không hợp lệ');
  const { data: prof } = await admin
    .from('profiles')
    .select('id, role, status')
    .eq('id', data.user.id)
    .maybeSingle();
  if (!prof || prof.status !== 'active' || (prof.role !== 'teacher' && prof.role !== 'admin')) {
    throw new HttpError(403, 'Chỉ giáo viên đã được duyệt mới dùng được chức năng này');
  }
  return { id: prof.id, role: prof.role };
}

async function assertOwnsClass(admin: SupabaseClient, caller: Caller, classId: string) {
  if (typeof classId !== 'string' || !/^[0-9a-f-]{36}$/i.test(classId)) throw new HttpError(400, 'Mã lớp không hợp lệ');
  const { data: cls } = await admin.from('classes').select('id, teacher_id, join_code').eq('id', classId).maybeSingle();
  if (!cls) throw new HttpError(404, 'Không tìm thấy lớp');
  if (cls.teacher_id !== caller.id && caller.role !== 'admin') throw new HttpError(403, 'Thầy cô không phụ trách lớp này');
  return cls as { id: string; teacher_id: string; join_code: string };
}

async function assertTeachesStudent(admin: SupabaseClient, caller: Caller, studentId: string) {
  if (typeof studentId !== 'string' || !/^[0-9a-f-]{36}$/i.test(studentId)) throw new HttpError(400, 'Mã học sinh không hợp lệ');
  const { data: prof } = await admin.from('profiles').select('id, role, username').eq('id', studentId).maybeSingle();
  if (!prof || prof.role !== 'student') throw new HttpError(404, 'Không tìm thấy học sinh');
  if (caller.role !== 'admin') {
    const { data: rows } = await admin
      .from('class_members')
      .select('class_id, classes!inner(teacher_id)')
      .eq('student_id', studentId)
      .eq('classes.teacher_id', caller.id);
    if (!rows || rows.length === 0) throw new HttpError(403, 'Học sinh này không thuộc lớp của thầy cô');
  }
  return prof as { id: string; role: string; username: string };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Chỉ hỗ trợ POST' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return json({ error: 'Máy chủ chưa cấu hình' }, 500);
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    const caller = await getCaller(admin, req);
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, 'Dữ liệu gửi lên không hợp lệ');
    }
    const action = body.action;

    if (action === 'create_students') {
      const cls = await assertOwnsClass(admin, caller, body.class_id as string);
      const names = Array.isArray(body.names) ? body.names.map(cleanName).filter(Boolean) : [];
      if (names.length === 0) throw new HttpError(400, 'Hãy nhập ít nhất một tên học sinh');
      if (names.length > MAX_BATCH) throw new HttpError(400, `Mỗi lần thêm tối đa ${MAX_BATCH} học sinh`);

      const { data: maxRow } = await admin
        .from('class_members')
        .select('number')
        .eq('class_id', cls.id)
        .order('number', { ascending: false })
        .limit(1)
        .maybeSingle();
      let next = (maxRow?.number ?? 0) + 1;
      const prefix = 'hs' + cls.join_code.toLowerCase();
      const created: { id: string; name: string; username: string; pin: string }[] = [];
      const failed: { name: string; error: string; detail?: string }[] = [];

      for (const name of names) {
        let result: 'ok' | 'fail' | 'none' = 'none';
        for (let tries = 0; tries < 5 && next <= 999; tries++) {
          const num = next++;
          const username = prefix + String(num).padStart(2, '0');
          const pin = randomPin();
          const { data: u, error } = await admin.auth.admin.createUser({
            email: `${username}@${STUDENT_DOMAIN}`,
            password: pin,
            email_confirm: true,
            app_metadata: { role: 'student', username },
            user_metadata: { display_name: name }
          });
          if (error || !u.user) {
            // Trùng tên đăng nhập (hiếm): thử số tiếp theo
            if (/already|exists|registered/i.test(error?.message || '')) continue;
            result = 'fail';
            console.error('createUser failed', error?.message);
            failed.push({ name, error: 'Không tạo được tài khoản', detail: error?.message });
            break;
          }
          const { error: memErr } = await admin
            .from('class_members')
            .insert({ class_id: cls.id, student_id: u.user.id, number: num });
          if (memErr) {
            await admin.auth.admin.deleteUser(u.user.id);
            failed.push({ name, error: 'Không thêm được vào lớp' });
            result = 'fail';
          } else {
            created.push({ id: u.user.id, name, username, pin });
            result = 'ok';
          }
          break;
        }
        if (result === 'none') failed.push({ name, error: 'Không tìm được tên đăng nhập trống' });
      }
      return json({ students: created, failed });
    }

    if (action === 'reset_pin') {
      const st = await assertTeachesStudent(admin, caller, body.student_id as string);
      const pin = randomPin();
      const { error } = await admin.auth.admin.updateUserById(st.id, { password: pin });
      if (error) throw new HttpError(500, 'Không đặt lại được mã PIN');
      return json({ username: st.username, pin });
    }

    if (action === 'set_locked') {
      const st = await assertTeachesStudent(admin, caller, body.student_id as string);
      const locked = body.locked === true;
      const { error: e1 } = await admin.from('profiles').update({ status: locked ? 'locked' : 'active' }).eq('id', st.id);
      if (e1) throw new HttpError(500, 'Không cập nhật được trạng thái');
      // Cấm đăng nhập ở tầng Auth (khóa phiên làm mới); RLS đã chặn dữ liệu theo trạng thái.
      await admin.auth.admin.updateUserById(st.id, { ban_duration: locked ? '876000h' : 'none' });
      return json({ ok: true });
    }

    if (action === 'rename') {
      const st = await assertTeachesStudent(admin, caller, body.student_id as string);
      const name = cleanName(body.display_name);
      if (!name) throw new HttpError(400, 'Tên không được để trống');
      const { error } = await admin.from('profiles').update({ display_name: name }).eq('id', st.id);
      if (error) throw new HttpError(500, 'Không đổi được tên');
      return json({ ok: true });
    }

    if (action === 'set_group') {
      const cls = await assertOwnsClass(admin, caller, body.class_id as string);
      const g = cleanName(body.group_name).slice(0, 40) || null;
      const { error } = await admin
        .from('class_members')
        .update({ group_name: g })
        .eq('class_id', cls.id)
        .eq('student_id', body.student_id as string);
      if (error) throw new HttpError(500, 'Không cập nhật được nhóm');
      return json({ ok: true });
    }

    if (action === 'delete_student') {
      const st = await assertTeachesStudent(admin, caller, body.student_id as string);
      const { error } = await admin.auth.admin.deleteUser(st.id);
      if (error) throw new HttpError(500, 'Không xóa được tài khoản');
      return json({ ok: true });
    }

    if (action === 'delete_user') {
      if (caller.role !== 'admin') throw new HttpError(403, 'Chỉ quản trị viên được xóa tài khoản');
      const id = body.user_id as string;
      if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(400, 'Mã tài khoản không hợp lệ');
      if (id === caller.id) throw new HttpError(400, 'Không thể tự xóa tài khoản của mình');
      // Xóa tệp người này đã tải lên trước, rồi xóa tài khoản (các bảng xóa theo ON DELETE CASCADE)
      for (const folder of ['resources', 'videos']) {
        const { data: files } = await admin.storage.from('tai-lieu').list(`${folder}/${id}`, { limit: 1000 });
        if (files && files.length) {
          await admin.storage.from('tai-lieu').remove(files.map((f) => `${folder}/${id}/${f.name}`));
        }
      }
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) throw new HttpError(500, 'Không xóa được tài khoản');
      return json({ ok: true });
    }

    throw new HttpError(400, 'Hành động không hợp lệ');
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status);
    console.error('manage-students error', e instanceof Error ? e.message : 'unknown');
    return json({ error: 'Lỗi máy chủ, thầy cô thử lại sau' }, 500);
  }
});
