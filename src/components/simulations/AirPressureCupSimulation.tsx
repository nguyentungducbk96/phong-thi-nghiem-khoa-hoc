import React, { useState, useEffect, useRef } from 'react';
import { soundManager } from '../../utils/audio';
import { RotateCcw, HelpCircle, CheckCircle2, AlertCircle, Volume2, VolumeX } from 'lucide-react';

interface Props {
  onExperimentAction?: (actionName: string, detail: string) => void;
}

export const AirPressureCupSimulation: React.FC<Props> = ({ onExperimentAction }) => {
  // Depth in percent (0 = above water, 100 = deep in tank)
  const [depth, setDepth] = useState<number>(10);
  // Tilt in degrees (-40 to +40)
  const [tilt, setTilt] = useState<number>(0);
  // Bubble release count
  const [bubbleCount, setBubbleCount] = useState<number>(0);
  // Water inside cup (0 = no water, 100 = completely filled)
  const [waterInsideCup, setWaterInsideCup] = useState<number>(0);
  // Sound mute state
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getIsMuted());
  // Show inspection overlay
  const [showRuler, setShowRuler] = useState<boolean>(true);

  // If cup is submerged and tilted, bubbles escape and water fills cup
  useEffect(() => {
    const isSubmerged = depth > 45;
    const isTilted = Math.abs(tilt) >= 15;

    if (isSubmerged && isTilted) {
      const interval = setInterval(() => {
        setWaterInsideCup((prev) => {
          if (prev < 90) {
            soundManager.playBubble(1 + Math.random() * 0.4);
            setBubbleCount((c) => c + 1);
            if (onExperimentAction && prev === 0) {
              onExperimentAction('Nghiêng cốc', 'Không khí thoát ra ngoài dạng bọt khí, nước tràn vào thế chỗ');
            }
            return Math.min(90, prev + 12);
          }
          return prev;
        });
      }, 350);

      return () => clearInterval(interval);
    }
  }, [depth, tilt, onExperimentAction]);

  // ---- Kéo cốc bằng chuột hoặc ngón tay ----
  // Kéo lên/xuống: nhúng cốc; kéo sang trái/phải: nghiêng cốc
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; depth: number; tilt: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const toSvgPoint = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  };

  const clampDepth = (v: number) => Math.max(5, Math.min(95, Math.round(v)));
  const clampTilt = (v: number) => Math.max(-35, Math.min(35, Math.round(v)));

  const handleCupPointerDown = (e: React.PointerEvent) => {
    const p = toSvgPoint(e.clientX, e.clientY);
    if (!p) return;
    e.preventDefault();
    dragRef.current = { startX: p.x, startY: p.y, depth, tilt };
    setIsDragging(true);
    svgRef.current?.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const start = dragRef.current;
    if (!start) return;
    const p = toSvgPoint(e.clientX, e.clientY);
    if (!p) return;
    setDepth(clampDepth(start.depth + (p.y - start.startY) / 1.5));
    setTilt(clampTilt(start.tilt + (p.x - start.startX) / 3));
  };

  const handlePointerUp = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setIsDragging(false);
    if (onExperimentAction) {
      onExperimentAction(
        'Kéo cốc',
        `Độ sâu ${depth}%, nghiêng ${tilt}° (${depth > 45 ? 'cốc ở dưới nước' : 'cốc trên mặt nước'})`
      );
    }
  };

  const handleCupKeyDown = (e: React.KeyboardEvent) => {
    const keys: Record<string, () => void> = {
      ArrowDown: () => setDepth((d) => clampDepth(d + 5)),
      ArrowUp: () => setDepth((d) => clampDepth(d - 5)),
      ArrowLeft: () => setTilt((t) => clampTilt(t - 5)),
      ArrowRight: () => setTilt((t) => clampTilt(t + 5))
    };
    if (keys[e.key]) {
      e.preventDefault();
      keys[e.key]();
      onExperimentAction?.('Di chuyển cốc bằng bàn phím', e.key.replace('Arrow', 'Phím '));
    }
  };

  const handleReset = () => {
    setDepth(10);
    setTilt(0);
    setBubbleCount(0);
    setWaterInsideCup(0);
    if (onExperimentAction) {
      onExperimentAction('Đặt lại thí nghiệm', 'Đưa cốc về trạng thái ban đầu');
    }
  };

  const isSubmerged = depth > 45;
  const isPaperDry = waterInsideCup < 70;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Simulation Header Bar */}
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 sm:gap-4 bg-slate-50/70">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            Mô phỏng: Chiếc cốc úp ngược trong chậu nước
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Kéo chiếc cốc (hoặc dùng thanh trượt): kéo xuống để nhúng, kéo sang ngang để nghiêng
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const muted = soundManager.toggleMute();
              setIsMuted(muted);
            }}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors text-xs flex items-center gap-1.5"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            aria-pressed={isMuted}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-cyan-600" />}
            <span className="hidden sm:inline">{isMuted ? 'Đã tắt tiếng' : 'Âm thanh'}</span>
          </button>
          <button
            onClick={() => setShowRuler(!showRuler)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              showRuler
                ? 'bg-cyan-50 border-cyan-300 text-cyan-800'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {showRuler ? 'Ẩn thước đo' : 'Hiện thước đo'}
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

      {/* Main Canvas & Stage */}
      <div className="p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
        {/* Left: SVG Canvas Stage */}
        <div className="lg:col-span-8 bg-gradient-to-b from-sky-50 via-cyan-50/40 to-blue-50/80 rounded-xl border border-sky-100 p-3 sm:p-4 relative sm:min-h-[420px] flex flex-col justify-end overflow-hidden">
          {/* Scientific Status Badge */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            <div className="bg-white/95 backdrop-blur-sm border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs text-xs font-medium flex items-center gap-2">
              <span className="text-slate-500">Mẩu giấy ở đáy cốc:</span>
              {isPaperDry ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> KHÔ RÁO
                </span>
              ) : (
                <span className="text-rose-600 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> BỊ ƯỚT
                </span>
              )}
            </div>
            {isSubmerged && (
              <div className="bg-white/95 backdrop-blur-sm border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs text-xs font-medium">
                <span className="text-slate-500">Trạng thái: </span>
                <span className="text-cyan-700 font-semibold">
                  {Math.abs(tilt) < 15
                    ? 'Không khí chiếm chỗ - Nước bị đẩy ra'
                    : 'Bọt khí thoát ra - Nước tràn vào'}
                </span>
              </div>
            )}
          </div>

          {/* SVG Laboratory Scene */}
          <svg
            ref={svgRef}
            viewBox="0 0 500 360"
            className="w-full h-auto max-h-[340px] select-none"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <defs>
              {/* Water Gradient */}
              <linearGradient id="tankWater" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.75" />
              </linearGradient>
              {/* Glass Glare Gradient */}
              <linearGradient id="glassReflection" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
                <stop offset="40%" stopColor="#ffffff" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.3" />
              </linearGradient>
            </defs>

            {/* Background Lab Desk */}
            <rect x="20" y="320" width="460" height="28" rx="4" fill="#cbd5e1" />
            <rect x="40" y="348" width="420" height="10" fill="#94a3b8" />

            {/* Water Tank (Glass Basin) */}
            <rect x="70" y="140" width="360" height="180" rx="12" fill="none" stroke="#0ea5e9" strokeWidth="4" />
            <rect x="72" y="152" width="356" height="166" rx="8" fill="url(#tankWater)" />

            {/* Tank Water Level Line with ripples */}
            <path
              d="M 72 152 Q 130 148, 190 152 T 310 152 T 428 152"
              fill="none"
              stroke="#0284c7"
              strokeWidth="2.5"
            />

            {/* Ruler Markings on Tank */}
            {showRuler && (
              <g opacity="0.6">
                {[160, 190, 220, 250, 280, 310].map((y, i) => (
                  <g key={y}>
                    <line x1="72" y1={y} x2="88" y2={y} stroke="#0369a1" strokeWidth="1.5" />
                    <text x="92" y={y + 3} fontSize="9" fill="#0369a1" fontFamily="monospace">
                      {(6 - i) * 5}cm
                    </text>
                  </g>
                ))}
              </g>
            )}

            {/* Dynamic Bubbles when tilted */}
            {isSubmerged && Math.abs(tilt) >= 15 && (
              <g>
                {[...Array(6)].map((_, i) => (
                  <circle
                    key={i}
                    cx={250 + (tilt > 0 ? -45 : 45) + (i % 3) * 14 - 10}
                    cy={Math.max(154, 250 - ((bubbleCount * 25 + i * 22) % 110))}
                    r={4 + (i % 3) * 2.5}
                    fill="#e0f2fe"
                    stroke="#0284c7"
                    strokeWidth="1.2"
                    opacity="0.85"
                  />
                ))}
              </g>
            )}

            {/* Inverted Cup Assembly */}
            {/* Base coordinate calculation: cup moves down based on depth, rotates by tilt */}
            <g
              transform={`translate(250, ${70 + (depth * 1.5)}) rotate(${tilt}) translate(-50, -90)`}
              className={`${isDragging ? 'cursor-grabbing' : 'cursor-grab transition-transform duration-100 ease-out'} focus:outline-none`}
              style={{ touchAction: 'none' }}
              role="slider"
              tabIndex={0}
              aria-label="Chiếc cốc: kéo lên xuống để nhúng, kéo sang ngang để nghiêng. Dùng phím mũi tên trên bàn phím."
              aria-valuemin={5}
              aria-valuemax={95}
              aria-valuenow={depth}
              aria-valuetext={`Độ sâu ${depth}%, nghiêng ${tilt} độ`}
              onPointerDown={handleCupPointerDown}
              onKeyDown={handleCupKeyDown}
            >
              {/* Vùng bấm rộng hơn để dễ kéo trên màn hình cảm ứng */}
              <rect x="-10" y="-40" width="120" height="170" fill="transparent" />
              {/* Hand Holding the Cup (Educational visual) */}
              <path
                d="M 20 -25 C 20 -35, 80 -35, 80 -25 L 75 -5 L 25 -5 Z"
                fill="#fdba74"
                stroke="#ea580c"
                strokeWidth="1.5"
              />

              {/* Inverted Cup Glass Walls */}
              {/* Cup is inverted: Top in SVG coordinate is actually bottom of the cup */}
              <polygon
                points="15,0 85,0 95,120 5,120"
                fill="rgba(240, 249, 255, 0.45)"
                stroke="#0284c7"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />

              {/* Glass Reflection Highlight */}
              <polygon points="20,5 35,5 30,115 12,115" fill="url(#glassReflection)" />

              {/* Trapped Air Space / Water Inside Cup */}
              {/* Water rising from bottom of the cup (which is the rim at y=120) */}
              {waterInsideCup > 0 && (
                <rect
                  x="8"
                  y={120 - waterInsideCup * 1.15}
                  width="84"
                  height={waterInsideCup * 1.15}
                  fill="#0284c7"
                  opacity="0.6"
                />
              )}

              {/* Trapped Air Bubble Pocket (Air volume) */}
              {waterInsideCup < 85 && (
                <rect
                  x="16"
                  y="5"
                  width="68"
                  height={115 - waterInsideCup * 1.15}
                  fill="#e0f2fe"
                  opacity="0.25"
                />
              )}

              {/* Dry Paper attached to the bottom inside of the cup (y near 0) */}
              <g transform="translate(32, 12)">
                <rect
                  x="0"
                  y="0"
                  width="36"
                  height="22"
                  rx="3"
                  fill={isPaperDry ? '#fef08a' : '#94a3b8'}
                  stroke={isPaperDry ? '#ca8a04' : '#475569'}
                  strokeWidth="1.5"
                />
                <text
                  x="18"
                  y="14"
                  fontSize="8"
                  fontWeight="bold"
                  textAnchor="middle"
                  fill={isPaperDry ? '#854d0e' : '#1e293b'}
                >
                  {isPaperDry ? 'MẨU GIẤY' : 'ƯỚT'}
                </text>
              </g>

              {/* Air Text Annotation inside cup */}
              {waterInsideCup < 60 && (
                <text
                  x="50"
                  y="65"
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="middle"
                  fill="#0369a1"
                  opacity="0.8"
                >
                  KHÔNG KHÍ
                </text>
              )}
            </g>
          </svg>
        </div>

        {/* Right: Interactive Controls & Observation Deck */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4 bg-slate-50/50 p-4 sm:p-5 rounded-xl border border-slate-200">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Bảng điều khiển thí nghiệm
              </span>
              <span className="text-xs text-cyan-600 font-semibold font-mono">
                Độ sâu: {Math.round(depth)}%
              </span>
            </div>

            {/* Control 1: Depth Slider */}
            <div className="mt-4">
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>1. Độ sâu nhúng cốc:</span>
                <span className="text-slate-500">
                  {depth < 40 ? 'Trên mặt nước' : depth < 70 ? 'Nhúng ngang' : 'Đáy chậu'}
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="95"
                value={depth}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setDepth(val);
                  if (onExperimentAction) {
                    onExperimentAction('Nhúng cốc bằng thanh trượt', `Độ sâu ${val}%`);
                  }
                }}
                className="w-full accent-cyan-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>Mặt nước</span>
                <span>Chìm sâu</span>
              </div>
            </div>

            {/* Control 2: Tilt Slider */}
            <div className="mt-4">
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>2. Góc nghiêng cốc:</span>
                <span className={`font-mono ${Math.abs(tilt) >= 15 ? 'text-amber-600 font-bold' : 'text-slate-500'}`}>
                  {tilt}° {Math.abs(tilt) >= 15 ? '(Nghiêng thoát khí)' : '(Thẳng đứng)'}
                </span>
              </div>
              <input
                type="range"
                min="-35"
                max="35"
                value={tilt}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTilt(val);
                  onExperimentAction?.('Nghiêng cốc bằng thanh trượt', `${val}°`);
                }}
                className="w-full accent-cyan-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>Nghiêng trái (-35°)</span>
                <span>0°</span>
                <span>Nghiêng phải (+35°)</span>
              </div>
            </div>

            {/* Quick Action Buttons for Touch / Mouse Ease */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => {
                  setDepth(80);
                  setTilt(0);
                  soundManager.playBubble(0.8);
                  onExperimentAction?.('Nhúng thẳng đứng', 'Cốc ở dưới nước, giữ thẳng');
                }}
                className="py-2 px-3 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-cyan-50 hover:text-cyan-800 hover:border-cyan-200 transition-colors shadow-2xs"
              >
                Nhúng thẳng đứng
              </button>
              <button
                onClick={() => {
                  setDepth(80);
                  setTilt(25);
                  onExperimentAction?.('Nghiêng cốc', 'Cốc ở dưới nước, nghiêng 25°');
                }}
                className="py-2 px-3 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-200 transition-colors shadow-2xs"
              >
                Nghiêng cốc thoát khí
              </button>
            </div>
          </div>

          {/* Real-time Scientific Explanation Box */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs">
            <div className="flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-slate-600">
                <span className="font-semibold text-slate-800 block">Hiện tượng quan sát:</span>
                {isSubmerged && Math.abs(tilt) < 15 && (
                  <p className="text-slate-600">
                    Cốc chứa đầy không khí bên trong. Khi nhúng thẳng đứng, không khí chiếm chỗ ngăn không cho nước tràn vào, nên mẩu giấy vẫn khô ráo!
                  </p>
                )}
                {isSubmerged && Math.abs(tilt) >= 15 && (
                  <p className="text-amber-800">
                    Khi nghiêng cốc, không khí thoát ra dưới dạng các bọt khí tròn nổi lên. Lúc này nước mới tràn vào chiếm chỗ, làm ướt mẩu giấy!
                  </p>
                )}
                {!isSubmerged && (
                  <p className="text-slate-500">
                    Em hãy kéo chiếc cốc xuống chậu nước (hoặc dùng thanh trượt) để bắt đầu nhé!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
