// Hộp thoại dùng chung: đóng bằng Esc / bấm nền, giữ tiêu điểm bên trong, trả tiêu điểm khi đóng.
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface Props {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<Props> = ({ title, onClose, children, size = 'md' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useRef(`modal-${Math.random().toString(36).slice(2, 8)}`).current;

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const first = el?.querySelector<HTMLElement>('input, select, textarea, button:not([data-close])');
    (first || el)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
      if (e.key === 'Tab' && el) {
        const f = Array.from(
          el.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])')
        );
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) {
          e.preventDefault();
          f[f.length - 1].focus();
        } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
          e.preventDefault();
          f[0].focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const width = size === 'xl' ? 'max-w-4xl' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg';
  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`bg-white rounded-2xl ${width} w-full max-h-[92vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6 shadow-xl border border-slate-200 focus:outline-none`}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <h3 id={titleId} className="text-base font-bold text-slate-900 min-w-0 break-words">
            {title}
          </h3>
          <button
            data-close
            onClick={onClose}
            aria-label="Đóng"
            className="p-2 -m-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export const inputCls =
  'w-full min-w-0 p-2.5 text-sm border border-slate-300 rounded-xl bg-white focus:border-cyan-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200';
export const labelCls = 'font-semibold text-slate-700 block mb-1 text-xs';
export const btnPrimary =
  'inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl transition-colors';
export const btnSecondary =
  'inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors';
