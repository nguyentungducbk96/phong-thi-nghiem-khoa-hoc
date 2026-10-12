import React, { useState } from 'react';
import { RotateCcw, Lightbulb, Sun, Shield } from 'lucide-react';

interface Props {
  onExperimentAction?: (actionName: string, detail: string) => void;
}

export const LightPropagationSimulation: React.FC<Props> = ({ onExperimentAction }) => {
  // Light On/Off
  const [isLightOn, setIsLightOn] = useState<boolean>(true);
  // Distance from light source to obstacle (cm: 10 to 60)
  const [obstacleDistance, setObstacleDistance] = useState<number>(25);
  // Distance from light to screen (cm: 70 to 100)
  const [screenDistance, setScreenDistance] = useState<number>(85);
  // Obstacle material: 'opaque' (Bìa chắn sáng), 'transparent' (Kính trong), 'translucent' (Kính mờ)
  const [obstacleType, setObstacleType] = useState<'opaque' | 'transparent' | 'translucent'>('opaque');
  // Obstacle size (cm)
  const [obstacleRadius, setObstacleRadius] = useState<number>(24);

  const handleReset = () => {
    setIsLightOn(true);
    setObstacleDistance(25);
    setScreenDistance(85);
    setObstacleType('opaque');
    setObstacleRadius(24);
    if (onExperimentAction) {
      onExperimentAction('Đặt lại thí nghiệm', 'Trở về vị trí ban đầu');
    }
  };

  // Geometric shadow calculation:
  // Light source at x=50, y=180
  // Obstacle at x = 50 + obstacleDistance * 3.5
  // Screen at x = 50 + screenDistance * 3.8
  // Shadow radius on screen = obstacleRadius * (screenDistance / obstacleDistance)
  const shadowRadius =
    obstacleType === 'transparent'
      ? 0
      : obstacleType === 'translucent'
      ? Math.min(130, obstacleRadius * (screenDistance / obstacleDistance) * 0.8)
      : Math.min(150, obstacleRadius * (screenDistance / obstacleDistance));

  const obstacleX = 50 + obstacleDistance * 3.6;
  const screenX = 50 + screenDistance * 3.8;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/70">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            Mô phỏng: Sự truyền thẳng của ánh sáng & Tạo thành bóng tối
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Bật đèn pin, di chuyển vật cản lại gần/xa nguồn sáng và quan sát bóng in trên màn
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsLightOn(!isLightOn);
              if (onExperimentAction) {
                onExperimentAction(isLightOn ? 'Tắt đèn' : 'Bật đèn', 'Thay đổi trạng thái nguồn sáng');
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border shadow-2xs ${
              isLightOn
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            {isLightOn ? 'Đèn đang BẬT' : 'Đèn đang TẮT'}
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
        {/* SVG Optical Bench */}
        <div className="lg:col-span-8 bg-slate-950 rounded-xl p-4 relative min-h-[420px] flex flex-col justify-between overflow-hidden text-white">
          <div className="flex items-center justify-between text-xs z-10">
            <span className="bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300">
              Chất liệu vật cản:{' '}
              <strong className="text-cyan-400">
                {obstacleType === 'opaque'
                  ? 'Bìa cứng (Chắn sáng)'
                  : obstacleType === 'transparent'
                  ? 'Thủy tinh (Trong suốt)'
                  : 'Kính mờ (Bán trong suốt)'}
              </strong>
            </span>
            <span className="bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300 font-mono">
              Kích thước bóng: <strong className="text-amber-400">{Math.round(shadowRadius * 2)}px</strong>
            </span>
          </div>

          <svg viewBox="0 0 500 340" className="w-full h-[320px] select-none my-auto">
            {/* Optical Rail (Thanh trượt quang học) */}
            <rect x="20" y="300" width="460" height="12" rx="3" fill="#334155" />
            <line x1="20" y1="306" x2="480" y2="306" stroke="#475569" strokeWidth="2" strokeDasharray="5,5" />

            {/* Flashlight (Đèn pin) at x=50, y=170 */}
            <g transform="translate(45, 170)">
              {/* Flashlight body */}
              <rect x="-35" y="-12" width="40" height="24" rx="4" fill="#64748b" stroke="#94a3b8" />
              <path d="M 5 -18 L 22 -24 L 22 24 L 5 18 Z" fill="#475569" stroke="#94a3b8" />
              <ellipse cx="22" cy="0" rx="3" ry="24" fill={isLightOn ? '#fef08a' : '#334155'} />

              {/* Light rays cone when turned ON */}
              {isLightOn && (
                <polygon
                  points={`22,-24 ${screenX - 45},-120 ${screenX - 45},120 22,24`}
                  fill="rgba(254, 240, 138, 0.22)"
                />
              )}

              {/* Light beam guidelines (Đường truyền thẳng) */}
              {isLightOn && (
                <g stroke="#fef08a" strokeWidth="1.2" strokeDasharray="3,3" opacity="0.65">
                  <line x1="22" y1="-22" x2={obstacleX - 45} y2={-obstacleRadius} />
                  <line x1={obstacleX - 45} y1={-obstacleRadius} x2={screenX - 45} y2={-shadowRadius} />
                  <line x1="22" y1="22" x2={obstacleX - 45} y2={obstacleRadius} />
                  <line x1={obstacleX - 45} y1={obstacleRadius} x2={screenX - 45} y2={shadowRadius} />
                </g>
              )}
            </g>

            {/* Obstacle (Vật cản) */}
            <g transform={`translate(${obstacleX}, 170)`} className="transition-all duration-150">
              {/* Stand */}
              <rect x="-3" y="25" width="6" height="105" fill="#64748b" />
              <rect x="-16" y="125" width="32" height="6" rx="2" fill="#475569" />

              {/* Obstacle disk */}
              <circle
                cx="0"
                cy="0"
                r={obstacleRadius}
                fill={
                  obstacleType === 'opaque'
                    ? '#0284c7'
                    : obstacleType === 'transparent'
                    ? 'rgba(56, 189, 248, 0.25)'
                    : 'rgba(148, 163, 184, 0.5)'
                }
                stroke={obstacleType === 'transparent' ? '#38bdf8' : '#0369a1'}
                strokeWidth="2.5"
              />

              <text x="0" y="4" fontSize="8" fontWeight="bold" fill="#ffffff" textAnchor="middle">
                {obstacleType === 'opaque' ? 'VẬT CẢN' : obstacleType === 'transparent' ? 'KÍNH TRONG' : 'KÍNH MỜ'}
              </text>
            </g>

            {/* Screen (Màn chắn) at screenX */}
            <g transform={`translate(${screenX}, 170)`} className="transition-all duration-150">
              {/* Screen frame */}
              <rect x="-4" y="-130" width="8" height="260" rx="3" fill="#cbd5e1" stroke="#94a3b8" />
              <rect x="-18" y="125" width="36" height="6" rx="2" fill="#475569" />

              {/* Shadow cast on the screen */}
              {isLightOn && obstacleType !== 'transparent' && (
                <rect
                  x="-3"
                  y={-shadowRadius}
                  width="6"
                  height={shadowRadius * 2}
                  fill={obstacleType === 'translucent' ? 'rgba(30, 41, 59, 0.55)' : '#020617'}
                  rx="2"
                />
              )}

              {/* Label */}
              <text x="18" y="-10" fontSize="9" fill="#94a3b8" transform="rotate(90 18 -10)">
                MÀN HỨNG
              </text>
            </g>

            {/* Educational Ray Lines */}
            {isLightOn && (
              <text x="250" y="40" fontSize="10.5" fill="#fef08a" fontWeight="bold" textAnchor="middle">
                ÁNH SÁNG TRUYỀN THEO ĐƯỜNG THẲNG TRONG KHÔNG KHÍ
              </text>
            )}
          </svg>

          {/* Bottom Observation Note */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-xs text-slate-400">
            <span>
              {obstacleDistance < 20
                ? '⭐ Vật cản rất gần đèn pin: Chùm sáng bị che rộng hơn, bóng trên màn phóng to cực đại!'
                : '⭐ Vật cản lùi xa đèn pin: Chùm sáng bị che hẹp hơn, bóng trên màn thu nhỏ lại.'}
            </span>
          </div>
        </div>

        {/* Right: Optical Controls Deck */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4 bg-slate-50/50 p-5 rounded-xl border border-slate-200">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Thông số vị trí và vật liệu
              </span>
              <span className="text-xs text-sky-600 font-semibold font-mono">
                d = {obstacleDistance} cm
              </span>
            </div>

            {/* Material Selector */}
            <div className="mt-4">
              <span className="text-xs font-semibold text-slate-700 block mb-2">
                1. Loại vật liệu thử nghiệm:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => {
                    setObstacleType('opaque');
                    if (onExperimentAction) onExperimentAction('Chọn vật liệu', 'Tấm bìa chắn sáng');
                  }}
                  className={`py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-all ${
                    obstacleType === 'opaque'
                      ? 'bg-sky-600 text-white border-sky-700 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Bìa cứng
                </button>
                <button
                  onClick={() => {
                    setObstacleType('transparent');
                    if (onExperimentAction) onExperimentAction('Chọn vật liệu', 'Tấm thủy tinh trong suốt');
                  }}
                  className={`py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-all ${
                    obstacleType === 'transparent'
                      ? 'bg-sky-600 text-white border-sky-700 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Kính trong
                </button>
                <button
                  onClick={() => {
                    setObstacleType('translucent');
                    if (onExperimentAction) onExperimentAction('Chọn vật liệu', 'Kính mờ');
                  }}
                  className={`py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-all ${
                    obstacleType === 'translucent'
                      ? 'bg-sky-600 text-white border-sky-700 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Kính mờ
                </button>
              </div>
            </div>

            {/* Obstacle Distance Slider */}
            <div className="mt-5">
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>2. Khoảng cách: Đèn pin → Vật cản</span>
                <span className="font-mono text-cyan-600 font-bold">{obstacleDistance} cm</span>
              </div>
              <input
                type="range"
                min="12"
                max="55"
                value={obstacleDistance}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setObstacleDistance(val);
                  if (onExperimentAction) onExperimentAction('Dịch chuyển vật cản', `${val} cm`);
                }}
                className="w-full accent-cyan-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>Gần đèn (Bóng to)</span>
                <span>Xa đèn (Bóng nhỏ)</span>
              </div>
            </div>

            {/* Quick buttons */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => setObstacleDistance(15)}
                className="py-1.5 px-2.5 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-sky-50 transition-colors shadow-2xs"
              >
                Đưa lại gần đèn (15cm)
              </button>
              <button
                onClick={() => setObstacleDistance(50)}
                className="py-1.5 px-2.5 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-sky-50 transition-colors shadow-2xs"
              >
                Đưa ra xa đèn (50cm)
              </button>
            </div>
          </div>

          {/* Scientific Insight Card */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs space-y-1.5 text-slate-600">
            <span className="font-semibold text-slate-800 block">Quy luật khoa học:</span>
            <p>
              Do <strong>ánh sáng truyền thẳng</strong>, các tia sáng chạm vào vật cản bị chặn lại, không thể uốn vòng qua vật. Phía sau vật cản là vùng tối không nhận được ánh sáng.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
