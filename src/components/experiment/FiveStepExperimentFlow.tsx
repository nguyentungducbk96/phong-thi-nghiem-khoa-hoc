import React, { useState } from 'react';
import { Experiment, NotebookEntry } from '../../types';
import { soundManager } from '../../utils/audio';
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
  Monitor,
  Maximize2,
  Minimize2,
  Save,
  Clock,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  experiment: Experiment;
  onBack: () => void;
  onSaveToNotebook: (entry: Omit<NotebookEntry, 'id'>) => void;
  onCompleteExperiment: (expId: string, score: number) => void;
}

export const FiveStepExperimentFlow: React.FC<Props> = ({
  experiment,
  onBack,
  onSaveToNotebook,
  onCompleteExperiment
}) => {
  // Step 1 to 5
  const [currentStep, setCurrentStep] = useState<number>(1);
  // Selected prediction option ID
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null);
  // Post-quiz selected answers { questionId: selectedIndex }
  const [postAnswers, setPostAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  // Student lab notes
  const [studentNote, setStudentNote] = useState<string>('');
  // Saved to notebook flag
  const [savedToNotebook, setSavedToNotebook] = useState<boolean>(false);
  // Projector / Fullscreen mode
  const [isProjectorMode, setIsProjectorMode] = useState<boolean>(false);
  // Tracked actions inside simulation
  const [simulationLog, setSimulationLog] = useState<string[]>([]);

  const handleSimulationAction = (action: string, detail: string) => {
    setSimulationLog((prev) => [`[${action}]: ${detail}`, ...prev.slice(0, 5)]);
  };

  const handleNextStep = () => {
    if (currentStep === 2 && !selectedPrediction) {
      alert('Em hãy chọn một dự đoán trước khi bắt đầu thực nghiệm nhé!');
      return;
    }

    if (currentStep === 4 && !quizSubmitted) {
      // Check if all answered
      const allAnswered = experiment.postQuestions.every((q) => postAnswers[q.id] !== undefined);
      if (!allAnswered) {
        alert('Em hãy chọn đáp án cho tất cả câu hỏi nhé!');
        return;
      }
      setQuizSubmitted(true);
      soundManager.playSuccess();
      return;
    }

    if (currentStep === 4 && quizSubmitted) {
      // Move to step 5
      setCurrentStep(5);
      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Confetti fallback
      }
      return;
    }

    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveNotebook = () => {
    const predObj = experiment.predictionOptions.find((p) => p.id === selectedPrediction);
    const dateStr = new Date().toLocaleDateString('vi-VN');

    onSaveToNotebook({
      experimentId: experiment.id,
      experimentTitle: experiment.title,
      date: dateStr,
      hypothesis: predObj ? predObj.text : 'Đã quan sát và đưa ra dự đoán',
      operations: experiment.procedureSteps.slice(0, 2).join('; '),
      observation: simulationLog.join('; ') || 'Đã hoàn thành toàn bộ thao tác mô phỏng tương tác.',
      conclusion: experiment.scientificConclusion,
      studentNotes: studentNote || 'Em đã hiểu rõ hiện tượng khoa học qua mô phỏng trực quan.',
      questionsExplored: experiment.realWorldApplication.question
    });

    setSavedToNotebook(true);
    soundManager.playSuccess();
    onCompleteExperiment(experiment.id, 100);
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
        return <AirPressureCupSimulation onExperimentAction={handleSimulationAction} />;
    }
  };

  const stepsList = [
    { num: 1, title: 'Khám phá', icon: Compass },
    { num: 2, title: 'Dự đoán', icon: HelpCircle },
    { num: 3, title: 'Thực nghiệm', icon: FlaskConical },
    { num: 4, title: 'Quan sát & Giải thích', icon: Eye },
    { num: 5, title: 'Kết luận & Vận dụng', icon: Award }
  ];

  return (
    <div className={`min-h-screen bg-slate-50 ${isProjectorMode ? 'p-2 sm:p-4 bg-slate-900 text-white' : 'py-6 px-4 sm:px-6'}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              title="Quay lại thư viện"
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsProjectorMode(!isProjectorMode)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                isProjectorMode
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Chế độ trình chiếu lớp học dành cho giáo viên"
            >
              <Monitor className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isProjectorMode ? 'Thoát trình chiếu' : 'Trình chiếu lớp học'}
              </span>
            </button>
          </div>
        </div>

        {/* 5-Step Process Timeline Tracker */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
          <div className="grid grid-cols-5 gap-2 sm:gap-4">
            {stepsList.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.num;
              const isPast = currentStep > step.num;

              return (
                <button
                  key={step.num}
                  onClick={() => {
                    // Allow navigating freely only to past or next available
                    if (step.num <= currentStep || (step.num === currentStep + 1 && selectedPrediction)) {
                      setCurrentStep(step.num);
                    }
                  }}
                  className={`flex flex-col items-center text-center p-2 rounded-xl transition-all ${
                    isActive
                      ? 'bg-cyan-50 border border-cyan-300'
                      : isPast
                      ? 'bg-emerald-50/60 border border-emerald-200 text-emerald-800'
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
                    {isPast ? <CheckCircle className="w-4 h-4" /> : step.num}
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
        </div>

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
                  Một nhà khoa học luôn đưa ra giả thuyết trước khi bắt tay vào làm thí nghiệm. Hãy chọn dự đoán của em:
                </p>
              </div>

              {/* Prediction Options */}
              <div className="space-y-3">
                {experiment.predictionOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedPrediction(opt.id)}
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
                💡 <em>Ghi nhớ: Đừng lo lắng nếu dự đoán của em chưa chính xác, việc quan sát hiện tượng ở bước tiếp theo sẽ giúp em hiểu rõ bản chất khoa học!</em>
              </div>
            </div>
          )}

          {/* ==================== BƯỚC 3: THỰC NGHIỆM ==================== */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-xs font-bold text-cyan-600 uppercase tracking-wider">
                    Bước 3: Thực nghiệm trực tiếp
                  </span>
                  <p className="text-xs text-slate-500">
                    Dự đoán của em: <strong className="text-slate-800">{experiment.predictionOptions.find(p => p.id === selectedPrediction)?.text}</strong>
                  </p>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {simulationLog.length > 0 && `Đã ghi ${simulationLog.length} thao tác`}
                </div>
              </div>

              {/* Real Interactive Simulation */}
              {renderSimulationComponent()}
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
                  Kiểm tra sự hiểu biết của em sau khi làm thí nghiệm
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Đối chiếu với dự đoán ban đầu và trả lời các câu hỏi sau:
                </p>
              </div>

              {/* Questions List */}
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
                              onClick={() =>
                                setPostAnswers({ ...postAnswers, [q.id]: optIdx })
                              }
                              className={`w-full text-left p-3 rounded-lg border text-xs font-medium transition-all flex items-center justify-between ${
                                isOptionSelected
                                  ? quizSubmitted
                                    ? optIdx === q.correctIndex
                                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                                      : 'bg-rose-50 border-rose-500 text-rose-900'
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
                          <strong>Giải thích khoa học:</strong> {q.explanation}
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
              {/* Scientific Conclusion Box */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider">
                  <Award className="w-4 h-4" /> Bước 5: Kết luận khoa học chính thức
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold leading-snug">
                  {experiment.scientificConclusion}
                </h2>
                <p className="text-xs text-emerald-100">
                  (Theo Chuẩn kiến thức và Kỹ năng Chương trình Khoa học Lớp 4)
                </p>
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
                  <p className="text-amber-800 leading-relaxed">
                    <strong>Giải đáp:</strong> {experiment.realWorldApplication.answer}
                  </p>
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

                <textarea
                  rows={3}
                  value={studentNote}
                  onChange={(e) => setStudentNote(e.target.value)}
                  placeholder="Viết cảm nghĩ, điều em phát hiện hoặc câu hỏi em muốn tìm hiểu thêm..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />

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
                      onClick={onBack}
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
              {currentStep === 4 && !quizSubmitted ? 'Nộp bài kiểm tra' : 'Tiếp tục'}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
