import React, { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, Search, Eye, EyeOff, Trash2, Check, X, Lock, Unlock, RefreshCw } from 'lucide-react';
import type { AuthProfile, LearningResource, ScienceVideo } from '../../types';
import {
  listAllProfiles,
  adminSetUser,
  manageStudents,
  listVideos,
  listResources,
  setContentHidden,
  deleteVideo,
  deleteResource
} from '../../lib/api';
import { friendlyError } from '../../lib/supabase';
import { formatDateTime } from '../../utils/progress';
import { useAuth, roleLabel } from '../../auth/AuthContext';
import { useToast } from '../ui/Toast';
import { LoadingState, ErrorState, EmptyState, Spinner } from '../ui/States';

type Filter = 'pending' | 'teachers' | 'students' | 'all';

const statusLabel: Record<AuthProfile['status'], string> = {
  pending: 'Chờ duyệt',
  active: 'Đang hoạt động',
  locked: 'Đã khóa'
};
const statusCls: Record<AuthProfile['status'], string> = {
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  active: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  locked: 'bg-rose-50 text-rose-800 border-rose-200'
};

export const AdminPanel: React.FC = () => {
  const auth = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState<'users' | 'content'>('users');
  const [users, setUsers] = useState<AuthProfile[]>([]);
  const [videos, setVideos] = useState<ScienceVideo[]>([]);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('pending');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [u, v, r] = await Promise.all([listAllProfiles(), listVideos(), listResources()]);
      setUsers(u);
      setVideos(v);
      setResources(r);
      if (!u.some((x) => x.status === 'pending')) setFilter((f) => (f === 'pending' ? 'teachers' : f));
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (key: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(key);
    try {
      await fn();
      toast.success(ok);
      await load();
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setBusy(null);
    }
  };

  const setStatus = (u: AuthProfile, status: AuthProfile['status'], ok: string) =>
    act(
      u.id + status,
      () =>
        u.role === 'student' && status !== 'pending'
          ? manageStudents({ action: 'set_locked', student_id: u.id, locked: status === 'locked' })
          : adminSetUser(u.id, { status }),
      ok
    );

  const pendingCount = users.filter((u) => u.status === 'pending').length;
  const shown = users.filter((u) => {
    if (filter === 'pending' && u.status !== 'pending') return false;
    if (filter === 'teachers' && u.role === 'student') return false;
    if (filter === 'students' && u.role !== 'student') return false;
    const t = q.trim().toLowerCase();
    return !t || [u.display_name, u.email, u.username].some((x) => x?.toLowerCase().includes(t));
  });

  const UserActions: React.FC<{ u: AuthProfile }> = ({ u }) => {
    if (u.id === auth.profile?.id) return <span className="text-xs text-slate-400">(tài khoản của thầy cô)</span>;
    const b = 'min-h-[40px] px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1 disabled:opacity-50';
    return (
      <div className="flex flex-wrap gap-1.5">
        {u.status === 'pending' && (
          <>
            <button className={`${b} bg-emerald-600 text-white hover:bg-emerald-700`} disabled={!!busy} onClick={() => setStatus(u, 'active', `Đã duyệt ${u.display_name}.`)}>
              <Check className="w-3.5 h-3.5" /> Duyệt
            </button>
            <button className={`${b} bg-white border border-rose-300 text-rose-700 hover:bg-rose-50`} disabled={!!busy} onClick={() => setStatus(u, 'locked', `Đã từ chối ${u.display_name}.`)}>
              <X className="w-3.5 h-3.5" /> Từ chối
            </button>
          </>
        )}
        {u.status === 'active' && (
          <button className={`${b} bg-white border border-slate-300 text-slate-700 hover:bg-slate-50`} disabled={!!busy} onClick={() => setStatus(u, 'locked', `Đã khóa ${u.display_name}.`)}>
            <Lock className="w-3.5 h-3.5" /> Khóa
          </button>
        )}
        {u.status === 'locked' && (
          <button className={`${b} bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50`} disabled={!!busy} onClick={() => setStatus(u, 'active', `Đã mở khóa ${u.display_name}.`)}>
            <Unlock className="w-3.5 h-3.5" /> Mở khóa
          </button>
        )}
        {u.role !== 'student' && (
          <label className="inline-flex items-center gap-1 text-xs">
            <span className="sr-only">Vai trò của {u.display_name}</span>
            <select
              value={u.role}
              disabled={!!busy}
              onChange={(e) => {
                const role = e.target.value as 'teacher' | 'admin';
                if (window.confirm(`Đổi vai trò của ${u.display_name} thành ${roleLabel(role)}?`)) {
                  act(u.id + 'role', () => adminSetUser(u.id, { role }), 'Đã đổi vai trò.');
                }
              }}
              className="min-h-[40px] px-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="teacher">Giáo viên</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </label>
        )}
        <button
          className={`${b} text-rose-600 hover:bg-rose-50`}
          disabled={!!busy}
          onClick={() => {
            if (window.confirm(`Xóa vĩnh viễn tài khoản ${u.display_name}? Mọi dữ liệu của tài khoản này sẽ bị xóa.`)) {
              act(u.id + 'del', () => manageStudents({ action: 'delete_user', user_id: u.id }), 'Đã xóa tài khoản.');
            }
          }}
        >
          <Trash2 className="w-3.5 h-3.5" /> Xóa
        </button>
        {busy?.startsWith(u.id) && <Spinner className="w-4 h-4 text-slate-400 self-center" />}
      </div>
    );
  };

  const tabBtn = (t: typeof tab, label: string) => (
    <button
      onClick={() => setTab(t)}
      aria-pressed={tab === t}
      className={`min-h-[44px] px-4 rounded-xl text-sm font-bold ${tab === t ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'text-slate-600 hover:bg-slate-100'}`}
    >
      {label}
    </button>
  );

  const contentRow = (kind: 'videos' | 'learning_resources', item: ScienceVideo | LearningResource) => (
    <div key={item.id} className="p-3 rounded-xl border border-slate-200 bg-white flex flex-wrap items-center gap-3">
      <div className="flex-1 min-w-[180px]">
        <div className="text-sm font-semibold text-slate-900 break-words">{item.title}</div>
        <div className="text-[11px] text-slate-500">
          {kind === 'videos' ? 'Video' : 'Tài liệu'}
          {'audience' in item && item.audience === 'teacher_only' ? ' · Chỉ giáo viên' : ''}
          {item.hidden ? ' · ĐANG ẨN' : ''}
        </div>
      </div>
      <div className="flex gap-1.5">
        <button
          disabled={!!busy}
          onClick={() => act(item.id, () => setContentHidden(kind, item.id, !item.hidden), item.hidden ? 'Đã hiện lại.' : 'Đã ẩn nội dung.')}
          className="min-h-[40px] px-3 rounded-lg text-xs font-semibold border border-slate-300 bg-white hover:bg-slate-50 inline-flex items-center gap-1"
        >
          {item.hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />} {item.hidden ? 'Hiện' : 'Ẩn'}
        </button>
        <button
          disabled={!!busy}
          onClick={() => {
            if (!window.confirm(`Xóa "${item.title}"?`)) return;
            act(item.id, () => (kind === 'videos' ? deleteVideo(item as ScienceVideo) : deleteResource(item as LearningResource)), 'Đã xóa.');
          }}
          className="min-h-[40px] px-3 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 inline-flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" /> Xóa
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Quản trị</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Duyệt giáo viên, phân quyền, khóa tài khoản và kiểm duyệt nội dung.</p>
        </div>
        <button onClick={load} disabled={loading} className="min-h-[44px] px-3 rounded-xl border border-slate-300 bg-white text-sm font-semibold inline-flex items-center gap-1.5">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Tải lại
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabBtn('users', `Tài khoản${pendingCount ? ` (${pendingCount} chờ duyệt)` : ''}`)}
        {tabBtn('content', 'Nội dung')}
      </div>

      {error && <ErrorState text={error} onRetry={load} />}
      {loading ? (
        <LoadingState />
      ) : tab === 'users' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo tên, email, tên đăng nhập"
                aria-label="Tìm tài khoản"
                className="w-full pl-9 pr-3 min-h-[44px] rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as Filter)}
              aria-label="Lọc tài khoản"
              className="min-h-[44px] px-3 rounded-xl border border-slate-300 bg-white text-sm font-semibold"
            >
              <option value="pending">Chờ duyệt ({pendingCount})</option>
              <option value="teachers">Giáo viên & quản trị</option>
              <option value="students">Học sinh</option>
              <option value="all">Tất cả</option>
            </select>
          </div>
          {shown.length === 0 ? (
            <EmptyState title={filter === 'pending' ? 'Không có tài khoản nào đang chờ duyệt' : 'Không có tài khoản phù hợp'} />
          ) : (
            <div className="space-y-2">
              {shown.map((u) => (
                <div key={u.id} className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 break-words">{u.display_name}</span>
                      <span className={`text-[11px] font-bold border px-2 py-0.5 rounded ${statusCls[u.status]}`}>{statusLabel[u.status]}</span>
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{roleLabel(u.role)}</span>
                    </div>
                    <div className="text-xs text-slate-500 break-all">
                      {u.email || (u.username ? `Tên đăng nhập: ${u.username}` : '')}
                      {u.created_at ? ` · tạo lúc ${formatDateTime(u.created_at)}` : ''}
                    </div>
                  </div>
                  <UserActions u={u} />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900">Video ({videos.length})</h2>
            {videos.length === 0 ? <EmptyState title="Chưa có video nào do giáo viên thêm" /> : videos.map((v) => contentRow('videos', v))}
          </section>
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900">Tài liệu ({resources.length})</h2>
            {resources.length === 0 ? <EmptyState title="Chưa có tài liệu nào" /> : resources.map((r) => contentRow('learning_resources', r))}
          </section>
        </div>
      )}
    </div>
  );
};
