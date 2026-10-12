import React, { useState, useEffect, useRef } from 'react';
import { soundManager } from '../../utils/audio';
import { RotateCcw, Flame, Snowflake, AlertTriangle, Play, Pause, Info } from 'lucide-react';

interface Props {
  onExperimentAction?: (actionName: string, detail: string) => void;
}

// Mô phỏng minh họa theo quy tắc đơn giản, không phải tính toán vật lý chính xác.
const START_WATER_ML = 200;
const ROOM_TEMP = 28;

const FLAME_LEVELS = [
  { label: 'Tắt', target: ROOM_TEMP, desc: 'Không đun (nhiệt độ phòng)' },
  { label: 'Mức 1', target: 50, desc: 'Lửa nhỏ (khoảng 50°C)' },
  { label: 'Mức 2', target: 80, desc: 'Lửa vừa (khoảng 80°C)' },
  { label: 'Mức 3', target: 100, desc: 'Lửa mạnh (nước sôi)' }
];

// Mức làm lạnh của đĩa: 0 = không làm lạnh ... 4 = rất lạnh
const COOLING_LEVELS = [
  { label: 'Không làm lạnh', plateTemp: ROOM_TEMP },
  { label: 'Nước mát', plateTemp: 20 },
  { label: 'Nước lạnh', plateTemp: 12 },
  { label: 'Vài viên đá', plateTemp: 5 },
  { label: 'Nhiều đá', plateTemp: 1 }
];

interface SimState {
  waterTemp: number;
  flaskWater: number; // ml còn trong bình
  collected: number; // ml thu được ở cốc hứng
  vaporRate: number; // ml/nhịp, dùng để vẽ hơi nước
  condenseRate: number;
  ticks: number;
}

const INITIAL_STATE: SimState = {
  waterTemp: ROOM_TEMP,
  flaskWater: START_WATER_ML,
  collected: 0,
  vaporRate: 0,
  condenseRate: 0,
  ticks: 0
};

// Nước bay hơi ở mọi nhiệt độ; càng nóng càng nhanh.
const evaporationRate = (temp: number) => 0.03 + Math.pow(Math.max(0, temp - 10) / 90, 2) * 1.2;

// Phần hơi nước ngưng tụ trên đĩa: đĩa càng lạnh (so với hơi nước) càng nhiều.
const condensationFraction = (plateTemp: number, waterTemp: number) => {
  const diff = Math.max(0, waterTemp - plateTemp);
  const coldness = Math.max(0, (ROOM_TEMP + 2 - plateTemp) / (ROOM_TEMP + 2));
  return Math.min(0.85, 0.05 + coldness * 0.7) * Math.min(1, diff / 40 + 0.15);
};

export const WaterEvaporationCondensationSimulation: React.FC<Props> = ({ onExperimentAction }) => {
  const [flameLevel, setFlameLevel] = useState<number>(0);
  const [coolingLevel, setCoolingLevel] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [sim, setSim] = useState<SimState>(INITIAL_STATE);

  const plateTemp = COOLING_LEVELS[coolingLevel].plateTemp;
  const paramsRef = useRef({ flameLevel, plateTemp });
  paramsRef.current = { flameLevel, plateTemp };

  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setSim((prev) => {
        const { flameLevel: fl, plateTemp: pt } = paramsRef.current;
        const target = FLAME_LEVELS[fl].target;
        let waterTemp = prev.waterTemp;
        if (waterTemp < target) waterTemp = Math.min(target, waterTemp + 2);
        else if (waterTemp > target) waterTemp = Math.max(target, waterTemp - 1);

        if (prev.flaskWater <= 0) {
          return { ...prev, waterTemp, vaporRate: 0, condenseRate: 0, ticks: prev.ticks + 1 };
        }
        const evaporated = Math.min(prev.flaskWater, evaporationRate(waterTemp));
        const condensed = evaporated * condensationFraction(pt, waterTemp);
        return {
          waterTemp,
          flaskWater: Math.max(0, prev.flaskWater - evaporated),
          collected: prev.collected + condensed,
          vaporRate: evaporated,
          condenseRate: condensed,
          ticks: prev.ticks + 1
        };
      });
    }, 450);
    return () => clearInterval(timer);
  }, [isRunning]);

  // Tiếng xì hơi nhẹ khi nước rất nóng
  useEffect(() => {
    if (isRunning && sim.waterTemp >= 90 && sim.flaskWater > 0 && sim.ticks % 4 === 0) {
      soundManager.playSteamHiss();
    }
  }, [sim.ticks, sim.waterTemp, sim.flaskWater, isRunning]);

  const handleFlameChange = (level: number) => {
    setFlameLevel(level);
    if (onExperimentAction) {
      onExperimentAction('Điều chỉnh nguồn nhiệt', FLAME_LEVELS[level].desc);
    }
  };

  const handleCoolingChange = (level: number) => {
    setCoolingLevel(level);
    if (onExperimentAction) {
      onExperimentAction(
        'Điều chỉnh mức làm lạnh đĩa',
        `${COOLING_LEVELS[level].label} (khoảng ${COOLING_LEVELS[level].plateTemp}°C)`
      );
    }
  };

  const handleReset = () => {
    setFlameLevel(0);
    setCoolingLevel(0);
    setSim(INITIAL_STATE);
    setIsRunning(true);
    if (onExperimentAction) {
      onExperimentAction('Đặt lại thí nghiệm', 'Bình đầy nước, cốc hứng rỗng');
    }
  };

  const { waterTemp, flaskWater, collected, vaporRate, condenseRate } = sim;
  const isBoiling = waterTemp >= 98 && flaskWater > 0;
  const vaporLevel = Math.min(1, vaporRate / 1.0); // 0..1 để vẽ
  const isCondensing = condenseRate > 0.02;
  const waterFraction = flaskWater / START_WATER_ML;
  // Mặt nước trong bình (tọa độ cục bộ của bình: đáy ~ y=100, cổ bình ~ y=-10)
  const waterTopY = 100 - waterFraction * 75;
  const steamCount = flaskWater > 0 ? Math.max(1, Math.round(vaporLevel * 7)) : 0;

  const evaporationText =
    flaskWater <= 0
      ? 'Nước trong bình đã bay hơi hết.'
      : waterTemp < 40
      ? 'Nước đang bay hơi rất chậm (khó nhìn thấy bằng mắt).'
      : waterTemp < 75
      ? 'Nước ấm lên nên bay hơi nhanh hơn.'
      : isBoiling
      ? 'Nước sôi: bay hơi rất nhanh, mực nước giảm rõ.'
      : 'Nước nóng: bay hơi nhanh, hơi nước bốc lên nhiều.';

  const condensationText =
    collected < 0.05
      ? 'Chưa thu được giọt nước nào.'
      : isCondensing
      ? coolingLevel >= 3
        ? 'Đĩa rất lạnh: nhiều hơi nước ngưng tụ thành giọt.'
        : 'Một phần hơi nước ngưng tụ trên đĩa.'
      : 'Rất ít hơi nước ngưng tụ lúc này.';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/70">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            Mô phỏng: Nước bay hơi và ngưng tụ
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Điều chỉnh nguồn nhiệt và mức làm lạnh của đĩa để quan sát
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-2xs"
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isRunning ? 'Tạm dừng' : 'Tiếp tục'}
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

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: SVG Apparatus Canvas */}
        <div className="lg:col-span-8 bg-slate-900 rounded-xl p-4 relative min-h-[420px] flex flex-col justify-between overflow-hidden text-white">
          {/* Status Displays */}
          <div className="flex flex-wrap items-center gap-2 z-10">
            <div className="bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2">
              <span className="text-slate-400">Nước trong bình:</span>
              <span className={`font-bold ${waterTemp > 80 ? 'text-orange-400' : 'text-cyan-300'}`}>
                {Math.round(waterTemp)}°C {isBoiling ? '(đang sôi)' : ''}
              </span>
            </div>
            <div className="bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2">
              <span className="text-slate-400">Còn lại:</span>
              <span className="font-bold text-cyan-300">{flaskWater.toFixed(1)} ml</span>
            </div>
            <div className="bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2">
              <span className="text-slate-400">Đĩa:</span>
              <span className="font-bold text-sky-300">khoảng {plateTemp}°C</span>
            </div>
            <div className="bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2">
              <span className="text-slate-400">Nước thu được:</span>
              <span className="font-bold text-emerald-400">{collected.toFixed(1)} ml</span>
            </div>
          </div>

          {/* SVG Diagram Canvas */}
          <svg viewBox="0 0 500 340" className="w-full h-[310px] select-none my-auto" role="img" aria-label="Bình nước được đun, hơi nước bay lên gặp đĩa lạnh và ngưng tụ thành giọt rơi vào cốc hứng">
            <defs>
              <clipPath id="flaskInside">
                <path d="M -13 -40 L -13 -10 L -43 55 A 43 43 0 0 0 43 55 L 13 -10 L 13 -40 Z" />
              </clipPath>
            </defs>

            {/* Laboratory Stand */}
            <rect x="50" y="315" width="400" height="15" fill="#334155" rx="3" />
            <rect x="70" y="30" width="8" height="285" fill="#475569" />
            <rect x="74" y="210" width="130" height="6" fill="#64748b" />
            <rect x="74" y="90" width="160" height="6" fill="#64748b" />

            {/* Burner */}
            <g transform="translate(140, 260)">
              <rect x="-25" y="40" width="50" height="15" rx="3" fill="#64748b" stroke="#334155" />
              <rect x="-8" y="15" width="16" height="25" fill="#94a3b8" />
              {flameLevel > 0 && (
                <g>
                  <path
                    d={`M -15 15 Q 0 ${15 - flameLevel * 14}, 15 15 Q 0 ${20}, -15 15 Z`}
                    fill="#f97316"
                    opacity="0.9"
                    className="animate-pulse"
                  />
                  <path
                    d={`M -8 15 Q 0 ${15 - flameLevel * 8}, 8 15 Q 0 ${18}, -8 15 Z`}
                    fill="#38bdf8"
                    opacity="0.8"
                  />
                </g>
              )}
            </g>

            {/* Glass Flask with Water: mực nước giảm khi nước bay hơi */}
            <g transform="translate(140, 150)">
              <g clipPath="url(#flaskInside)">
                <rect x="-50" y={waterTopY} width="100" height={110} fill="#0284c7" opacity="0.6" />
                {isBoiling && (
                  <g fill="#bae6fd" opacity="0.8">
                    <circle cx="-15" cy={Math.min(90, waterTopY + 30)} r="2.5" className="animate-ping" />
                    <circle cx="10" cy={Math.min(92, waterTopY + 40)} r="3.5" className="animate-ping" />
                    <circle cx="-5" cy={Math.min(95, waterTopY + 50)} r="2" />
                  </g>
                )}
              </g>
              <path
                d="M -15 -40 L -15 -10 L -45 55 A 45 45 0 0 0 45 55 L 15 -10 L 15 -40 Z"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
              />
            </g>

            {/* Rising vapor: số lượng và độ đậm theo tốc độ bay hơi */}
            {steamCount > 0 && (
              <g opacity={0.25 + vaporLevel * 0.6}>
                {[...Array(steamCount)].map((_, idx) => (
                  <path
                    key={idx}
                    d={`M ${132 + (idx % 3) * 8} 105 Q ${126 + ((idx * 8) % 20)} 80, ${140 + ((idx * 15) % 40)} 60`}
                    fill="none"
                    stroke="#e0f2fe"
                    strokeWidth={1.5 + vaporLevel * 1.5}
                    strokeDasharray="4,4"
                    className="animate-steam"
                  />
                ))}
              </g>
            )}

            {/* Slanted plate with cooling */}
            <g transform="translate(190, 65) rotate(18)">
              <rect
                x="-70"
                y="0"
                width="140"
                height="8"
                rx="2"
                fill={coolingLevel === 0 ? '#94a3b8' : coolingLevel <= 2 ? '#7dd3fc' : '#bae6fd'}
                stroke="#cbd5e1"
                strokeWidth="1.5"
              />
              {coolingLevel >= 3 && (
                <g transform="translate(-40, -16)">
                  {[...Array(coolingLevel === 4 ? 4 : 2)].map((_, i) => (
                    <rect key={i} x={i * 20} y="0" width="16" height="14" rx="2" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1" opacity="0.9" />
                  ))}
                </g>
              )}
              {(coolingLevel === 1 || coolingLevel === 2) && (
                <rect x="-50" y="-10" width="80" height="10" rx="3" fill="#38bdf8" opacity="0.5" />
              )}
              <text x="0" y="-22" fontSize="8" fill="#7dd3fc" textAnchor="middle" fontWeight="bold">
                {COOLING_LEVELS[coolingLevel].label.toUpperCase()}
              </text>

              {/* Droplets under the plate: nhiều hay ít theo lượng ngưng tụ */}
              {collected > 0.05 && (
                <g fill="#38bdf8">
                  {[-30, -5, 20, 45].slice(0, Math.max(1, Math.min(4, Math.ceil(condenseRate * 8)))).map((cx, i) => (
                    <circle key={i} cx={cx} cy={11 + i * 0.6} r={2.5 + i * 0.5} />
                  ))}
                </g>
              )}
            </g>

            {/* Dripping drop */}
            {isCondensing && (
              <circle cx="290" cy={105 + ((sim.ticks * 22) % 115)} r="3.5" fill="#38bdf8" />
            )}

            {/* Collector Beaker */}
            <g transform="translate(290, 220)">
              <rect x="-30" y="0" width="60" height="80" rx="3" fill="none" stroke="#38bdf8" strokeWidth="2" />
              <rect
                x="-28"
                y={80 - Math.min(78, collected * 0.8)}
                width="56"
                height={Math.min(78, collected * 0.8)}
                fill="#0284c7"
                opacity="0.75"
              />
              <text x="0" y="95" fontSize="9" fill="#94a3b8" textAnchor="middle">
                Cốc hứng
              </text>
            </g>

            {/* Annotations */}
            <text x="140" y="45" fontSize="10" fill="#f59e0b" fontWeight="bold" textAnchor="middle">
              1. BAY HƠI
            </text>
            <text x="340" y="55" fontSize="10" fill="#38bdf8" fontWeight="bold" textAnchor="middle">
              2. NGƯNG TỤ (GẶP LẠNH)
            </text>
          </svg>

          {/* Safety Notice Banner */}
          <div className="bg-amber-500/20 border border-amber-400/40 rounded-lg p-2.5 flex items-center gap-2 text-xs text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>An toàn:</strong> Nước sôi và hơi nước rất nóng, có thể gây bỏng. Em không tự đun nước ở nhà; thí nghiệm thật chỉ làm khi có thầy cô hoặc người lớn hướng dẫn.
            </span>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4 bg-slate-50/50 p-5 rounded-xl border border-slate-200">
          <div>
            <div className="pb-3 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Điều chỉnh thông số
              </span>
            </div>

            {/* Flame Control */}
            <div className="mt-4">
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-500" /> Nguồn nhiệt:
                </span>
                <span className="text-orange-600 font-bold">{FLAME_LEVELS[flameLevel].desc}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                {FLAME_LEVELS.map((lvl, idx) => (
                  <button
                    key={idx}
                    aria-pressed={flameLevel === idx}
                    onClick={() => handleFlameChange(idx)}
                    className={`py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      flameLevel === idx
                        ? 'bg-orange-600 text-white border-orange-700 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cooling slider */}
            <div className="mt-5">
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <label htmlFor="cooling-level" className="flex items-center gap-1.5">
                  <Snowflake className="w-3.5 h-3.5 text-sky-500" /> Mức làm lạnh đĩa:
                </label>
                <span className="text-sky-600 font-bold">{COOLING_LEVELS[coolingLevel].label}</span>
              </div>
              <input
                id="cooling-level"
                type="range"
                min={0}
                max={COOLING_LEVELS.length - 1}
                step={1}
                value={coolingLevel}
                aria-valuetext={`${COOLING_LEVELS[coolingLevel].label}, khoảng ${plateTemp} độ C`}
                onChange={(e) => handleCoolingChange(Number(e.target.value))}
                className="w-full accent-sky-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>Không làm lạnh</span>
                <span>Rất lạnh</span>
              </div>
            </div>

            {/* Live observation */}
            <div className="mt-5 p-3 rounded-lg bg-white border border-slate-200 text-xs space-y-1 text-slate-700" aria-live="polite">
              <p>💧 {evaporationText}</p>
              <p>❄️ {condensationText}</p>
            </div>
          </div>

          {/* Concept Deck */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs space-y-2">
            <span className="font-semibold text-slate-800 block">Em cần nhớ:</span>
            <div className="space-y-1.5 text-slate-600">
              <p>
                <strong className="text-orange-700">Bay hơi:</strong> Nước chuyển từ thể lỏng sang hơi nước ở mọi nhiệt độ. Nước càng nóng thì bay hơi càng nhanh.
              </p>
              <p>
                <strong className="text-sky-700">Ngưng tụ:</strong> Hơi nước gặp bề mặt lạnh thì chuyển lại thành giọt nước. Bề mặt càng lạnh, càng nhiều giọt nước.
              </p>
            </div>
            <p className="flex items-start gap-1 text-[11px] text-slate-400">
              <Info className="w-3 h-3 mt-0.5 shrink-0" /> Đây là mô phỏng minh họa, số liệu chỉ để so sánh.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
