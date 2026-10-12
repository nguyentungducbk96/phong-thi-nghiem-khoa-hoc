import React, { useState, useEffect } from 'react';
import { RotateCcw, Play, Pause, Sun, Droplets, Wind, ShieldAlert, PencilLine } from 'lucide-react';

interface Props {
  onExperimentAction?: (actionName: string, detail: string) => void;
}

type PotId = 'A' | 'B' | 'C' | 'D';

interface PotConfig {
  id: PotId;
  title: string;
  tag: string;
  water: boolean;
  light: boolean;
  air: boolean;
  boxClass: string;
  textClass: string;
}

const POTS: PotConfig[] = [
  { id: 'A', title: 'Chậu A (đối chứng)', tag: 'Đủ điều kiện', water: true, light: true, air: true, boxClass: 'bg-emerald-50/40 border-emerald-200', textClass: 'text-emerald-900' },
  { id: 'B', title: 'Chậu B', tag: 'Thiếu nước', water: false, light: true, air: true, boxClass: 'bg-amber-50/40 border-amber-200', textClass: 'text-amber-900' },
  { id: 'C', title: 'Chậu C', tag: 'Thiếu ánh sáng', water: true, light: false, air: true, boxClass: 'bg-slate-100/60 border-slate-200', textClass: 'text-slate-800' },
  { id: 'D', title: 'Chậu D', tag: 'Thiếu không khí', water: true, light: true, air: false, boxClass: 'bg-sky-50/40 border-sky-200', textClass: 'text-sky-900' }
];

// Mô tả theo ngày và điều kiện của từng chậu (mô hình đơn giản)
const describePot = (pot: PotId, day: number): string => {
  switch (pot) {
    case 'A':
      if (day <= 2) return 'Cây mầm nhỏ, có hai lá xanh.';
      if (day <= 5) return 'Cây cao dần, lá xanh tươi.';
      if (day <= 7) return 'Cây cao rõ rệt, mọc thêm lá mới.';
      return 'Cây cao khỏe, lá xanh đậm, bắt đầu có nụ.';
    case 'B':
      if (day <= 2) return 'Cây còn xanh giống chậu A. Đất bắt đầu khô.';
      if (day <= 4) return 'Đất khô. Lá bắt đầu rũ xuống, cây chậm lớn.';
      if (day <= 7) return 'Lá héo, ngả màu vàng nâu.';
      return 'Cây héo rũ, khô. Cây có thể chết nếu không được tưới.';
    case 'C':
      if (day <= 2) return 'Cây còn giống chậu A.';
      if (day <= 5) return 'Thân vươn dài hơn, lá nhạt màu dần.';
      return 'Thân cao gầy, yếu; lá vàng nhạt.';
    case 'D':
      if (day <= 3) return 'Cây còn xanh. Thành túi có hơi nước đọng.';
      if (day <= 6) return 'Cây lớn chậm hơn chậu A.';
      return 'Cây còi, lá kém tươi hơn hẳn chậu A.';
  }
};

const PlantVisual: React.FC<{ pot: PotId; day: number }> = ({ pot, day }) => {
  if (pot === 'A') {
    const top = 95 - Math.min(65, 20 + day * 5);
    return (
      <svg viewBox="0 0 100 120" className="w-28 h-36" aria-hidden="true">
        <polygon points="25,95 75,95 70,120 30,120" fill="#92400e" />
        <ellipse cx="50" cy="95" rx="26" ry="5" fill="#78350f" />
        <path d={`M 50 95 Q ${48 + day * 0.5} ${(95 + top) / 2}, 50 ${top}`} fill="none" stroke="#16a34a" strokeWidth="3.5" strokeLinecap="round" />
        <ellipse cx={42} cy={top + 6} rx={6 + day * 0.7} ry={3.5 + day * 0.3} fill="#22c55e" />
        <ellipse cx={58} cy={top + 10} rx={6 + day * 0.7} ry={3.5 + day * 0.3} fill="#22c55e" />
        {day >= 5 && <ellipse cx={44} cy={top + 22} rx={9} ry={5} fill="#15803d" />}
        {day >= 7 && <ellipse cx={57} cy={top + 30} rx={9} ry={5} fill="#15803d" />}
        {day >= 8 && <circle cx={50} cy={top - 3} r={3.5} fill="#86efac" stroke="#16a34a" />}
      </svg>
    );
  }
  if (pot === 'B') {
    const droop = day <= 2 ? 0 : Math.min(30, (day - 2) * 4);
    const green = day <= 2;
    return (
      <svg viewBox="0 0 100 120" className="w-28 h-36" aria-hidden="true">
        <polygon points="25,95 75,95 70,120 30,120" fill="#a16207" />
        <ellipse cx="50" cy="95" rx="26" ry="5" fill={day <= 1 ? '#78350f' : '#ca8a04'} />
        <path
          d={`M 50 95 Q ${50 + droop * 0.3} 70, ${50 + droop} ${55 + droop}`}
          fill="none"
          stroke={green ? '#16a34a' : day <= 5 ? '#65a30d' : '#854d0e'}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <ellipse cx={44 + droop} cy={60 + droop} rx={day > 6 ? 5 : 8} ry={day > 6 ? 2.5 : 4} fill={green ? '#22c55e' : day <= 5 ? '#84cc16' : '#a16207'} />
      </svg>
    );
  }
  if (pot === 'C') {
    const top = 95 - Math.min(75, 20 + day * 6);
    const pale = day > 2;
    return (
      <svg viewBox="0 0 100 120" className="w-28 h-36" aria-hidden="true">
        <polygon points="25,95 75,95 70,120 30,120" fill="#92400e" />
        <ellipse cx="50" cy="95" rx="26" ry="5" fill="#78350f" />
        <path d={`M 50 95 Q 46 ${(95 + top) / 2}, 48 ${top}`} fill="none" stroke={pale ? '#fde68a' : '#16a34a'} strokeWidth={pale ? 2 : 3} strokeLinecap="round" />
        <ellipse cx={42} cy={top + 5} rx={6} ry={3} fill={pale ? '#fef08a' : '#22c55e'} />
        <ellipse cx={55} cy={top + 9} rx={6} ry={3} fill={pale ? '#fef08a' : '#22c55e'} />
      </svg>
    );
  }
  const top = 95 - Math.min(35, 20 + day * 1.5);
  const dull = day > 6;
  return (
    <svg viewBox="0 0 100 120" className="w-28 h-36" aria-hidden="true">
      <polygon points="25,95 75,95 70,120 30,120" fill="#92400e" />
      <ellipse cx="50" cy="95" rx="26" ry="5" fill="#78350f" />
      <path d={`M 50 95 Q 52 ${(95 + top) / 2}, 50 ${top}`} fill="none" stroke={dull ? '#71717a' : '#16a34a'} strokeWidth="3" />
      <ellipse cx={43} cy={top + 6} rx={6} ry={3.5} fill={dull ? '#a1a1aa' : '#22c55e'} />
      <ellipse cx={57} cy={top + 9} rx={6} ry={3.5} fill={dull ? '#a1a1aa' : '#22c55e'} />
      <path d="M 20 95 C 10 30, 90 30, 80 95 Z" fill="rgba(224, 242, 254, 0.45)" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3,3" />
      {day >= 2 && (
        <g fill="#7dd3fc">
          <circle cx="30" cy="60" r="1.5" />
          <circle cx="70" cy="58" r="1.5" />
          <circle cx="66" cy="70" r="1.2" />
        </g>
      )}
      <text x="50" y="42" fontSize="7" fill="#0284c7" fontWeight="bold" textAnchor="middle">TÚI NI LÔNG KÍN</text>
    </svg>
  );
};

export const PlantGrowthSimulation: React.FC<Props> = ({ onExperimentAction }) => {
  const [day, setDay] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  // Ghi chép của học sinh cho từng chậu, theo từng ngày đã xem
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [savedKey, setSavedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setDay((prev) => {
        if (prev >= 10) {
          setIsPlaying(false);
          return 10;
        }
        return prev + 1;
      });
    }, 900);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const handleReset = () => {
    setDay(1);
    setIsPlaying(false);
    if (onExperimentAction) {
      onExperimentAction('Đặt lại thí nghiệm', 'Trở về Ngày 1');
    }
  };

  const handleDayChange = (newDay: number) => {
    setDay(newDay);
    if (onExperimentAction) {
      onExperimentAction('Xem ngày', `Ngày ${newDay}`);
    }
  };

  const noteKey = (pot: PotId) => `${pot}-${day}`;

  const handleSaveNote = (pot: PotId) => {
    const text = (notes[noteKey(pot)] || '').trim();
    if (!text) return;
    if (onExperimentAction) {
      onExperimentAction(`Ghi quan sát chậu ${pot} (ngày ${day})`, text);
    }
    setSavedKey(noteKey(pot));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/70">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            Mô phỏng: Cây cần gì để sống và phát triển?
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            So sánh 4 chậu cây trong các điều kiện khác nhau theo thời gian
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (!isPlaying && onExperimentAction) {
                onExperimentAction('Chạy mô phỏng thời gian', `Từ ngày ${day}`);
              }
              if (!isPlaying && day >= 10) setDay(1);
              setIsPlaying(!isPlaying);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border shadow-2xs ${
              isPlaying
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? 'Tạm dừng' : 'Chạy tự động (10 ngày)'}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            Làm lại
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Simulation disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2.5 text-xs text-amber-800">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Đây là mô phỏng đơn giản, kết quả thực tế có thể khác.</strong> Cây thật còn phụ thuộc vào loại cây, đất, thời tiết... Em có thể trồng cây thật để so sánh.
          </span>
        </div>

        {/* Day Slider Bar */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <label htmlFor="plant-day" className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Thời gian mô phỏng: <span className="text-emerald-600 text-sm font-black">NGÀY {day} / 10</span>
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {[1, 3, 5, 7, 10].map((d) => (
                <button
                  key={d}
                  onClick={() => handleDayChange(d)}
                  aria-pressed={day === d}
                  className={`px-2.5 py-1 text-xs rounded font-semibold transition-colors ${
                    day === d
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Ngày {d}
                </button>
              ))}
            </div>
          </div>
          <input
            id="plant-day"
            type="range"
            min="1"
            max="10"
            value={day}
            onChange={(e) => handleDayChange(Number(e.target.value))}
            className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>

        {/* 4 Comparative Pots Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {POTS.map((pot) => {
            const key = noteKey(pot.id);
            return (
              <div key={pot.id} className={`border rounded-xl p-4 flex flex-col justify-between ${pot.boxClass}`}>
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-black/5 mb-2">
                    <span className={`text-xs font-bold ${pot.textClass}`}>{pot.title}</span>
                    <span className="text-[10px] font-bold bg-white/80 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                      {pot.tag}
                    </span>
                  </div>
                  <div className="flex gap-2 text-[11px] text-slate-600 mb-2">
                    <span className={`flex items-center gap-0.5 ${pot.water ? '' : 'line-through text-rose-600'}`}>
                      <Droplets className="w-3 h-3" /> Nước
                    </span>
                    <span className={`flex items-center gap-0.5 ${pot.light ? '' : 'line-through text-rose-600'}`}>
                      <Sun className="w-3 h-3" /> Ánh sáng
                    </span>
                    <span className={`flex items-center gap-0.5 ${pot.air ? '' : 'line-through text-rose-600'}`}>
                      <Wind className="w-3 h-3" /> Không khí
                    </span>
                  </div>

                  <div
                    className={`h-44 rounded-lg border flex items-end justify-center p-2 relative overflow-hidden ${
                      pot.light ? 'bg-white/70 border-white' : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    {!pot.light && (
                      <span className="absolute top-2 left-2 text-[9px] text-slate-400 font-mono">HỘP TỐI</span>
                    )}
                    <PlantVisual pot={pot.id} day={day} />
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-700">
                  <strong>Mô phỏng cho thấy (ngày {day}):</strong> {describePot(pot.id, day)}
                </div>

                <div className="mt-3 space-y-1.5">
                  <label htmlFor={`note-${key}`} className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                    <PencilLine className="w-3 h-3" /> Em ghi lại (ngày {day}):
                  </label>
                  <textarea
                    id={`note-${key}`}
                    rows={2}
                    value={notes[key] || ''}
                    onChange={(e) => {
                      setNotes({ ...notes, [key]: e.target.value });
                      if (savedKey === key) setSavedKey(null);
                    }}
                    placeholder="Em thấy lá, thân cây thế nào?"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={() => handleSaveNote(pot.id)}
                    disabled={!(notes[key] || '').trim()}
                    className="w-full py-1.5 text-[11px] font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    {savedKey === key ? '✓ Đã ghi vào nhật ký' : 'Ghi vào nhật ký thí nghiệm'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
