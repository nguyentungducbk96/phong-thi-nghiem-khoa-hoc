import React, { useState, useEffect, useRef } from 'react';
import { soundManager } from '../../utils/audio';
import { RotateCcw, Volume2, VolumeX, Hand, Music } from 'lucide-react';

interface Props {
  onExperimentAction?: (actionName: string, detail: string) => void;
}

export const SoundVibrationSimulation: React.FC<Props> = ({ onExperimentAction }) => {
  // Instrument mode: 'drum' | 'guitar'
  const [mode, setMode] = useState<'drum' | 'guitar'>('drum');
  // Vibration amplitude (0 to 100)
  const [vibration, setVibration] = useState<number>(0);
  // Strike force level: 1 = gentle, 2 = medium, 3 = strong
  const [strikeForce, setStrikeForce] = useState<number>(2);
  // Is hand damping the drum
  const [isDamped, setIsDamped] = useState<boolean>(false);
  // Mute state
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getIsMuted());
  // Selected musical note for guitar (frequency Hz)
  const [guitarNote, setGuitarNote] = useState<{ name: string; freq: number }>({ name: 'Đô (C4)', freq: 261.63 });

  // Vibration decay animation loop
  useEffect(() => {
    if (vibration > 0 && !isDamped) {
      const timer = setTimeout(() => {
        setVibration((prev) => Math.max(0, prev - (mode === 'drum' ? 8 : 4)));
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [vibration, isDamped, mode]);

  // Bàn tay chỉ áp lên trống một lúc rồi tự nhấc ra, để có thể gõ tiếp
  const releaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (releaseTimer.current) clearTimeout(releaseTimer.current);
  }, []);

  const releaseHand = () => {
    if (releaseTimer.current) clearTimeout(releaseTimer.current);
    releaseTimer.current = null;
    setIsDamped(false);
  };

  // Strike drum
  const handleStrikeDrum = () => {
    // Gõ trống thì nhấc tay ra trước (không để trống bị "kẹt")
    if (isDamped) releaseHand();
    const forceFactor = strikeForce === 1 ? 0.35 : strikeForce === 2 ? 0.7 : 1.0;
    setVibration(forceFactor * 100);
    soundManager.playDrum(forceFactor);

    if (onExperimentAction) {
      const labels = ['', 'Gõ nhẹ', 'Gõ vừa', 'Gõ mạnh'];
      onExperimentAction(
        labels[strikeForce],
        `Hạt gạo nảy ${strikeForce === 1 ? 'thấp' : strikeForce === 2 ? 'vừa' : 'cao'}, âm thanh ${strikeForce === 1 ? 'nhỏ' : strikeForce === 2 ? 'vừa' : 'to'}`
      );
    }
  };

  // Pluck guitar string
  const handlePluckGuitar = (note = guitarNote) => {
    setVibration(80);
    setIsDamped(false);
    soundManager.playStringPluck(note.freq);

    if (onExperimentAction) {
      onExperimentAction(`Gảy nốt ${note.name}`, 'Dây đàn rung qua lại và phát ra âm thanh');
    }
  };

  // Damp drum with hand
  const handleDampDrum = () => {
    const wasVibrating = vibration > 5;
    setIsDamped(true);
    setVibration(0);
    if (releaseTimer.current) clearTimeout(releaseTimer.current);
    releaseTimer.current = setTimeout(() => {
      setIsDamped(false);
      releaseTimer.current = null;
    }, 1500);
    if (onExperimentAction) {
      onExperimentAction(
        'Áp tay vào mặt trống',
        wasVibrating ? 'Mặt trống ngừng rung, âm thanh tắt' : 'Mặt trống đang đứng yên nên không có tiếng'
      );
    }
  };

  const handleReset = () => {
    setVibration(0);
    releaseHand();
    if (onExperimentAction) {
      onExperimentAction('Đặt lại thí nghiệm', 'Dừng mọi dao động');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 sm:gap-4 bg-slate-50/70">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            Mô phỏng: Âm thanh được tạo ra như thế nào?
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Gõ trống quan sát hạt gạo nảy lên hoặc gảy dây đàn quan sát dây rung
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => {
                setMode('drum');
                setVibration(0);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                mode === 'drum' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mặt trống & Hạt gạo
            </button>
            <button
              onClick={() => {
                setMode('guitar');
                setVibration(0);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                mode === 'guitar' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dây đàn ghi-ta
            </button>
          </div>

          <button
            onClick={() => {
              const muted = soundManager.toggleMute();
              setIsMuted(muted);
            }}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors text-xs flex items-center gap-1.5"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            aria-label={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            aria-pressed={isMuted}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-cyan-600" />}
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
        {/* SVG Acoustic Canvas */}
        <div className="lg:col-span-8 bg-slate-900 rounded-xl p-3 sm:p-4 relative sm:min-h-[420px] flex flex-col justify-between overflow-hidden text-white">
          <div className="flex items-center justify-between text-xs z-10">
            <span className="bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300">
              Trạng thái: <strong className={vibration > 10 ? 'text-emerald-400' : 'text-slate-400'}>
                {vibration > 10 ? 'Đang rung động (Phát ra âm thanh)' : 'Đứng yên (Yên lặng)'}
              </strong>
            </span>
            <span className="bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300 font-mono">
              Biên độ rung: <strong className="text-amber-400">{Math.round(vibration)}%</strong>
            </span>
          </div>

          {/* SVG Visual Stage */}
          <svg viewBox="0 0 500 320" className="w-full h-auto max-h-[280px] select-none my-auto">
            {mode === 'drum' ? (
              /* DRUM SCENE */
              <g transform="translate(250, 150)">
                {/* Drum Shell (Thân trống gỗ) */}
                <path
                  d="M -160 30 C -160 120, 160 120, 160 30 L 160 -10 C 160 -50, -160 -50, -160 -10 Z"
                  fill="#78350f"
                  stroke="#451a03"
                  strokeWidth="3"
                />

                {/* Decorative Red/Gold Bands */}
                <ellipse cx="0" cy="50" rx="155" ry="38" fill="none" stroke="#d97706" strokeWidth="4" />

                {/* Drumhead (Mặt trống da căng) */}
                <ellipse
                  cx="0"
                  cy="-15"
                  rx="160"
                  ry="45"
                  fill="#fef3c7"
                  stroke="#b45309"
                  strokeWidth="4"
                  className="cursor-pointer focus:outline-none"
                  role="button"
                  tabIndex={0}
                  aria-label="Gõ vào mặt trống"
                  onClick={handleStrikeDrum}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleStrikeDrum();
                    }
                  }}
                />

                {/* Vibration Ripple Circles when vibrating */}
                {vibration > 5 && (
                  <g fill="none" stroke="#f59e0b" opacity={vibration / 100}>
                    <ellipse cx="0" cy="-15" rx={40 + (vibration * 0.9)} ry={12 + (vibration * 0.28)} strokeWidth="2.5" />
                    <ellipse cx="0" cy="-15" rx={20 + (vibration * 0.5)} ry={6 + (vibration * 0.15)} strokeWidth="1.5" />
                  </g>
                )}

                {/* Rice Grains on Drumhead */}
                {/* When vibrating, rice grains jump upward! */}
                {[-100, -70, -45, -20, 0, 25, 55, 80, 110].map((xOffset, idx) => {
                  const jumpY = vibration > 5 ? -15 - Math.sin((idx + 1) * 2) * (vibration * 0.55) : -15;
                  return (
                    <g key={idx} transform={`translate(${xOffset}, ${jumpY})`}>
                      <ellipse cx="0" cy="0" rx="4" ry="2.2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
                    </g>
                  );
                })}

                {/* Drumstick (Dùi gõ trống) */}
                <g
                  transform={`translate(60, ${vibration > 10 ? -45 : -75}) rotate(${vibration > 10 ? -25 : -40})`}
                  className="transition-transform duration-100"
                >
                  <rect x="0" y="0" width="100" height="8" rx="4" fill="#d97706" stroke="#92400e" strokeWidth="1" />
                  <circle cx="0" cy="4" r="10" fill="#f59e0b" stroke="#78350f" strokeWidth="1.5" />
                </g>

                {/* Hand touching drumhead if damped */}
                {isDamped && (
                  <g transform="translate(-50, -45)">
                    <path
                      d="M 0 0 C 15 -10, 45 -5, 55 10 C 65 25, 45 35, 30 30 Z"
                      fill="#fed7aa"
                      stroke="#ea580c"
                      strokeWidth="2"
                    />
                    <text x="30" y="-12" fontSize="10" fill="#f97316" fontWeight="bold">
                      ÁP TAY DẬP TẮT RUNG
                    </text>
                  </g>
                )}

                <text x="0" y="90" fontSize="11" fill="#fef3c7" fontWeight="bold" textAnchor="middle">
                  BẤM VÀO MẶT TRỐNG ĐỂ GÕ
                </text>
              </g>
            ) : (
              /* GUITAR STRING SCENE */
              <g transform="translate(250, 160)">
                {/* Guitar Neck & Frets */}
                <rect x="-220" y="-35" width="440" height="70" rx="8" fill="#451a03" stroke="#292524" strokeWidth="3" />
                {/* Frets (Phím đàn kim loại) */}
                {[-180, -130, -80, -30, 20, 70, 120, 170].map((fx) => (
                  <line key={fx} x1={fx} y1="-35" x2={fx} y2="35" stroke="#cbd5e1" strokeWidth="2.5" />
                ))}

                {/* Guitar String vibrating */}
                <g
                  className="cursor-pointer focus:outline-none"
                  role="button"
                  tabIndex={0}
                  aria-label="Gảy dây đàn"
                  onClick={() => handlePluckGuitar()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handlePluckGuitar();
                    }
                  }}
                >
                  {/* Vùng bấm cao hơn dây đàn để dễ chạm bằng ngón tay */}
                  <rect x="-220" y="-30" width="440" height="60" fill="transparent" />
                  <path
                    d={`M -220 0 Q 0 ${vibration > 5 ? (vibration % 2 === 0 ? 1 : -1) * (vibration * 0.35) : 0}, 220 0`}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </g>

                {/* Ghost blurred lines showing vibration envelope */}
                {vibration > 15 && (
                  <g stroke="#f59e0b" strokeWidth="1.5" opacity="0.4" fill="none">
                    <path d={`M -220 0 Q 0 ${vibration * 0.25}, 220 0`} />
                    <path d={`M -220 0 Q 0 ${-vibration * 0.25}, 220 0`} />
                  </g>
                )}

                <text x="0" y="55" fontSize="11" fill="#fde68a" fontWeight="bold" textAnchor="middle">
                  BẤM VÀO DÂY ĐÀN ĐỂ GẢY
                </text>
              </g>
            )}
          </svg>

          {/* Mini waveform bar (minh họa rung động) */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between">
            <span className="text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Hình ảnh rung động (minh họa):
            </span>
            <div className="w-48 h-6 bg-slate-900 border border-slate-700 rounded flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 100 20" className="w-full h-full">
                <path
                  d={`M 0 10 Q 15 ${10 - vibration * 0.18}, 30 10 T 60 10 T 90 10 T 100 10`}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Right: Sound Controls & Vibration Discovery */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4 bg-slate-50/50 p-4 sm:p-5 rounded-xl border border-slate-200">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Bảng điều khiển dao động
              </span>
              <span className="text-xs text-cyan-600 font-semibold font-mono">
                {mode === 'drum' ? 'Trống da' : 'Đàn ghi-ta'}
              </span>
            </div>

            {mode === 'drum' ? (
              <div className="mt-4 space-y-4">
                <div>
                  <span className="text-xs font-semibold text-slate-700 block mb-2">
                    Lực gõ dùi trống:
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[1, 2, 3].map((f) => (
                      <button
                        key={f}
                        aria-pressed={strikeForce === f}
                        onClick={() => setStrikeForce(f)}
                        className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          strikeForce === f
                            ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {f === 1 ? 'Nhẹ' : f === 2 ? 'Vừa' : 'Mạnh'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleStrikeDrum}
                    className="py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                  >
                    Gõ trống
                  </button>
                  <button
                    onClick={handleDampDrum}
                    className="py-2.5 px-3 bg-slate-700 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <Hand className="w-3.5 h-3.5" />
                    {isDamped ? 'Đang áp tay...' : 'Áp tay giữ trống'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <span className="text-xs font-semibold text-slate-700 block">
                  Chọn cao độ dây đàn:
                </span>
                <div className="space-y-1.5">
                  {[
                    { name: 'Đô (C4)', freq: 261.63 },
                    { name: 'Mi (E4)', freq: 329.63 },
                    { name: 'Son (G4)', freq: 392.0 },
                    { name: 'Đố (C5)', freq: 523.25 }
                  ].map((note) => (
                    <button
                      key={note.name}
                      onClick={() => {
                        setGuitarNote(note);
                        handlePluckGuitar(note);
                      }}
                      className={`w-full py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-between transition-colors ${
                        guitarNote.name === note.name
                          ? 'bg-amber-50 border-amber-300 text-amber-900'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Music className="w-3.5 h-3.5 text-amber-500" /> Nốt {note.name}
                      </span>
                      <span className="font-mono text-slate-400 text-[11px]">{note.freq.toFixed(0)} Hz</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Scientific Insight Card */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs space-y-1.5 text-slate-600">
            <span className="font-semibold text-slate-800 block">Quy luật khoa học:</span>
            <p>
              Âm thanh do <strong>các vật rung động (dao động)</strong> phát ra. Gõ càng mạnh, dao động càng lớn thì âm thanh càng to và các hạt gạo nảy càng cao!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
