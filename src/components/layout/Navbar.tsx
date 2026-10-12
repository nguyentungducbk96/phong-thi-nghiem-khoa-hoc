import React, { useEffect, useRef, useState } from 'react';
import { FlaskConical, Atom, Sparkles, Bot, ChevronDown, Menu, X, LogIn, LogOut, UserRound } from 'lucide-react';
import { clickable } from '../../utils/a11y';
import { useAuth, roleLabel } from '../../auth/AuthContext';

interface Props {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  studentPoints: number;
  onOpenAssistant: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
}

interface NavItem {
  id: string;
  label: string; // nhãn đầy đủ (menu điện thoại, menu "Thêm")
  short?: string; // nhãn gọn cho thanh trên máy tính
}

// Đóng khi bấm ra ngoài phần tử
const useOutsideClose = (open: boolean, refs: React.RefObject<HTMLElement | null>[], close: () => void) => {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (refs.every((r) => !r.current || !r.current.contains(t))) close();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
};

export const Navbar: React.FC<Props> = ({ currentTab, onSelectTab, studentPoints, onOpenAssistant, onOpenLogin, onLogout }) => {
  const auth = useAuth();
  const role = auth.role;
  const loggedIn = !!auth.session;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Danh sách mục theo vai trò
  const primary: NavItem[] = [
    { id: 'home', label: 'Trang chủ' },
    { id: 'experiments', label: 'Khám phá thí nghiệm', short: 'Thí nghiệm' },
    { id: 'quiz', label: 'Thử thách nhà khoa học nhí', short: 'Thử thách' },
    { id: 'notebook', label: 'Sổ tay khoa học', short: 'Sổ tay' }
  ];
  if (role === 'student') primary.push({ id: 'tasks', label: 'Nhiệm vụ của em', short: 'Nhiệm vụ' });
  if (role === 'teacher' || role === 'admin') primary.push({ id: 'teacher', label: 'Góc giáo viên' });

  const secondary: NavItem[] = [
    { id: 'topics', label: 'Chủ đề khoa học' },
    { id: 'videos', label: 'Video khoa học' },
    { id: 'documents', label: 'Tài liệu học tập' }
  ];
  if (role === 'guest' || role === 'student') secondary.push({ id: 'teacher', label: 'Góc giáo viên' });
  if (role === 'admin') secondary.push({ id: 'admin', label: 'Quản trị' });
  const all = [...primary, ...secondary];

  const go = (id: string) => {
    onSelectTab(id);
    setMobileOpen(false);
    setMoreOpen(false);
    setUserOpen(false);
  };

  useOutsideClose(mobileOpen, [panelRef, burgerRef], () => setMobileOpen(false));
  useOutsideClose(moreOpen, [moreRef], () => setMoreOpen(false));
  useOutsideClose(userOpen, [userRef], () => setUserOpen(false));

  // Esc đóng menu và trả tiêu điểm về nút mở
  useEffect(() => {
    if (!mobileOpen && !moreOpen && !userOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (mobileOpen) {
        setMobileOpen(false);
        burgerRef.current?.focus();
      }
      if (moreOpen) {
        setMoreOpen(false);
        moreRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
      }
      if (userOpen) {
        setUserOpen(false);
        userRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen, moreOpen, userOpen]);

  // Mở menu điện thoại → đưa tiêu điểm vào mục đầu tiên
  useEffect(() => {
    if (mobileOpen) panelRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }, [mobileOpen]);

  // Lên màn hình rộng thì đóng menu điện thoại
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const h = () => mq.matches && setMobileOpen(false);
    mq.addEventListener?.('change', h);
    return () => mq.removeEventListener?.('change', h);
  }, []);

  const secondaryActive = secondary.some((s) => s.id === currentTab);
  const name = auth.profile?.display_name || 'Tài khoản';
  const statusNote =
    auth.profile?.status === 'pending' ? 'Đang chờ duyệt' : auth.profile?.status === 'locked' ? 'Đã bị khóa' : roleLabel(role);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-3">
          {/* Logo */}
          <div
            {...clickable(() => go('home'), 'Về trang chủ')}
            className="flex items-center gap-2.5 cursor-pointer min-w-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          >
            <div className="relative w-10 h-10 shrink-0 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <FlaskConical className="w-5 h-5 text-white z-10" />
              <Atom className="w-8 h-8 text-cyan-200/50 absolute animate-spin" style={{ animationDuration: '16s' }} />
              <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1 -right-1" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base lg:text-[15px] xl:text-lg font-black tracking-tight text-slate-900 leading-none truncate">
                  KHOA HỌC THÔNG MINH
                </span>
                <span className="hidden sm:inline lg:hidden xl:inline text-[10px] font-black text-cyan-700 bg-cyan-100/80 px-1.5 py-0.5 rounded uppercase shrink-0">
                  LỚP 4
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium block truncate">Smart Science Lab</span>
            </div>
          </div>

          {/* Thanh điều hướng máy tính */}
          <nav aria-label="Điều hướng chính" className="hidden lg:flex items-center gap-0.5 text-[13px] font-semibold text-slate-600">
            {primary.map((item) => (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                aria-current={currentTab === item.id ? 'page' : undefined}
                className={`px-2.5 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  currentTab === item.id ? 'text-cyan-800 bg-cyan-50 font-bold' : 'hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {item.short || item.label}
              </button>
            ))}
            <div ref={moreRef} className="relative">
              <button
                onClick={() => setMoreOpen((o) => !o)}
                aria-expanded={moreOpen}
                aria-haspopup="true"
                aria-controls="nav-more"
                className={`px-2.5 py-2 rounded-lg whitespace-nowrap flex items-center gap-1 transition-colors ${
                  secondaryActive ? 'text-cyan-800 bg-cyan-50 font-bold' : 'hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Thêm <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
              </button>
              {moreOpen && (
                <div id="nav-more" className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-50">
                  {secondary.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => go(item.id)}
                      aria-current={currentTab === item.id ? 'page' : undefined}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm ${
                        currentTab === item.id ? 'bg-cyan-50 text-cyan-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Khu vực bên phải */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {role === 'student' || role === 'guest' ? (
              <div className="hidden sm:flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-bold text-amber-800">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{studentPoints} XP</span>
              </div>
            ) : null}

            <button
              onClick={onOpenAssistant}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 min-h-[40px] rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs hover:from-cyan-700 hover:to-blue-700 transition-all"
              title="Mở Bạn Khoa Học"
              aria-label="Mở Bạn Khoa Học"
            >
              <Bot className="w-4 h-4" />
              <span className="hidden xl:inline">Bạn Khoa Học</span>
            </button>

            {/* Tài khoản (máy tính) */}
            {auth.configured && (
              <div ref={userRef} className="relative hidden lg:block">
                {loggedIn ? (
                  <>
                    <button
                      onClick={() => setUserOpen((o) => !o)}
                      aria-expanded={userOpen}
                      aria-haspopup="true"
                      className="flex items-center gap-1.5 max-w-[180px] px-2.5 min-h-[40px] rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                    >
                      <UserRound className="w-4 h-4 shrink-0" />
                      <span className="truncate">{name}</span>
                      <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                    </button>
                    {userOpen && (
                      <div className="absolute right-0 mt-1 w-60 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-50 space-y-2">
                        <div className="text-sm">
                          <div className="font-bold text-slate-900 break-words">{name}</div>
                          <div className="text-xs text-slate-500">
                            {statusNote}
                            {auth.profile?.username ? ` · ${auth.profile.username}` : ''}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setUserOpen(false);
                            onLogout();
                          }}
                          className="w-full min-h-[40px] flex items-center justify-center gap-1.5 rounded-lg bg-rose-50 text-rose-700 font-semibold text-sm hover:bg-rose-100"
                        >
                          <LogOut className="w-4 h-4" /> Đăng xuất
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <button
                    onClick={onOpenLogin}
                    className="flex items-center gap-1.5 px-3 min-h-[40px] rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-700"
                  >
                    <LogIn className="w-4 h-4" /> Đăng nhập
                  </button>
                )}
              </div>
            )}

            {/* Nút mở menu điện thoại/máy tính bảng */}
            <button
              ref={burgerRef}
              onClick={() => setMobileOpen((o) => !o)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
              className="lg:hidden w-11 h-11 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu điện thoại: thả xuống dưới thanh trên */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          ref={panelRef}
          className="lg:hidden absolute left-0 right-0 top-full bg-white border-b border-slate-200 shadow-xl max-h-[calc(100vh-4rem)] overflow-y-auto"
        >
          <nav aria-label="Menu" className="max-w-7xl mx-auto px-4 sm:px-6 py-3 grid grid-cols-1 sm:grid-cols-2 gap-1">
            {all.map((item) => (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                aria-current={currentTab === item.id ? 'page' : undefined}
                className={`w-full text-left px-4 min-h-[48px] rounded-xl text-[15px] font-semibold ${
                  currentTab === item.id ? 'bg-cyan-50 text-cyan-800' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          {auth.configured && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-4 pt-2 border-t border-slate-100">
              {loggedIn ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 break-words">{name}</div>
                    <div className="text-xs text-slate-500">
                      {statusNote}
                      {auth.profile?.username ? ` · ${auth.profile.username}` : ''}
                      {role === 'student' ? ` · ${studentPoints} XP` : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      onLogout();
                    }}
                    className="min-h-[44px] px-4 flex items-center gap-1.5 rounded-xl bg-rose-50 text-rose-700 font-semibold text-sm hover:bg-rose-100"
                  >
                    <LogOut className="w-4 h-4" /> Đăng xuất
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    onOpenLogin();
                  }}
                  className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white font-bold text-[15px]"
                >
                  <LogIn className="w-5 h-5" /> Đăng nhập (học sinh / giáo viên)
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
};
