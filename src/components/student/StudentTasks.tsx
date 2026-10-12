import React from 'react';
import { ClipboardList, Calendar, CheckCircle2, Clock, AlertCircle, FlaskConical, Trophy, Users } from 'lucide-react';
import type { AssignmentRow, SubmissionRow } from '../../lib/api';
import { EXPERIMENTS_DATA, INITIAL_QUIZZES } from '../../data/scienceData';
import { formatDateTime } from '../../utils/progress';
import { LoadingState, ErrorState, EmptyState } from '../ui/States';

interface Props {
  assignments: AssignmentRow[];
  submissions: SubmissionRow[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onOpenExperiment: (id: string) => void;
  onOpenQuiz: (id: string) => void;
}

type Status = 'done' | 'late-done' | 'todo' | 'overdue';

export const assignmentStatus = (a: AssignmentRow, sub?: SubmissionRow): Status => {
  const due = a.due_at ? new Date(a.due_at).getTime() : null;
  if (sub) return due && new Date(sub.submitted_at).getTime() > due ? 'late-done' : 'done';
  return due && Date.now() > due ? 'overdue' : 'todo';
};

export const StudentTasks: React.FC<Props> = ({ assignments, submissions, loading, error, onRetry, onOpenExperiment, onOpenQuiz }) => {
  const subOf = (id: string) => submissions.find((s) => s.assignment_id === id);
  const order: Record<Status, number> = { todo: 0, overdue: 1, 'late-done': 2, done: 3 };
  const sorted = [...assignments].sort((a, b) => {
    const d = order[assignmentStatus(a, subOf(a.id))] - order[assignmentStatus(b, subOf(b.id))];
    if (d) return d;
    return (a.due_at ? new Date(a.due_at).getTime() : Infinity) - (b.due_at ? new Date(b.due_at).getTime() : Infinity);
  });
  const todoCount = assignments.filter((a) => !subOf(a.id)).length;

  const badge = (st: Status) => {
    const map: Record<Status, { cls: string; label: string; Icon: typeof Clock }> = {
      todo: { cls: 'bg-sky-50 text-sky-800 border-sky-200', label: 'Chưa làm', Icon: Clock },
      overdue: { cls: 'bg-rose-50 text-rose-800 border-rose-200', label: 'Đã quá hạn – em vẫn có thể làm', Icon: AlertCircle },
      done: { cls: 'bg-emerald-50 text-emerald-800 border-emerald-200', label: 'Đã nộp', Icon: CheckCircle2 },
      'late-done': { cls: 'bg-amber-50 text-amber-800 border-amber-200', label: 'Đã nộp (sau hạn)', Icon: CheckCircle2 }
    };
    const { cls, label, Icon } = map[st];
    return (
      <span className={`inline-flex items-center gap-1 border px-2 py-1 rounded-lg text-[11px] font-bold ${cls}`}>
        <Icon className="w-3.5 h-3.5" /> {label}
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <ClipboardList className="w-4 h-4" />
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Nhiệm vụ của em</h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {loading ? 'Đang tải...' : todoCount > 0 ? `Em còn ${todoCount} nhiệm vụ chưa làm. Cố lên nhé!` : 'Em đã làm hết nhiệm vụ. Tuyệt vời!'}
        </p>
      </div>

      {error && <ErrorState text={error} onRetry={onRetry} />}
      {loading ? (
        <LoadingState text="Đang tải nhiệm vụ..." />
      ) : sorted.length === 0 && !error ? (
        <EmptyState title="Chưa có nhiệm vụ nào" text="Khi thầy cô giao bài, nhiệm vụ sẽ hiện ở đây. Trong lúc chờ, em có thể tự khám phá thí nghiệm nhé!" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((a) => {
            const sub = subOf(a.id);
            const st = assignmentStatus(a, sub);
            const exp = a.experiment_id ? EXPERIMENTS_DATA.find((e) => e.id === a.experiment_id) : null;
            const quiz = a.quiz_id ? INITIAL_QUIZZES.find((q) => q.id === a.quiz_id) : null;
            return (
              <div key={a.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {badge(st)}
                  {a.classes?.name && <span className="text-[11px] text-slate-400">Lớp {a.classes.name}</span>}
                </div>
                <h3 className="text-sm font-bold text-slate-900 break-words">{a.title}</h3>
                <p className="text-xs text-slate-600 flex items-center gap-1.5">
                  {exp ? <FlaskConical className="w-3.5 h-3.5 text-cyan-600" /> : <Trophy className="w-3.5 h-3.5 text-amber-600" />}
                  {exp ? `Thí nghiệm: ${exp.title}` : quiz ? `Thử thách: ${quiz.title}` : 'Nội dung không còn trong ứng dụng'}
                </p>
                {a.instructions && <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2 break-words">{a.instructions}</p>}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {a.due_at ? `Hạn: ${formatDateTime(a.due_at)}` : 'Không đặt hạn'}
                  </span>
                  {a.mode === 'group' && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> Làm theo nhóm{a.group_name ? `: ${a.group_name}` : ''}
                    </span>
                  )}
                </div>
                {sub && (
                  <p className="text-xs text-emerald-800">
                    Đã nộp lúc {formatDateTime(sub.submitted_at)}
                    {sub.total ? ` · Đúng ${sub.score}/${sub.total} câu` : ''}
                  </p>
                )}
                {(exp || quiz) && (
                  <button
                    onClick={() => (exp ? onOpenExperiment(exp.id) : onOpenQuiz(quiz!.id))}
                    className="mt-auto min-h-[44px] rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold"
                  >
                    {sub ? 'Làm lại để cải thiện' : 'Bắt đầu làm'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      <p className="text-[11px] text-slate-400">
        Bài được nộp tự động khi em trả lời xong câu hỏi của thí nghiệm hoặc hoàn thành thử thách được giao.
      </p>
    </div>
  );
};
