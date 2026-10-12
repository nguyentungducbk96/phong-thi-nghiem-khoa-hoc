// Trạng thái dùng chung: đang tải, lỗi, chưa có dữ liệu.
import React from 'react';
import { Loader2, AlertTriangle, Inbox } from 'lucide-react';

export const LoadingState: React.FC<{ text?: string }> = ({ text = 'Đang tải dữ liệu...' }) => (
  <div role="status" className="p-8 flex flex-col items-center justify-center gap-2 text-slate-500 text-sm">
    <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
    <span>{text}</span>
  </div>
);

export const ErrorState: React.FC<{ text: string; onRetry?: () => void }> = ({ text, onRetry }) => (
  <div role="alert" className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-sm flex flex-wrap items-center gap-3">
    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
    <span className="flex-1 min-w-0 break-words">{text}</span>
    {onRetry && (
      <button onClick={onRetry} className="px-3 py-2 min-h-11 lg:min-h-10 rounded-xl bg-white border border-rose-300 font-semibold hover:bg-rose-100">
        Thử lại
      </button>
    )}
  </div>
);

export const EmptyState: React.FC<{ title: string; text?: string; children?: React.ReactNode }> = ({ title, text, children }) => (
  <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
    <Inbox className="w-9 h-9 text-slate-300 mx-auto" />
    <h3 className="text-sm font-bold text-slate-800">{title}</h3>
    {text && <p className="text-xs text-slate-500">{text}</p>}
    {children}
  </div>
);

export const Spinner: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <Loader2 className={`${className} animate-spin`} aria-hidden="true" />
);
