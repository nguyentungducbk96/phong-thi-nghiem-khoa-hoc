import React, { useState } from 'react';
import { RotateCcw, Lightbulb } from 'lucide-react';

interface Props {
  onExperimentAction?: (actionName: string, detail: string) => void;
}

export const LightPropagationSimulation: React.FC<Props> = ({ onExperimentAction }) => {
  // Light On/Off
  const [isLightOn, setIsLightOn] = useState<boolean>(true);
  // Vị trí trên thanh trượt quang học (cm, từ 0 đến 100)
  const [lightPos, setLightPos] = useState<number>(5);
  const [obstaclePos, setObstaclePos] = useState<number>(30);
  const [screenPos, setScreenPos] = useState<number>(90);
  // Obstacle material: 'opaque' (Bìa chắn sáng), 'transparent' (Kính trong), 'translucent' (Kính mờ)
  const [obstacleType, setObstacleType] = useState<'opaque' | 'transparent' | 'translucent'>('opaque');
  const obstacleRadius = 24;
  const MIN_GAP = 8;

  const log = (action: string, detail: string) => onExperimentAction?.(action, detail);

  const handleReset = () => {
    setIsLightOn(true);
    setLightPos(5);
    setObstaclePos(30);
    setScreenPos(90);
    setObstacleType('opaque');
    log('Đặt lại thí nghiệm', 'Trở về vị trí ban đầu');
  };

  // Giữ thứ tự: đèn < vật cản < màn
  const moveLight = (v: number) => {
    const val = Math.min(v, obstaclePos - MIN_GAP);
    setLightPos(val);
    log('Di chuyển nguồn sáng', `${val} cm`);
  };
  const moveObstacle = (v: number) => {
    const val = Math.max(lightPos + MIN_GAP, Math.min(v, screenPos - MIN_GAP));
    setObstaclePos(val);
    log('Di chuyển vật cản', `${val} cm`);
  };
  const moveScreen = (v: number) => {
    const val = Math.max(v, obstaclePos + MIN_GAP);
    setScreenPos(val);
    log('Di chuyển màn hứng', `${val} cm`);
  };

  // Hình học đơn giản (đèn coi như một điểm): bóng to gấp
  // (khoảng cách đèn → màn) / (khoảng cách đèn → vật) lần vật cản.
  const ratio = (screenPos - lightPos) / (obstaclePos - lightPos);
  const rawShadow = obstacleRadius * ratio;
  const SCREEN_HALF = 130;
  const shadowRadius = obstacleType === 'transparent' ? 0 : Math.min(SCREEN_HALF, rawShadow);
  const shadowTooBig = obstacleType !== 'transparent' && rawShadow > SCREEN_HALF;

  const toX = (cm: number) => 30 + cm * 4.4;
  const lightX = toX(lightPos);
  const obstacleX = toX(obstaclePos);
  const screenX = toX(screenPos);
  const beamHalf = Math.min(SCREEN_HALF, (screenX - lightX) * 0.45);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 sm:gap-4 bg-slate-50/70">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            Mô phỏng: Sự truyền thẳng của ánh sáng & Tạo thành bóng tối
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Bật đèn, di chuyển đèn, vật cản và màn hứng rồi quan sát bóng trên màn
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

      <div className="p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
        {/* SVG Optical Bench */}
        <div className="lg:col-span-8 bg-slate-950 rounded-xl p-3 sm:p-4 relative sm:min-h-[420px] flex flex-col justify-between overflow-hidden text-white">
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
              Bóng to gấp: <strong className="text-amber-400">
                {obstacleType === 'transparent' || !isLightOn ? '—' : `${ratio.toFixed(1)} lần vật`}
              </strong>
            </span>
          </div>

          <svg viewBox="0 0 500 340" className="w-full h-auto max-h-[320px] select-none my-auto">
            {/* Optical Rail (Thanh trượt quang học) */}
            <rect x="20" y="300" width="460" height="12" rx="3" fill="#334155" />
            <line x1="20" y1="306" x2="480" y2="306" stroke="#475569" strokeWidth="2" strokeDasharray="5,5" />

            {/* Light beam cone & straight rays (vẽ theo tọa độ tuyệt đối) */}
            {isLightOn && (
              <polygon
                points={`${lightX},170 ${screenX},${170 - beamHalf} ${screenX},${170 + beamHalf}`}
                fill="rgba(254, 240, 138, 0.22)"
              />
            )}
            {isLightOn && obstacleType !== 'transparent' && (
              <g stroke="#fef08a" strokeWidth="1.2" strokeDasharray="3,3" opacity="0.7">
                <line x1={lightX} y1="170" x2={screenX} y2={170 - shadowRadius} />
                <line x1={lightX} y1="170" x2={screenX} y2={170 + shadowRadius} />
              </g>
            )}

            {/* Flashlight (nguồn sáng) */}
            <g transform={`translate(${lightX}, 170)`} className="transition-all duration-150">
              <rect x="-40" y="-12" width="40" height="24" rx="4" fill="#64748b" stroke="#94a3b8" />
              <path d="M -2 -18 L 4 -22 L 4 22 L -2 18 Z" fill="#475569" stroke="#94a3b8" />
              <circle cx="0" cy="0" r="5" fill={isLightOn ? '#fef08a' : '#334155'} />
              <rect x="-3" y="25" width="6" height="105" fill="#64748b" />
              <rect x="-16" y="125" width="32" height="6" rx="2" fill="#475569" />
              <text x="-20" y="-20" fontSize="8" fill="#94a3b8" textAnchor="middle">ĐÈN</text>
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
              {isLightOn && (
                <rect x="-3" y={-beamHalf} width="6" height={beamHalf * 2} fill="#fef9c3" rx="2" />
              )}
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
            <span aria-live="polite">
              {!isLightOn
                ? '🌑 Đèn tắt: không có ánh sáng nên cũng không thấy bóng.'
                : obstacleType === 'transparent'
                ? '⭐ Kính trong cho ánh sáng đi qua nên gần như không có bóng.'
                : shadowTooBig
                ? '⭐ Vật rất gần đèn: bóng to hơn cả màn hứng!'
                : ratio >= 2.5
                ? '⭐ Vật ở gần đèn (hoặc màn ở xa): bóng to.'
                : '⭐ Vật ở xa đèn (hoặc gần màn): bóng nhỏ, gần bằng vật.'}
            </span>
          </div>
        </div>

        {/* Right: Optical Controls Deck */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4 bg-slate-50/50 p-4 sm:p-5 rounded-xl border border-slate-200">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Vị trí và vật liệu
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

            {/* Position sliders */}
            {[
              { id: 'light-pos', label: '2. Vị trí nguồn sáng (đèn)', value: lightPos, min: 0, max: 40, onChange: moveLight },
              { id: 'obstacle-pos', label: '3. Vị trí vật cản', value: obstaclePos, min: 8, max: 92, onChange: moveObstacle },
              { id: 'screen-pos', label: '4. Vị trí màn hứng', value: screenPos, min: 50, max: 100, onChange: moveScreen }
            ].map((ctl) => (
              <div className="mt-4" key={ctl.id}>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                  <label htmlFor={ctl.id}>{ctl.label}</label>
                  <span className="font-mono text-cyan-600 font-bold">{ctl.value} cm</span>
                </div>
                <input
                  id={ctl.id}
                  type="range"
                  min={ctl.min}
                  max={ctl.max}
                  value={ctl.value}
                  onChange={(e) => ctl.onChange(Number(e.target.value))}
                  className="w-full accent-cyan-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>
            ))}
            <div className="mt-3 p-2.5 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-600 space-y-0.5">
              <p>Khoảng cách đèn → vật cản: <strong>{obstaclePos - lightPos} cm</strong></p>
              <p>Khoảng cách đèn → màn: <strong>{screenPos - lightPos} cm</strong></p>
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
