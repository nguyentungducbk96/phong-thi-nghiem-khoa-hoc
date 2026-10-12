import React, { useState } from 'react';
import { soundManager } from '../../utils/audio';
import { RotateCcw, Check, X, Magnet as MagnetIcon, Info } from 'lucide-react';

interface TestItem {
  id: string;
  name: string;
  material: string;
  isMagnetic: boolean;
  explanation: string;
  x: number;
  y: number;
  isAttracted: boolean;
  tested: boolean;
  icon: string;
}

const INITIAL_ITEMS: TestItem[] = [
  {
    id: 'nail',
    name: 'Đinh sắt',
    material: 'Sắt',
    isMagnetic: true,
    explanation: 'Đinh làm bằng sắt nên bị nam châm hút chặt.',
    x: 80,
    y: 70,
    isAttracted: false,
    tested: false,
    icon: '🔩'
  },
  {
    id: 'clip',
    name: 'Kẹp giấy thép',
    material: 'Thép (phần lớn là sắt)',
    isMagnetic: true,
    explanation: 'Thép có phần lớn là sắt nên bị nam châm hút.',
    x: 80,
    y: 140,
    isAttracted: false,
    tested: false,
    icon: '📎'
  },
  {
    id: 'al_coin',
    name: 'Đồng xu nhôm',
    material: 'Nhôm',
    isMagnetic: false,
    explanation: 'Nhôm là kim loại nhưng không bị nam châm hút. Không phải kim loại nào cũng bị hút!',
    x: 80,
    y: 210,
    isAttracted: false,
    tested: false,
    icon: '🪙'
  },
  {
    id: 'ni_coin',
    name: 'Đồng xu thép mạ niken',
    material: 'Lõi thép, phủ lớp niken',
    isMagnetic: true,
    explanation: 'Đồng xu mẫu này có lõi thép và lớp niken bên ngoài, cả hai đều bị nam châm hút. Đồng xu làm bằng nhôm hay đồng thì không bị hút, nên phải biết đồng xu làm bằng gì.',
    x: 80,
    y: 280,
    isAttracted: false,
    tested: false,
    icon: '🥈'
  },
  {
    id: 'wood',
    name: 'Miếng gỗ nhỏ',
    material: 'Gỗ',
    isMagnetic: false,
    explanation: 'Gỗ không bị nam châm hút.',
    x: 420,
    y: 70,
    isAttracted: false,
    tested: false,
    icon: '🪵'
  },
  {
    id: 'ruler',
    name: 'Thước kẻ nhựa',
    material: 'Nhựa',
    isMagnetic: false,
    explanation: 'Nhựa không bị nam châm hút.',
    x: 420,
    y: 140,
    isAttracted: false,
    tested: false,
    icon: '📏'
  },
  {
    id: 'paper',
    name: 'Mảnh giấy nhỏ',
    material: 'Giấy',
    isMagnetic: false,
    explanation: 'Giấy không bị nam châm hút.',
    x: 420,
    y: 210,
    isAttracted: false,
    tested: false,
    icon: '📄'
  },
  {
    id: 'spoon',
    name: 'Thìa inox (mẫu)',
    material: 'Inox loại bị nam châm hút',
    isMagnetic: true,
    explanation: 'Có loại inox bị nam châm hút, nhưng nhiều loại inox không bị hút. Chiếc thìa trong mô phỏng này là loại inox bị hút. Ở nhà, em phải thử mới biết thìa của mình thuộc loại nào.',
    x: 420,
    y: 280,
    isAttracted: false,
    tested: false,
    icon: '🥄'
  }
];

interface Props {
  onExperimentAction?: (actionName: string, detail: string) => void;
}

export const MagnetMaterialsSimulation: React.FC<Props> = ({ onExperimentAction }) => {
  const [items, setItems] = useState<TestItem[]>(INITIAL_ITEMS);
  const [magnetPos, setMagnetPos] = useState<{ x: number; y: number }>({ x: 250, y: 175 });
  const [activeItem, setActiveItem] = useState<TestItem | null>(null);
  const [showFieldLines, setShowFieldLines] = useState<boolean>(true);

  // Test bring magnet near specific item
  const testBringNear = (targetItem: TestItem) => {
    setActiveItem(targetItem);
    // Move magnet close to target
    const targetMagnetX = targetItem.x < 250 ? targetItem.x + 85 : targetItem.x - 85;
    const targetMagnetY = targetItem.y;
    setMagnetPos({ x: targetMagnetX, y: targetMagnetY });

    setTimeout(() => {
      if (targetItem.isMagnetic) {
        soundManager.playMagnetSnap();
        // Snap item to magnet
        setItems((prev) =>
          prev.map((it) =>
            it.id === targetItem.id
              ? {
                  ...it,
                  tested: true,
                  isAttracted: true,
                  x: targetItem.x < 250 ? targetMagnetX - 35 : targetMagnetX + 35,
                  y: targetMagnetY
                }
              : it
          )
        );
      } else {
        // Just mark as tested
        setItems((prev) =>
          prev.map((it) =>
            it.id === targetItem.id ? { ...it, tested: true, isAttracted: false } : it
          )
        );
      }

      if (onExperimentAction) {
        onExperimentAction(
          `Thử nam châm với ${targetItem.name}`,
          targetItem.isMagnetic ? 'Bị hút dính vào cực nam châm' : 'Không bị hút, đứng yên'
        );
      }
    }, 200);
  };

  const handleReset = () => {
    setItems(INITIAL_ITEMS);
    setMagnetPos({ x: 250, y: 175 });
    setActiveItem(null);
    if (onExperimentAction) {
      onExperimentAction('Làm lại thí nghiệm', 'Đặt lại toàn bộ các vật mẫu và nam châm');
    }
  };

  const testedCount = items.filter((i) => i.tested).length;
  const attractedCount = items.filter((i) => i.isAttracted).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/70">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            Mô phỏng: Nam châm và các vật liệu trên bàn thí nghiệm
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Đưa nam châm lại gần từng vật mẫu để quan sát phản hồi từ tính
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFieldLines(!showFieldLines)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              showFieldLines
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {showFieldLines ? 'Ẩn từ trường' : 'Hiện từ trường'}
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
        {/* SVG Lab Desk Canvas */}
        <div className="lg:col-span-8 bg-amber-50/30 rounded-xl border border-amber-200/50 p-4 relative min-h-[420px] flex flex-col justify-between overflow-hidden">
          {/* Status Indicator */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600 bg-white/90 border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
              Đã kiểm tra: <span className="text-cyan-700 font-bold">{testedCount}/{items.length} vật mẫu</span>
            </span>
            <span className="text-xs font-semibold text-slate-600 bg-white/90 border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
              Vật bị hút: <span className="text-emerald-700 font-bold">{attractedCount} vật</span>
            </span>
          </div>

          <svg viewBox="0 0 520 360" className="w-full h-[330px] select-none">
            {/* Wooden Lab Desk Background Texture */}
            <rect x="0" y="0" width="520" height="360" fill="#fefce8" rx="8" />
            {/* Desk lines */}
            <line x1="0" y1="355" x2="520" y2="355" stroke="#fcd34d" strokeWidth="2" />

            {/* Magnetic Field Lines around Magnet */}
            {showFieldLines && (
              <g opacity="0.35" stroke="#6366f1" strokeWidth="1.2" strokeDasharray="4,4" fill="none">
                <path d={`M ${magnetPos.x - 30} ${magnetPos.y - 30} C ${magnetPos.x - 80} ${magnetPos.y - 70}, ${magnetPos.x - 80} ${magnetPos.y + 70}, ${magnetPos.x - 30} ${magnetPos.y + 30}`} />
                <path d={`M ${magnetPos.x + 30} ${magnetPos.y - 30} C ${magnetPos.x + 80} ${magnetPos.y - 70}, ${magnetPos.x + 80} ${magnetPos.y + 70}, ${magnetPos.x + 30} ${magnetPos.y + 30}`} />
                <path d={`M ${magnetPos.x - 20} ${magnetPos.y - 20} C ${magnetPos.x - 55} ${magnetPos.y - 50}, ${magnetPos.x - 55} ${magnetPos.y + 50}, ${magnetPos.x - 20} ${magnetPos.y + 20}`} />
                <path d={`M ${magnetPos.x + 20} ${magnetPos.y - 20} C ${magnetPos.x + 55} ${magnetPos.y - 50}, ${magnetPos.x + 55} ${magnetPos.y + 50}, ${magnetPos.x + 20} ${magnetPos.y + 20}`} />
              </g>
            )}

            {/* Horseshoe Magnet */}
            <g
              transform={`translate(${magnetPos.x}, ${magnetPos.y})`}
              className="transition-all duration-300 ease-out cursor-pointer"
            >
              {/* Outer Horseshoe Arc */}
              {/* North Pole (Red - Left) */}
              <path
                d="M -30 -35 L -30 10 A 30 30 0 0 0 0 40 L 0 25 A 15 15 0 0 1 -15 10 L -15 -35 Z"
                fill="#dc2626"
                stroke="#991b1b"
                strokeWidth="2"
              />
              {/* South Pole (Blue - Right) */}
              <path
                d="M 30 -35 L 30 10 A 30 30 0 0 1 0 40 L 0 25 A 15 15 0 0 0 15 10 L 15 -35 Z"
                fill="#2563eb"
                stroke="#1e40af"
                strokeWidth="2"
              />

              {/* Pole Tip Labels */}
              {/* N pole tip */}
              <rect x="-30" y="-35" width="15" height="12" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
              <text x="-22" y="-26" fontSize="9" fontWeight="bold" fill="#ffffff" textAnchor="middle">
                N
              </text>
              {/* S pole tip */}
              <rect x="15" y="-35" width="15" height="12" fill="#3b82f6" stroke="#1e40af" strokeWidth="1" />
              <text x="22" y="-26" fontSize="9" fontWeight="bold" fill="#ffffff" textAnchor="middle">
                S
              </text>

              {/* Label below magnet */}
              <text x="0" y="55" fontSize="10" fontWeight="bold" fill="#475569" textAnchor="middle">
                NAM CHÂM
              </text>
            </g>

            {/* Test Items on the Table */}
            {items.map((it) => (
              <g
                key={it.id}
                transform={`translate(${it.x}, ${it.y})`}
                role="button"
                tabIndex={0}
                aria-label={`Đưa nam châm lại gần ${it.name}`}
                onClick={() => testBringNear(it)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    testBringNear(it);
                  }
                }}
                className="cursor-pointer group transition-all duration-300 focus:outline-none"
              >
                {/* Target Circle Backdrop */}
                <circle
                  cx="0"
                  cy="0"
                  r="22"
                  fill={it.tested ? (it.isAttracted ? '#dcfce7' : '#fee2e2') : '#ffffff'}
                  stroke={it.tested ? (it.isAttracted ? '#16a34a' : '#ef4444') : '#cbd5e1'}
                  strokeWidth="2"
                  className="group-hover:stroke-cyan-500 transition-colors"
                />

                {/* Emoji Icon */}
                <text x="0" y="6" fontSize="16" textAnchor="middle">
                  {it.icon}
                </text>

                {/* Name Label */}
                <text
                  x="0"
                  y="34"
                  fontSize="9.5"
                  fontWeight="600"
                  fill="#1e293b"
                  textAnchor="middle"
                >
                  {it.name}
                </text>

                {/* Result Indicator if Tested */}
                {it.tested && (
                  <circle
                    cx="15"
                    cy="-14"
                    r="8"
                    fill={it.isAttracted ? '#16a34a' : '#dc2626'}
                  />
                )}
                {it.tested && (
                  <text
                    x="15"
                    y="-11"
                    fontSize="9"
                    fontWeight="bold"
                    fill="#ffffff"
                    textAnchor="middle"
                  >
                    {it.isAttracted ? '✓' : '✕'}
                  </text>
                )}
              </g>
            ))}
          </svg>

          {/* Quick Click Bar at Bottom of Canvas */}
          <div className="bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg p-2.5 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Bấm vào bất kỳ vật thể nào trên bàn để thử đưa nam châm lại gần!</span>
            <button
              onClick={() => {
                // Test all sequentially
                items.forEach((it, idx) => {
                  setTimeout(() => testBringNear(it), idx * 400);
                });
              }}
              className="px-3 py-1 text-xs font-semibold bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors"
            >
              Thử tất cả vật
            </button>
          </div>
        </div>

        {/* Right: Results Table & Material Properties */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4 bg-slate-50/50 p-5 rounded-xl border border-slate-200">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Bảng ghi chép từ tính
              </span>
              <span className="text-xs text-indigo-600 font-semibold">
                Bị hút / Không bị hút
              </span>
            </div>

            {/* Checklist items */}
            <div className="mt-3 space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
              {items.map((it) => (
                <button
                  key={it.id}
                  onClick={() => testBringNear(it)}
                  className={`w-full text-left p-2 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                    activeItem?.id === it.id
                      ? 'bg-cyan-50 border-cyan-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{it.icon}</span>
                    <div>
                      <span className="font-semibold text-slate-800 block">{it.name}</span>
                      <span className="text-[10px] text-slate-400">{it.material}</span>
                    </div>
                  </div>

                  <div>
                    {it.tested ? (
                      it.isAttracted ? (
                        <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" /> BỊ HÚT
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-700 flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          <X className="w-3 h-3 text-rose-600" /> KHÔNG HÚT
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Chưa thử</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Explanation Info Box */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1 text-slate-600">
                <span className="font-semibold text-slate-800 block">Lưu ý khoa học:</span>
                {activeItem ? (
                  <p className="text-slate-700">
                    <strong className="text-slate-900">{activeItem.name}:</strong> {activeItem.explanation}
                  </p>
                ) : (
                  <p className="text-slate-600">
                    Không phải mọi kim loại đều bị nam châm hút! Ví dụ, <strong>đồng xu bằng nhôm</strong> không bị hút. Với đồng xu và inox, phải biết vật làm bằng gì (hoặc thử) mới biết có bị hút hay không.
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
