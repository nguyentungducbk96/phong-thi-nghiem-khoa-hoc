// Các dạng câu hỏi cần thao tác: nối, sắp xếp, phân loại.
// Tất cả dùng bấm/chạm (không cần kéo thả) nên chạy tốt trên điện thoại, máy tính bảng và bàn phím.
import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, CheckCircle, XCircle } from 'lucide-react';
import type { QuizQuestion } from '../../types';
import { seededShuffle } from '../../utils/quiz';

// Màu cho từng cặp nối (kèm số để không chỉ dựa vào màu)
const PAIR_COLORS = [
  'bg-cyan-600 text-white',
  'bg-amber-500 text-white',
  'bg-violet-600 text-white',
  'bg-emerald-600 text-white',
  'bg-rose-500 text-white',
  'bg-blue-600 text-white'
];

interface BaseProps {
  q: QuizQuestion;
  seed: string;
  value: number[];
  onChange: (v: number[]) => void;
  checked: boolean;
}

// ===================== NỐI =====================
export const MatchingQuestion: React.FC<BaseProps> = ({ q, seed, value, onChange, checked }) => {
  const pairs = q.pairs || [];
  const rightOrder = useMemo(() => seededShuffle(pairs.length, seed + ':r'), [pairs.length, seed]);
  const firstEmpty = value.findIndex((v) => v < 0);
  const [active, setActive] = useState<number>(firstEmpty >= 0 ? firstEmpty : 0);

  const pick = (rightIdx: number) => {
    if (checked) return;
    const next = value.map((v) => (v === rightIdx ? -1 : v)); // một nguyên nhân chỉ ghép với một hiện tượng
    next[active] = rightIdx;
    onChange(next);
    const nextEmpty = next.findIndex((v, i) => v < 0 && i !== active);
    if (nextEmpty >= 0) setActive(nextEmpty);
  };
  const leftOf = (rightIdx: number) => value.findIndex((v) => v === rightIdx);

  return (
    <div className="space-y-3">
      {!checked && (
        <p className="text-xs text-slate-500">
          Bấm chọn một <strong>hiện tượng</strong> (đang chọn có viền xanh), rồi bấm vào <strong>nguyên nhân</strong> phù hợp. Bấm lại để đổi.
        </p>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2" role="group" aria-label="Hiện tượng">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Hiện tượng</h3>
          {pairs.map((p, i) => {
            const paired = value[i] >= 0;
            const ok = checked && value[i] === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => !checked && setActive(i)}
                aria-pressed={!checked && active === i}
                disabled={checked}
                className={`w-full text-left p-3 rounded-xl border-2 text-sm flex items-start gap-2.5 transition-colors ${
                  checked
                    ? ok
                      ? 'border-emerald-400 bg-emerald-50'
                      : 'border-rose-300 bg-rose-50'
                    : active === i
                      ? 'border-cyan-500 bg-cyan-50/60'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <span className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${PAIR_COLORS[i % PAIR_COLORS.length]}`}>
                  {i + 1}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-slate-800 font-medium">{p.left}</span>
                  {checked ? (
                    <span className={`block mt-1 text-xs ${ok ? 'text-emerald-800' : 'text-rose-800'}`}>
                      {ok ? '✓ ' : '✗ Đúng là: '}
                      {p.right}
                    </span>
                  ) : (
                    <span className="block mt-1 text-xs text-slate-500">
                      {paired ? `→ ${pairs[value[i]].right}` : 'Chưa nối'}
                    </span>
                  )}
                </span>
                {checked && (ok ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : <XCircle className="w-5 h-5 text-rose-500 shrink-0" />)}
              </button>
            );
          })}
        </div>
        {!checked && (
          <div className="space-y-2" role="group" aria-label="Nguyên nhân">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nguyên nhân</h3>
            {rightOrder.map((r) => {
              const l = leftOf(r);
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => pick(r)}
                  aria-label={`${pairs[r].right}${l >= 0 ? ` (đã nối với hiện tượng ${l + 1})` : ''}`}
                  className={`w-full text-left p-3 rounded-xl border-2 text-sm flex items-start gap-2.5 transition-colors ${
                    l >= 0 ? 'border-slate-300 bg-slate-50' : 'border-dashed border-slate-300 bg-white hover:border-cyan-400 hover:bg-cyan-50/40'
                  }`}
                >
                  <span
                    className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                      l >= 0 ? PAIR_COLORS[l % PAIR_COLORS.length] : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                    aria-hidden="true"
                  >
                    {l >= 0 ? l + 1 : '?'}
                  </span>
                  <span className="flex-1 min-w-0 text-slate-700">{pairs[r].right}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ===================== SẮP XẾP =====================
export const OrderingQuestion: React.FC<BaseProps> = ({ q, value, onChange, checked }) => {
  const steps = q.steps || [];
  const move = (pos: number, dir: -1 | 1) => {
    const to = pos + dir;
    if (checked || to < 0 || to >= value.length) return;
    const next = [...value];
    [next[pos], next[to]] = [next[to], next[pos]];
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {!checked && <p className="text-xs text-slate-500">Dùng nút mũi tên lên / xuống để đưa các bước về đúng thứ tự.</p>}
      <ol className="space-y-2">
        {value.map((stepIdx, pos) => {
          const ok = stepIdx === pos;
          return (
            <li
              key={stepIdx}
              className={`flex items-center gap-2 p-2 sm:p-3 rounded-xl border-2 text-sm ${
                checked ? (ok ? 'border-emerald-400 bg-emerald-50' : 'border-rose-300 bg-rose-50') : 'border-slate-200 bg-white'
              }`}
            >
              <span className="w-7 h-7 shrink-0 rounded-full bg-cyan-100 text-cyan-800 flex items-center justify-center text-xs font-bold">
                {pos + 1}
              </span>
              <span className="flex-1 min-w-0 text-slate-800 font-medium">
                {steps[stepIdx]}
                {checked && !ok && <span className="block text-xs text-rose-800 mt-0.5">Đây là bước {stepIdx + 1}</span>}
              </span>
              {checked ? (
                ok ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
              ) : (
                <span className="flex flex-col sm:flex-row gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => move(pos, -1)}
                    disabled={pos === 0}
                    aria-label={`Đưa bước “${steps[stepIdx]}” lên trên`}
                    className="w-11 h-11 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(pos, 1)}
                    disabled={pos === value.length - 1}
                    aria-label={`Đưa bước “${steps[stepIdx]}” xuống dưới`}
                    className="w-11 h-11 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {checked && value.some((s, i) => s !== i) && (
        <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700">
          <strong className="block mb-1">Thứ tự đúng:</strong>
          <ol className="list-decimal list-inside space-y-0.5">
            {steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

// ===================== PHÂN LOẠI =====================
export const ClassificationQuestion: React.FC<BaseProps> = ({ q, seed, value, onChange, checked }) => {
  const items = q.items || [];
  const buckets = q.buckets || [];
  const order = useMemo(() => seededShuffle(items.length, seed + ':i'), [items.length, seed]);
  const choose = (itemIdx: number, b: number) => {
    if (checked) return;
    const next = [...value];
    next[itemIdx] = b;
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {!checked && <p className="text-xs text-slate-500">Với mỗi thẻ, bấm vào nhóm em cho là đúng.</p>}
      <ul className="space-y-2">
        {order.map((i) => {
          const it = items[i];
          const ok = checked && value[i] === it.bucket;
          return (
            <li
              key={i}
              className={`p-3 rounded-xl border-2 ${
                checked ? (ok ? 'border-emerald-400 bg-emerald-50' : 'border-rose-300 bg-rose-50') : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold text-slate-800 min-w-0">{it.text}</span>
                {checked && (ok ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : <XCircle className="w-5 h-5 text-rose-500 shrink-0" />)}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup" aria-label={`Nhóm cho: ${it.text}`}>
                {buckets.map((b, bi) => {
                  const sel = value[i] === bi;
                  return (
                    <button
                      key={bi}
                      type="button"
                      role="radio"
                      aria-checked={sel}
                      disabled={checked}
                      onClick={() => choose(i, bi)}
                      className={`min-h-11 px-2 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                        sel
                          ? checked
                            ? ok
                              ? 'bg-emerald-600 text-white border-emerald-700'
                              : 'bg-rose-500 text-white border-rose-600'
                            : 'bg-cyan-600 text-white border-cyan-700'
                          : checked && bi === it.bucket
                            ? 'bg-white text-emerald-800 border-emerald-400 border-dashed'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {b}
                      {checked && !sel && bi === it.bucket ? ' (đúng)' : ''}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
