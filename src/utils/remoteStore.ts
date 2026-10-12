// Kho dữ liệu học tập trên Supabase cho học sinh đã đăng nhập.
// Chỉ được dùng qua getStudentStore() trong storage.ts.
import { supabase } from '../lib/supabase';
import { EXPERIMENTS_DATA, INITIAL_QUIZZES } from '../data/scienceData';
import type { StudentStore, StudentData } from './storage';
import type { NotebookEntry, QuizAttempt, ExperimentResult } from '../types';
import { XP_EXPERIMENT_COMPLETE } from './progress';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KNOWN_EXPERIMENTS = new Set(EXPERIMENTS_DATA.map((e) => e.id));
const KNOWN_QUIZZES = new Set(INITIAL_QUIZZES.map((q) => q.id));

const db = () => {
  if (!supabase) throw new Error('Chưa cấu hình máy chủ');
  return supabase;
};

const must = <T,>(r: { data: T; error: { message: string } | null }): T => {
  if (r.error) throw new Error(r.error.message);
  return r.data;
};

// ---- chuyển đổi dòng ↔ đối tượng giao diện ----
interface NotebookRow {
  id: string;
  experiment_id: string | null;
  experiment_title: string;
  entry_date: string;
  hypothesis: string;
  operations: string;
  observation: string;
  conclusion: string;
  student_notes: string;
  questions_explored: string | null;
}
export const rowToNotebook = (r: NotebookRow): NotebookEntry => ({
  id: r.id,
  experimentId: r.experiment_id || '',
  experimentTitle: r.experiment_title,
  date: r.entry_date,
  hypothesis: r.hypothesis,
  operations: r.operations,
  observation: r.observation,
  conclusion: r.conclusion,
  studentNotes: r.student_notes,
  questionsExplored: r.questions_explored || undefined
});
const notebookToRow = (e: Partial<NotebookEntry>) => {
  const row: Record<string, unknown> = {};
  if (e.experimentId !== undefined) row.experiment_id = KNOWN_EXPERIMENTS.has(e.experimentId) ? e.experimentId : null;
  if (e.experimentTitle !== undefined) row.experiment_title = e.experimentTitle.slice(0, 200) || 'Ghi chép';
  if (e.date !== undefined) row.entry_date = e.date.slice(0, 40);
  if (e.hypothesis !== undefined) row.hypothesis = e.hypothesis;
  if (e.operations !== undefined) row.operations = e.operations;
  if (e.observation !== undefined) row.observation = e.observation;
  if (e.conclusion !== undefined) row.conclusion = e.conclusion;
  if (e.studentNotes !== undefined) row.student_notes = e.studentNotes;
  if (e.questionsExplored !== undefined) row.questions_explored = e.questionsExplored || null;
  return row;
};

interface AttemptRow {
  id: string;
  quiz_id: string;
  score: number;
  total: number;
  xp_awarded: number;
  wrong_question_ids: string[];
  answers: Record<string, unknown>;
  created_at: string;
}
export const rowToAttempt = (r: AttemptRow): QuizAttempt => ({
  id: r.id,
  quizId: r.quiz_id,
  quizTitle: INITIAL_QUIZZES.find((q) => q.id === r.quiz_id)?.title || r.quiz_id,
  date: r.created_at,
  correct: r.score,
  total: r.total,
  xpAwarded: r.xp_awarded,
  wrongQuestionIds: r.wrong_question_ids || [],
  answers: r.answers || {}
});
const attemptToRow = (a: QuizAttempt) => ({
  ...(UUID_RE.test(a.id) ? { id: a.id } : {}),
  quiz_id: a.quizId,
  score: a.correct,
  total: a.total,
  xp_awarded: Math.max(0, Math.min(2000, a.xpAwarded || 0)),
  wrong_question_ids: a.wrongQuestionIds || [],
  answers: a.answers || {},
  created_at: a.date
});

interface ResultRow {
  id: string;
  experiment_id: string;
  prediction_id: string | null;
  prediction_correct: boolean;
  correct: number;
  total: number;
  wrong_question_ids: string[];
  answers: Record<string, number>;
  actions: string[];
  created_at: string;
}
export const rowToResult = (r: ResultRow): ExperimentResult => ({
  id: r.id,
  experimentId: r.experiment_id,
  experimentTitle: EXPERIMENTS_DATA.find((e) => e.id === r.experiment_id)?.title || r.experiment_id,
  date: r.created_at,
  predictionId: r.prediction_id,
  predictionCorrect: r.prediction_correct,
  correct: r.correct,
  total: r.total,
  wrongQuestionIds: r.wrong_question_ids || [],
  answers: r.answers || {},
  actions: Array.isArray(r.actions) ? r.actions : []
});
const resultToRow = (r: ExperimentResult, observation?: string) => ({
  ...(UUID_RE.test(r.id) ? { id: r.id } : {}),
  experiment_id: r.experimentId,
  prediction_id: r.predictionId,
  prediction_correct: r.predictionCorrect,
  correct: r.correct,
  total: r.total,
  wrong_question_ids: r.wrongQuestionIds || [],
  answers: r.answers || {},
  actions: (r.actions || []).slice(0, 200),
  observation: (observation || r.observation || '').slice(0, 4000) || null,
  created_at: r.date
});

export const createRemoteStore = (studentId: string): StudentStore => ({
  mode: 'remote',

  async load(): Promise<StudentData> {
    const c = db();
    const [prog, att, res, nb, fav] = await Promise.all([
      c.from('experiment_progress').select('experiment_id, xp_awarded').eq('student_id', studentId),
      c.from('quiz_attempts').select('*').eq('student_id', studentId).order('created_at', { ascending: false }).limit(500),
      c.from('experiment_results').select('*').eq('student_id', studentId).order('created_at', { ascending: false }).limit(500),
      c.from('lab_notebooks').select('*').eq('student_id', studentId).order('created_at', { ascending: false }).limit(500),
      c.from('favorites').select('item_type, item_id').eq('user_id', studentId)
    ]);
    const progress = must(prog) as { experiment_id: string; xp_awarded: number }[];
    const attempts = (must(att) as AttemptRow[]).map(rowToAttempt);
    const favorites = must(fav) as { item_type: string; item_id: string }[];
    const points =
      progress.reduce((s, p) => s + (p.xp_awarded || 0), 0) + attempts.reduce((s, a) => s + (a.xpAwarded || 0), 0);
    return {
      completedExpIds: progress.map((p) => p.experiment_id),
      studentPoints: points,
      notebooks: (must(nb) as NotebookRow[]).map(rowToNotebook),
      quizAttempts: attempts,
      experimentResults: (must(res) as ResultRow[]).map(rowToResult),
      resourceBookmarks: favorites.filter((f) => f.item_type === 'resource').map((f) => f.item_id),
      favoriteVideoIds: favorites.filter((f) => f.item_type === 'video').map((f) => f.item_id)
    };
  },

  async completeExperiment(expId, xp) {
    if (!KNOWN_EXPERIMENTS.has(expId)) return;
    must(
      await db()
        .from('experiment_progress')
        .upsert({ student_id: studentId, experiment_id: expId, xp_awarded: xp }, { onConflict: 'student_id,experiment_id', ignoreDuplicates: true })
    );
  },

  async addExperimentResult(r, observation) {
    if (!KNOWN_EXPERIMENTS.has(r.experimentId)) return null;
    const row = must(
      await db().from('experiment_results').insert({ ...resultToRow(r, observation), student_id: studentId }).select('id').single()
    ) as { id: string };
    return row.id;
  },

  async addQuizAttempt(a) {
    if (!KNOWN_QUIZZES.has(a.quizId)) return null;
    const row = must(
      await db().from('quiz_attempts').insert({ ...attemptToRow(a), student_id: studentId }).select('id').single()
    ) as { id: string };
    return row.id;
  },

  async addNotebook(e) {
    must(
      await db()
        .from('lab_notebooks')
        .insert({ ...(UUID_RE.test(e.id) ? { id: e.id } : {}), ...notebookToRow(e), student_id: studentId })
    );
  },

  async updateNotebook(id, patch) {
    must(await db().from('lab_notebooks').update(notebookToRow(patch)).eq('id', id));
  },

  async deleteNotebook(id) {
    must(await db().from('lab_notebooks').delete().eq('id', id));
  },

  async setBookmark(id, on) {
    const c = db();
    if (on) must(await c.from('favorites').upsert({ user_id: studentId, item_type: 'resource', item_id: id }, { ignoreDuplicates: true }));
    else must(await c.from('favorites').delete().match({ user_id: studentId, item_type: 'resource', item_id: id }));
  },

  async setFavoriteVideo(id, on) {
    const c = db();
    if (on) must(await c.from('favorites').upsert({ user_id: studentId, item_type: 'video', item_id: id }, { ignoreDuplicates: true }));
    else must(await c.from('favorites').delete().match({ user_id: studentId, item_type: 'video', item_id: id }));
  },

  async syncBadges(ids) {
    if (!ids.length) return;
    await db()
      .from('student_achievements')
      .upsert(ids.map((achievement_id) => ({ student_id: studentId, achievement_id })), { ignoreDuplicates: true });
  }
});

// Đưa dữ liệu đang có trên thiết bị lên tài khoản (một lần, khi học sinh đồng ý).
// Điểm XP được tính lại: mỗi thí nghiệm đã hoàn thành = XP_EXPERIMENT_COMPLETE,
// cộng XP của từng lần làm thử thách.
export const importLocalToRemote = async (studentId: string, d: StudentData) => {
  const c = db();
  const opts = { ignoreDuplicates: true };
  const progress = d.completedExpIds
    .filter((id) => KNOWN_EXPERIMENTS.has(id))
    .map((experiment_id) => ({ student_id: studentId, experiment_id, xp_awarded: XP_EXPERIMENT_COMPLETE }));
  if (progress.length) must(await c.from('experiment_progress').upsert(progress, { ...opts, onConflict: 'student_id,experiment_id' }));

  const attempts = d.quizAttempts
    .filter((a) => KNOWN_QUIZZES.has(a.quizId) && a.total > 0)
    .map((a) => ({ ...attemptToRow(a), id: UUID_RE.test(a.id) ? a.id : crypto.randomUUID(), student_id: studentId }));
  if (attempts.length) must(await c.from('quiz_attempts').upsert(attempts, opts));

  const results = d.experimentResults
    .filter((r) => KNOWN_EXPERIMENTS.has(r.experimentId) && r.total > 0)
    .map((r) => ({ ...resultToRow(r), id: UUID_RE.test(r.id) ? r.id : crypto.randomUUID(), student_id: studentId }));
  if (results.length) must(await c.from('experiment_results').upsert(results, opts));

  const notebooks = d.notebooks.map((e) => ({
    ...notebookToRow(e),
    id: UUID_RE.test(e.id) ? e.id : crypto.randomUUID(),
    student_id: studentId
  }));
  if (notebooks.length) must(await c.from('lab_notebooks').upsert(notebooks, opts));

  const favs = [
    ...d.favoriteVideoIds.map((item_id) => ({ user_id: studentId, item_type: 'video', item_id })),
    ...d.resourceBookmarks.map((item_id) => ({ user_id: studentId, item_type: 'resource', item_id }))
  ].filter((f) => f.item_id.length <= 80);
  if (favs.length) must(await c.from('favorites').upsert(favs, opts));
};
