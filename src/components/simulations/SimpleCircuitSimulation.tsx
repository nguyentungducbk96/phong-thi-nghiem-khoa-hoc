import React, { useState, useRef } from 'react';
import { soundManager } from '../../utils/audio';
import { RotateCcw, Zap, AlertTriangle, CheckCircle2, XCircle, Trash2, MousePointerClick } from 'lucide-react';

interface Props {
  onExperimentAction?: (actionName: string, detail: string) => void;
}

type TerminalId = 'bat+' | 'bat-' | 'sw1' | 'sw2' | 'bulb1' | 'bulb2';

interface Terminal {
  id: TerminalId;
  x: number;
  y: number;
  label: string;
  color: string;
}

// Vị trí các đầu nối trên bản vẽ SVG (viewBox 520 x 340)
const TERMINALS: Terminal[] = [
  { id: 'bat+', x: 90, y: 92, label: 'cực (+) của pin', color: '#f87171' },
  { id: 'bat-', x: 90, y: 222, label: 'cực (−) của pin', color: '#60a5fa' },
  { id: 'sw1', x: 220, y: 70, label: 'chốt trái của công tắc', color: '#e2e8f0' },
  { id: 'sw2', x: 300, y: 70, label: 'chốt phải của công tắc', color: '#e2e8f0' },
  { id: 'bulb1', x: 394, y: 220, label: 'chốt trái của bóng đèn', color: '#fbbf24' },
  { id: 'bulb2', x: 426, y: 220, label: 'chốt phải của bóng đèn', color: '#fbbf24' }
];

const termById = (id: TerminalId) => TERMINALS.find((t) => t.id === id)!;

interface Wire {
  id: string;
  a: TerminalId;
  b: TerminalId;
}

const WIRE_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#a855f7', '#ec4899', '#14b8a6'];

// Gom các đầu nối được nối liền với nhau (bằng dây, hoặc qua công tắc đang đóng)
const buildGroups = (wires: Wire[], switchClosed: boolean) => {
  const parent: Record<string, string> = {};
  TERMINALS.forEach((t) => (parent[t.id] = t.id));
  const find = (x: string): string => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const union = (a: string, b: string) => {
    parent[find(a)] = find(b);
  };
  wires.forEach((w) => union(w.a, w.b));
  if (switchClosed) union('sw1', 'sw2');
  return find;
};

const analyzeCircuit = (wires: Wire[], switchClosed: boolean) => {
  const find = buildGroups(wires, switchClosed);
  const same = (a: TerminalId, b: TerminalId) => find(a) === find(b);
  const shortCircuit = same('bat+', 'bat-');
  const bulbBypassed = same('bulb1', 'bulb2');
  const bulbInLoop =
    (same('bat+', 'bulb1') && same('bulb2', 'bat-')) || (same('bat+', 'bulb2') && same('bulb1', 'bat-'));
  const isLit = bulbInLoop && !shortCircuit && !bulbBypassed;

  // Công tắc có thật sự điều khiển đèn không: thử mở công tắc xem đèn còn sáng không
  const findOpen = buildGroups(wires, false);
  const sameOpen = (a: TerminalId, b: TerminalId) => findOpen(a) === findOpen(b);
  const litWithSwitchOpen =
    ((sameOpen('bat+', 'bulb1') && sameOpen('bulb2', 'bat-')) ||
      (sameOpen('bat+', 'bulb2') && sameOpen('bulb1', 'bat-'))) &&
    !sameOpen('bat+', 'bat-') &&
    !sameOpen('bulb1', 'bulb2');

  return { isLit, shortCircuit, bulbBypassed, switchInLoop: isLit && !litWithSwitchOpen };
};

export const SimpleCircuitSimulation: React.FC<Props> = ({ onExperimentAction }) => {
  // Mạch bắt đầu chưa nối dây nào
  const [wires, setWires] = useState<Wire[]>([]);
  const [isSwitchClosed, setIsSwitchClosed] = useState<boolean>(false);
  const [selected, setSelected] = useState<TerminalId | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [notice, setNotice] = useState<string>('');
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef<boolean>(false);

  const { isLit, shortCircuit, bulbBypassed, switchInLoop } = analyzeCircuit(wires, isSwitchClosed);

  const log = (action: string, detail: string) => onExperimentAction?.(action, detail);

  const toSvgPoint = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  };

  const nearestTerminal = (x: number, y: number): TerminalId | null => {
    let best: TerminalId | null = null;
    let bestD = 24;
    TERMINALS.forEach((t) => {
      const d = Math.hypot(t.x - x, t.y - y);
      if (d < bestD) {
        bestD = d;
        best = t.id;
      }
    });
    return best;
  };

  const connect = (a: TerminalId, b: TerminalId) => {
    setSelected(null);
    setDragPos(null);
    if (a === b) return;
    const exists = wires.some((w) => (w.a === a && w.b === b) || (w.a === b && w.b === a));
    if (exists) {
      setNotice('Hai đầu này đã được nối rồi.');
      return;
    }
    const wire: Wire = { id: `w_${Date.now()}`, a, b };
    const next = [...wires, wire];
    setWires(next);
    setNotice('');
    soundManager.playSwitchClick(true);
    const result = analyzeCircuit(next, isSwitchClosed);
    log('Nối dây', `${termById(a).label} → ${termById(b).label}${result.isLit ? ' (đèn sáng)' : ''}`);
  };

  const removeWire = (id: string) => {
    const w = wires.find((x) => x.id === id);
    if (!w) return;
    setWires(wires.filter((x) => x.id !== id));
    log('Tháo dây', `${termById(w.a).label} – ${termById(w.b).label}`);
  };

  // Chọn đầu nối: bấm đầu thứ nhất rồi bấm đầu thứ hai (hoặc kéo từ đầu này sang đầu kia)
  const activateTerminal = (id: TerminalId) => {
    if (selected && selected !== id) {
      connect(selected, id);
    } else if (selected === id) {
      setSelected(null);
    } else {
      setSelected(id);
      setNotice(`Đã chọn ${termById(id).label}. Bấm vào một đầu nối khác để nối dây.`);
    }
  };

  const handleTerminalPointerDown = (e: React.PointerEvent, id: TerminalId) => {
    e.preventDefault();
    if (selected && selected !== id) {
      connect(selected, id);
      return;
    }
    setSelected(id);
    draggingRef.current = true;
    const p = toSvgPoint(e.clientX, e.clientY);
    if (p) setDragPos(p);
    svgRef.current?.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const p = toSvgPoint(e.clientX, e.clientY);
    if (p) setDragPos(p);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const p = toSvgPoint(e.clientX, e.clientY);
    const target = p ? nearestTerminal(p.x, p.y) : null;
    if (selected && target && target !== selected) {
      connect(selected, target);
    } else {
      // Thả tại chỗ: giữ đầu nối đang chọn để bấm tiếp đầu thứ hai
      setDragPos(null);
      if (selected) setNotice(`Đã chọn ${termById(selected).label}. Bấm vào một đầu nối khác để nối dây.`);
    }
  };

  const handleToggleSwitch = () => {
    const nextState = !isSwitchClosed;
    setIsSwitchClosed(nextState);
    soundManager.playSwitchClick(nextState);
    const result = analyzeCircuit(wires, nextState);
    log(nextState ? 'Đóng công tắc' : 'Mở công tắc', result.isLit ? 'Đèn sáng' : 'Đèn không sáng');
  };

  const handleReset = () => {
    setWires([]);
    setIsSwitchClosed(false);
    setSelected(null);
    setDragPos(null);
    setNotice('');
    log('Đặt lại mạch điện', 'Tháo toàn bộ dây dẫn');
  };

  const wirePath = (w: Wire) => {
    const a = termById(w.a);
    const b = termById(w.b);
    // Đường cong nhẹ (lệch vuông góc với đoạn thẳng nối 2 đầu) cho dễ nhìn
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const cx = (a.x + b.x) / 2 + (-dy / len) * 35;
    const cy = (a.y + b.y) / 2 + (dx / len) * 35;
    return `M ${a.x} ${a.y} Q ${cx} ${cy}, ${b.x} ${b.y}`;
  };

  const status = shortCircuit
    ? { ok: false, text: 'ĐOẢN MẠCH! Hai cực pin nối thẳng với nhau' }
    : isLit
    ? { ok: true, text: 'MẠCH KÍN – ĐÈN SÁNG' }
    : { ok: false, text: 'MẠCH HỞ – ĐÈN TẮT' };

  const hint = shortCircuit
    ? 'Dây đang nối thẳng cực (+) với cực (−) của pin nên dòng điện không đi qua bóng đèn. Với điện thật, đoản mạch làm pin nóng lên và rất nguy hiểm. Hãy tháo dây đó ra.'
    : bulbBypassed
    ? 'Hai chốt của bóng đèn đang bị nối thẳng với nhau, dòng điện đi vòng qua dây chứ không qua đèn.'
    : isLit && !switchInLoop
    ? 'Đèn sáng, nhưng công tắc chưa nằm trong mạch nên không bật/tắt được đèn. Em thử nối công tắc vào giữa pin và bóng đèn nhé!'
    : isLit
    ? 'Tuyệt! Dòng điện đi từ pin, qua công tắc đang đóng, qua bóng đèn rồi về pin. Thử mở công tắc xem sao!'
    : wires.length === 0
    ? 'Bấm vào một đầu nối (chấm tròn) rồi bấm vào đầu nối khác để nối dây. Trên máy tính, em cũng có thể kéo từ đầu này sang đầu kia.'
    : !isSwitchClosed && analyzeCircuit(wires, true).isLit
    ? 'Các dây đã nối đúng. Công tắc đang mở nên mạch còn hở – hãy đóng công tắc!'
    : 'Mạch chưa khép kín. Dòng điện cần một đường đi liền từ cực (+) qua công tắc, bóng đèn rồi về cực (−).';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 sm:gap-4 bg-slate-50/70">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            Mô phỏng: Lắp mạch điện thắp sáng đơn giản
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Tự nối dây giữa pin, công tắc và bóng đèn rồi đóng công tắc
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-2xs"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          Làm lại (tháo hết dây)
        </button>
      </div>

      <div className="p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
        {/* SVG Circuit Canvas */}
        <div className="lg:col-span-8 bg-slate-900 rounded-xl p-3 sm:p-4 relative sm:min-h-[420px] flex flex-col justify-between overflow-hidden text-white">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs z-10">
            <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-lg" aria-live="polite">
              <span className="text-slate-400">Trạng thái:</span>
              <span className={`${status.ok ? 'text-emerald-400' : 'text-rose-400'} font-bold flex items-center gap-1`}>
                {status.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                {status.text}
              </span>
            </div>
            <div className="bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-lg">
              Số dây đã nối: <strong className="text-amber-400">{wires.length}</strong>
            </div>
          </div>

          <svg
            ref={svgRef}
            viewBox="0 0 520 340"
            className="w-full h-auto max-h-[320px] select-none my-auto"
            style={{ touchAction: 'none' }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => {
              draggingRef.current = false;
              setDragPos(null);
            }}
          >
            <defs>
              <radialGradient id="bulbGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </radialGradient>
            </defs>

            <rect x="20" y="305" width="480" height="15" fill="#1e293b" rx="4" />

            {/* BATTERY */}
            <g transform="translate(90, 160)">
              <rect x="-35" y="-55" width="70" height="110" rx="8" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="2" />
              <rect x="-14" y="-68" width="28" height="14" rx="3" fill="#cbd5e1" stroke="#94a3b8" />
              <text x="0" y="-35" fontSize="14" fontWeight="bold" fill="#f87171" textAnchor="middle">+</text>
              <text x="0" y="45" fontSize="16" fontWeight="bold" fill="#60a5fa" textAnchor="middle">−</text>
              <text x="0" y="5" fontSize="10" fontWeight="bold" fill="#ffffff" textAnchor="middle">PIN 1,5V</text>
            </g>

            {/* SWITCH */}
            <g transform="translate(260, 70)">
              <rect x="-60" y="-18" width="120" height="36" rx="5" fill="#334155" stroke="#475569" strokeWidth="1.5" />
              <g
                transform={`translate(-40, 0) rotate(${isSwitchClosed ? 0 : -32})`}
                className="transition-transform duration-200 cursor-pointer focus:outline-none"
                role="button"
                tabIndex={0}
                aria-label={isSwitchClosed ? 'Mở công tắc' : 'Đóng công tắc'}
                onClick={handleToggleSwitch}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleToggleSwitch();
                  }
                }}
              >
                {/* Vùng bấm rộng cho ngón tay */}
                <rect x="-6" y="-24" width="100" height="48" fill="transparent" />
                <line x1="0" y1="0" x2="80" y2="0" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
                <circle cx="80" cy="0" r="7" fill="#ef4444" />
              </g>
              <text x="0" y="32" fontSize="9.5" fill="#cbd5e1" textAnchor="middle" fontWeight="bold">
                CÔNG TẮC ({isSwitchClosed ? 'ĐÓNG' : 'MỞ'})
              </text>
            </g>

            {/* BULB */}
            <g transform="translate(410, 170)">
              {isLit && <circle cx="0" cy="-30" r="65" fill="url(#bulbGlow)" opacity="0.6" className="animate-pulse" />}
              <rect x="-24" y="25" width="48" height="35" rx="5" fill="#475569" stroke="#64748b" strokeWidth="1.5" />
              <circle
                cx="0"
                cy="-20"
                r="40"
                fill={isLit ? '#fef08a' : 'rgba(241, 245, 249, 0.25)'}
                stroke={isLit ? '#f59e0b' : '#94a3b8'}
                strokeWidth="2.5"
              />
              <path d="M -12 15 L -8 -15 Q 0 -35, 8 -15 L 12 15" fill="none" stroke={isLit ? '#dc2626' : '#64748b'} strokeWidth="2" />
              <text x="0" y="78" fontSize="10" fill="#cbd5e1" textAnchor="middle" fontWeight="bold">BÓNG ĐÈN</text>
            </g>

            {/* WIRES: bấm vào dây để tháo */}
            {wires.map((w, idx) => (
              <g key={w.id}>
                <path d={wirePath(w)} fill="none" stroke={WIRE_COLORS[idx % WIRE_COLORS.length]} strokeWidth="4" strokeLinecap="round" />
                <path
                  d={wirePath(w)}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="16"
                  className="cursor-pointer"
                  onClick={() => removeWire(w.id)}
                >
                  <title>Bấm để tháo dây này</title>
                </path>
              </g>
            ))}

            {/* Rubber-band wire while dragging */}
            {selected && dragPos && (
              <line
                x1={termById(selected).x}
                y1={termById(selected).y}
                x2={dragPos.x}
                y2={dragPos.y}
                stroke="#fde68a"
                strokeWidth="3"
                strokeDasharray="6,4"
                pointerEvents="none"
              />
            )}

            {/* Current flow dots */}
            {isLit && (
              <g fill="#fef08a" pointerEvents="none">
                {wires.map((w) => {
                  const a = termById(w.a);
                  const b = termById(w.b);
                  return <circle key={w.id} cx={(a.x + b.x) / 2} cy={(a.y + b.y) / 2} r="3" className="animate-ping" />;
                })}
              </g>
            )}

            {/* TERMINALS (đầu nối) */}
            {TERMINALS.map((t) => (
              <g
                key={t.id}
                role="button"
                tabIndex={0}
                aria-label={`Đầu nối: ${t.label}${selected === t.id ? ' (đang chọn)' : ''}`}
                aria-pressed={selected === t.id}
                className="cursor-pointer focus:outline-none"
                onPointerDown={(e) => handleTerminalPointerDown(e, t.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    activateTerminal(t.id);
                  }
                }}
              >
                <circle cx={t.x} cy={t.y} r="22" fill="transparent" />
                {selected === t.id && (
                  <circle cx={t.x} cy={t.y} r="13" fill="none" stroke="#fde68a" strokeWidth="2.5" className="animate-pulse" />
                )}
                <circle cx={t.x} cy={t.y} r="7" fill={t.color} stroke="#ffffff" strokeWidth="2" />
              </g>
            ))}
          </svg>

          {/* Safety Notice */}
          <div className="bg-amber-500/20 border border-amber-400/40 rounded-lg p-2.5 flex items-center gap-2 text-xs text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>An toàn điện:</strong> Đây là mô phỏng pin 1,5V điện áp thấp, không phải hướng dẫn dùng điện lưới. Tuyệt đối không cắm dây vào ổ điện trong nhà vì có thể bị điện giật rất nguy hiểm!
            </span>
          </div>
        </div>

        {/* Right panel */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4 bg-slate-50/50 p-4 sm:p-5 rounded-xl border border-slate-200">
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 flex items-start gap-2" aria-live="polite">
              <MousePointerClick className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
              <span>{notice || hint}</span>
            </div>

            <button
              onClick={handleToggleSwitch}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
                isSwitchClosed ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-800 text-white hover:bg-slate-900'
              }`}
            >
              <Zap className="w-4 h-4" />
              {isSwitchClosed ? 'MỞ CÔNG TẮC' : 'ĐÓNG CÔNG TẮC'}
            </button>

            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
                Dây đã nối ({wires.length})
              </span>
              {wires.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Chưa có dây nào.</p>
              ) : (
                <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {wires.map((w, idx) => (
                    <li key={w.id} className="flex items-center justify-between gap-2 p-2 bg-white border border-slate-200 rounded-lg text-[11px]">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: WIRE_COLORS[idx % WIRE_COLORS.length] }} />
                        {termById(w.a).label} ↔ {termById(w.b).label}
                      </span>
                      <button
                        onClick={() => removeWire(w.id)}
                        aria-label="Tháo dây này"
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs space-y-1.5 text-slate-600">
            <span className="font-semibold text-slate-800 block">Điều kiện để bóng đèn sáng:</span>
            <ul className="list-disc list-inside space-y-1">
              <li>Có nguồn điện (pin).</li>
              <li>Dây dẫn nối thành vòng kín từ cực (+) qua bóng đèn về cực (−).</li>
              <li>Công tắc trong mạch phải đóng.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
