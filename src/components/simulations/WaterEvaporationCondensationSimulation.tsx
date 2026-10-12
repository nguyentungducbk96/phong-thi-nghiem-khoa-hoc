import React, { useState, useEffect } from 'react';
import { soundManager } from '../../utils/audio';
import { RotateCcw, Flame, Snowflake, AlertTriangle, Play, Pause } from 'lucide-react';

interface Props {
  onExperimentAction?: (actionName: string, detail: string) => void;
}

export const WaterEvaporationCondensationSimulation: React.FC<Props> = ({ onExperimentAction }) => {
  // Flame power: 0 = off, 1 = low, 2 = medium, 3 = high
  const [flameLevel, setFlameLevel] = useState<number>(2);
  // Water temperature (°C)
  const [waterTemp, setWaterTemp] = useState<number>(65);
  // Cold plate temperature (°C)
  const [plateTemp, setPlateTemp] = useState<number>(5);
  // Has ice cubes on plate
  const [hasIce, setHasIce] = useState<boolean>(true);
  // Condensation drop counter
  const [dropCount, setDropCount] = useState<number>(0);
  // Collected water volume (ml)
  const [collectedWater, setCollectedWater] = useState<number>(15);
  // Running simulation loop
  const [isRunning, setIsRunning] = useState<boolean>(true);

  // Dynamic temperature simulation
  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setWaterTemp((curr) => {
        const targetTemp = flameLevel === 0 ? 25 : flameLevel === 1 ? 55 : flameLevel === 2 ? 85 : 100;
        if (curr < targetTemp) {
          return Math.min(targetTemp, curr + 2);
        } else if (curr > targetTemp) {
          return Math.max(targetTemp, curr - 1);
        }
        return curr;
      });

      // If water is hot (>70°C) and cold plate is cold (<15°C) -> condensation occurs!
      if (waterTemp >= 70 && plateTemp <= 15) {
        soundManager.playSteamHiss();
        setDropCount((c) => c + 1);
        setCollectedWater((w) => Math.min(100, w + 1));
      }
    }, 450);

    return () => clearInterval(timer);
  }, [flameLevel, waterTemp, plateTemp, isRunning]);

  const handleFlameChange = (level: number) => {
    setFlameLevel(level);
    if (onExperimentAction) {
      const labels = ['Tắt lửa', 'Lửa nhỏ', 'Lửa vừa', 'Lửa mạnh (Sôi)'];
      onExperimentAction('Điều chỉnh ngọn lửa', labels[level]);
    }
  };

  const handleReset = () => {
    setFlameLevel(0);
    setWaterTemp(25);
    setPlateTemp(5);
    setHasIce(true);
    setDropCount(0);
    setCollectedWater(0);
    if (onExperimentAction) {
      onExperimentAction('Đặt lại thí nghiệm', 'Làm nguội nước và đặt lại thể tích ban đầu');
    }
  };

  const isBoiling = waterTemp >= 98;
  const isEvaporating = waterTemp >= 60;
  const isCondensing = isEvaporating && plateTemp <= 15;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/70">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            Mô phỏng: Nước bay hơi và ngưng tụ (Vòng tuần hoàn mini)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Tăng nguồn nhiệt đun nước và giữ lạnh đĩa để quan sát các giọt nước đọng lại
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
          {/* Scientific Status Displays */}
          <div className="flex flex-wrap items-center justify-between gap-2 z-10">
            <div className="bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2">
              <span className="text-slate-400">Nhiệt độ nước:</span>
              <span className={`font-bold ${waterTemp > 80 ? 'text-orange-400' : 'text-cyan-300'}`}>
                {waterTemp}°C {isBoiling ? '(Đang sôi!)' : ''}
              </span>
            </div>
            <div className="bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2">
              <span className="text-slate-400">Nhiệt độ đĩa lạnh:</span>
              <span className="font-bold text-sky-300">
                {plateTemp}°C {hasIce ? '(Có đá viên)' : ''}
              </span>
            </div>
            <div className="bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2">
              <span className="text-slate-400">Nước thu được:</span>
              <span className="font-bold text-emerald-400">{collectedWater} ml</span>
            </div>
          </div>

          {/* SVG Diagram Canvas */}
          <svg viewBox="0 0 500 340" className="w-full h-[310px] select-none my-auto">
            {/* Laboratory Stand (Giá thí nghiệm) */}
            <rect x="50" y="315" width="400" height="15" fill="#334155" rx="3" />
            <rect x="70" y="30" width="8" height="285" fill="#475569" />
            {/* Ring clamps */}
            <rect x="74" y="210" width="130" height="6" fill="#64748b" />
            <rect x="74" y="90" width="160" height="6" fill="#64748b" />

            {/* Bunsen Burner / Stove at bottom */}
            <g transform="translate(140, 260)">
              {/* Burner base */}
              <rect x="-25" y="40" width="50" height="15" rx="3" fill="#64748b" stroke="#334155" />
              <rect x="-8" y="15" width="16" height="25" fill="#94a3b8" />
              {/* Flame (animated size based on level) */}
              {flameLevel > 0 && (
                <g>
                  {/* Outer flame */}
                  <path
                    d={`M -15 15 Q 0 ${15 - flameLevel * 14}, 15 15 Q 0 ${20}, -15 15 Z`}
                    fill="#f97316"
                    opacity="0.9"
                    className="animate-pulse"
                  />
                  {/* Inner blue flame */}
                  <path
                    d={`M -8 15 Q 0 ${15 - flameLevel * 8}, 8 15 Q 0 ${18}, -8 15 Z`}
                    fill="#38bdf8"
                    opacity="0.8"
                  />
                </g>
              )}
            </g>

            {/* Glass Flask with Water */}
            <g transform="translate(140, 150)">
              {/* Boiling Flask Outline */}
              <path
                d="M -15 -40 L -15 -10 L -45 55 A 45 45 0 0 0 45 55 L 15 -10 L 15 -40 Z"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
              />
              {/* Liquid inside flask */}
              <path
                d="M -40 50 A 42 42 0 0 0 40 50 Q 0 45, -40 50 Z"
                fill="#0284c7"
                opacity="0.6"
              />
              {/* Boiling bubbles inside water */}
              {isEvaporating && (
                <g fill="#bae6fd" opacity="0.8">
                  <circle cx="-15" cy="50" r="2.5" className="animate-ping" />
                  <circle cx="10" cy="52" r="3.5" className="animate-ping" />
                  <circle cx="-5" cy="54" r="2" />
                  <circle cx="20" cy="48" r="2" />
                </g>
              )}
            </g>

            {/* Rising Steam Vapor Particles */}
            {isEvaporating && (
              <g opacity="0.75">
                {[...Array(6)].map((_, idx) => (
                  <path
                    key={idx}
                    d={`M ${135 + (idx % 3) * 12} 95 Q ${130 + ((idx * 8) % 20)} 70, ${145 + ((idx * 15) % 30)} 50`}
                    fill="none"
                    stroke="#e0f2fe"
                    strokeWidth="2.5"
                    strokeDasharray="4,4"
                    className="animate-steam"
                  />
                ))}
              </g>
            )}

            {/* Slanted Cold Metal Plate with Ice on Top */}
            <g transform="translate(190, 65) rotate(18)">
              {/* Metal Plate */}
              <rect x="-70" y="0" width="140" height="8" rx="2" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="1.5" />
              {/* Ice Cubes on Top */}
              {hasIce && (
                <g transform="translate(-40, -16)">
                  <rect x="0" y="0" width="16" height="14" rx="2" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1" opacity="0.9" />
                  <rect x="22" y="0" width="18" height="14" rx="2" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1" opacity="0.9" />
                  <rect x="46" y="0" width="15" height="14" rx="2" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1" opacity="0.9" />
                  <text x="35" y="-4" fontSize="8" fill="#7dd3fc" textAnchor="middle" fontWeight="bold">ĐÁ LẠNH (0°C)</text>
                </g>
              )}

              {/* Condensed Droplets on Underside of plate */}
              {isCondensing && (
                <g fill="#38bdf8">
                  <circle cx="-30" cy="11" r="2.5" />
                  <circle cx="-5" cy="12" r="3" />
                  <circle cx="20" cy="12" r="3.5" />
                  <circle cx="45" cy="13" r="4" />
                </g>
              )}
            </g>

            {/* Dripping Water Drops from Plate Tip into Collector Beaker */}
            {isCondensing && (
              <g>
                <circle
                  cx="290"
                  cy={105 + ((dropCount * 22) % 115)}
                  r="3.5"
                  fill="#38bdf8"
                />
              </g>
            )}

            {/* Collector Beaker (Cốc hứng nước) */}
            <g transform="translate(290, 220)">
              <rect x="-30" y="0" width="60" height="80" rx="3" fill="none" stroke="#38bdf8" strokeWidth="2" />
              {/* Collected Water */}
              <rect
                x="-28"
                y={80 - (collectedWater * 0.7)}
                width="56"
                height={collectedWater * 0.7}
                fill="#0284c7"
                opacity="0.75"
              />
              <text x="0" y="95" fontSize="9" fill="#94a3b8" textAnchor="middle">
                Nước ngưng tụ
              </text>
            </g>

            {/* Educational Annotations */}
            <text x="140" y="45" fontSize="10" fill="#f59e0b" fontWeight="bold" textAnchor="middle">
              1. BAY HƠI (GẶP NHIỆT ĐỘ CAO)
            </text>
            <text x="340" y="55" fontSize="10" fill="#38bdf8" fontWeight="bold" textAnchor="middle">
              2. NGƯNG TỤ (GẶP LẠNH)
            </text>
          </svg>

          {/* Safety Notice Banner */}
          <div className="bg-amber-500/20 border border-amber-400/40 rounded-lg p-2.5 flex items-center gap-2 text-xs text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Ghi nhớ an toàn:</strong> Nước sôi và hơi nước rất nóng có thể gây bỏng. Thí nghiệm thực tế trên lớp luôn phải có giáo viên hướng dẫn!
            </span>
          </div>
        </div>

        {/* Right: Parameter Controls & Concept Deck */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4 bg-slate-50/50 p-5 rounded-xl border border-slate-200">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Điều chỉnh thông số
              </span>
              <span className="text-xs text-amber-600 font-semibold font-mono">
                {isCondensing ? 'Đang ngưng tụ tích cực' : 'Chưa đủ điều kiện'}
              </span>
            </div>

            {/* Flame Control */}
            <div className="mt-4">
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-500" /> Nguồn nhiệt đun nước:
                </span>
                <span className="font-mono text-orange-600 font-bold">
                  {['Tắt lửa', 'Lửa nhỏ (55°C)', 'Lửa vừa (85°C)', 'Lửa mạnh (100°C)'][flameLevel]}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                {[0, 1, 2, 3].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => handleFlameChange(lvl)}
                    className={`py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      flameLevel === lvl
                        ? 'bg-orange-600 text-white border-orange-700 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {lvl === 0 ? 'Tắt' : `Mức ${lvl}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Cold Plate Control */}
            <div className="mt-5">
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Snowflake className="w-3.5 h-3.5 text-sky-500" /> Bề mặt làm lạnh:
                </span>
                <span className="font-mono text-sky-600 font-bold">{plateTemp}°C</span>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => {
                    setHasIce(true);
                    setPlateTemp(5);
                    if (onExperimentAction) onExperimentAction('Thêm đá lạnh', 'Hạ nhiệt độ bề mặt đĩa xuống 5°C');
                  }}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    hasIce
                      ? 'bg-sky-500 text-white border-sky-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Có đá lạnh (5°C)
                </button>
                <button
                  onClick={() => {
                    setHasIce(false);
                    setPlateTemp(28);
                    if (onExperimentAction) onExperimentAction('Bỏ đá lạnh', 'Bề mặt đĩa ấm lên nhiệt độ phòng');
                  }}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    !hasIce
                      ? 'bg-slate-700 text-white border-slate-800'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Không có đá (28°C)
                </button>
              </div>
            </div>
          </div>

          {/* Educational Concept Deck */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs space-y-2">
            <span className="font-semibold text-slate-800 block">Hai giai đoạn của vòng tuần hoàn:</span>
            <div className="space-y-1.5 text-slate-600">
              <p>
                <strong className="text-orange-700">1. Bay hơi:</strong> Khi nước trong bình được đun nóng, nước chuyển từ thể lỏng sang thể khí (hơi nước) bay lên cao.
              </p>
              <p>
                <strong className="text-sky-700">2. Ngưng tụ:</strong> Hơi nước nóng bay lên gặp đáy đĩa lạnh liền bị mất nhiệt, chuyển từ thể khí trở lại thể lỏng và đọng thành giọt rơi xuống!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
