import React from 'react';
import { UserRole } from '../../types';
import {
  FlaskConical,
  Atom,
  Sparkles,
  Bot,
  UserCheck,
  ChevronDown,
  BookOpen,
  Play,
  FileText,
  Award,
  Users,
  Compass
} from 'lucide-react';

interface Props {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  studentPoints: number;
  onOpenAssistant: () => void;
}

export const Navbar: React.FC<Props> = ({
  currentTab,
  onSelectTab,
  currentRole,
  onSelectRole,
  studentPoints,
  onOpenAssistant
}) => {
  const navItems = [
    { id: 'home', label: 'Trang chủ' },
    { id: 'experiments', label: 'Khám phá thí nghiệm' },
    { id: 'topics', label: 'Chủ đề khoa học' },
    { id: 'videos', label: 'Video khoa học' },
    { id: 'documents', label: 'Tài liệu học tập' },
    { id: 'quiz', label: 'Thử thách nhí' },
    { id: 'notebook', label: 'Sổ tay khoa học' },
    { id: 'teacher', label: 'Góc giáo viên' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Zone 1: Logo & Brand Lockup */}
          <div
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-3 cursor-pointer shrink-0"
          >
            {/* Logo combining Flask, Atom Ring, and Star */}
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <FlaskConical className="w-5 h-5 text-white z-10" />
              <Atom className="w-8 h-8 text-cyan-200/50 absolute animate-spin" style={{ animationDuration: '16s' }} />
              <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1 -right-1" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-none">
                  KHOA HỌC THÔNG MINH
                </span>
                <span className="text-[10px] font-black text-cyan-700 bg-cyan-100/80 px-1.5 py-0.5 rounded uppercase">
                  LỚP 4
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium block truncate">
                Smart Science Lab
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-600">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`transition-colors whitespace-nowrap py-1 relative ${
                  currentTab === item.id
                    ? 'text-cyan-700 font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                {item.label}
                {currentTab === item.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-600 rounded-full" />
                )}
              </button>
            ))}
          </nav>

          {/* Zone 3: Role Switcher & Assistant Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Student Points Pill */}
            {currentRole === 'student' && (
              <div className="hidden sm:flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-bold text-amber-800">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{studentPoints} XP</span>
              </div>
            )}

            {/* AI Assistant Button */}
            <button
              onClick={onOpenAssistant}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs shadow-xs hover:from-cyan-700 hover:to-blue-700 transition-all"
              title="Mở Bạn Khoa Học"
            >
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">Bạn Khoa Học</span>
            </button>

            {/* Role Switcher Menu */}
            <div className="relative group">
              <select
                value={currentRole}
                onChange={(e) => onSelectRole(e.target.value as UserRole)}
                className="appearance-none bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 font-bold text-xs py-1.5 pl-3 pr-7 rounded-xl focus:outline-none cursor-pointer transition-colors"
              >
                <option value="student">👨‍🎓 Học sinh</option>
                <option value="teacher">👩‍🏫 Giáo viên</option>
                <option value="admin">⚙️ Quản trị viên</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Mobile Navigation Scrollbar */}
        <div className="flex lg:hidden items-center gap-3 overflow-x-auto py-2.5 border-t border-slate-100 text-xs font-semibold text-slate-600">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`whitespace-nowrap px-2.5 py-1 rounded-lg transition-colors ${
                currentTab === item.id
                  ? 'bg-cyan-50 text-cyan-800 font-bold'
                  : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
