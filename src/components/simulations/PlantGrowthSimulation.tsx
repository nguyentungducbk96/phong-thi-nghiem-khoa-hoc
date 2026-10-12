import React, { useState, useEffect } from 'react';
import { RotateCcw, Play, Pause, Sun, Droplets, Wind, ShieldAlert } from 'lucide-react';

interface Props {
  onExperimentAction?: (actionName: string, detail: string) => void;
}

export const PlantGrowthSimulation: React.FC<Props> = ({ onExperimentAction }) => {
  // Day from 1 to 10
  const [day, setDay] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Auto step timer
  useEffect(() => {
    if (isPlaying) {
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
    }
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
      onExperimentAction(`Xem Ngày ${newDay}`, `Quan sát cây đậu sau ${newDay} ngày thí nghiệm`);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/70">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            Mô phỏng: Cây cần gì để sống và phát triển? (Thực nghiệm 10 ngày)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            So sánh 4 chậu cây trong các điều kiện môi trường khác nhau theo thời gian
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border shadow-2xs ${
              isPlaying
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? 'Tạm dừng mô phỏng' : 'Chạy tự động (10 ngày)'}
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
        {/* Day Slider Bar */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Thời gian thí nghiệm: <span className="text-emerald-600 text-sm font-black">NGÀY THỨ {day} / 10</span>
            </span>
            <div className="flex items-center gap-1.5">
              {[1, 3, 5, 7, 10].map((d) => (
                <button
                  key={d}
                  onClick={() => handleDayChange(d)}
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
          {/* POT A: Full Conditions */}
          <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60 mb-2">
                <span className="text-xs font-bold text-emerald-900">Chậu A (Đối chứng)</span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Đầy đủ</span>
              </div>
              <div className="flex gap-2 text-[11px] text-emerald-700 mb-2">
                <span className="flex items-center gap-0.5"><Droplets className="w-3 h-3" /> Nước</span>
                <span className="flex items-center gap-0.5"><Sun className="w-3 h-3" /> Nắng</span>
                <span className="flex items-center gap-0.5"><Wind className="w-3 h-3" /> Khí</span>
              </div>

              {/* Plant Visual */}
              <div className="h-44 bg-white/70 rounded-lg border border-emerald-100 flex items-end justify-center p-2 relative overflow-hidden">
                <svg viewBox="0 0 100 120" className="w-28 h-36">
                  {/* Pot */}
                  <polygon points="25,95 75,95 70,120 30,120" fill="#92400e" />
                  <ellipse cx="50" cy="95" rx="26" ry="5" fill="#78350f" />
                  {/* Stem height grows with day */}
                  <path
                    d={`M 50 95 Q ${48 + day} ${95 - day * 6}, 50 ${95 - Math.min(65, day * 7)}`}
                    fill="none"
                    stroke="#16a34a"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  {/* Green leaves */}
                  <ellipse cx={40} cy={95 - Math.min(45, day * 4)} rx={8 + day} ry={5 + day * 0.5} fill="#22c55e" />
                  <ellipse cx={60} cy={95 - Math.min(55, day * 5)} rx={8 + day} ry={5 + day * 0.5} fill="#22c55e" />
                  {day >= 5 && (
                    <ellipse cx={42} cy={95 - Math.min(65, day * 6.5)} rx={10} ry={6} fill="#15803d" />
                  )}
                  {/* Flower on day 8-10 */}
                  {day >= 8 && (
                    <circle cx={50} cy={95 - Math.min(65, day * 7) - 4} r={6} fill="#f59e0b" />
                  )}
                </svg>
              </div>
            </div>
            <div className="mt-3 text-xs text-emerald-800">
              <strong>Quan sát:</strong> Thân cao khỏe, lá xanh thẫm, mọc thêm nhiều chồi non và nở hoa tươi tốt!
            </div>
          </div>

          {/* POT B: Lack of Water */}
          <div className="bg-amber-50/40 border border-amber-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-amber-200/60 mb-2">
                <span className="text-xs font-bold text-amber-900">Chậu B</span>
                <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">Thiếu nước</span>
              </div>
              <div className="flex gap-2 text-[11px] text-amber-700 mb-2">
                <span className="line-through text-rose-600 flex items-center gap-0.5"><Droplets className="w-3 h-3" /> Nước</span>
                <span className="flex items-center gap-0.5"><Sun className="w-3 h-3" /> Nắng</span>
                <span className="flex items-center gap-0.5"><Wind className="w-3 h-3" /> Khí</span>
              </div>

              {/* Plant Visual */}
              <div className="h-44 bg-white/70 rounded-lg border border-amber-100 flex items-end justify-center p-2 relative overflow-hidden">
                <svg viewBox="0 0 100 120" className="w-28 h-36">
                  {/* Dry Soil */}
                  <polygon points="25,95 75,95 70,120 30,120" fill="#a16207" />
                  <ellipse cx="50" cy="95" rx="26" ry="5" fill="#ca8a04" />
                  {/* Stem droops as days pass */}
                  <path
                    d={`M 50 95 Q ${50 + (day > 3 ? day * 3 : 0)} 70, ${50 + (day > 3 ? day * 4 : 0)} ${95 - Math.max(15, 45 - day * 3)}`}
                    fill="none"
                    stroke={day < 5 ? '#65a30d' : '#854d0e'}
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {/* Wilted leaves */}
                  <ellipse
                    cx={day > 3 ? 65 : 42}
                    cy={day > 3 ? 90 : 65}
                    rx={day > 4 ? 6 : 9}
                    ry={day > 4 ? 3 : 5}
                    fill={day < 4 ? '#84cc16' : '#a16207'}
                  />
                </svg>
              </div>
            </div>
            <div className="mt-3 text-xs text-amber-800">
              <strong>Quan sát:</strong> Đất khô nứt nẻ. {day <= 3 ? 'Cây bắt đầu chậm lớn.' : 'Lá héo rũ, khô quắt lại và cây chết dần.'}
            </div>
          </div>

          {/* POT C: In Dark Box (No Light) */}
          <div className="bg-slate-100/60 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
                <span className="text-xs font-bold text-slate-800">Chậu C</span>
                <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">Thiếu ánh sáng</span>
              </div>
              <div className="flex gap-2 text-[11px] text-slate-600 mb-2">
                <span className="flex items-center gap-0.5"><Droplets className="w-3 h-3" /> Nước</span>
                <span className="line-through text-rose-600 flex items-center gap-0.5"><Sun className="w-3 h-3" /> Nắng</span>
                <span className="flex items-center gap-0.5"><Wind className="w-3 h-3" /> Khí</span>
              </div>

              {/* Plant Visual */}
              <div className="h-44 bg-slate-900 rounded-lg border border-slate-800 flex items-end justify-center p-2 relative overflow-hidden">
                <span className="absolute top-2 left-2 text-[9px] text-slate-400 font-mono">HỘP TỐI</span>
                <svg viewBox="0 0 100 120" className="w-28 h-36">
                  <polygon points="25,95 75,95 70,120 30,120" fill="#92400e" />
                  <ellipse cx="50" cy="95" rx="26" ry="5" fill="#78350f" />
                  {/* Etiolation: tall, skinny, pale yellow */}
                  <path
                    d={`M 50 95 Q 46 65, 48 ${95 - day * 6}`}
                    fill="none"
                    stroke="#fef08a"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <ellipse cx={40} cy={95 - day * 4} rx={6} ry={3} fill="#fef08a" />
                  <ellipse cx={56} cy={95 - day * 5} rx={6} ry={3} fill="#fef08a" />
                </svg>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-700">
              <strong>Quan sát:</strong> Thân vống cao khẳng khiu, yếu ớt. Lá nhạt màu chuyển sang màu vàng úa vì không quang hợp được.
            </div>
          </div>

          {/* POT D: Sealed Plastic Bag (No Air) */}
          <div className="bg-sky-50/40 border border-sky-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-sky-200/60 mb-2">
                <span className="text-xs font-bold text-sky-900">Chậu D</span>
                <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">Thiếu không khí</span>
              </div>
              <div className="flex gap-2 text-[11px] text-sky-700 mb-2">
                <span className="flex items-center gap-0.5"><Droplets className="w-3 h-3" /> Nước</span>
                <span className="flex items-center gap-0.5"><Sun className="w-3 h-3" /> Nắng</span>
                <span className="line-through text-rose-600 flex items-center gap-0.5"><Wind className="w-3 h-3" /> Khí</span>
              </div>

              {/* Plant Visual with Plastic Bag Overlay */}
              <div className="h-44 bg-white/70 rounded-lg border border-sky-100 flex items-end justify-center p-2 relative overflow-hidden">
                <svg viewBox="0 0 100 120" className="w-28 h-36">
                  <polygon points="25,95 75,95 70,120 30,120" fill="#92400e" />
                  <ellipse cx="50" cy="95" rx="26" ry="5" fill="#78350f" />
                  {/* Stunted stem */}
                  <path
                    d={`M 50 95 Q 52 75, 50 ${95 - Math.min(30, day * 3)}`}
                    fill="none"
                    stroke={day < 5 ? '#16a34a' : '#71717a'}
                    strokeWidth="3"
                  />
                  <ellipse cx={42} cy={75} rx={6} ry={4} fill={day < 5 ? '#22c55e' : '#a1a1aa'} />
                  {/* Plastic bag dome outline */}
                  <path
                    d="M 20 95 C 10 30, 90 30, 80 95 Z"
                    fill="rgba(224, 242, 254, 0.45)"
                    stroke="#0284c7"
                    strokeWidth="1.5"
                    strokeDasharray="3,3"
                  />
                  <text x="50" y="45" fontSize="7" fill="#0284c7" fontWeight="bold" textAnchor="middle">
                    TÚI NILON KÍN
                  </text>
                </svg>
              </div>
            </div>
            <div className="mt-3 text-xs text-sky-800">
              <strong>Quan sát:</strong> Không khí bị chặn lại, cây không thể hô hấp và trao đổi khí. Cây ngừng lớn và thối rữa dần.
            </div>
          </div>
        </div>

        {/* Scientific Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2.5 text-xs text-amber-800">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Lưu ý khoa học:</strong> Đây là mô hình mô phỏng quy luật chung của thực vật thân thảo (đậu, ngô). Trong thực tế, các cây sa mạc có cơ chế thích nghi đặc biệt để giữ nước khác với cây nhiệt đới.
          </span>
        </div>
      </div>
    </div>
  );
};
