import React, { useState } from 'react';
import { soundManager } from '../../utils/audio';
import { RotateCcw, Zap, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  onExperimentAction?: (actionName: string, detail: string) => void;
}

export const SimpleCircuitSimulation: React.FC<Props> = ({ onExperimentAction }) => {
  // Wire 1: Battery (+) -> Switch Terminal A
  const [wire1Connected, setWire1Connected] = useState<boolean>(true);
  // Wire 2: Switch Terminal B -> Bulb Terminal A
  const [wire2Connected, setWire2Connected] = useState<boolean>(true);
  // Wire 3: Bulb Terminal B -> Battery (-)
  const [wire3Connected, setWire3Connected] = useState<boolean>(true);
  // Switch state: open (false) or closed (true)
  const [isSwitchClosed, setIsSwitchClosed] = useState<boolean>(false);

  // Circuit is complete if all 3 wires are connected AND switch is closed
  const isCircuitClosed = wire1Connected && wire2Connected && wire3Connected && isSwitchClosed;

  const handleToggleSwitch = () => {
    const nextState = !isSwitchClosed;
    setIsSwitchClosed(nextState);
    soundManager.playSwitchClick(nextState);
    if (onExperimentAction) {
      onExperimentAction(nextState ? 'Đóng công tắc' : 'Mở công tắc', nextState ? 'Mạch kín' : 'Mạch hở');
    }
  };

  const handleReset = () => {
    setWire1Connected(false);
    setWire2Connected(false);
    setWire3Connected(false);
    setIsSwitchClosed(false);
    if (onExperimentAction) {
      onExperimentAction('Đặt lại mạch điện', 'Tháo toàn bộ dây dẫn');
    }
  };

  const handleConnectAll = () => {
    setWire1Connected(true);
    setWire2Connected(true);
    setWire3Connected(true);
    setIsSwitchClosed(true);
    soundManager.playSwitchClick(true);
    if (onExperimentAction) {
      onExperimentAction('Lắp hoàn chỉnh mạch', 'Nối đủ 3 dây dẫn và đóng công tắc');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/70">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            Mô phỏng: Lắp ráp mạch điện thắp sáng đơn giản
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Nối các đoạn dây dẫn giữa pin, công tắc và bóng đèn rồi đóng khóa K
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleConnectAll}
            className="px-3 py-1.5 text-xs font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg transition-colors shadow-2xs"
          >
            Lắp mẫu nhanh
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
        {/* SVG Circuit Canvas */}
        <div className="lg:col-span-8 bg-slate-900 rounded-xl p-4 relative min-h-[420px] flex flex-col justify-between overflow-hidden text-white">
          <div className="flex items-center justify-between text-xs z-10">
            <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-lg">
              <span className="text-slate-400">Trạng thái mạch:</span>
              {isCircuitClosed ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> MẠCH KÍN (CÓ DÒNG ĐIỆN)
                </span>
              ) : (
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> MẠCH HỞ (KHÔNG CÓ ĐIỆN)
                </span>
              )}
            </div>
            <div className="bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-lg font-mono">
              <span className="text-amber-400 font-bold">{isCircuitClosed ? '💡 ĐÈN SÁNG' : '🌑 ĐÈN TẮT'}</span>
            </div>
          </div>

          <svg viewBox="0 0 520 340" className="w-full h-[320px] select-none my-auto">
            {/* Lab Bench Surface */}
            <rect x="20" y="305" width="480" height="15" fill="#1e293b" rx="4" />

            {/* 1. BATTERY (PIN 1.5V) at x=90, y=160 */}
            <g transform="translate(90, 160)">
              {/* Battery body */}
              <rect x="-35" y="-55" width="70" height="110" rx="8" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="2" />
              {/* Positive nub (+) */}
              <rect x="-14" y="-68" width="28" height="14" rx="3" fill="#cbd5e1" stroke="#94a3b8" />
              {/* Positive label */}
              <text x="0" y="-35" fontSize="14" fontWeight="bold" fill="#f87171" textAnchor="middle">
                +
              </text>
              {/* Negative label */}
              <text x="0" y="45" fontSize="16" fontWeight="bold" fill="#60a5fa" textAnchor="middle">
                −
              </text>
              {/* Battery brand label */}
              <text x="0" y="5" fontSize="10" fontWeight="bold" fill="#ffffff" textAnchor="middle">
                PIN 1.5V
              </text>

              {/* Terminal Contact Points */}
              <circle cx="0" cy="-62" r="6" fill="#f87171" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="0" cy="55" r="6" fill="#60a5fa" stroke="#ffffff" strokeWidth="1.5" />
            </g>

            {/* 2. KNIFE SWITCH (CÔNG TẮC DAO) at x=260, y=70 */}
            <g transform="translate(260, 70)">
              {/* Wooden / plastic switch base */}
              <rect x="-60" y="-18" width="120" height="36" rx="5" fill="#334155" stroke="#475569" strokeWidth="1.5" />
              {/* Contacts */}
              <circle cx="-40" cy="0" r="6" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
              <circle cx="40" cy="0" r="6" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />

              {/* Switch Blade (Knife arm) */}
              <g
                transform={`translate(-40, 0) rotate(${isSwitchClosed ? 0 : -32})`}
                className="transition-transform duration-200 cursor-pointer"
                onClick={handleToggleSwitch}
              >
                <line x1="0" y1="0" x2="80" y2="0" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
                <circle cx="80" cy="0" r="7" fill="#ef4444" />
              </g>

              <text x="0" y="32" fontSize="9.5" fill="#cbd5e1" textAnchor="middle" fontWeight="bold">
                CÔNG TẮC ({isSwitchClosed ? 'ĐÓNG' : 'MỞ'})
              </text>
            </g>

            {/* 3. LIGHT BULB (BÓNG ĐÈN) at x=410, y=170 */}
            <g transform="translate(410, 170)">
              {/* Bulb Glow Halo when ON */}
              {isCircuitClosed && (
                <circle cx="0" cy="-30" r="65" fill="url(#bulbGlow)" opacity="0.6" className="animate-pulse" />
              )}

              {/* Bulb Base / Socket */}
              <rect x="-24" y="25" width="48" height="35" rx="5" fill="#475569" stroke="#64748b" strokeWidth="1.5" />
              <line x1="-24" y1="36" x2="24" y2="36" stroke="#94a3b8" strokeWidth="2" />
              <line x1="-24" y1="46" x2="24" y2="46" stroke="#94a3b8" strokeWidth="2" />

              {/* Bulb Screw Terminals */}
              <circle cx="-16" cy="50" r="5" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="16" cy="50" r="5" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.5" />

              {/* Glass Dome */}
              <circle
                cx="0"
                cy="-20"
                r="40"
                fill={isCircuitClosed ? '#fef08a' : 'rgba(241, 245, 249, 0.25)'}
                stroke={isCircuitClosed ? '#f59e0b' : '#94a3b8'}
                strokeWidth="2.5"
              />

              {/* Filament (Dây tóc bóng đèn) */}
              <path
                d="M -12 15 L -8 -15 Q 0 -35, 8 -15 L 12 15"
                fill="none"
                stroke={isCircuitClosed ? '#dc2626' : '#64748b'}
                strokeWidth="2"
              />

              <text x="0" y="75" fontSize="10" fill="#cbd5e1" textAnchor="middle" fontWeight="bold">
                BÓNG ĐÈN
              </text>
            </g>

            {/* WIRES (DÂY DẪN ĐIỆN) */}
            {/* Wire 1: Battery (+) to Switch Terminal Left */}
            {wire1Connected && (
              <path
                d="M 90 98 Q 90 70, 220 70"
                fill="none"
                stroke="#ef4444"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            )}

            {/* Wire 2: Switch Terminal Right to Bulb Left Terminal */}
            {wire2Connected && (
              <path
                d="M 300 70 Q 394 70, 394 220"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            )}

            {/* Wire 3: Bulb Right Terminal to Battery (-) */}
            {wire3Connected && (
              <path
                d="M 426 220 Q 426 270, 260 270 Q 90 270, 90 215"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            )}

            {/* Current flow animations (Moving dots along wires when closed) */}
            {isCircuitClosed && (
              <g fill="#fef08a">
                <circle cx="150" cy="72" r="3" className="animate-ping" />
                <circle cx="350" cy="72" r="3" className="animate-ping" />
                <circle cx="300" cy="270" r="3" className="animate-ping" />
              </g>
            )}

            <defs>
              <radialGradient id="bulbGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>

          {/* Safety Notice */}
          <div className="bg-amber-500/20 border border-amber-400/40 rounded-lg p-2.5 flex items-center gap-2 text-xs text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Lưu ý an toàn điện:</strong> Pin 1.5V có điện áp thấp, an toàn cho thí nghiệm học tập. Tuyệt đối không cắm dây vào ổ cắm điện 220V trong nhà vì có thể gây giật chết người!
            </span>
          </div>
        </div>

        {/* Right: Wire Assembly & Switch Controls */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4 bg-slate-50/50 p-5 rounded-xl border border-slate-200">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Lắp ráp các đoạn dây dẫn
              </span>
              <span className="text-xs text-cyan-600 font-semibold font-mono">
                {wire1Connected && wire2Connected && wire3Connected ? 'Đã nối đủ dây' : 'Chưa đủ dây'}
              </span>
            </div>

            <div className="mt-4 space-y-2.5">
              {/* Wire 1 */}
              <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="font-medium text-slate-700">Dây đỏ: Cực (+) → Khóa K</span>
                </div>
                <button
                  onClick={() => {
                    setWire1Connected(!wire1Connected);
                    if (onExperimentAction) onExperimentAction('Nối/tháo dây đỏ', !wire1Connected ? 'Đã nối' : 'Đã tháo');
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                    wire1Connected
                      ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {wire1Connected ? 'Đang nối' : 'Đã tháo'}
                </button>
              </div>

              {/* Wire 2 */}
              <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="font-medium text-slate-700">Dây vàng: Khóa K → Bóng đèn</span>
                </div>
                <button
                  onClick={() => {
                    setWire2Connected(!wire2Connected);
                    if (onExperimentAction) onExperimentAction('Nối/tháo dây vàng', !wire2Connected ? 'Đã nối' : 'Đã tháo');
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                    wire2Connected
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {wire2Connected ? 'Đang nối' : 'Đã tháo'}
                </button>
              </div>

              {/* Wire 3 */}
              <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="font-medium text-slate-700">Dây xanh: Bóng đèn → Cực (−)</span>
                </div>
                <button
                  onClick={() => {
                    setWire3Connected(!wire3Connected);
                    if (onExperimentAction) onExperimentAction('Nối/tháo dây xanh', !wire3Connected ? 'Đã nối' : 'Đã tháo');
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                    wire3Connected
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {wire3Connected ? 'Đang nối' : 'Đã tháo'}
                </button>
              </div>
            </div>

            {/* Switch Big Button */}
            <div className="mt-5">
              <button
                onClick={handleToggleSwitch}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
                  isSwitchClosed
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-slate-800 text-white hover:bg-slate-900'
                }`}
              >
                <Zap className="w-4 h-4" />
                {isSwitchClosed ? 'MỞ CÔNG TẮC (NGẮT ĐIỆN)' : 'ĐÓNG CÔNG TẮC (BẬT ĐIỆN)'}
              </button>
            </div>
          </div>

          {/* Educational Deck */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs space-y-1.5 text-slate-600">
            <span className="font-semibold text-slate-800 block">Điều kiện để bóng đèn sáng:</span>
            <ul className="list-disc list-inside space-y-1">
              <li>Có nguồn cung cấp điện (Pin).</li>
              <li>Dây dẫn nối khép kín từ cực dương qua bóng đèn về cực âm.</li>
              <li>Công tắc đóng kín, không bị hở bất kỳ điểm nào.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
