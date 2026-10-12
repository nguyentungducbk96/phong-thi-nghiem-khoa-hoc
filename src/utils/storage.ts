// Lớp truy cập dữ liệu duy nhất của ứng dụng — ĐIỂM CHUYỂN DUY NHẤT giữa
//   • local  : khách / chế độ ngoại tuyến → localStorage của thiết bị (khóa ssl_v2_*)
//   • remote : học sinh đã đăng nhập → Supabase (xem ./remoteStore.ts)
// Component chỉ dùng getStudentStore(); không gọi localStorage hay Supabase trực tiếp
// cho dữ liệu học tập cá nhân.

import {
  NotebookEntry,
  LearningResource,
  ScienceVideo,
  Classroom,
  Assignment,
  QuizAttempt,
  ExperimentResult
} from '../types';
import { createRemoteStore } from './remoteStore';
import { isSupabaseConfigured } from '../lib/supabase';

// Tăng phiên bản khi cần bỏ dữ liệu cũ không còn hợp lệ.
// v1 (khóa "ssl_*") chứa dữ liệu mẫu giả: điểm 180 XP, thí nghiệm đã hoàn thành sẵn,
// lớp học / học sinh / tài liệu bịa. v2 bắt đầu sạch.
export const STORAGE_VERSION = 2;
const PREFIX = `ssl_v${STORAGE_VERSION}_`;

export const STORAGE_KEYS = {
  completedExps: 'completed_exps',
  studentPoints: 'student_points',
  notebooks: 'notebooks',
  resources: 'resources',
  resourceBookmarks: 'resource_bookmarks',
  videos: 'videos',
  classrooms: 'classrooms',
  assignments: 'assignments',
  quizAttempts: 'quiz_attempts',
  experimentResults: 'experiment_results',
  videoFavorites: 'video_favorites',
  importHandled: 'import_handled'
} as const;

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

const safeGet = (fullKey: string): string | null => {
  try {
    return window.localStorage.getItem(fullKey);
  } catch {
    return null;
  }
};

const safeSet = (fullKey: string, value: string) => {
  try {
    window.localStorage.setItem(fullKey, value);
  } catch {
    // Bộ nhớ đầy hoặc trình duyệt chặn lưu trữ: bỏ qua, ứng dụng vẫn chạy.
  }
};

const safeRemove = (fullKey: string) => {
  try {
    window.localStorage.removeItem(fullKey);
  } catch {
    // bỏ qua
  }
};

export function loadData<T>(key: StorageKey, fallback: T): T {
  const raw = safeGet(PREFIX + key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveData<T>(key: StorageKey, value: T) {
  safeSet(PREFIX + key, JSON.stringify(value));
}

// ---- Chuyển dữ liệu từ phiên bản cũ (v1) ----
// Giữ lại những gì người dùng thật sự tự tạo, bỏ toàn bộ dữ liệu mẫu giả.
const LEGACY_KEYS = [
  'ssl_completed_exps',
  'ssl_student_points',
  'ssl_notebooks',
  'ssl_resources',
  'ssl_videos',
  'ssl_classrooms',
  'ssl_assignments'
];
const SEEDED_IDS = new Set([
  'nb_1', 'nb_2',
  'res_1', 'res_2', 'res_3', 'res_4',
  'class_4a1', 'class_4a2',
  'asg_1', 'asg_2'
]);
const SEEDED_VIDEO_IDS = new Set(['vid_1', 'vid_2', 'vid_3']);

const readLegacy = <T,>(key: string): T[] | null => {
  const raw = safeGet(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : null;
  } catch {
    return null;
  }
};

// Thêm các mục cũ vào danh sách v2 (bỏ qua mục đã có cùng id)
function mergeIntoList<T extends { id: string }>(key: StorageKey, items: T[]) {
  if (!items.length) return;
  const current = loadData<T[]>(key, []);
  const ids = new Set(current.map((x) => x.id));
  saveData(key, [...current, ...items.filter((x) => !ids.has(x.id))]);
}

export function migrateLegacyStorage() {
  const hasLegacy = LEGACY_KEYS.some((k) => safeGet(k) !== null);
  if (!hasLegacy) return;

  // Điểm XP và danh sách thí nghiệm đã hoàn thành của v1 có giá trị gieo sẵn
  // (180 XP, 1 thí nghiệm) nên không thể tách đâu là thật: đặt lại về 0.

  const notebooks = readLegacy<NotebookEntry>('ssl_notebooks');
  if (notebooks) {
    const own = notebooks.filter((n) => !SEEDED_IDS.has(n.id));
    mergeIntoList(STORAGE_KEYS.notebooks, own);
  }

  const classrooms = readLegacy<Classroom>('ssl_classrooms');
  if (classrooms) {
    const own = classrooms
      .filter((c) => !SEEDED_IDS.has(c.id))
      .map((c) => ({
        ...c,
        students: (c.students || []).map((st) => ({ id: st.id, name: st.name, avatar: st.avatar }))
      }));
    mergeIntoList(STORAGE_KEYS.classrooms, own);
  }

  const assignments = readLegacy<Assignment>('ssl_assignments');
  if (assignments) {
    const own = assignments
      .filter((a) => !SEEDED_IDS.has(a.id))
      .map((a) => ({ ...a, submissionsCount: 0 }));
    mergeIntoList(STORAGE_KEYS.assignments, own);
  }

  // Tài liệu v1 không có đường dẫn thật nên không mở được: chỉ giữ cái có link.
  const resources = readLegacy<LearningResource & { downloadUrl?: string }>('ssl_resources');
  if (resources) {
    const own = resources
      .filter((r) => !SEEDED_IDS.has(r.id) && (r.url || r.downloadUrl))
      .map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        topicId: r.topicId,
        fileType: r.fileType,
        audience: r.audience,
        url: r.url || r.downloadUrl || '',
        uploadedAt: r.uploadedAt
      }));
    mergeIntoList(STORAGE_KEYS.resources, own);
  }

  // Video giáo viên tự thêm: giữ lại, bỏ lượt xem giả và thời lượng mặc định "04:00".
  const videos = readLegacy<ScienceVideo & { viewCount?: number }>('ssl_videos');
  if (videos) {
    const own = videos
      .filter((v) => !SEEDED_VIDEO_IDS.has(v.id))
      .map(({ viewCount: _viewCount, ...v }) => ({
        ...v,
        duration: v.duration === '04:00' ? undefined : v.duration
      }));
    mergeIntoList(STORAGE_KEYS.videos, own);
  }

  LEGACY_KEYS.forEach(safeRemove);
}

// Tiện ích nhỏ cho các component. Dùng UUID để bản ghi tạo ngoại tuyến cũng
// đưa được lên máy chủ (cột id kiểu uuid).
export const newId = (prefix: string): string => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  } catch {
    // bỏ qua
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
};

export const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

// =====================================================================
// Kho dữ liệu học tập của học sinh (bất đồng bộ, cùng giao diện cho local/remote)
// =====================================================================
export interface StudentData {
  completedExpIds: string[];
  studentPoints: number;
  notebooks: NotebookEntry[];
  quizAttempts: QuizAttempt[];
  experimentResults: ExperimentResult[];
  resourceBookmarks: string[];
  favoriteVideoIds: string[];
}

export interface StudentStore {
  mode: 'local' | 'remote';
  load(): Promise<StudentData>;
  completeExperiment(expId: string, xp: number): Promise<void>;
  // Trả về id bản ghi trên máy chủ (để gắn vào bài nộp nhiệm vụ)
  addExperimentResult(r: ExperimentResult, observation?: string): Promise<string | null>;
  addQuizAttempt(a: QuizAttempt): Promise<string | null>;
  addNotebook(e: NotebookEntry): Promise<void>;
  updateNotebook(id: string, patch: Partial<NotebookEntry>): Promise<void>;
  deleteNotebook(id: string): Promise<void>;
  setBookmark(resourceId: string, on: boolean): Promise<void>;
  setFavoriteVideo(videoId: string, on: boolean): Promise<void>;
  syncBadges(badgeIds: string[]): Promise<void>;
}

const loadVideoFavorites = (): string[] => {
  const saved = loadData<string[] | null>(STORAGE_KEYS.videoFavorites, null);
  if (saved) return saved;
  // Phiên bản trước lưu cờ isFavorite ngay trong danh sách video
  return loadData<ScienceVideo[]>(STORAGE_KEYS.videos, [])
    .filter((v) => v.isFavorite)
    .map((v) => v.id);
};

export const loadLocalSnapshot = (): StudentData => ({
  completedExpIds: loadData<string[]>(STORAGE_KEYS.completedExps, []),
  studentPoints: loadData<number>(STORAGE_KEYS.studentPoints, 0),
  notebooks: loadData<NotebookEntry[]>(STORAGE_KEYS.notebooks, []),
  quizAttempts: loadData<QuizAttempt[]>(STORAGE_KEYS.quizAttempts, []),
  experimentResults: loadData<ExperimentResult[]>(STORAGE_KEYS.experimentResults, []),
  resourceBookmarks: loadData<string[]>(STORAGE_KEYS.resourceBookmarks, []),
  favoriteVideoIds: loadVideoFavorites()
});

export const hasLocalLearningData = (d: StudentData = loadLocalSnapshot()) =>
  d.completedExpIds.length + d.notebooks.length + d.quizAttempts.length + d.experimentResults.length > 0;

// Ghi nhớ (trên thiết bị) rằng đã hỏi tài khoản này về việc nhập dữ liệu cũ
export const isImportHandled = (userId: string) =>
  loadData<string[]>(STORAGE_KEYS.importHandled, []).includes(userId);
export const markImportHandled = (userId: string) => {
  const list = loadData<string[]>(STORAGE_KEYS.importHandled, []);
  if (!list.includes(userId)) saveData(STORAGE_KEYS.importHandled, [...list, userId]);
};

const toggleInList = (key: StorageKey, id: string, on: boolean) => {
  const list = loadData<string[]>(key, []);
  const next = on ? (list.includes(id) ? list : [...list, id]) : list.filter((x) => x !== id);
  saveData(key, next);
};

export const localStore: StudentStore = {
  mode: 'local',
  async load() {
    return loadLocalSnapshot();
  },
  async completeExperiment(expId, xp) {
    const done = loadData<string[]>(STORAGE_KEYS.completedExps, []);
    if (done.includes(expId)) return;
    saveData(STORAGE_KEYS.completedExps, [...done, expId]);
    saveData(STORAGE_KEYS.studentPoints, loadData<number>(STORAGE_KEYS.studentPoints, 0) + xp);
  },
  async addExperimentResult(r) {
    saveData(STORAGE_KEYS.experimentResults, [r, ...loadData<ExperimentResult[]>(STORAGE_KEYS.experimentResults, [])]);
    return null;
  },
  async addQuizAttempt(a) {
    saveData(STORAGE_KEYS.quizAttempts, [a, ...loadData<QuizAttempt[]>(STORAGE_KEYS.quizAttempts, [])]);
    if (a.xpAwarded > 0) {
      saveData(STORAGE_KEYS.studentPoints, loadData<number>(STORAGE_KEYS.studentPoints, 0) + a.xpAwarded);
    }
    return null;
  },
  async addNotebook(e) {
    saveData(STORAGE_KEYS.notebooks, [e, ...loadData<NotebookEntry[]>(STORAGE_KEYS.notebooks, [])]);
  },
  async updateNotebook(id, patch) {
    saveData(
      STORAGE_KEYS.notebooks,
      loadData<NotebookEntry[]>(STORAGE_KEYS.notebooks, []).map((e) => (e.id === id ? { ...e, ...patch } : e))
    );
  },
  async deleteNotebook(id) {
    saveData(
      STORAGE_KEYS.notebooks,
      loadData<NotebookEntry[]>(STORAGE_KEYS.notebooks, []).filter((e) => e.id !== id)
    );
  },
  async setBookmark(id, on) {
    toggleInList(STORAGE_KEYS.resourceBookmarks, id, on);
  },
  async setFavoriteVideo(id, on) {
    saveData(STORAGE_KEYS.videoFavorites, loadVideoFavorites());
    toggleInList(STORAGE_KEYS.videoFavorites, id, on);
  },
  async syncBadges() {
    // Ngoại tuyến: huy hiệu được tính lại từ dữ liệu mỗi lần, không cần lưu riêng
  }
};

// Chọn kho: học sinh đã đăng nhập (và có cấu hình máy chủ) → remote; còn lại → local
export const getStudentStore = (studentId: string | null): StudentStore =>
  isSupabaseConfigured && studentId ? createRemoteStore(studentId) : localStore;

