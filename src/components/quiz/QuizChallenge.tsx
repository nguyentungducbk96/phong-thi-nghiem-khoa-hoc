import React, { useState } from 'react';
import { Quiz, QuizQuestion, QuizAttempt } from '../../types';
import { soundManager } from '../../utils/audio';
import { newId } from '../../utils/storage';
import {
  computeQuizXp,
  formatDateTime,
  QUIZ_BADGE_THRESHOLD,
  XP_PER_QUIZ_CORRECT
} from '../../utils/progress';
import { Award, CheckCircle, XCircle, RotateCcw, ArrowRight, HelpCircle, Sparkles, History } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  onQuizComplete: (attempt: QuizAttempt) => void;
}

export const QuizChallenge: React.FC<Props> = ({ quizzes, attempts, onQuizComplete }) => {
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz>(quizzes[0]);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number | boolean>>({});
  const [isAnsweredCurrent, setIsAnsweredCurrent] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);

  const currentQ: QuizQuestion = selectedQuiz.questions[currentQIndex];
  const quizHistory = attempts.filter((a) => a.quizId === selectedQuiz.id);

  const isAnswerCorrect = (q: QuizQuestion, ans: number | boolean | undefined) =>
    q.type === 'multiple_choice' ? ans === q.correctIndex : ans === q.isTrue;

  const handleSelectAnswer = (ans: number | boolean) => {
    if (isAnsweredCurrent) return;

    setUserAnswers({ ...userAnswers, [currentQ.id]: ans });
    setIsAnsweredCurrent(true);

    if (isAnswerCorrect(currentQ, ans)) {
      soundManager.playSuccess();
      setCorrectCount((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentQIndex < selectedQuiz.questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
      setIsAnsweredCurrent(false);
      return;
    }

    // Kết thúc: chấm điểm từ đáp án đã lưu
    const total = selectedQuiz.questions.length;
    const wrongIds = selectedQuiz.questions
      .filter((q) => !isAnswerCorrect(q, userAnswers[q.id]))
      .map((q) => q.id);
    const correct = total - wrongIds.length;
    const attempt: QuizAttempt = {
      id: newId('qa'),
      quizId: selectedQuiz.id,
      quizTitle: selectedQuiz.title,
      date: new Date().toISOString(),
      correct,
      total,
      xpAwarded: computeQuizXp(correct, quizHistory),
      wrongQuestionIds: wrongIds
    };
    onQuizComplete(attempt);
    setLastAttempt(attempt);
    setIsFinished(true);

    if (total > 0 && correct / total >= QUIZ_BADGE_THRESHOLD) {
      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.55 }
        });
      } catch {
        // Confetti fallback
      }
    }
  };

  const handleRetake = () => {
    setCurrentQIndex(0);
    setUserAnswers({});
    setIsAnsweredCurrent(false);
    setIsFinished(false);
    setCorrectCount(0);
    setLastAttempt(null);
  };

  const earnedBadge =
    !!lastAttempt && lastAttempt.total > 0 && lastAttempt.correct / lastAttempt.total >= QUIZ_BADGE_THRESHOLD;
  const bestBefore = lastAttempt
    ? quizHistory.filter((a) => a.id !== lastAttempt.id).reduce((m, a) => Math.max(m, a.correct), 0)
    : 0;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Thử Thách Nhà Khoa Học Nhí
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Trắc nghiệm vui khám phá kiến thức - Tích lũy điểm thưởng, không trừ điểm khi trả lời sai!
          </p>
        </div>

        {/* Quiz Selector */}
        <div className="flex flex-wrap gap-2">
          {quizzes.map((q) => (
            <button
              key={q.id}
              onClick={() => {
                setSelectedQuiz(q);
                handleRetake();
              }}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                selectedQuiz.id === q.id
                  ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {q.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Challenge Card */}
      {!isFinished ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          {/* Progress & Score Bar */}
          <div className="flex items-center justify-between text-xs pb-4 border-b border-slate-100">
            <span className="font-semibold text-slate-500">
              Câu hỏi <strong className="text-cyan-700">{currentQIndex + 1}</strong> / {selectedQuiz.questions.length}
            </span>
            <div className="flex items-center gap-1.5 font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" /> Đúng {correctCount} câu
            </div>
          </div>

          {/* Question Text */}
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {currentQ.question}
            </h2>
          </div>

          {/* Answer Options */}
          <div className="space-y-3">
            {currentQ.type === 'multiple_choice' &&
              currentQ.options?.map((opt, idx) => {
                const isSelected = userAnswers[currentQ.id] === idx;
                const isCorrect = idx === currentQ.correctIndex;

                return (
                  <button
                    key={idx}
                    disabled={isAnsweredCurrent}
                    onClick={() => handleSelectAnswer(idx)}
                    className={`w-full text-left p-4 rounded-xl border-2 text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${
                      isAnsweredCurrent
                        ? isCorrect
                          ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold'
                          : isSelected
                          ? 'border-rose-400 bg-rose-50/70 text-rose-950'
                          : 'border-slate-200 text-slate-400 opacity-60'
                        : 'border-slate-200 hover:border-cyan-400 bg-white hover:bg-cyan-50/30 text-slate-800'
                    }`}
                  >
                    <span>{opt}</span>
                    {isAnsweredCurrent && isCorrect && (
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    )}
                    {isAnsweredCurrent && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    )}
                  </button>
                );
              })}

            {currentQ.type === 'true_false' && (
              <div className="grid grid-cols-2 gap-4">
                {[true, false].map((boolVal) => {
                  const isSelected = userAnswers[currentQ.id] === boolVal;
                  const isCorrect = boolVal === currentQ.isTrue;

                  return (
                    <button
                      key={String(boolVal)}
                      disabled={isAnsweredCurrent}
                      onClick={() => handleSelectAnswer(boolVal)}
                      className={`py-4 px-6 rounded-xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                        isAnsweredCurrent
                          ? isCorrect
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                            : isSelected
                            ? 'border-rose-400 bg-rose-50 text-rose-800'
                            : 'border-slate-200 opacity-40'
                          : 'border-slate-200 hover:border-cyan-400 bg-white text-slate-800'
                      }`}
                    >
                      {boolVal ? 'ĐÚNG (Chính xác)' : 'SAI (Chưa đúng)'}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Explanation Callout */}
          {isAnsweredCurrent && (
            <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-950 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-cyan-800">
                <HelpCircle className="w-4 h-4" /> Giải thích khoa học:
              </span>
              <p className="leading-relaxed">{currentQ.explanation}</p>
            </div>
          )}

          {/* Next Button */}
          {isAnsweredCurrent && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-cyan-600 text-white hover:bg-cyan-700 transition-colors shadow-xs"
              >
                {currentQIndex < selectedQuiz.questions.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Finished Card */
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center space-y-6 shadow-xs">
          <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
            <Award className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {earnedBadge ? 'Chúc mừng nhà khoa học nhí!' : 'Em đã hoàn thành thử thách!'}
            </h2>
            <p className="text-sm text-slate-500">
              {selectedQuiz.title}
            </p>
          </div>

          {lastAttempt && (
            <div className="inline-flex flex-wrap items-center justify-center gap-4 bg-amber-50 border border-amber-200 px-6 py-3 rounded-2xl">
              <div>
                <span className="text-xs text-amber-700 block font-medium">Kết quả</span>
                <span className="text-2xl font-black text-amber-900 font-mono">
                  {lastAttempt.correct}/{lastAttempt.total} câu đúng
                </span>
              </div>
              <div className="h-8 w-px bg-amber-200" />
              <div>
                <span className="text-xs text-amber-700 block font-medium">Điểm XP được cộng</span>
                <span className="text-2xl font-black text-amber-900 font-mono">+{lastAttempt.xpAwarded} XP</span>
              </div>
              {earnedBadge && (
                <>
                  <div className="h-8 w-px bg-amber-200" />
                  <div>
                    <span className="text-xs text-amber-700 block font-medium">Huy hiệu</span>
                    <span className="text-xs font-bold text-amber-900">🏅 Thợ săn tri thức</span>
                  </div>
                </>
              )}
            </div>
          )}

          {lastAttempt && (
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {lastAttempt.xpAwarded > 0
                ? bestBefore > 0
                  ? `Em đã làm tốt hơn lần trước (${bestBefore} câu đúng) nên được cộng ${XP_PER_QUIZ_CORRECT} XP cho mỗi câu đúng thêm.`
                  : `Mỗi câu đúng được ${XP_PER_QUIZ_CORRECT} XP.`
                : bestBefore > 0
                ? `Em đã từng đạt ${bestBefore} câu đúng ở bài này. XP chỉ được cộng khi em làm tốt hơn lần tốt nhất.`
                : 'Lần này chưa có câu đúng. Đọc lại phần giải thích rồi thử lại nhé!'}
              {!earnedBadge && ' Đúng từ 80% số câu trở lên để nhận huy hiệu Thợ săn tri thức.'}
            </p>
          )}

          <div className="pt-4 flex justify-center gap-3">
            <button
              onClick={handleRetake}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <RotateCcw className="w-4 h-4" /> Thử sức lại
            </button>
          </div>
        </div>
      )}

      {/* Lịch sử làm bài */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-600" /> Lịch sử làm bài: {selectedQuiz.title}
        </h3>
        {quizHistory.length === 0 ? (
          <p className="text-xs text-slate-400">Chưa có lần làm bài nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="py-2 pr-4 font-semibold">Thời gian</th>
                  <th className="py-2 pr-4 font-semibold">Số câu đúng</th>
                  <th className="py-2 font-semibold">XP được cộng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quizHistory.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2 pr-4 text-slate-600">{formatDateTime(a.date)}</td>
                    <td className="py-2 pr-4 font-semibold text-slate-800">
                      {a.correct}/{a.total}
                    </td>
                    <td className="py-2 font-mono text-amber-700">+{a.xpAwarded}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
