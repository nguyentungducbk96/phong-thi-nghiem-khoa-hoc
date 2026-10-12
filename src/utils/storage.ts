// Lớp truy cập dữ liệu duy nhất của ứng dụng.
// Hiện tại dữ liệu chỉ lưu trong localStorage của thiết bị đang dùng.
// Giai đoạn sau sẽ thay phần thân các hàm load/save bằng Supabase
// mà không phải sửa các component.

import {
  NotebookEntry,
  LearningResource,
  ScienceVideo,
  Classroom,
  Assignment
} from '../types';

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
  experimentResults: 'experiment_results'
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

// Tiện ích nhỏ cho các component
export const newId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

