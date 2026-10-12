import React, { useState, useEffect, useRef } from 'react';
import { Experiment, NotebookEntry, ExperimentResult } from '../../types';
import { soundManager } from '../../utils/audio';
import { newId } from '../../utils/storage';
import { XP_EXPERIMENT_COMPLETE, XP_PER_EXPERIMENT_CORRECT } from '../../utils/progress';
import { AirPressureCupSimulation } from '../simulations/AirPressureCupSimulation';
import { MagnetMaterialsSimulation } from '../simulations/MagnetMaterialsSimulation';
import { WaterEvaporationCondensationSimulation } from '../simulations/WaterEvaporationCondensationSimulation';
import { LightPropagationSimulation } from '../simulations/LightPropagationSimulation';
import { SimpleCircuitSimulation } from '../simulations/SimpleCircuitSimulation';
import { SoundVibrationSimulation } from '../simulations/SoundVibrationSimulation';
import { PlantGrowthSimulation } from '../simulations/PlantGrowthSimulation';
import {
  Compass,
  HelpCircle,
  FlaskConical,
  Eye,
  Award,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Maximize2,
  Minimize2,
  Save,
  Clock,
  Sparkles,
  Lock,
  Info,
  ListChecks
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  experiment: Experiment;
  isAlreadyCompleted: boolean;
  onBack: () => void;
  onSaveToNotebook: (entry: Omit<NotebookEntry, 'id'>) => void;
  onCompleteExperiment: (expId: string, score: number) => void;
  onRecordResult: (result: ExperimentResult) => void;
}

type FsTarget = 'page' | 'sim';

const RESET_ACTION = /Đặt lại|Làm lại/;

// Fullscreen API có tiền tố webkit trên Safari cũ
const getFullscreenElement = (): Element | null =>
  document.fullscreenElement ||
  (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement ||
  null;

export const FiveStepExperimentFlow: React.FC<Props> = ({
  experiment,
  isAlreadyCompleted,
  onBack,
  onSaveToNotebook,
  onCompleteExperiment,
  onRecordResult
}) => {
  // Step 1 to 5
  const [currentStep, setCurrentStep] = useState<number>(1);
  // Selected prediction option ID
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null);
  // Post-quiz selected answers { questionId: selectedIndex }
  const [postAnswers, setPostAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  // Điều em quan sát được: do học sinh tự viết (mặc định để trống)
  const [observationText, setObservationText] = useState<string>('');
  // Ghi chú, cảm nghĩ và câu hỏi muốn tìm hiểu thêm: do học sinh tự viết
  const [studentNote, setStudentNote] = useState<string>('');
  const [exploreQuestion, setExploreQuestion] = useState<string>('');
  const [showApplicationAnswer, setShowApplicationAnswer] = useState<boolean>(false);
  // Saved to notebook flag
  const [savedToNotebook, setSavedToNotebook] = useState<boolean>(false);
  // Nhật ký thao tác thật trong mô phỏng (theo thứ tự thời gian)
  const [simulationLog, setSimulationLog] = useState<string[]>([]);
  // Học sinh đã thực sự thao tác với mô phỏng chưa
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  // Lời nhắc nhẹ nhàng khi chưa đủ điều kiện sang bước sau
  const [gateMessage, setGateMessage] = useState<string | null>(null);
  // XP nhận được ở lần này (null = chưa tới bước 5)
  const [xpEarned, setXpEarned] = useState<number | null>(null);
  const [wasCompletedBefore] = useState<boolean>(isAlreadyCompleted);
  // Toàn màn hình: thật (Fullscreen API) hoặc dự phòng bằng CSS
  const [nativeFs, setNativeFs] = useState<FsTarget | null>(null);
  const [fallbackFs, setFallbackFs] = useState<FsTarget | null>(null);

  const pageRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<HTMLDivElement>(null);

  const predObj = experiment.predictionOptions.find((p) => p.id === selectedPrediction);
  const correctPrediction = experiment.predictionOptions.find((p) => p.isCorrect);

  // ---------- Toàn màn hình ----------
  useEffect(() => {
    const onChange = () => {
      if (!getFullscreenElement()) setNativeFs(null);
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  useEffect(() => {
    if (!fallbackFs) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFallbackFs(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fallbackFs]);

  // Mô phỏng chỉ có ở bước 3: rời bước 3 thì bỏ chế độ phóng to mô phỏng
  useEffect(() => {
    if (currentStep !== 3) {
      setFallbackFs((f) => (f === 'sim' ? null : f));
      setNativeFs((f) => (f === 'sim' ? null : f));
    }
  }, [currentStep]);

  // Rời trang khi đang toàn màn hình thì thoát ra
  useEffect(() => {
    return () => {
      if (getFullscreenElement()) {
        document.exitFullscreen?.().catch(() => undefined);
      }
    };
  }, []);

  const enterFullscreen = async (target: FsTarget) => {
    const el = target === 'sim' ? simRef.current : pageRef.current;
    if (!el) return;
    const anyEl = el as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
        setNativeFs(target);
        return;
      }
      if (anyEl.webkitRequestFullscreen) {
        await anyEl.webkitRequestFullscreen();
        setNativeFs(target);
        return;
      }
    } catch {
      // Trình duyệt từ chối (ví dụ trong khung nhúng): dùng chế độ dự phòng bên dưới
    }
    setFallbackFs(target);
  };

  const exitFullscreen = () => {
    if (getFullscreenElement()) {
      const doc = document as Document & { webkitExitFullscreen?: () => void };
      if (document.exitFullscreen) document.exitFullscreen().catch(() => undefined);
      else doc.webkitExitFullscreen?.();
    }
    setNativeFs(null);
    setFallbackFs(null);
  };

  const isFs = (target: FsTarget) => nativeFs === target || fallbackFs === target;
  const anyFs = nativeFs !== null || fallbackFs !== null;

  const fsClasses = (target: FsTarget) => {
    if (fallbackFs === target) return 'fixed inset-0 z-[70] overflow-auto bg-white p-3 sm:p-6';
    if (nativeFs === target) return 'overflow-auto bg-white p-3 sm:p-6 h-full';
    return '';
  };

  // ---------- Nhật ký thao tác ----------
  const handleSimulationAction = (action: string, detail: string) => {
    const line = detail ? `${action}: ${detail}` : action;
    setSimulationLog((prev) => {
      const last = prev[prev.length - 1];
      // Gộp các lần kéo thanh trượt liên tiếp của cùng một thao tác
      if (last && last.startsWith(action + ':')) {
        return [...prev.slice(0, -1), line];
      }
      return [...prev, line].slice(-30);
    });
    if (!RESET_ACTION.test(action)) {
      setHasInteracted(true);
      if (gateMessage) setGateMessage(null);
    }
  };

  // ---------- Điều kiện chuyển bước ----------
  const getGateReason = (step: number): string | null => {
    if (step <= 2) return null;
    if (!selectedPrediction) {
      return 'Em hãy chọn một dự đoán ở Bước 2 trước khi làm thí nghiệm nhé!';
    }
    if (step === 4 && !hasInteracted) {
      return 'Em hãy thử thao tác với mô phỏng ở Bước 3 trước (bấm, kéo hoặc điều chỉnh) rồi mới sang bước Quan sát nhé!';
    }
    if (step === 5 && !hasInteracted) {
      return 'Em hãy làm thí nghiệm ở Bước 3 trước nhé!';
    }
    if (step === 5 && !quizSubmitted) {
      return 'Em hãy trả lời và nộp các câu hỏi ở Bước 4 trước khi xem kết luận nhé!';
    }
    return null;
  };

  const handleReachConclusion = () => {
    if (xpEarned !== null) return;
    const correct = experiment.postQuestions.filter((q) => postAnswers[q.id] === q.correctIndex).length;
    const xp = wasCompletedBefore ? 0 : XP_EXPERIMENT_COMPLETE + correct * XP_PER_EXPERIMENT_CORRECT;
    onCompleteExperiment(experiment.id, xp);
    setXpEarned(xp);
    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch {
      // Confetti fallback
    }
  };

  const goToStep = (step: number) => {
    const reason = getGateReason(step);
    if (reason) {
      setGateMessage(reason);
      return;
    }
    setGateMessage(null);
    if (step === 5) handleReachConclusion();
    setCurrentStep(step);
  };

  const handleSubmitQuestions = () => {
    const allAnswered = experiment.postQuestions.every((q) => postAnswers[q.id] !== undefined);
    if (!allAnswered) {
      setGateMessage('Em hãy chọn đáp án cho tất cả câu hỏi rồi bấm Nộp bài nhé!');
      return;
    }
    setGateMessage(null);
    setQuizSubmitted(true);
    soundManager.playSuccess();
    const wrong = experiment.postQuestions.filter((q) => postAnswers[q.id] !== q.correctIndex);
    onRecordResult({
      id: newId('res'),
      experimentId: experiment.id,
      experimentTitle: experiment.title,
      date: new Date().toISOString(),
      predictionId: selectedPrediction,
      predictionCorrect: !!predObj?.isCorrect,
      correct: experiment.postQuestions.length - wrong.length,
      total: experiment.postQuestions.length,
      wrongQuestionIds: wrong.map((q) => `${experiment.id}:${q.id}`)
    });
  };

  const handleNextStep = () => {
    if (currentStep === 4 && !quizSubmitted) {
      handleSubmitQuestions();
      return;
    }
    if (currentStep < 5) goToStep(currentStep + 1);
  };

  const handlePrevStep = () => {
    setGateMessage(null);
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSaveNotebook = () => {
    const dateStr = new Date().toLocaleDateString('vi-VN');
    onSaveToNotebook({
      experimentId: experiment.id,
      experimentTitle: experiment.title,
      date: dateStr,
      hypothesis: predObj ? predObj.text : '',
      operations: simulationLog.join('; '),
      observation: observationText.trim(),
      conclusion: experiment.scientificConclusion,
      studentNotes: studentNote.trim(),
      questionsExplored: exploreQuestion.trim() || undefined
    });
    setSavedToNotebook(true);
    soundManager.playSuccess();
  };

  // Render the corresponding interactive simulation
  const renderSimulationComponent = () => {
    switch (experiment.id) {
      case 'khong-khi-chiem-cho':
        return <AirPressureCupSimulation onExperimentAction={handleSimulationAction} />;
      case 'nam-cham-hut-vat-nao':
        return <MagnetMaterialsSimulation onExperimentAction={handleSimulationAction} />;
      case 'nuoc-bay-hoi-ngung-tu':
        return <WaterEvaporationCondensationSimulation onExperimentAction={handleSimulationAction} />;
      case 'anh-sang-truyen-nhu-the-nao':
        return <LightPropagationSimulation onExperimentAction={handleSimulationAction} />;
      case 'mach-dien-don-gian':
        return <SimpleCircuitSimulation onExperimentAction={handleSimulationAction} />;
      case 'am-thanh-tao-ra-nhu-the-nao':
        return <SoundVibrationSimulation onExperimentAction={handleSimulationAction} />;
      case 'cay-can-gi-de-song':
        return <PlantGrowthSimulation onExperimentAction={handleSimulationAction} />;
      default:
        return (
          <div className="p-8 text-center text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl">
            Thí nghiệm này chưa có mô phỏng.
          </div>
        );
    }
  };

  const stepsList = [
    { num: 1, title: 'Khám phá', icon: Compass },
    { num: 2, title: 'Dự đoán', icon: HelpCircle },
    { num: 3, title: 'Thực nghiệm', icon: FlaskConical },
    { num: 4, title: 'Quan sát & Giải thích', icon: Eye },
    { num: 5, title: 'Kết luận & Vận dụng', icon: Award }
  ];

  const renderActionLog = (title: string) => (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
        <ListChecks className="w-4 h-4 text-slate-500" /> {title}
        <span className="font-normal text-slate-400">(ứng dụng tự ghi lại)</span>
      </span>
      {simulationLog.length === 0 ? (
        <p className="text-xs text-slate-400 italic">Chưa có thao tác nào được ghi lại.</p>
      ) : (
        <ol className="list-decimal list-inside space-y-0.5 text-xs text-slate-600 max-h-40 overflow-y-auto">
          {simulationLog.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ol>
      )}
    </div>
  );

  return (
    <div
      ref={pageRef}
      className={`min-h-screen bg-slate-50 py-6 px-4 sm:px-6 ${fsClasses('page')}`}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                exitFullscreen();
                onBack();
              }}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              title="Quay lại thư viện"
              aria-label="Quay lại thư viện"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">
                  Khoa học 4
                </span>
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {experiment.durationMinutes} phút
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                {experiment.title}
              </h1>
            </div>
          </div>

          <button
            onClick={() => (isFs('page') ? exitFullscreen() : enterFullscreen('page'))}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${
              isFs('page')
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Trình chiếu toàn màn hình cho cả lớp"
          >
            {isFs('page') ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">
              {isFs('page') ? 'Thoát toàn màn hình' : 'Trình chiếu toàn màn hình'}
            </span>
          </button>
        </div>

        {/* 5-Step Process Timeline Tracker */}
        <nav aria-label="Các bước thí nghiệm" className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
          <div className="grid grid-cols-5 gap-2 sm:gap-4">
            {stepsList.map((step) => {
              const isActive = currentStep === step.num;
              const isPast = currentStep > step.num;
              const isLocked = !!getGateReason(step.num);

              return (
                <button
                  key={step.num}
                  onClick={() => goToStep(step.num)}
                  aria-current={isActive ? 'step' : undefined}
                  aria-disabled={isLocked}
                  title={isLocked ? getGateReason(step.num) || '' : step.title}
                  className={`flex flex-col items-center text-center p-2 rounded-xl transition-all ${
                    isActive
                      ? 'bg-cyan-50 border border-cyan-300'
                      : isPast
                      ? 'bg-emerald-50/60 border border-emerald-200 text-emerald-800'
                      : isLocked
                      ? 'text-slate-300 cursor-not-allowed'
                      : 'text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : isPast
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isPast ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : isLocked ? (
                      <Lock className="w-3.5 h-3.5" />
                    ) : (
                      step.num
                    )}
                  </div>
                  <span
                    className={`text-[11px] sm:text-xs font-semibold truncate w-full ${
                      isActive ? 'text-cyan-900' : isPast ? 'text-emerald-900' : 'text-slate-500'
                    }`}
                  >
                    {step.title}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Gentle gate message */}
        {gateMessage && (
          <div
            role="status"
            className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl flex items-start gap-2.5 text-sm text-sky-900"
          >
            <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <span className="flex-1">{gateMessage}</span>
            <button
              onClick={() => setGateMessage(null)}
              className="text-xs font-semibold text-sky-700 hover:underline"
            >
              Đã hiểu
            </button>
          </div>
        )}

        {/* MAIN STEP CONTENT AREA */}
        <div className="transition-all">
          {/* ==================== BƯỚC 1: KHÁM PHÁ ==================== */}
          {currentStep === 1 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div>
                <span className="text-xs font-bold text-cyan-600 uppercase tracking-wider">
                  Bước 1: Khám phá vấn đề
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  {experiment.inquiryQuestion}
                </h2>
              </div>

              {/* Background scenario */}
              <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-4 text-sm text-sky-950 space-y-2">
                <span className="font-bold flex items-center gap-1.5 text-cyan-800">
                  <Sparkles className="w-4 h-4" /> Tình huống mở đầu:
                </span>
                <p className="leading-relaxed">{experiment.description}</p>
                <p className="text-xs text-sky-700 italic">{experiment.backgroundKnowledge}</p>
              </div>

              {/* Equipment & Materials List */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-cyan-600" /> Dụng cụ và vật liệu thí nghiệm:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {experiment.equipment.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-800"
                    >
                      <div className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-xs shrink-0">
                        {idx + 1}
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Procedure Steps Preview */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-indigo-600" /> Các bước thực hiện:
                </h3>
                <div className="space-y-2">
                  {experiment.procedureSteps.map((stepText, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700"
                    >
                      <span className="font-bold text-indigo-600 shrink-0">Bước {idx + 1}:</span>
                      <span>{stepText}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety Warning */}
              {experiment.safetyWarning && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{experiment.safetyWarning}</span>
                </div>
              )}
            </div>
          )}

          {/* ==================== BƯỚC 2: DỰ ĐOÁN ==================== */}
          {currentStep === 2 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                  Bước 2: Đưa ra dự đoán khoa học
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  Theo em, điều gì sẽ xảy ra khi thực hiện thí nghiệm này?
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Một nhà khoa học luôn đưa ra dự đoán trước khi bắt tay vào làm thí nghiệm. Hãy chọn dự đoán của em:
                </p>
              </div>

              {/* Prediction Options */}
              <div className="space-y-3" role="radiogroup" aria-label="Dự đoán của em">
                {experiment.predictionOptions.map((opt) => (
                  <button
                    key={opt.id}
                    role="radio"
                    aria-checked={selectedPrediction === opt.id}
                    onClick={() => {
                      setSelectedPrediction(opt.id);
                      setGateMessage(null);
                    }}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3.5 ${
                      selectedPrediction === opt.id
                        ? 'border-cyan-600 bg-cyan-50/70 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${
                        selectedPrediction === opt.id
                          ? 'border-cyan-600 bg-cyan-600'
                          : 'border-slate-300'
                      }`}
                    >
                      {selectedPrediction === opt.id && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="text-sm font-medium text-slate-800 leading-relaxed">
                      {opt.text}
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs text-slate-600">
                💡 <em>Ghi nhớ: Đừng lo lắng nếu dự đoán của em chưa chính xác, việc quan sát hiện tượng ở bước tiếp theo sẽ giúp em hiểu rõ hơn!</em>
              </div>
            </div>
          )}

          {/* ==================== BƯỚC 3: THỰC NGHIỆM ==================== */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                <div>
                  <span className="text-xs font-bold text-cyan-600 uppercase tracking-wider">
                    Bước 3: Thực nghiệm trực tiếp
                  </span>
                  <p className="text-xs text-slate-500">
                    Dự đoán của em: <strong className="text-slate-800">{predObj?.text}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold ${hasInteracted ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {hasInteracted
                      ? `✓ Đã ghi ${simulationLog.length} thao tác`
                      : 'Hãy thao tác với mô phỏng bên dưới'}
                  </span>
                  <button
                    onClick={() => enterFullscreen('sim')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg"
                    title="Phóng to mô phỏng toàn màn hình để trình chiếu"
                  >
                    <Maximize2 className="w-3.5 h-3.5" /> Phóng to mô phỏng
                  </button>
                </div>
              </div>

              {/* Real Interactive Simulation */}
              <div ref={simRef} className={fsClasses('sim')}>
                {isFs('sim') && (
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-slate-900">{experiment.title}</h2>
                    <button
                      onClick={exitFullscreen}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg"
                    >
                      <Minimize2 className="w-4 h-4" /> Thoát toàn màn hình
                    </button>
                  </div>
                )}
                {renderSimulationComponent()}
              </div>
            </div>
          )}

          {/* ==================== BƯỚC 4: QUAN SÁT VÀ GIẢI THÍCH ==================== */}
          {currentStep === 4 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Bước 4: Quan sát và Giải thích
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  So sánh dự đoán với điều em quan sát được
                </h2>
              </div>

              {/* Prediction vs result */}
              {predObj && (
                <div
                  className={`p-4 rounded-xl border space-y-2 text-sm ${
                    predObj.isCorrect
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : 'bg-amber-50/70 border-amber-200 text-amber-950'
                  }`}
                >
                  <p>
                    <strong>Em đã dự đoán:</strong> {predObj.text}
                  </p>
                  {correctPrediction && (
                    <p>
                      <strong>Kết quả thực tế:</strong> {correctPrediction.text}
                    </p>
                  )}
                  <p className="text-xs leading-relaxed">
                    {predObj.isCorrect
                      ? 'Dự đoán của em khớp với kết quả thí nghiệm. Giỏi lắm! '
                      : 'Kết quả hơi khác với dự đoán của em. Không sao cả, các nhà khoa học cũng thường sửa lại dự đoán sau khi quan sát! '}
                    {predObj.explanation}
                  </p>
                </div>
              )}

              {/* Student's own observation */}
              <div className="space-y-2">
                <label htmlFor="obs-text" className="text-sm font-bold text-slate-900 block">
                  Em đã quan sát thấy gì? <span className="font-normal text-slate-400 text-xs">(viết bằng lời của em)</span>
                </label>
                <textarea
                  id="obs-text"
                  rows={3}
                  value={observationText}
                  onChange={(e) => setObservationText(e.target.value)}
                  placeholder="Ví dụ: Khi em ... thì em thấy ..."
                  className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              {renderActionLog('Các thao tác em đã làm')}

              {/* Questions List */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900">Trả lời câu hỏi:</h3>
              </div>
              <div className="space-y-6">
                {experiment.postQuestions.map((q, qIndex) => {
                  const selectedOpt = postAnswers[q.id];
                  const isAnswered = selectedOpt !== undefined;
                  const isCorrect = isAnswered && selectedOpt === q.correctIndex;

                  return (
                    <div
                      key={q.id}
                      className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                    >
                      <h4 className="text-sm font-bold text-slate-900 flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs shrink-0">
                          {qIndex + 1}
                        </span>
                        <span>{q.question}</span>
                      </h4>

                      <div className="space-y-2 mt-2">
                        {q.options.map((optionText, optIdx) => {
                          const isOptionSelected = selectedOpt === optIdx;

                          return (
                            <button
                              key={optIdx}
                              disabled={quizSubmitted}
                              aria-pressed={isOptionSelected}
                              onClick={() =>
                                setPostAnswers({ ...postAnswers, [q.id]: optIdx })
                              }
                              className={`w-full text-left p-3 rounded-lg border text-xs font-medium transition-all flex items-center justify-between ${
                                isOptionSelected
                                  ? quizSubmitted
                                    ? optIdx === q.correctIndex
                                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                                      : 'bg-amber-50 border-amber-400 text-amber-900'
                                    : 'bg-indigo-50 border-indigo-400 text-indigo-900'
                                  : quizSubmitted && optIdx === q.correctIndex
                                  ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                              }`}
                            >
                              <span>{optionText}</span>
                              {quizSubmitted && optIdx === q.correctIndex && (
                                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation displayed after submitting */}
                      {quizSubmitted && (
                        <div
                          className={`p-3 rounded-lg text-xs leading-relaxed ${
                            isCorrect
                              ? 'bg-emerald-100/70 border border-emerald-200 text-emerald-950'
                              : 'bg-amber-100/70 border border-amber-200 text-amber-950'
                          }`}
                        >
                          <strong>{isCorrect ? 'Đúng rồi! ' : 'Mình cùng xem lại nhé: '}</strong>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== BƯỚC 5: KẾT LUẬN VÀ VẬN DỤNG ==================== */}
          {currentStep === 5 && (
            <div className="space-y-6">
              {/* XP notice */}
              {xpEarned !== null && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  {xpEarned > 0 ? (
                    <span>
                      Em đã hoàn thành thí nghiệm và nhận được <strong>+{xpEarned} XP</strong>!
                    </span>
                  ) : (
                    <span>
                      Em đã hoàn thành thí nghiệm này từ trước nên lần này không cộng thêm XP. Làm lại để ôn tập cũng rất tốt!
                    </span>
                  )}
                </div>
              )}

              {/* Scientific Conclusion Box */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider">
                  <Award className="w-4 h-4" /> Bước 5: Kết luận khoa học
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold leading-snug">
                  {experiment.scientificConclusion}
                </h2>
              </div>

              {/* Real World Application Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
                <div className="flex items-center gap-2 text-amber-700 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" /> Vận dụng vào đời sống
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {experiment.realWorldApplication.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {experiment.realWorldApplication.scenario}
                </p>
                <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-xl space-y-2 text-xs">
                  <strong className="text-amber-900 block font-semibold">
                    Câu hỏi thử thách: {experiment.realWorldApplication.question}
                  </strong>
                  {showApplicationAnswer ? (
                    <p className="text-amber-800 leading-relaxed">
                      <strong>Gợi ý trả lời:</strong> {experiment.realWorldApplication.answer}
                    </p>
                  ) : (
                    <button
                      onClick={() => setShowApplicationAnswer(true)}
                      className="text-xs font-semibold text-amber-800 underline hover:text-amber-950"
                    >
                      Em nghĩ xong rồi, xem gợi ý trả lời
                    </button>
                  )}
                </div>
              </div>

              {/* Lab Notebook Recording Section */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-cyan-600" /> Ghi chép vào Sổ tay nhà khoa học:
                  </h3>
                  {savedToNotebook && (
                    <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      <CheckCircle className="w-3.5 h-3.5" /> Đã lưu vào sổ tay
                    </span>
                  )}
                </div>

                {renderActionLog('Các thao tác em đã làm')}

                <div className="space-y-1">
                  <label htmlFor="nb-obs" className="text-xs font-semibold text-slate-700 block">
                    Điều em quan sát được:
                  </label>
                  <textarea
                    id="nb-obs"
                    rows={2}
                    value={observationText}
                    disabled={savedToNotebook}
                    onChange={(e) => setObservationText(e.target.value)}
                    placeholder="Em tự viết điều em đã nhìn thấy trong thí nghiệm..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="nb-note" className="text-xs font-semibold text-slate-700 block">
                    Cảm nghĩ hoặc điều em phát hiện:
                  </label>
                  <textarea
                    id="nb-note"
                    rows={2}
                    value={studentNote}
                    disabled={savedToNotebook}
                    onChange={(e) => setStudentNote(e.target.value)}
                    placeholder="Không bắt buộc"
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="nb-q" className="text-xs font-semibold text-slate-700 block">
                    Câu hỏi em muốn tìm hiểu thêm:
                  </label>
                  <input
                    id="nb-q"
                    type="text"
                    value={exploreQuestion}
                    disabled={savedToNotebook}
                    onChange={(e) => setExploreQuestion(e.target.value)}
                    placeholder="Không bắt buộc"
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    onClick={handleSaveNotebook}
                    disabled={savedToNotebook}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs ${
                      savedToNotebook
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        : 'bg-cyan-600 text-white hover:bg-cyan-700'
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    {savedToNotebook ? 'Đã lưu thành công' : 'Lưu kết quả vào Sổ tay'}
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setCurrentStep(3);
                        setSavedToNotebook(false);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Làm lại thí nghiệm
                    </button>
                    <button
                      onClick={() => {
                        exitFullscreen();
                        onBack();
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                    >
                      Quay lại thư viện
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <button
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              currentStep === 1
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
            }`}
          >
            <ArrowLeft className="w-4 h-4" /> Bước trước
          </button>

          {currentStep < 5 && (
            <button
              onClick={handleNextStep}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 text-white hover:bg-cyan-700 transition-colors shadow-xs"
            >
              {currentStep === 4 && !quizSubmitted ? 'Nộp câu trả lời' : 'Tiếp tục'}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
        {anyFs && (
          <p className="text-[11px] text-slate-400 text-center">Nhấn Esc để thoát toàn màn hình.</p>
        )}
      </div>
    </div>
  );
};
