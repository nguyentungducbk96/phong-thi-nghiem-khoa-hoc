import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Experiment, Quiz } from '../../types';
import { formatDateTime } from '../../utils/progress';
import {
  ClassRow,
  MemberRow,
  AssignmentRow,
  SubmissionRow,
  ClassLearningData,
  NewStudentCredential,
  listMyClasses,
  createClass,
  deleteClass,
  listMembers,
  manageStudents,
  listAssignments,
  createAssignment,
  deleteAssignment,
  listSubmissions,
  loadClassLearningData
} from '../../lib/api';
import { friendlyError } from '../../lib/supabase';
import { useToast } from '../ui/Toast';
import { Modal, inputCls, labelCls, btnPrimary, btnSecondary } from '../ui/Modal';
import { LoadingState, ErrorState, EmptyState, Spinner } from '../ui/States';
import {
  Users,
  Plus,
  Calendar,
  FileSpreadsheet,
  AlertCircle,
  Send,
  Trash2,
  Monitor,
  KeyRound,
  Lock,
  Unlock,
  Printer,
  Download,
  Eye,
  Pencil,
  RefreshCw
} from 'lucide-react';

const csvCell = (v: string | number | null | undefined) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const downloadCsv = (name: string, lines: string[]) => {
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// ===== Trình chiếu (dùng cả khi chưa đăng nhập) =====
export const PresentLauncher: React.FC<{ experiments: Experiment[]; onOpen: (e: Experiment) => void }> = ({ experiments, onOpen }) => {
  const [id, setId] = useState(experiments[0]?.id ?? '');
  return (
    <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
      <div className="min-w-0">
        <h3 className="text-base font-bold flex items-center gap-2">
          <Monitor className="w-4 h-4" /> Trình chiếu thí nghiệm lên màn hình lớp học
        </h3>
        <p className="text-xs text-slate-400 mt-1">Mở thí nghiệm rồi bấm “Trình chiếu toàn màn hình” để cả lớp cùng quan sát</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        <select
          value={id}
          onChange={(e) => setId(e.target.value)}
          aria-label="Chọn thí nghiệm để trình chiếu"
          className="bg-slate-800 border border-slate-700 text-white text-sm p-2.5 min-h-[44px] rounded-xl focus:outline-none w-full sm:w-auto min-w-0"
        >
          {experiments.map((ex) => (
            <option key={ex.id} value={ex.id}>{ex.title}</option>
          ))}
        </select>
        <button
          onClick={() => {
            const exp = experiments.find((x) => x.id === id);
            if (exp) onOpen(exp);
          }}
          className="px-4 min-h-[44px] bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm rounded-xl w-full sm:w-auto"
        >
          Mở thí nghiệm
        </button>
      </div>
    </div>
  );
};

interface Props {
  experiments: Experiment[];
  quizzes: Quiz[];
  onSelectExperimentToPresent: (exp: Experiment) => void;
}

type Tab = 'students' | 'assignments' | 'progress' | 'analytics';

const todayPlus = (days: number) => {
  const d = new Date(Date.now() + days * 864e5);
  d.setHours(17, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const TeacherDashboard: React.FC<Props> = ({ experiments, quizzes, onSelectExperimentToPresent }) => {
  const toast = useToast();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [classId, setClassId] = useState<string | null>(null);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [classesError, setClassesError] = useState<string | null>(null);

  const [members, setMembers] = useState<MemberRow[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [learning, setLearning] = useState<ClassLearningData>({ results: [], attempts: [], progress: [], notebooks: [] });
  const [loadingClass, setLoadingClass] = useState(false);
  const [classError, setClassError] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>('students');
  const [busy, setBusy] = useState<string | null>(null);

  // hộp thoại
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [showAddStudents, setShowAddStudents] = useState(false);
  const [credentials, setCredentials] = useState<{ title: string; list: NewStudentCredential[] } | null>(null);
  const [showAssign, setShowAssign] = useState(false);
  const [detailStudent, setDetailStudent] = useState<MemberRow | null>(null);
  const [openAssignmentId, setOpenAssignmentId] = useState<string | null>(null);

  const selected = classes.find((c) => c.id === classId) || null;

  const loadClasses = useCallback(async () => {
    setLoadingClasses(true);
    setClassesError(null);
    try {
      const list = await listMyClasses();
      setClasses(list);
      setClassId((cur) => (cur && list.some((c) => c.id === cur) ? cur : list[0]?.id ?? null));
    } catch (e) {
      setClassesError(friendlyError(e));
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  const loadClass = useCallback(async (id: string) => {
    setLoadingClass(true);
    setClassError(null);
    try {
      const [m, a] = await Promise.all([listMembers(id), listAssignments(id)]);
      const [subs, data] = await Promise.all([
        listSubmissions(a.map((x) => x.id)),
        loadClassLearningData(m.map((x) => x.student_id))
      ]);
      setMembers(m);
      setAssignments(a);
      setSubmissions(subs);
      setLearning(data);
    } catch (e) {
      setClassError(friendlyError(e));
    } finally {
      setLoadingClass(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);
  useEffect(() => {
    if (classId) loadClass(classId);
    else {
      setMembers([]);
      setAssignments([]);
      setSubmissions([]);
      setLearning({ results: [], attempts: [], progress: [], notebooks: [] });
    }
  }, [classId, loadClass]);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setBusy(null);
    }
  };

  // ===== Tổng hợp theo học sinh =====
  const summary = useMemo(() => {
    return members.map((m) => {
      const prog = learning.progress.filter((p) => p.student_id === m.student_id);
      const atts = learning.attempts.filter((a) => a.studentId === m.student_id);
      const ress = learning.results.filter((r) => r.studentId === m.student_id);
      const nbs = learning.notebooks.filter((n) => n.studentId === m.student_id);
      const subs = submissions.filter((s) => s.student_id === m.student_id);
      const quizPct = atts.length ? Math.round((atts.reduce((s, a) => s + a.correct / a.total, 0) / atts.length) * 100) : null;
      const times = [
        ...prog.map((p) => p.completed_at),
        ...atts.map((a) => a.date),
        ...ress.map((r) => r.date),
        ...nbs.map((n) => n.updatedAt)
      ].filter(Boolean);
      const last = times.sort().pop() || null;
      return { m, prog, atts, ress, nbs, subs, quizPct, last };
    });
  }, [members, learning, submissions]);

  // ===== Câu hay sai (dữ liệu thật của lớp) =====
  const missed = useMemo(() => {
    const out: { key: string; source: string; question: string; wrong: number; seen: number; students: number }[] = [];
    quizzes.forEach((quiz) => {
      const qa = learning.attempts.filter((a) => a.quizId === quiz.id);
      if (!qa.length) return;
      quiz.questions.forEach((q) => {
        const wrongAtt = qa.filter((a) => a.wrongQuestionIds.includes(q.id));
        out.push({
          key: `${quiz.id}:${q.id}`,
          source: quiz.title,
          question: q.question,
          wrong: wrongAtt.length,
          seen: qa.length,
          students: new Set(wrongAtt.map((a) => a.studentId)).size
        });
      });
    });
    experiments.forEach((exp) => {
      const rs = learning.results.filter((r) => r.experimentId === exp.id);
      if (!rs.length) return;
      exp.postQuestions.forEach((q) => {
        const key = `${exp.id}:${q.id}`;
        const wrongR = rs.filter((r) => r.wrongQuestionIds.includes(key));
        out.push({ key, source: exp.title, question: q.question, wrong: wrongR.length, seen: rs.length, students: new Set(wrongR.map((r) => r.studentId)).size });
      });
    });
    return out.filter((x) => x.wrong > 0).sort((a, b) => b.wrong / b.seen - a.wrong / a.seen);
  }, [learning, quizzes, experiments]);
  const answerSessions = learning.attempts.length + learning.results.length;

  const itemTitle = (a: AssignmentRow) =>
    a.experiment_id
      ? experiments.find((e) => e.id === a.experiment_id)?.title || a.experiment_id
      : quizzes.find((q) => q.id === a.quiz_id)?.title || a.quiz_id || '';

  // ===== Xuất CSV báo cáo lớp =====
  const exportReport = () => {
    if (!selected) return;
    const lines: string[] = [];
    lines.push(csvCell(`Báo cáo lớp ${selected.name} (mã ${selected.join_code}) — xuất lúc ${formatDateTime(new Date().toISOString())}`));
    lines.push(
      ['STT', 'Họ và tên', 'Tên đăng nhập', 'Trạng thái', 'Thí nghiệm hoàn thành', 'Số lần làm thử thách', 'Tỉ lệ đúng TB thử thách (%)', 'Số bài ghi sổ tay', 'Nhiệm vụ đã nộp', 'Hoạt động gần nhất']
        .map(csvCell)
        .join(',')
    );
    summary.forEach((s) =>
      lines.push(
        [s.m.number, s.m.display_name, s.m.username, s.m.status === 'locked' ? 'Đã khóa' : 'Hoạt động', `${s.prog.length}/${experiments.length}`, s.atts.length, s.quizPct ?? '', s.nbs.length, `${s.subs.length}/${assignments.length}`, s.last ? formatDateTime(s.last) : '']
          .map(csvCell)
          .join(',')
      )
    );
    assignments.forEach((a) => {
      lines.push('');
      lines.push(csvCell(`Nhiệm vụ: ${a.title} (${itemTitle(a)}) — hạn ${a.due_at ? formatDateTime(a.due_at) : 'không đặt'}`));
      lines.push(['STT', 'Họ và tên', 'Đã nộp lúc', 'Đúng', 'Tổng câu', 'Ghi chú'].map(csvCell).join(','));
      members.forEach((m) => {
        const sub = submissions.find((s) => s.assignment_id === a.id && s.student_id === m.student_id);
        const late = sub && a.due_at && new Date(sub.submitted_at) > new Date(a.due_at);
        lines.push([m.number, m.display_name, sub ? formatDateTime(sub.submitted_at) : 'Chưa nộp', sub?.score ?? '', sub?.total ?? '', late ? 'Nộp sau hạn' : ''].map(csvCell).join(','));
      });
    });
    lines.push('');
    lines.push(csvCell('Câu hỏi hay trả lời sai'));
    lines.push(['Câu hỏi', 'Trong bài', 'Số lần sai', 'Số lần làm', 'Số học sinh sai'].map(csvCell).join(','));
    missed.forEach((x) => lines.push([x.question, x.source, x.wrong, x.seen, x.students].map(csvCell).join(',')));
    downloadCsv(`Bao_cao_${selected.join_code}_${new Date().toISOString().slice(0, 10)}.csv`, lines);
  };

  // ===== In / xuất danh sách tài khoản =====
  const printCredentials = (title: string, list: NewStudentCredential[]) => {
    const w = window.open('', '_blank');
    if (!w) {
      toast.error('Trình duyệt chặn cửa sổ in. Thầy cô hãy cho phép cửa sổ bật lên hoặc dùng “Tải CSV”.');
      return;
    }
    const rows = list
      .map((s, i) => `<tr><td>${i + 1}</td><td>${escapeHtml(s.name)}</td><td class="m">${escapeHtml(s.username)}</td><td class="m">${escapeHtml(s.pin)}</td></tr>`)
      .join('');
    w.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>body{font-family:system-ui,sans-serif;padding:24px}h1{font-size:18px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:8px;text-align:left}.m{font-family:ui-monospace,monospace;font-size:16px;letter-spacing:1px}p{font-size:12px;color:#444}</style>
</head><body><h1>${escapeHtml(title)}</h1><p>Học sinh vào ứng dụng → “Đăng nhập” → “Học sinh”, nhập tên đăng nhập và mã PIN. Giữ phiếu này cẩn thận, không chia sẻ mã PIN.</p>
<table><thead><tr><th>STT</th><th>Họ và tên</th><th>Tên đăng nhập</th><th>Mã PIN</th></tr></thead><tbody>${rows}</tbody></table>
<script>window.onload=function(){window.print()}</script></body></html>`);
    w.document.close();
  };
  const csvCredentials = (title: string, list: NewStudentCredential[]) =>
    downloadCsv(`Tai_khoan_${selected?.join_code || 'lop'}.csv`, [
      csvCell(title),
      ['STT', 'Họ và tên', 'Tên đăng nhập', 'Mã PIN'].map(csvCell).join(','),
      ...list.map((s, i) => [i + 1, s.name, s.username, s.pin].map(csvCell).join(','))
    ]);

  // ===== Thao tác học sinh =====
  const resetPin = (m: MemberRow) =>
    run(m.student_id + 'pin', async () => {
      if (!window.confirm(`Đặt lại mã PIN cho ${m.display_name}? Mã cũ sẽ không dùng được nữa.`)) return;
      const r = await manageStudents<{ username: string; pin: string }>({ action: 'reset_pin', student_id: m.student_id });
      setCredentials({ title: `Mã PIN mới — lớp ${selected?.name}`, list: [{ id: m.student_id, name: m.display_name, username: r.username, pin: r.pin }] });
    });
  const toggleLock = (m: MemberRow) =>
    run(m.student_id + 'lock', async () => {
      const locking = m.status !== 'locked';
      if (locking && !window.confirm(`Khóa tài khoản ${m.display_name}? Em sẽ không đăng nhập được cho tới khi mở khóa.`)) return;
      await manageStudents({ action: 'set_locked', student_id: m.student_id, locked: locking });
      toast.success(locking ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.');
      if (classId) await loadClass(classId);
    });
  const renameStudent = (m: MemberRow) =>
    run(m.student_id + 'name', async () => {
      const name = window.prompt('Tên hiển thị mới của học sinh:', m.display_name);
      if (!name || !name.trim() || name.trim() === m.display_name) return;
      await manageStudents({ action: 'rename', student_id: m.student_id, display_name: name.trim() });
      toast.success('Đã đổi tên.');
      if (classId) await loadClass(classId);
    });
  const setGroup = (m: MemberRow) =>
    run(m.student_id + 'group', async () => {
      const g = window.prompt('Tên nhóm (để trống để bỏ nhóm):', m.group_name || '');
      if (g === null) return;
      await manageStudents({ action: 'set_group', class_id: classId, student_id: m.student_id, group_name: g.trim() });
      toast.success('Đã cập nhật nhóm.');
      if (classId) await loadClass(classId);
    });
  const removeStudent = (m: MemberRow) =>
    run(m.student_id + 'del', async () => {
      if (!window.confirm(`Xóa vĩnh viễn tài khoản ${m.display_name} và toàn bộ kết quả học tập của em? Không hoàn tác được.`)) return;
      await manageStudents({ action: 'delete_student', student_id: m.student_id });
      toast.success('Đã xóa học sinh.');
      if (classId) await loadClass(classId);
    });

  const tabBtn = (t: Tab, label: string) => (
    <button
      onClick={() => setTab(t)}
      aria-pressed={tab === t}
      className={`px-3 sm:px-4 min-h-[44px] text-xs sm:text-sm font-bold rounded-xl transition-all ${
        tab === t ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {label}
    </button>
  );
  const smallBtn = 'min-h-11 lg:min-h-10 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 disabled:opacity-50';

  if (loadingClasses) return <LoadingState text="Đang tải lớp học..." />;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Đầu trang */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Góc Giáo Viên</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Quản lí lớp, tài khoản học sinh, giao nhiệm vụ và theo dõi kết quả (dữ liệu trực tuyến).</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowAssign(true)} disabled={!selected} className={`${btnPrimary} !bg-teal-600 hover:!bg-teal-700 disabled:!bg-slate-300`}>
            <Send className="w-4 h-4" /> Giao nhiệm vụ
          </button>
          <button onClick={exportReport} disabled={!selected || members.length === 0} className={btnSecondary}>
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Xuất báo cáo CSV
          </button>
        </div>
      </div>

      {classesError && <ErrorState text={classesError} onRetry={loadClasses} />}

      {/* Chọn lớp */}
      <div className="flex flex-wrap items-center gap-2">
        {classes.length > 0 && (
          <select
            value={classId ?? ''}
            onChange={(e) => setClassId(e.target.value)}
            aria-label="Chọn lớp"
            className="min-h-[44px] px-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 max-w-full"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.join_code})
              </option>
            ))}
          </select>
        )}
        <button onClick={() => setShowCreateClass(true)} className="min-h-[44px] px-3 inline-flex items-center gap-1 text-sm text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl font-bold">
          <Plus className="w-4 h-4" /> Tạo lớp
        </button>
        {selected && (
          <button onClick={() => classId && loadClass(classId)} disabled={loadingClass} className="min-h-[44px] px-3 inline-flex items-center gap-1 text-sm text-slate-600 bg-white border border-slate-300 rounded-xl font-semibold">
            <RefreshCw className={`w-4 h-4 ${loadingClass ? 'animate-spin' : ''}`} /> Làm mới
          </button>
        )}
      </div>

      {!selected ? (
        <EmptyState title="Chưa có lớp học nào" text="Thầy cô tạo lớp đầu tiên để thêm học sinh và giao nhiệm vụ.">
          <button onClick={() => setShowCreateClass(true)} className={`${btnPrimary} !bg-teal-600 mt-2`}>Tạo lớp học</button>
        </EmptyState>
      ) : (
        <>
          {/* Thẻ tóm tắt */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Mã lớp</span>
              <span className="text-lg font-black text-teal-700 font-mono tracking-wider">{selected.join_code}</span>
              {selected.school_year && <span className="block text-[11px] text-slate-400">Năm học {selected.school_year}</span>}
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Sĩ số</span>
              <span className="text-lg font-black text-slate-900">{members.length} em</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Nhiệm vụ đã giao</span>
              <span className="text-lg font-black text-slate-900">{assignments.length}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Tỉ lệ nộp bài</span>
              <span className="text-lg font-black text-slate-900">
                {assignments.length && members.length ? `${Math.round((submissions.length / (assignments.length * members.length)) * 100)}%` : '—'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
            {tabBtn('students', 'Học sinh')}
            {tabBtn('assignments', `Nhiệm vụ (${assignments.length})`)}
            {tabBtn('progress', 'Tiến độ & câu trả lời')}
            {tabBtn('analytics', 'Câu hay sai')}
          </div>

          {classError && <ErrorState text={classError} onRetry={() => classId && loadClass(classId)} />}
          {loadingClass ? (
            <LoadingState text="Đang tải dữ liệu lớp..." />
          ) : (
            <>
              {/* ===== Học sinh ===== */}
              {tab === 'students' && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-xs">
                  <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900">Danh sách học sinh lớp {selected.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setShowAddStudents(true)} className={`${btnPrimary} !bg-teal-600 hover:!bg-teal-700 !min-h-11 lg:!min-h-10 !py-2`}>
                        <Plus className="w-4 h-4" /> Thêm học sinh
                      </button>
                      <button
                        onClick={async () => {
                          if (!window.confirm(`Xóa lớp ${selected.name}? Nhiệm vụ của lớp sẽ bị xóa. Tài khoản học sinh vẫn còn (thầy cô xóa riêng nếu cần).`)) return;
                          await run('delclass', async () => {
                            await deleteClass(selected.id);
                            toast.success('Đã xóa lớp.');
                            await loadClasses();
                          });
                        }}
                        disabled={members.length > 0 || busy === 'delclass'}
                        title={members.length > 0 ? 'Xóa hết học sinh trước khi xóa lớp' : undefined}
                        className={`${btnSecondary} !min-h-11 lg:!min-h-10 !py-2 !text-rose-700`}
                      >
                        <Trash2 className="w-4 h-4" /> Xóa lớp
                      </button>
                    </div>
                  </div>
                  {members.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-500">
                      Lớp chưa có học sinh. Bấm “Thêm học sinh”, nhập tên các em — ứng dụng sẽ tạo tên đăng nhập và mã PIN để in phát cho các em.
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {members.map((m) => (
                        <li key={m.student_id} className="p-4 flex flex-col md:flex-row md:items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs text-slate-400 w-6">{m.number}</span>
                              <span className="font-semibold text-slate-900 break-words">{m.display_name}</span>
                              {m.status === 'locked' && <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 rounded">Đã khóa</span>}
                              {m.group_name && <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 rounded">Nhóm {m.group_name}</span>}
                            </div>
                            <div className="text-xs text-slate-500 font-mono ml-8">{m.username}</div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 md:justify-end">
                            <button onClick={() => resetPin(m)} disabled={!!busy} className={`${smallBtn} bg-amber-50 text-amber-800 hover:bg-amber-100`}>
                              <KeyRound className="w-3.5 h-3.5" /> Đặt lại PIN
                            </button>
                            <button onClick={() => toggleLock(m)} disabled={!!busy} className={`${smallBtn} bg-slate-100 text-slate-700 hover:bg-slate-200`}>
                              {m.status === 'locked' ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />} {m.status === 'locked' ? 'Mở khóa' : 'Khóa'}
                            </button>
                            <button onClick={() => renameStudent(m)} disabled={!!busy} className={`${smallBtn} bg-slate-100 text-slate-700 hover:bg-slate-200`}>
                              <Pencil className="w-3.5 h-3.5" /> Sửa tên
                            </button>
                            <button onClick={() => setGroup(m)} disabled={!!busy} className={`${smallBtn} bg-slate-100 text-slate-700 hover:bg-slate-200`}>
                              <Users className="w-3.5 h-3.5" /> Nhóm
                            </button>
                            <button onClick={() => removeStudent(m)} disabled={!!busy} className={`${smallBtn} text-rose-600 hover:bg-rose-50`}>
                              <Trash2 className="w-3.5 h-3.5" /> Xóa
                            </button>
                            {busy?.startsWith(m.student_id) && <Spinner className="w-4 h-4 text-slate-400 self-center" />}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="p-4 pt-0 text-[11px] text-slate-400">
                    Mã PIN chỉ hiện một lần khi tạo hoặc đặt lại (máy chủ không lưu mã PIN dạng chữ). Quên mã thì bấm “Đặt lại PIN”.
                  </p>
                </div>
              )}

              {/* ===== Nhiệm vụ ===== */}
              {tab === 'assignments' && (
                <div className="space-y-3">
                  {assignments.length === 0 ? (
                    <EmptyState title="Chưa giao nhiệm vụ nào" text="Bấm “Giao nhiệm vụ” để giao thí nghiệm hoặc thử thách cho lớp, kèm hạn hoàn thành." />
                  ) : (
                    assignments.map((a) => {
                      const subs = submissions.filter((s) => s.assignment_id === a.id);
                      const open = openAssignmentId === a.id;
                      const overdue = a.due_at && new Date(a.due_at).getTime() < Date.now();
                      return (
                        <div key={a.id} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-slate-900 break-words">{a.title}</h3>
                              <p className="text-xs text-slate-500">
                                {a.experiment_id ? 'Thí nghiệm' : 'Thử thách'}: <strong>{itemTitle(a)}</strong>
                              </p>
                            </div>
                            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded">
                              Đã nộp {subs.length}/{members.length}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span className={`flex items-center gap-1 ${overdue ? 'text-rose-700 font-semibold' : ''}`}>
                              <Calendar className="w-3.5 h-3.5" /> {a.due_at ? `Hạn ${formatDateTime(a.due_at)}${overdue ? ' (đã qua)' : ''}` : 'Không đặt hạn'}
                            </span>
                            <span>{a.mode === 'group' ? `Nhóm${a.group_name ? `: ${a.group_name}` : ''}` : 'Cá nhân'}</span>
                            <span>Giao lúc {formatDateTime(a.created_at)}</span>
                          </div>
                          {a.instructions && <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2 break-words">{a.instructions}</p>}
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => setOpenAssignmentId(open ? null : a.id)} className={`${smallBtn} bg-slate-100 text-slate-700`}>
                              <Eye className="w-3.5 h-3.5" /> {open ? 'Ẩn bài nộp' : 'Xem bài nộp'}
                            </button>
                            <button
                              onClick={() =>
                                run('asg' + a.id, async () => {
                                  if (!window.confirm(`Xóa nhiệm vụ "${a.title}" và các bài nộp?`)) return;
                                  await deleteAssignment(a.id);
                                  toast.success('Đã xóa nhiệm vụ.');
                                  if (classId) await loadClass(classId);
                                })
                              }
                              disabled={!!busy}
                              className={`${smallBtn} text-rose-600 hover:bg-rose-50`}
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Xóa
                            </button>
                          </div>
                          {open && (
                            <div className="-mx-1">
                              <table className="w-full text-left text-xs [&_td]:align-top [&_td]:break-words">
                                <thead className="bg-slate-50 text-slate-500">
                                  <tr>
                                    <th className="py-2 px-2">STT</th>
                                    <th className="py-2 px-2">Học sinh</th>
                                    <th className="py-2 px-2">Nộp lúc</th>
                                    <th className="py-2 px-2">Kết quả</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {members.map((m) => {
                                    const sub = subs.find((s) => s.student_id === m.student_id);
                                    const late = sub && a.due_at && new Date(sub.submitted_at) > new Date(a.due_at);
                                    return (
                                      <tr key={m.student_id}>
                                        <td className="py-2 px-2 text-slate-400">{m.number}</td>
                                        <td className="py-2 px-2 font-semibold text-slate-800">{m.display_name}</td>
                                        <td className="py-2 px-2">
                                          {sub ? (
                                            <span className={late ? 'text-amber-700' : 'text-emerald-700'}>
                                              {formatDateTime(sub.submitted_at)}
                                              {late ? ' (sau hạn)' : ''}
                                            </span>
                                          ) : (
                                            <span className="text-slate-400">Chưa nộp</span>
                                          )}
                                        </td>
                                        <td className="py-2 px-2">{sub?.total ? `${sub.score}/${sub.total} câu đúng` : '—'}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ===== Tiến độ ===== */}
              {tab === 'progress' && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-xs">
                  {members.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-500">Chưa có học sinh.</div>
                  ) : (
                    <>
                    {/* Điện thoại / máy tính bảng dọc: mỗi học sinh một thẻ */}
                    <ul className="md:hidden divide-y divide-slate-100">
                      {summary.map((s) => (
                        <li key={s.m.student_id} className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <span className="text-xs text-slate-400 mr-1.5">{s.m.number}.</span>
                              <span className="font-semibold text-slate-900 break-words">{s.m.display_name}</span>
                            </div>
                            <button onClick={() => setDetailStudent(s.m)} className={`${smallBtn} shrink-0 bg-teal-50 text-teal-800 hover:bg-teal-100`}>
                              <Eye className="w-3.5 h-3.5" /> Chi tiết
                            </button>
                          </div>
                          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                            <dt className="text-slate-500">Thí nghiệm xong</dt>
                            <dd className="font-semibold text-slate-800">{s.prog.length}/{experiments.length}</dd>
                            <dt className="text-slate-500">Thử thách</dt>
                            <dd className="font-semibold text-slate-800">{s.atts.length ? `${s.atts.length} lần · ${s.quizPct}%` : 'Chưa làm'}</dd>
                            <dt className="text-slate-500">Sổ tay</dt>
                            <dd className="font-semibold text-slate-800">{s.nbs.length}</dd>
                            <dt className="text-slate-500">Nhiệm vụ nộp</dt>
                            <dd className="font-semibold text-slate-800">{s.subs.length}/{assignments.length}</dd>
                            <dt className="text-slate-500">Gần nhất</dt>
                            <dd className="text-slate-600">{s.last ? formatDateTime(s.last) : 'Chưa có'}</dd>
                          </dl>
                        </li>
                      ))}
                    </ul>
                    <div className="hidden md:block">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                          <tr>
                            <th className="py-3 px-3">STT</th>
                            <th className="py-3 px-3">Học sinh</th>
                            <th className="py-3 px-3">Thí nghiệm xong</th>
                            <th className="py-3 px-3">Thử thách (lần / đúng TB)</th>
                            <th className="py-3 px-3">Sổ tay</th>
                            <th className="py-3 px-3">Nhiệm vụ nộp</th>
                            <th className="py-3 px-3">Hoạt động gần nhất</th>
                            <th className="py-3 px-3"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {summary.map((s) => (
                            <tr key={s.m.student_id} className="hover:bg-slate-50/60">
                              <td className="py-3 px-3 text-slate-400">{s.m.number}</td>
                              <td className="py-3 px-3 font-semibold text-slate-900">{s.m.display_name}</td>
                              <td className="py-3 px-3">{s.prog.length}/{experiments.length}</td>
                              <td className="py-3 px-3">{s.atts.length ? `${s.atts.length} lần · ${s.quizPct}%` : 'Chưa làm'}</td>
                              <td className="py-3 px-3">{s.nbs.length}</td>
                              <td className="py-3 px-3">{s.subs.length}/{assignments.length}</td>
                              <td className="py-3 px-3 text-slate-500">{s.last ? formatDateTime(s.last) : 'Chưa có'}</td>
                              <td className="py-3 px-3 text-right">
                                <button onClick={() => setDetailStudent(s.m)} className={`${smallBtn} bg-teal-50 text-teal-800 hover:bg-teal-100`}>
                                  <Eye className="w-3.5 h-3.5" /> Chi tiết
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    </>
                  )}
                </div>
              )}

              {/* ===== Câu hay sai ===== */}
              {tab === 'analytics' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xs">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    <h3 className="text-base font-bold text-slate-900">Câu hỏi học sinh hay trả lời sai</h3>
                  </div>
                  <p className="text-xs text-slate-500">Tính từ {answerSessions} lần làm bài thật của học sinh lớp {selected.name} (thử thách và câu hỏi sau thí nghiệm).</p>
                  {missed.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                      {answerSessions === 0 ? 'Chưa có dữ liệu: học sinh chưa làm bài nào.' : 'Chưa có câu nào bị trả lời sai.'}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {missed.map((x, i) => (
                        <div key={x.key} className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1 text-xs">
                          <div className="flex flex-wrap justify-between gap-2 font-bold text-amber-900">
                            <span className="min-w-0 break-words">{i + 1}. {x.question}</span>
                            <span className="text-rose-700 shrink-0">Sai {x.wrong}/{x.seen} lần ({Math.round((x.wrong / x.seen) * 100)}%) · {x.students} em</span>
                          </div>
                          <p className="text-slate-500">Trong: {x.source}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      <PresentLauncher experiments={experiments} onOpen={onSelectExperimentToPresent} />

      {/* ===== Hộp thoại ===== */}
      {showCreateClass && (
        <CreateClassModal
          onClose={() => setShowCreateClass(false)}
          onCreate={async (name, year) => {
            const c = await createClass(name, year);
            toast.success(`Đã tạo lớp ${c.name} (mã ${c.join_code}).`);
            setShowCreateClass(false);
            await loadClasses();
            setClassId(c.id);
            setTab('students');
          }}
        />
      )}
      {showAddStudents && selected && (
        <AddStudentsModal
          className={selected.name}
          onClose={() => setShowAddStudents(false)}
          onSubmit={async (names) => {
            const r = await manageStudents<{ students: NewStudentCredential[]; failed: { name: string; error: string }[] }>({
              action: 'create_students',
              class_id: selected.id,
              names
            });
            setShowAddStudents(false);
            if (r.failed?.length) toast.error(`Không tạo được ${r.failed.length} tài khoản: ${r.failed.map((f) => f.name).join(', ')}`);
            if (r.students.length) {
              toast.success(`Đã tạo ${r.students.length} tài khoản học sinh.`);
              setCredentials({ title: `Tài khoản học sinh — lớp ${selected.name}`, list: r.students });
            }
            await loadClass(selected.id);
          }}
        />
      )}
      {credentials && (
        <Modal title={credentials.title} onClose={() => setCredentials(null)} size="lg">
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-3">
            Mã PIN chỉ hiện <strong>một lần</strong>. Thầy cô hãy in hoặc tải danh sách ngay trước khi đóng hộp thoại này.
          </p>
          <div>
            <table className="w-full text-left text-sm [&_td]:align-top">
              <thead className="bg-slate-50 text-slate-500 text-xs">
                <tr>
                  <th className="py-2 px-2">STT</th>
                  <th className="py-2 px-2">Họ và tên</th>
                  <th className="py-2 px-2">Tên đăng nhập</th>
                  <th className="py-2 px-2">Mã PIN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {credentials.list.map((s, i) => (
                  <tr key={s.id}>
                    <td className="py-2 px-2 text-slate-400">{i + 1}</td>
                    <td className="py-2 px-2 font-semibold">{s.name}</td>
                    <td className="py-2 px-2 font-mono break-all">{s.username}</td>
                    <td className="py-2 px-2 font-mono tracking-widest">{s.pin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-end gap-2 mt-4">
            <button className={btnSecondary} onClick={() => csvCredentials(credentials.title, credentials.list)}>
              <Download className="w-4 h-4" /> Tải CSV
            </button>
            <button className={btnPrimary} onClick={() => printCredentials(credentials.title, credentials.list)}>
              <Printer className="w-4 h-4" /> In danh sách
            </button>
          </div>
        </Modal>
      )}
      {showAssign && selected && (
        <AssignModal
          className={selected.name}
          experiments={experiments}
          quizzes={quizzes}
          onClose={() => setShowAssign(false)}
          onCreate={async (a) => {
            await createAssignment({ ...a, class_id: selected.id });
            toast.success('Đã giao nhiệm vụ cho lớp.');
            setShowAssign(false);
            setTab('assignments');
            await loadClass(selected.id);
          }}
        />
      )}
      {detailStudent && (
        <StudentDetailModal
          member={detailStudent}
          data={learning}
          experiments={experiments}
          quizzes={quizzes}
          onClose={() => setDetailStudent(null)}
        />
      )}
    </div>
  );
};

// ===================== Hộp thoại con =====================
const FormError: React.FC<{ text: string }> = ({ text }) =>
  text ? <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">{text}</p> : null;

const CreateClassModal: React.FC<{ onClose: () => void; onCreate: (name: string, year: string) => Promise<void> }> = ({ onClose, onCreate }) => {
  const y = new Date().getFullYear();
  const defYear = new Date().getMonth() >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
  const [name, setName] = useState('');
  const [year, setYear] = useState(defYear);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  return (
    <Modal title="Tạo lớp học mới" onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim() || name.trim().length > 60) return setErr('Tên lớp cần từ 1 đến 60 kí tự.');
          if (year && !/^\d{4}-\d{4}$/.test(year)) return setErr('Năm học ghi dạng 2026-2027.');
          setBusy(true);
          setErr('');
          try {
            await onCreate(name.trim(), year.trim());
          } catch (e2) {
            setErr(friendlyError(e2));
            setBusy(false);
          }
        }}
      >
        <div>
          <label htmlFor="cls-name" className={labelCls}>Tên lớp</label>
          <input id="cls-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: 4A3" className={inputCls} maxLength={60} />
        </div>
        <div>
          <label htmlFor="cls-year" className={labelCls}>Năm học</label>
          <input id="cls-year" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2026-2027" className={inputCls} />
        </div>
        <p className="text-[11px] text-slate-500">Ứng dụng tự tạo mã lớp 5 kí tự; tên đăng nhập của học sinh bắt đầu bằng “hs” + mã lớp.</p>
        <FormError text={err} />
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button type="button" className={btnSecondary} onClick={onClose}>Hủy</button>
          <button type="submit" className={btnPrimary} disabled={busy}>{busy && <Spinner />} Tạo lớp</button>
        </div>
      </form>
    </Modal>
  );
};

const AddStudentsModal: React.FC<{ className: string; onClose: () => void; onSubmit: (names: string[]) => Promise<void> }> = ({ className, onClose, onSubmit }) => {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const names = text
    .split('\n')
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  return (
    <Modal title={`Thêm học sinh vào lớp ${className}`} onClose={busy ? () => undefined : onClose}>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!names.length) return setErr('Hãy nhập ít nhất một tên.');
          if (names.length > 60) return setErr('Mỗi lần thêm tối đa 60 học sinh.');
          if (names.some((n) => n.length > 80)) return setErr('Mỗi tên tối đa 80 kí tự.');
          setBusy(true);
          setErr('');
          try {
            await onSubmit(names);
          } catch (e2) {
            setErr(friendlyError(e2));
            setBusy(false);
          }
        }}
      >
        <div>
          <label htmlFor="st-names" className={labelCls}>Mỗi dòng một tên học sinh</label>
          <textarea id="st-names" rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder={'Nguyễn Văn An\nTrần Thị Bình'} className={inputCls} />
        </div>
        <p className="text-[11px] text-slate-500">
          Chỉ cần tên hiển thị (có thể chỉ ghi tên gọi). Ứng dụng không thu thập email hay thông tin cá nhân khác của học sinh. Sẽ tạo {names.length} tài khoản.
        </p>
        <FormError text={err} />
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button type="button" className={btnSecondary} onClick={onClose} disabled={busy}>Hủy</button>
          <button type="submit" className={btnPrimary} disabled={busy || !names.length}>
            {busy && <Spinner />} {busy ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

interface AssignInput {
  experiment_id: string | null;
  quiz_id: string | null;
  title: string;
  instructions: string | null;
  due_at: string | null;
  mode: 'individual' | 'group';
  group_name: string | null;
}
const AssignModal: React.FC<{
  className: string;
  experiments: Experiment[];
  quizzes: Quiz[];
  onClose: () => void;
  onCreate: (a: AssignInput) => Promise<void>;
}> = ({ className, experiments, quizzes, onClose, onCreate }) => {
  const [kind, setKind] = useState<'experiment' | 'quiz'>('experiment');
  const [itemId, setItemId] = useState(experiments[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [due, setDue] = useState(todayPlus(7));
  const [mode, setMode] = useState<'individual' | 'group'>('individual');
  const [groupName, setGroupName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const items = kind === 'experiment' ? experiments.map((e) => ({ id: e.id, title: e.title })) : quizzes.map((q) => ({ id: q.id, title: q.title }));
  const minDue = todayPlus(0).slice(0, 10) + 'T00:00';
  const maxDue = todayPlus(365);

  return (
    <Modal title={`Giao nhiệm vụ cho lớp ${className}`} onClose={onClose}>
      <form
        className="space-y-3"
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          if (!itemId) return setErr('Hãy chọn nội dung cần giao.');
          if (!due) return setErr('Hãy chọn hạn hoàn thành.');
          const dueDate = new Date(due);
          if (Number.isNaN(dueDate.getTime())) return setErr('Hạn hoàn thành chưa hợp lệ.');
          if (dueDate.getTime() <= Date.now()) return setErr('Hạn hoàn thành phải ở sau thời điểm hiện tại.');
          if (dueDate.getTime() > Date.now() + 366 * 864e5) return setErr('Hạn hoàn thành không quá 1 năm.');
          if (title.length > 160) return setErr('Tiêu đề tối đa 160 kí tự.');
          setBusy(true);
          setErr('');
          try {
            const itemTitle = items.find((i) => i.id === itemId)?.title || '';
            await onCreate({
              experiment_id: kind === 'experiment' ? itemId : null,
              quiz_id: kind === 'quiz' ? itemId : null,
              title: title.trim() || `${kind === 'experiment' ? 'Thí nghiệm' : 'Thử thách'}: ${itemTitle}`.slice(0, 160),
              instructions: instructions.trim() || null,
              due_at: dueDate.toISOString(),
              mode,
              group_name: mode === 'group' && groupName.trim() ? groupName.trim() : null
            });
          } catch (e2) {
            setErr(friendlyError(e2));
            setBusy(false);
          }
        }}
      >
        <fieldset>
          <legend className={labelCls}>Loại nhiệm vụ</legend>
          <div className="grid grid-cols-2 gap-2">
            {(['experiment', 'quiz'] as const).map((k) => (
              <label key={k} className={`min-h-[44px] flex items-center justify-center rounded-xl border cursor-pointer text-sm font-semibold ${kind === k ? 'border-teal-500 bg-teal-50 text-teal-800' : 'border-slate-300 text-slate-600'}`}>
                <input
                  type="radio"
                  name="asg-kind"
                  className="sr-only"
                  checked={kind === k}
                  onChange={() => {
                    setKind(k);
                    setItemId(k === 'experiment' ? experiments[0]?.id ?? '' : quizzes[0]?.id ?? '');
                  }}
                />
                {k === 'experiment' ? 'Thí nghiệm' : 'Thử thách'}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="asg-item" className={labelCls}>{kind === 'experiment' ? 'Chọn thí nghiệm' : 'Chọn thử thách'}</label>
          <select id="asg-item" value={itemId} onChange={(e) => setItemId(e.target.value)} className={inputCls}>
            {items.map((i) => (
              <option key={i.id} value={i.id}>{i.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="asg-title" className={labelCls}>Tiêu đề (không bắt buộc)</label>
          <input id="asg-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Để trống sẽ dùng tên nội dung" className={inputCls} maxLength={160} />
        </div>
        <div>
          <label htmlFor="asg-ins" className={labelCls}>Hướng dẫn cho học sinh (không bắt buộc)</label>
          <textarea id="asg-ins" rows={2} value={instructions} onChange={(e) => setInstructions(e.target.value)} className={inputCls} maxLength={2000} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="asg-due" className={labelCls}>Hạn hoàn thành</label>
            <input id="asg-due" type="datetime-local" value={due} min={minDue} max={maxDue} onChange={(e) => setDue(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="asg-mode" className={labelCls}>Hình thức</label>
            <select id="asg-mode" value={mode} onChange={(e) => setMode(e.target.value as 'individual' | 'group')} className={inputCls}>
              <option value="individual">Cá nhân từng em</option>
              <option value="group">Làm theo nhóm</option>
            </select>
          </div>
        </div>
        {mode === 'group' && (
          <div>
            <label htmlFor="asg-group" className={labelCls}>Tên nhóm (không bắt buộc)</label>
            <input id="asg-group" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Ví dụ: Nhóm 1" className={inputCls} maxLength={40} />
            <p className="text-[11px] text-slate-500 mt-1">Mỗi em vẫn đăng nhập và nộp bằng tài khoản của mình; tên nhóm giúp thầy cô theo dõi.</p>
          </div>
        )}
        <FormError text={err} />
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button type="button" className={btnSecondary} onClick={onClose}>Hủy</button>
          <button type="submit" className={`${btnPrimary} !bg-teal-600 hover:!bg-teal-700`} disabled={busy}>{busy && <Spinner />} Giao bài</button>
        </div>
      </form>
    </Modal>
  );
};

const StudentDetailModal: React.FC<{
  member: MemberRow;
  data: ClassLearningData;
  experiments: Experiment[];
  quizzes: Quiz[];
  onClose: () => void;
}> = ({ member, data, experiments, quizzes, onClose }) => {
  const results = data.results.filter((r) => r.studentId === member.student_id);
  const attempts = data.attempts.filter((a) => a.studentId === member.student_id);
  const notebooks = data.notebooks.filter((n) => n.studentId === member.student_id);
  const progress = data.progress.filter((p) => p.student_id === member.student_id);
  return (
    <Modal title={`Kết quả của ${member.display_name}`} onClose={onClose} size="xl">
      <div className="space-y-5 text-sm">
        <section>
          <h4 className="font-bold text-slate-900 mb-2">Thí nghiệm đã hoàn thành ({progress.length}/{experiments.length})</h4>
          {progress.length === 0 ? (
            <p className="text-xs text-slate-400">Chưa hoàn thành thí nghiệm nào.</p>
          ) : (
            <ul className="text-xs space-y-1">
              {progress.map((p) => (
                <li key={p.experiment_id}>• {experiments.find((e) => e.id === p.experiment_id)?.title || p.experiment_id} — {formatDateTime(p.completed_at)}</li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h4 className="font-bold text-slate-900 mb-2">Câu trả lời sau thí nghiệm ({results.length} lần)</h4>
          {results.length === 0 ? (
            <p className="text-xs text-slate-400">Chưa có.</p>
          ) : (
            <div className="space-y-2">
              {results.map((r) => {
                const exp = experiments.find((e) => e.id === r.experimentId);
                const pred = exp?.predictionOptions.find((p) => p.id === r.predictionId);
                return (
                  <details key={r.id} className="border border-slate-200 rounded-xl p-3">
                    <summary className="cursor-pointer text-xs font-semibold text-slate-800">
                      {r.experimentTitle} — {formatDateTime(r.date)} — đúng {r.correct}/{r.total}
                    </summary>
                    <div className="mt-2 space-y-1 text-xs text-slate-600">
                      {pred && <p>Dự đoán: “{pred.text}” {r.predictionCorrect ? '(đúng)' : '(chưa đúng)'}</p>}
                      {exp?.postQuestions.map((q) => {
                        const chosen = r.answers?.[q.id];
                        const ok = chosen === q.correctIndex;
                        return (
                          <p key={q.id} className={ok ? 'text-emerald-700' : 'text-rose-700'}>
                            {ok ? '✓' : '✗'} {q.question} — em chọn: {chosen !== undefined ? q.options[chosen] : '(không có dữ liệu)'}
                            {!ok && ` · đáp án: ${q.options[q.correctIndex]}`}
                          </p>
                        );
                      })}
                      {r.actions && r.actions.length > 0 && <p className="text-slate-500">Thao tác: {r.actions.slice(0, 12).join('; ')}</p>}
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </section>
        <section>
          <h4 className="font-bold text-slate-900 mb-2">Thử thách ({attempts.length} lần)</h4>
          {attempts.length === 0 ? (
            <p className="text-xs text-slate-400">Chưa có.</p>
          ) : (
            <ul className="space-y-1 text-xs">
              {attempts.map((a) => {
                const quiz = quizzes.find((q) => q.id === a.quizId);
                const wrongQs = quiz?.questions.filter((q) => a.wrongQuestionIds.includes(q.id)) || [];
                return (
                  <li key={a.id} className="border border-slate-200 rounded-xl p-2.5">
                    <div className="font-semibold text-slate-800">{a.quizTitle} — {formatDateTime(a.date)} — đúng {a.correct}/{a.total}</div>
                    {wrongQs.length > 0 && <div className="text-rose-700 mt-1">Câu sai: {wrongQs.map((q) => q.question).join(' | ')}</div>}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <section>
          <h4 className="font-bold text-slate-900 mb-2">Sổ tay khoa học ({notebooks.length} bài)</h4>
          {notebooks.length === 0 ? (
            <p className="text-xs text-slate-400">Chưa có.</p>
          ) : (
            <div className="space-y-2">
              {notebooks.map((n) => (
                <details key={n.id} className="border border-slate-200 rounded-xl p-3 text-xs">
                  <summary className="cursor-pointer font-semibold text-slate-800">{n.experimentTitle} — {n.date}</summary>
                  <div className="mt-2 space-y-1 text-slate-600 break-words">
                    {n.hypothesis && <p><strong>Dự đoán:</strong> {n.hypothesis}</p>}
                    {n.observation && <p><strong>Quan sát:</strong> {n.observation}</p>}
                    {n.studentNotes && <p><strong>Ghi chú:</strong> {n.studentNotes}</p>}
                    {n.questionsExplored && <p><strong>Muốn khám phá thêm:</strong> {n.questionsExplored}</p>}
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
};
