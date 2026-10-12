import React, { useState } from 'react';
import { GraduationCap, UserRound } from 'lucide-react';
import { Modal, inputCls, labelCls, btnPrimary } from '../ui/Modal';
import { Spinner } from '../ui/States';
import { useAuth } from '../../auth/AuthContext';

interface Props {
  initialTab?: 'student' | 'teacher';
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const LoginModal: React.FC<Props> = ({ initialTab = 'student', onClose, onSuccess }) => {
  const auth = useAuth();
  const [tab, setTab] = useState<'student' | 'teacher'>(initialTab);
  const [teacherMode, setTeacherMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (fn: () => Promise<string>) => {
    setError('');
    setBusy(true);
    try {
      const msg = await fn();
      onSuccess(msg);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Có lỗi xảy ra, thử lại nhé.');
    } finally {
      setBusy(false);
    }
  };

  const submitStudent = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      await auth.signInStudent(username, pin);
      return 'Chào mừng nhà khoa học nhí! Kết quả của em sẽ được lưu trực tuyến.';
    });
  };

  const submitTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Email chưa đúng định dạng.');
      return;
    }
    if (teacherMode === 'register') {
      if (!displayName.trim()) return setError('Thầy cô hãy nhập họ tên.');
      if (password.length < 8) return setError('Mật khẩu cần ít nhất 8 kí tự.');
      if (password !== password2) return setError('Hai lần nhập mật khẩu chưa khớp.');
      run(async () => {
        await auth.signUpTeacher(email, password, displayName);
        return 'Đã tạo tài khoản. Nếu đây không phải tài khoản đầu tiên, thầy cô cần chờ quản trị viên duyệt.';
      });
    } else {
      if (!password) return setError('Thầy cô hãy nhập mật khẩu.');
      run(async () => {
        await auth.signInTeacher(email, password);
        return 'Đăng nhập thành công.';
      });
    }
  };

  const tabBtn = (t: 'student' | 'teacher', label: string, Icon: typeof UserRound) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === t}
      onClick={() => {
        setTab(t);
        setError('');
      }}
      className={`flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors ${
        tab === t ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );

  return (
    <Modal title={tab === 'student' ? 'Học sinh đăng nhập' : teacherMode === 'login' ? 'Giáo viên đăng nhập' : 'Đăng ký tài khoản giáo viên'} onClose={onClose}>
      <div role="tablist" className="flex gap-2 mb-4">
        {tabBtn('student', 'Học sinh', UserRound)}
        {tabBtn('teacher', 'Giáo viên', GraduationCap)}
      </div>

      {tab === 'student' ? (
        <form onSubmit={submitStudent} className="space-y-3" noValidate>
          <p className="text-xs text-slate-500">
            Em nhập <strong>tên đăng nhập</strong> và <strong>mã PIN 6 số</strong> thầy cô đã phát cho em.
          </p>
          <div>
            <label htmlFor="li-user" className={labelCls}>Tên đăng nhập</label>
            <input
              id="li-user"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
              placeholder="Ví dụ: hsab12c01"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="li-pin" className={labelCls}>Mã PIN (6 chữ số)</label>
            <input
              id="li-pin"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className={`${inputCls} tracking-[0.4em] font-mono`}
            />
          </div>
          {error && <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">{error}</p>}
          <button type="submit" disabled={busy || !username || pin.length !== 6} className={`${btnPrimary} w-full`}>
            {busy && <Spinner />} Vào phòng thí nghiệm
          </button>
          <p className="text-[11px] text-slate-400">Quên mã PIN? Em nhờ thầy cô đặt lại nhé.</p>
        </form>
      ) : (
        <form onSubmit={submitTeacher} className="space-y-3" noValidate>
          {teacherMode === 'register' && (
            <div>
              <label htmlFor="li-name" className={labelCls}>Họ và tên</label>
              <input id="li-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputCls} maxLength={80} />
            </div>
          )}
          <div>
            <label htmlFor="li-email" className={labelCls}>Email</label>
            <input id="li-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="li-pass" className={labelCls}>Mật khẩu{teacherMode === 'register' ? ' (ít nhất 8 kí tự)' : ''}</label>
            <input
              id="li-pass"
              type="password"
              autoComplete={teacherMode === 'register' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
          </div>
          {teacherMode === 'register' && (
            <div>
              <label htmlFor="li-pass2" className={labelCls}>Nhập lại mật khẩu</label>
              <input id="li-pass2" type="password" autoComplete="new-password" value={password2} onChange={(e) => setPassword2(e.target.value)} className={inputCls} />
            </div>
          )}
          {teacherMode === 'register' && (
            <p className="text-[11px] text-slate-500">
              Tài khoản mới cần quản trị viên của trường duyệt trước khi tạo lớp, thêm học sinh hay tải tài liệu.
            </p>
          )}
          {error && <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">{error}</p>}
          <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
            {busy && <Spinner />} {teacherMode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
          </button>
          <button
            type="button"
            onClick={() => {
              setTeacherMode(teacherMode === 'login' ? 'register' : 'login');
              setError('');
            }}
            className="w-full min-h-[44px] text-sm font-semibold text-cyan-700 hover:underline"
          >
            {teacherMode === 'login' ? 'Chưa có tài khoản? Đăng ký giáo viên' : 'Đã có tài khoản? Đăng nhập'}
          </button>
        </form>
      )}
    </Modal>
  );
};
