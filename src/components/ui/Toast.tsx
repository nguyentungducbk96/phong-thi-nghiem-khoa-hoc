// Thông báo nổi ngắn (thành công / lỗi / thông tin), đọc được bằng trình đọc màn hình.
import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

type Kind = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  kind: Kind;
  text: string;
}
interface ToastApi {
  success(text: string): void;
  error(text: string): void;
  info(text: string): void;
}

const ToastContext = createContext<ToastApi | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ToastItem[]>([]);
  const remove = useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const push = useCallback(
    (kind: Kind, text: string) => {
      const id = Date.now() + Math.random();
      setItems((l) => [...l.slice(-3), { id, kind, text }]);
      setTimeout(() => remove(id), kind === 'error' ? 7000 : 4000);
    },
    [remove]
  );
  const api = React.useMemo<ToastApi>(
    () => ({
      success: (t) => push('success', t),
      error: (t) => push('error', t),
      info: (t) => push('info', t)
    }),
    [push]
  );
  const style: Record<Kind, string> = {
    success: 'bg-emerald-50 border-emerald-300 text-emerald-900',
    error: 'bg-rose-50 border-rose-300 text-rose-900',
    info: 'bg-sky-50 border-sky-300 text-sky-900'
  };
  const Icon = { success: CheckCircle2, error: AlertTriangle, info: Info };
  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-[60] flex flex-col gap-2 pointer-events-none"
      >
        {items.map((t) => {
          const I = Icon[t.kind];
          return (
            <div
              key={t.id}
              role={t.kind === 'error' ? 'alert' : 'status'}
              className={`pointer-events-auto border rounded-xl px-3 py-2.5 text-sm shadow-lg flex items-start gap-2 ${style[t.kind]}`}
            >
              <I className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="flex-1 break-words">{t.text}</span>
              <button onClick={() => remove(t.id)} aria-label="Đóng thông báo" className="p-1 -m-1 rounded hover:bg-black/5">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastApi => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast phải nằm trong ToastProvider');
  return ctx;
};
