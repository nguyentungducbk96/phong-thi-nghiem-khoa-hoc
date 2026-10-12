// Thành phần dùng chung cho các thư viện (thí nghiệm, video, tài liệu):
// ô chọn có nhãn, nút "Xem thêm" và hook phân trang theo kiểu tải thêm.
import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const fieldCls =
  'w-full min-w-0 min-h-11 px-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-200';

interface SelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}

export const FilterSelect: React.FC<SelectProps> = ({ id, label, value, onChange, options }) => (
  <div className="min-w-0">
    <label htmlFor={id} className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
      {label}
    </label>
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={fieldCls}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
);

// Hiện dần từng trang; về trang đầu khi bộ lọc đổi (resetKey)
export const usePaged = <T,>(items: T[], pageSize: number, resetKey: string) => {
  const [count, setCount] = useState(pageSize);
  useEffect(() => setCount(pageSize), [resetKey, pageSize]);
  return {
    visible: items.slice(0, count),
    remaining: Math.max(0, items.length - count),
    more: () => setCount((c) => c + pageSize)
  };
};

export const LoadMore: React.FC<{ remaining: number; shown: number; total: number; onMore: () => void; noun: string }> = ({
  remaining,
  shown,
  total,
  onMore,
  noun
}) =>
  total === 0 ? null : (
    <div className="flex flex-col items-center gap-2 pt-2">
      <p className="text-xs text-slate-500" aria-live="polite">
        Đang hiện {shown}/{total} {noun}
      </p>
      {remaining > 0 && (
        <button
          onClick={onMore}
          className="inline-flex items-center gap-1.5 px-5 min-h-11 rounded-xl bg-white border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          <ChevronDown className="w-4 h-4" /> Xem thêm ({remaining})
        </button>
      )}
    </div>
  );
