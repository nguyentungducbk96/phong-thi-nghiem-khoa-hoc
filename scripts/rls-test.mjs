// Kiểm thử phân quyền (RLS + Storage + Edge Function) trên dự án Supabase THẬT,
// chỉ dùng khóa anon và các tài khoản thử nghiệm do script tự tạo.
//
// Cách chạy (CHỈ khi dự án chưa có người dùng thật — tài khoản đầu tiên sẽ thành quản trị viên):
//   node scripts/rls-test.mjs
// Đọc VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY từ .env.local.
//
// Cuối script tự xóa tệp, học sinh và giáo viên thử nghiệm qua API. Riêng tài khoản quản trị
// thử nghiệm (teacher1) không tự xóa được chính mình: script in ra id để xóa bằng SQL
// (delete from auth.users where id = '...') qua Dashboard / Management API.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const URL_ = env.VITE_SUPABASE_URL;
const ANON = env.VITE_SUPABASE_ANON_KEY;
if (!URL_ || !ANON) throw new Error('Thiếu VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY trong .env.local');

const mk = () => createClient(URL_, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
const RUN = Date.now().toString(36);
const PASSWORD = 'Test-' + Math.random().toString(36).slice(2, 10) + '!9';
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};
const rows = (r) => (r.error ? null : r.data || []);

async function signupTeacher(tag) {
  const c = mk();
  const email = `khoahoc4.rlstest.${tag}.${RUN}@gmail.com`;
  const { data, error } = await c.auth.signUp({
    email,
    password: PASSWORD,
    options: { data: { display_name: `GV thử ${tag}` } }
  });
  if (error) throw new Error(`signup ${tag}: ${error.message}`);
  if (!data.session) {
    const r = await c.auth.signInWithPassword({ email, password: PASSWORD });
    if (r.error) throw new Error(`signin ${tag}: ${r.error.message}`);
  }
  return { c, id: data.user.id, email };
}
const profile = async (c) => (await c.rpc('my_profile')).data?.[0];
const fn = async (c, body) => {
  const { data, error } = await c.functions.invoke('manage-students', { body });
  if (error) {
    let msg = error.message;
    try {
      msg = (await error.context.json()).error || msg;
    } catch {}
    return { error: msg, status: error.context?.status };
  }
  return { data };
};

const created = { teachers: [], students: [], files: [] };

try {
  // 1. Tài khoản đầu tiên thành quản trị viên
  const t1 = await signupTeacher('t1');
  created.teachers.push(t1);
  const p1 = await profile(t1.c);
  check('teacher1 (tài khoản đầu tiên) tự động là admin + active', p1?.role === 'admin' && p1?.status === 'active', JSON.stringify(p1 && { role: p1.role, status: p1.status }));

  // 2. Tài khoản thứ hai: giáo viên chờ duyệt, bị chặn
  const t2 = await signupTeacher('t2');
  created.teachers.push(t2);
  const p2 = await profile(t2.c);
  check('teacher2 đăng ký → teacher + pending', p2?.role === 'teacher' && p2?.status === 'pending');
  const cc = await t2.c.rpc('create_class', { p_name: 'Lớp thử' });
  check('teacher2 (pending) KHÔNG tạo được lớp', !!cc.error, cc.error?.message);
  const insDirect = await t2.c.from('classes').insert({ teacher_id: t2.id, name: 'x', join_code: 'ABCDE' });
  check('teacher2 (pending) KHÔNG chèn trực tiếp được vào classes', !!insDirect.error);
  const fnPending = await fn(t2.c, { action: 'create_students', class_id: '00000000-0000-0000-0000-000000000000', names: ['A'] });
  check('teacher2 (pending) bị Edge Function từ chối', fnPending.status === 403, fnPending.error);
  const selfPromote = await t2.c.from('profiles').update({ role: 'admin', status: 'active' }).eq('id', t2.id).select();
  check('teacher2 KHÔNG tự nâng quyền được', !!selfPromote.error || rows(selfPromote).length === 0, selfPromote.error?.message);
  const rpcPromote = await t2.c.rpc('admin_set_user', { target: t2.id, new_status: 'active' });
  check('teacher2 KHÔNG gọi được admin_set_user', !!rpcPromote.error);

  // 3. Admin duyệt teacher2
  const appr = await t1.c.rpc('admin_set_user', { target: t2.id, new_status: 'active' });
  check('admin duyệt teacher2', !appr.error, appr.error?.message);
  check('teacher2 sau khi duyệt → active', (await profile(t2.c))?.status === 'active');

  // 4. teacher2 tạo lớp + 2 học sinh; admin tạo một lớp khác
  const cls2 = await t2.c.rpc('create_class', { p_name: '4A thử nghiệm', p_school_year: '2026-2027' });
  check('teacher2 tạo lớp có mã tham gia', !cls2.error && /^[A-Z0-9]{5}$/.test(cls2.data?.join_code || ''), cls2.error?.message || cls2.data?.join_code);
  const classId = cls2.data.id;
  const cls1 = await t1.c.rpc('create_class', { p_name: 'Lớp của admin' });
  const otherClassId = cls1.data?.id;
  const made = await fn(t2.c, { action: 'create_students', class_id: classId, names: ['Nguyễn Văn An', 'Trần Thị Bình'] });
  const sts = made.data?.students || [];
  if (!sts.length) console.log('create_students →', JSON.stringify(made));
  created.students.push(...sts);
  check('Edge Function tạo 2 học sinh (username + PIN 6 số)', sts.length === 2 && sts.every((s) => /^\d{6}$/.test(s.pin) && s.username.startsWith('hs')), made.error || sts.map((s) => s.username).join(', '));
  const wrongOwner = await fn(t2.c, { action: 'create_students', class_id: otherClassId, names: ['X'] });
  check('teacher2 KHÔNG thêm được học sinh vào lớp của người khác', wrongOwner.status === 403, wrongOwner.error);

  // 5. Học sinh đăng nhập bằng username + PIN
  const loginStudent = async (s) => {
    const c = mk();
    const r = await c.auth.signInWithPassword({ email: `${s.username}@hocsinh.khoahoc4.app`, password: s.pin });
    return { c, error: r.error, id: r.data?.user?.id };
  };
  const s1 = await loginStudent(sts[0]);
  check('student1 đăng nhập bằng username + PIN', !s1.error, s1.error?.message);
  const s2 = await loginStudent(sts[1]);
  const ps1 = await profile(s1.c);
  check('student1 có role student + active, không có email', ps1?.role === 'student' && ps1?.status === 'active' && !ps1?.email);

  const qa1 = await s1.c.from('quiz_attempts').insert({ quiz_id: 'quiz_khong_khi_nuoc', score: 3, total: 4, wrong_question_ids: ['q2'], answers: { q1: 0 } }).select().single();
  check('student1 ghi được quiz_attempt', !qa1.error, qa1.error?.message);
  const qa2 = await s2.c.from('quiz_attempts').insert({ quiz_id: 'quiz_khong_khi_nuoc', score: 1, total: 4 }).select().single();
  await s2.c.from('lab_notebooks').insert({ experiment_title: 'Ghi chép riêng của Bình', entry_date: '12/10/2026' });
  const forge = await s1.c.from('quiz_attempts').insert({ student_id: s2.id, quiz_id: 'quiz_khong_khi_nuoc', score: 4, total: 4 });
  check('student1 KHÔNG ghi được bài làm mang tên student2', !!forge.error);

  // 6. Học sinh chỉ thấy dữ liệu của mình
  const s1Att = rows(await s1.c.from('quiz_attempts').select('id, student_id'));
  check('student1 chỉ đọc được bài làm của mình', s1Att.length === 1 && s1Att[0].student_id === s1.id, `${s1Att.length} dòng`);
  const s1ReadS2 = rows(await s1.c.from('quiz_attempts').select('id').eq('student_id', s2.id));
  check('student1 KHÔNG đọc được quiz_attempts của student2', s1ReadS2.length === 0);
  const s1Nb = rows(await s1.c.from('lab_notebooks').select('id'));
  check('student1 KHÔNG đọc được sổ tay của student2', s1Nb.length === 0);
  const s1Prof = rows(await s1.c.from('profiles').select('id, display_name'));
  check('student1 chỉ thấy hồ sơ của chính mình (không thấy tên bạn)', s1Prof.length === 1 && s1Prof[0].id === s1.id, `${s1Prof.length} dòng`);
  const s1Mem = rows(await s1.c.from('class_members').select('student_id'));
  check('student1 chỉ thấy dòng thành viên của mình', s1Mem.length === 1 && s1Mem[0].student_id === s1.id);
  const s1Cls = rows(await s1.c.from('classes').select('id'));
  check('student1 chỉ thấy lớp mình học', s1Cls.length === 1 && s1Cls[0].id === classId);
  const s1Other = rows(await s1.c.from('classes').select('id').eq('id', otherClassId));
  check('student1 KHÔNG đọc được lớp khác', s1Other.length === 0);
  const s1Upd = await s1.c.from('profiles').update({ role: 'teacher' }).eq('id', s1.id).select();
  check('student1 KHÔNG tự đổi vai trò', !!s1Upd.error || rows(s1Upd).length === 0);
  const s1Fn = await fn(s1.c, { action: 'reset_pin', student_id: s2.id });
  check('student1 KHÔNG dùng được Edge Function', s1Fn.status === 403, s1Fn.error);

  // 7. Nhiệm vụ + bài nộp
  const asg = await t2.c.from('assignments').insert({ class_id: classId, created_by: t2.id, quiz_id: 'quiz_khong_khi_nuoc', title: 'Làm thử thách', due_at: new Date(Date.now() + 864e5).toISOString(), mode: 'individual' }).select().single();
  check('teacher2 giao nhiệm vụ cho lớp mình', !asg.error, asg.error?.message);
  const asgOther = await t1.c.from('assignments').insert({ class_id: otherClassId, created_by: t1.id, experiment_id: 'mach-dien-don-gian', title: 'Nhiệm vụ lớp khác' }).select().single();
  const s1Asg = rows(await s1.c.from('assignments').select('id'));
  check('student1 chỉ thấy nhiệm vụ của lớp mình', s1Asg.length === 1 && s1Asg[0].id === asg.data.id);
  const sub = await s1.c.from('assignment_submissions').insert({ assignment_id: asg.data.id, quiz_attempt_id: qa1.data.id, score: 3, total: 4 }).select().single();
  check('student1 nộp bài cho nhiệm vụ của lớp mình', !sub.error, sub.error?.message);
  const subOther = await s1.c.from('assignment_submissions').insert({ assignment_id: asgOther.data?.id, score: 1, total: 1 });
  check('student1 KHÔNG nộp được bài cho lớp khác', !!subOther.error);
  const t2Subs = rows(await t2.c.from('assignment_submissions').select('id'));
  check('teacher2 thấy bài nộp của lớp mình', t2Subs.length === 1);

  // 8. Giáo viên đọc kết quả học sinh lớp mình; giáo viên khác thì không
  const t2Att = rows(await t2.c.from('quiz_attempts').select('id'));
  check('teacher2 đọc được bài làm của học sinh lớp mình', t2Att.length === 2, `${t2Att.length} dòng`);
  const t2Names = rows(await t2.c.from('profiles').select('id, display_name').eq('role', 'student'));
  check('teacher2 thấy tên học sinh lớp mình', t2Names.length === 2);

  const t3 = await signupTeacher('t3');
  created.teachers.push(t3);
  await t1.c.rpc('admin_set_user', { target: t3.id, new_status: 'active' });
  const t3Att = rows(await t3.c.from('quiz_attempts').select('id'));
  const t3Prof = rows(await t3.c.from('profiles').select('id'));
  const t3Cls = rows(await t3.c.from('classes').select('id'));
  const t3Sub = rows(await t3.c.from('assignment_submissions').select('id'));
  check('teacher3 (không phụ trách) KHÔNG đọc được học sinh/bài làm/lớp của teacher2',
    t3Att.length === 0 && t3Prof.length === 1 && t3Cls.length === 0 && t3Sub.length === 0,
    `attempts=${t3Att.length} profiles=${t3Prof.length} classes=${t3Cls.length}`);
  const t3Fn = await fn(t3.c, { action: 'reset_pin', student_id: s1.id });
  check('teacher3 KHÔNG đặt lại PIN học sinh lớp khác', t3Fn.status === 403, t3Fn.error);
  const t3Asg = await t3.c.from('assignments').insert({ class_id: classId, created_by: t3.id, quiz_id: 'quiz_khong_khi_nuoc', title: 'Chen ngang' });
  check('teacher3 KHÔNG giao nhiệm vụ vào lớp của teacher2', !!t3Asg.error);
  const t1Att = rows(await t1.c.from('quiz_attempts').select('id'));
  check('teacher1 (admin) đọc được mọi bài làm', t1Att.length === 2);

  // 9. Khách (anon) không đọc được gì
  const anon = mk();
  let anonLeak = [];
  for (const t of ['profiles', 'classes', 'class_members', 'quiz_attempts', 'experiment_results', 'experiment_progress', 'lab_notebooks', 'assignments', 'assignment_submissions', 'learning_resources', 'videos', 'favorites', 'student_achievements']) {
    const r = await anon.from(t).select('*').limit(1);
    if (!r.error && (r.data || []).length > 0) anonLeak.push(t);
  }
  const anonRpc = await anon.rpc('my_profile');
  check('anon KHÔNG đọc được bảng riêng tư nào', anonLeak.length === 0, anonLeak.join(',') || 'không rò rỉ');
  check('anon KHÔNG gọi được my_profile', !!anonRpc.error || (anonRpc.data || []).length === 0);
  const anonFn = await fn(anon, { action: 'create_students', class_id: classId, names: ['X'] });
  check('anon KHÔNG dùng được Edge Function', anonFn.status === 401 || anonFn.status === 403, anonFn.error);

  // 10. Storage: tệp chỉ dành cho giáo viên
  const pdf = new Blob(['%PDF-1.4\n% test\n'], { type: 'application/pdf' });
  const pathPriv = `resources/${t2.id}/${RUN}-giao-an.pdf`;
  const pathPub = `resources/${t2.id}/${RUN}-phieu.pdf`;
  const up1 = await t2.c.storage.from('tai-lieu').upload(pathPriv, pdf, { contentType: 'application/pdf' });
  const up2 = await t2.c.storage.from('tai-lieu').upload(pathPub, pdf, { contentType: 'application/pdf' });
  created.files.push(pathPriv, pathPub);
  check('teacher2 tải tệp lên kho riêng tư', !up1.error && !up2.error, up1.error?.message || up2.error?.message);
  const r1 = await t2.c.from('learning_resources').insert({ owner_id: t2.id, title: 'Giáo án riêng', topic_id: 'khong-khi-nuoc', file_type: 'pdf', kind: 'file', storage_path: pathPriv, visibility: 'teacher_only', size_bytes: 16 });
  const r2 = await t2.c.from('learning_resources').insert({ owner_id: t2.id, title: 'Phiếu học tập', topic_id: 'khong-khi-nuoc', file_type: 'pdf', kind: 'file', storage_path: pathPub, visibility: 'public', size_bytes: 16 });
  check('teacher2 tạo 2 tài liệu (teacher_only + public)', !r1.error && !r2.error, r1.error?.message || r2.error?.message);
  const s1Res = rows(await s1.c.from('learning_resources').select('title, visibility'));
  check('student1 chỉ thấy tài liệu công khai', s1Res.length === 1 && s1Res[0].visibility === 'public', s1Res.map((r) => r.title).join(','));
  const sPriv = await s1.c.storage.from('tai-lieu').createSignedUrl(pathPriv, 60);
  check('student1 KHÔNG tạo được signed URL cho tệp teacher_only', !!sPriv.error, sPriv.error?.message);
  const sPrivDl = await s1.c.storage.from('tai-lieu').download(pathPriv);
  check('student1 KHÔNG tải được tệp teacher_only', !!sPrivDl.error);
  const sPub = await s1.c.storage.from('tai-lieu').createSignedUrl(pathPub, 60);
  let pubOk = false;
  if (!sPub.error) pubOk = (await fetch(sPub.data.signedUrl)).ok;
  check('student1 mở được tệp công khai bằng signed URL', pubOk);
  const anonDl = await anon.storage.from('tai-lieu').createSignedUrl(pathPub, 60);
  check('anon KHÔNG mở được tệp nào trong kho', !!anonDl.error);
  const s1Up = await s1.c.storage.from('tai-lieu').upload(`resources/${s1.id}/x.pdf`, pdf, { contentType: 'application/pdf' });
  check('student1 KHÔNG tải tệp lên được', !!s1Up.error);
  const t3Up = await t3.c.storage.from('tai-lieu').upload(`resources/${t2.id}/hack.pdf`, pdf, { contentType: 'application/pdf' });
  check('teacher3 KHÔNG ghi vào thư mục của teacher2', !!t3Up.error);
  const exe = await t2.c.storage.from('tai-lieu').upload(`resources/${t2.id}/${RUN}.exe`, new Blob(['MZ']), { contentType: 'application/x-msdownload' });
  check('kho từ chối loại tệp không cho phép (.exe)', !!exe.error);

  // 11. Khóa học sinh
  const lock = await fn(t2.c, { action: 'set_locked', student_id: s2.id, locked: true });
  check('teacher2 khóa student2', !!lock.data?.ok, lock.error);
  const s2Att = rows(await s2.c.from('quiz_attempts').select('id'));
  const s2Cls = rows(await s2.c.from('classes').select('id'));
  const s2Asg = rows(await s2.c.from('assignments').select('id'));
  const s2Prof = rows(await s2.c.from('profiles').select('id'));
  const s2Res = rows(await s2.c.from('learning_resources').select('id'));
  check('student2 bị khóa KHÔNG đọc được gì (dù còn phiên cũ)',
    [s2Att, s2Cls, s2Asg, s2Prof, s2Res].every((x) => x.length === 0),
    `attempts=${s2Att.length} classes=${s2Cls.length} assignments=${s2Asg.length}`);
  const s2Write = await s2.c.from('quiz_attempts').insert({ quiz_id: 'quiz_khong_khi_nuoc', score: 1, total: 4 });
  check('student2 bị khóa KHÔNG ghi được', !!s2Write.error);
  const s2Login = await loginStudent(sts[1]);
  check('student2 bị khóa KHÔNG đăng nhập lại được', !!s2Login.error, s2Login.error?.message);
  const reset = await fn(t2.c, { action: 'reset_pin', student_id: s1.id });
  check('teacher2 đặt lại PIN cho student1', /^\d{6}$/.test(reset.data?.pin || ''), reset.error);
  const oldPin = await loginStudent(sts[0]);
  const newPin = await loginStudent({ username: sts[0].username, pin: reset.data?.pin });
  check('PIN cũ hết hiệu lực, PIN mới đăng nhập được', !!oldPin.error && !newPin.error);

  // 12. Pending teacher cũng không tải tệp lên được
  const t4 = await signupTeacher('t4');
  created.teachers.push(t4);
  const t4Up = await t4.c.storage.from('tai-lieu').upload(`resources/${t4.id}/x.pdf`, pdf, { contentType: 'application/pdf' });
  check('giáo viên chờ duyệt KHÔNG tải tệp lên được', !!t4Up.error);
  const fakeC = mk();
  const fakeStudent = await fakeC.auth.signUp({ email: `hsfake${RUN}@hocsinh.khoahoc4.app`, password: PASSWORD });
  if (fakeStudent.data?.user) created.teachers.push({ id: fakeStudent.data.user.id });
  const fakeProf = fakeStudent.data?.session ? await profile(fakeC) : undefined;
  const fakeCls = fakeStudent.data?.session ? rows(await fakeC.from('classes').select('id')) : [];
  check('tự đăng ký bằng email miền học sinh → không có hồ sơ, không có quyền', !fakeProf && fakeCls.length === 0,
    fakeStudent.error?.message || 'không có hồ sơ');

  // ---- Dọn dẹp qua API ----
  await t2.c.storage.from('tai-lieu').remove(created.files);
  for (const s of created.students) await fn(t1.c, { action: 'delete_user', user_id: s.id });
  for (const t of created.teachers.slice(1)) await fn(t1.c, { action: 'delete_user', user_id: t.id });
  console.log(`\nTài khoản admin thử nghiệm cần xóa bằng SQL: ${t1.id}`);
} catch (e) {
  console.error('LỖI DỪNG KIỂM THỬ:', e.message);
  results.push({ name: 'script', ok: false });
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} kiểm tra đạt`);
process.exit(failed.length ? 1 : 0);
