// Truy cập Supabase cho lớp học, nhiệm vụ, tài liệu, video và quản trị.
// (Dữ liệu học tập cá nhân của học sinh đi qua src/utils/storage.ts.)
// Mọi quyền hạn được kiểm tra ở máy chủ bằng RLS / Edge Function; frontend chỉ ẩn nút.
import { supabase, STORAGE_BUCKET, MAX_UPLOAD_BYTES } from './supabase';
import type { LearningResource, ResourceFileType, ScienceVideo, TopicId, AuthProfile, NotebookEntry, QuizAttempt, ExperimentResult } from '../types';
import { rowToAttempt, rowToNotebook, rowToResult } from '../utils/remoteStore';

const db = () => {
  if (!supabase) throw new Error('Chưa cấu hình máy chủ');
  return supabase;
};
const must = <T,>(r: { data: T; error: { message: string } | null }): T => {
  if (r.error) throw new Error(r.error.message);
  return r.data;
};
const uid = async (): Promise<string> => {
  const { data } = await db().auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error('Phiên đăng nhập đã hết, hãy đăng nhập lại.');
  return id;
};

// ===================== Lớp học & học sinh =====================
export interface ClassRow {
  id: string;
  teacher_id: string;
  name: string;
  school_year: string | null;
  join_code: string;
  created_at: string;
}
export interface MemberRow {
  student_id: string;
  number: number;
  group_name: string | null;
  display_name: string;
  username: string;
  status: 'active' | 'locked' | 'pending';
}
export interface NewStudentCredential {
  id: string;
  name: string;
  username: string;
  pin: string;
}

export const listMyClasses = async (): Promise<ClassRow[]> => {
  const me = await uid();
  return must(await db().from('classes').select('*').eq('teacher_id', me).order('created_at')) as ClassRow[];
};

export const createClass = async (name: string, schoolYear: string): Promise<ClassRow> =>
  must(await db().rpc('create_class', { p_name: name, p_school_year: schoolYear || null })) as ClassRow;

export const deleteClass = async (id: string) => {
  must(await db().from('classes').delete().eq('id', id));
};

export const listMembers = async (classId: string): Promise<MemberRow[]> => {
  const rows = must(
    await db()
      .from('class_members')
      .select('student_id, number, group_name, profiles!class_members_student_id_fkey(display_name, username, status)')
      .eq('class_id', classId)
      .order('number')
  ) as unknown as {
    student_id: string;
    number: number;
    group_name: string | null;
    profiles: { display_name: string; username: string; status: MemberRow['status'] } | null;
  }[];
  return rows.map((r) => ({
    student_id: r.student_id,
    number: r.number,
    group_name: r.group_name,
    display_name: r.profiles?.display_name || '(không rõ)',
    username: r.profiles?.username || '',
    status: r.profiles?.status || 'active'
  }));
};

// Gọi Edge Function manage-students; trả lỗi tiếng Việt từ máy chủ
export const manageStudents = async <T = Record<string, unknown>,>(body: Record<string, unknown>): Promise<T> => {
  const { data, error } = await db().functions.invoke('manage-students', { body });
  if (error) {
    let msg = error.message;
    try {
      const ctx = (error as unknown as { context?: Response }).context;
      if (ctx && typeof ctx.json === 'function') msg = (await ctx.json()).error || msg;
    } catch {
      // giữ thông báo gốc
    }
    throw new Error(msg);
  }
  return data as T;
};

// ===================== Nhiệm vụ & bài nộp =====================
export interface AssignmentRow {
  id: string;
  class_id: string;
  experiment_id: string | null;
  quiz_id: string | null;
  title: string;
  instructions: string | null;
  due_at: string | null;
  mode: 'individual' | 'group';
  group_name: string | null;
  created_at: string;
  classes?: { name: string } | null;
}
export interface SubmissionRow {
  id: string;
  assignment_id: string;
  student_id: string;
  experiment_result_id: string | null;
  quiz_attempt_id: string | null;
  score: number | null;
  total: number | null;
  submitted_at: string;
}

export const listAssignments = async (classId: string): Promise<AssignmentRow[]> =>
  must(await db().from('assignments').select('*').eq('class_id', classId).order('created_at', { ascending: false })) as AssignmentRow[];

export const createAssignment = async (a: {
  class_id: string;
  experiment_id?: string | null;
  quiz_id?: string | null;
  title: string;
  instructions?: string | null;
  due_at: string | null;
  mode: 'individual' | 'group';
  group_name?: string | null;
}) => {
  const me = await uid();
  must(await db().from('assignments').insert({ ...a, created_by: me }));
};

export const deleteAssignment = async (id: string) => {
  must(await db().from('assignments').delete().eq('id', id));
};

export const listSubmissions = async (assignmentIds: string[]): Promise<SubmissionRow[]> => {
  if (!assignmentIds.length) return [];
  return must(await db().from('assignment_submissions').select('*').in('assignment_id', assignmentIds)) as SubmissionRow[];
};

// Dữ liệu học tập của các học sinh trong lớp (RLS chỉ trả về học sinh giáo viên phụ trách)
export interface ClassLearningData {
  results: (ExperimentResult & { studentId: string })[];
  attempts: (QuizAttempt & { studentId: string })[];
  progress: { student_id: string; experiment_id: string; completed_at: string; xp_awarded: number }[];
  notebooks: (NotebookEntry & { studentId: string; updatedAt: string })[];
}
export const loadClassLearningData = async (studentIds: string[]): Promise<ClassLearningData> => {
  if (!studentIds.length) return { results: [], attempts: [], progress: [], notebooks: [] };
  const c = db();
  const [r, a, p, n] = await Promise.all([
    c.from('experiment_results').select('*').in('student_id', studentIds).order('created_at', { ascending: false }).limit(2000),
    c.from('quiz_attempts').select('*').in('student_id', studentIds).order('created_at', { ascending: false }).limit(2000),
    c.from('experiment_progress').select('*').in('student_id', studentIds),
    c.from('lab_notebooks').select('*').in('student_id', studentIds).order('updated_at', { ascending: false }).limit(2000)
  ]);
  type WithStudent = { student_id: string };
  return {
    results: (must(r) as (Parameters<typeof rowToResult>[0] & WithStudent)[]).map((x) => ({ ...rowToResult(x), studentId: x.student_id })),
    attempts: (must(a) as (Parameters<typeof rowToAttempt>[0] & WithStudent)[]).map((x) => ({ ...rowToAttempt(x), studentId: x.student_id })),
    progress: must(p) as ClassLearningData['progress'],
    notebooks: (must(n) as (Parameters<typeof rowToNotebook>[0] & WithStudent & { updated_at: string })[]).map((x) => ({
      ...rowToNotebook(x),
      studentId: x.student_id,
      updatedAt: x.updated_at
    }))
  };
};

// ----- phía học sinh -----
export const listMyAssignments = async (): Promise<AssignmentRow[]> =>
  must(
    await db()
      .from('assignments')
      .select('*, classes(name)')
      .order('due_at', { ascending: true, nullsFirst: false })
      .limit(200)
  ) as AssignmentRow[];

export const listMySubmissions = async (studentId: string): Promise<SubmissionRow[]> =>
  must(await db().from('assignment_submissions').select('*').eq('student_id', studentId)) as SubmissionRow[];

export const submitAssignment = async (s: {
  assignment_id: string;
  student_id: string;
  experiment_result_id?: string | null;
  quiz_attempt_id?: string | null;
  score: number;
  total: number;
}) => {
  must(
    await db()
      .from('assignment_submissions')
      .upsert({ ...s, submitted_at: new Date().toISOString() }, { onConflict: 'assignment_id,student_id' })
  );
};

// ===================== Kho tệp =====================
const EXT_MIME: Record<string, { mime: string; type: ResourceFileType | 'video' }> = {
  pdf: { mime: 'application/pdf', type: 'pdf' },
  docx: { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', type: 'docx' },
  pptx: { mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', type: 'pptx' },
  png: { mime: 'image/png', type: 'image' },
  jpg: { mime: 'image/jpeg', type: 'image' },
  jpeg: { mime: 'image/jpeg', type: 'image' },
  gif: { mime: 'image/gif', type: 'image' },
  webp: { mime: 'image/webp', type: 'image' },
  mp4: { mime: 'video/mp4', type: 'video' }
};
export const RESOURCE_ACCEPT = '.pdf,.docx,.pptx,.png,.jpg,.jpeg,.gif,.webp';
export const VIDEO_ACCEPT = '.mp4,video/mp4';

export const formatBytes = (n?: number | null) =>
  !n ? '' : n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;

// Kiểm tra tệp trước khi tải: trả về thông báo lỗi hoặc null
export const validateFile = (file: File, kind: 'resource' | 'video'): string | null => {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const info = EXT_MIME[ext];
  if (!info || (kind === 'video') !== (info.type === 'video')) {
    return kind === 'video'
      ? 'Chỉ nhận tệp video MP4.'
      : 'Chỉ nhận tệp PDF, Word (.docx), PowerPoint (.pptx) hoặc ảnh (PNG, JPG, GIF, WEBP).';
  }
  if (file.size === 0) return 'Tệp rỗng, hãy chọn tệp khác.';
  if (file.size > MAX_UPLOAD_BYTES) return `Tệp nặng ${formatBytes(file.size)}, vượt giới hạn 50 MB.`;
  return null;
};
export const fileTypeOf = (file: File): ResourceFileType => {
  const t = EXT_MIME[file.name.split('.').pop()?.toLowerCase() || '']?.type;
  return t && t !== 'video' ? t : 'pdf';
};

const slug = (name: string) => {
  const dot = name.lastIndexOf('.');
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
  return `${base || 'tep'}${ext ? '.' + ext : ''}`;
};

const uploadFile = async (folder: 'resources' | 'videos', file: File): Promise<string> => {
  const me = await uid();
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const path = `${folder}/${me}/${Date.now().toString(36)}-${slug(file.name)}`;
  must(
    await db().storage.from(STORAGE_BUCKET).upload(path, file, {
      contentType: EXT_MIME[ext]?.mime || file.type,
      upsert: false
    })
  );
  return path;
};

const removeFile = async (path?: string | null) => {
  if (!path) return;
  await db().storage.from(STORAGE_BUCKET).remove([path]);
};

// Link xem/tải có hạn dùng (mặc định 1 giờ). download=true → trình duyệt tải về với tên tệp.
export const signedUrl = async (path: string, download?: string | boolean): Promise<string> => {
  const r = await db().storage.from(STORAGE_BUCKET).createSignedUrl(path, 3600, download ? { download } : undefined);
  if (r.error || !r.data) throw new Error('Không mở được tệp (có thể em chưa có quyền xem hoặc tệp đã bị xóa).');
  return r.data.signedUrl;
};

// ===================== Tài liệu =====================
interface ResourceRow {
  id: string;
  owner_id: string;
  class_id: string | null;
  title: string;
  description: string;
  topic_id: string;
  file_type: ResourceFileType;
  kind: 'file' | 'link';
  storage_path: string | null;
  url: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  visibility: 'public' | 'teacher_only';
  hidden: boolean;
  created_at: string;
  updated_at: string;
}
const viDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN');
const rowToResource = (r: ResourceRow): LearningResource => ({
  id: r.id,
  title: r.title,
  description: r.description,
  topicId: r.topic_id as TopicId,
  fileType: r.file_type,
  audience: r.visibility,
  url: r.url || '',
  uploadedAt: viDate(r.created_at),
  updatedAt: r.updated_at !== r.created_at ? viDate(r.updated_at) : undefined,
  kind: r.kind,
  storagePath: r.storage_path,
  ownerId: r.owner_id,
  classId: r.class_id,
  hidden: r.hidden,
  sizeBytes: r.size_bytes,
  mimeType: r.mime_type
});

export const listResources = async (): Promise<LearningResource[]> =>
  (must(await db().from('learning_resources').select('*').order('created_at', { ascending: false }).limit(500)) as ResourceRow[]).map(rowToResource);

export interface ResourceInput {
  title: string;
  description: string;
  topicId: TopicId;
  fileType: ResourceFileType;
  audience: 'public' | 'teacher_only';
  url: string; // khi là liên kết
}

// Tạo mới hoặc sửa; file != null → tải tệp mới lên (thay thế tệp cũ nếu có)
export const saveResource = async (input: ResourceInput, file: File | null, existing?: LearningResource) => {
  const base = {
    title: input.title,
    description: input.description,
    topic_id: input.topicId,
    visibility: input.audience
  };
  let newPath: string | null = null;
  try {
    let fields: Record<string, unknown>;
    if (file) {
      newPath = await uploadFile('resources', file);
      fields = { ...base, kind: 'file', file_type: fileTypeOf(file), storage_path: newPath, url: null, mime_type: file.type || null, size_bytes: file.size };
    } else if (input.fileType === 'link' || !existing || existing.kind === 'link') {
      fields = { ...base, kind: 'link', file_type: input.fileType, url: input.url.trim(), storage_path: null, mime_type: null, size_bytes: null };
    } else {
      fields = base; // sửa thông tin, giữ nguyên tệp
    }
    if (existing) {
      must(await db().from('learning_resources').update(fields).eq('id', existing.id));
      if (newPath || fields.kind === 'link') await removeFile(existing.storagePath);
    } else {
      const me = await uid();
      must(await db().from('learning_resources').insert({ ...fields, owner_id: me }));
    }
  } catch (e) {
    await removeFile(newPath); // không để lại tệp mồ côi
    throw e;
  }
};

export const deleteResource = async (r: LearningResource) => {
  must(await db().from('learning_resources').delete().eq('id', r.id));
  await removeFile(r.storagePath);
};

// ===================== Video =====================
interface VideoRow {
  id: string;
  owner_id: string;
  title: string;
  url: string | null;
  storage_path: string | null;
  size_bytes: number | null;
  topic_id: string;
  description: string;
  duration: string | null;
  level: string;
  pre_question: string;
  post_question: string;
  hidden: boolean;
  created_at: string;
}
const rowToVideo = (r: VideoRow): ScienceVideo => ({
  id: r.id,
  title: r.title,
  thumbnailUrl: './images/hero_smart_science_lab_1791767458426.jpg',
  topicId: r.topic_id as TopicId,
  description: r.description,
  duration: r.duration || undefined,
  level: r.level,
  preQuestion: r.pre_question,
  postQuestion: r.post_question,
  videoUrl: r.url || '',
  storagePath: r.storage_path,
  ownerId: r.owner_id,
  hidden: r.hidden,
  isRemote: true
});

export const listVideos = async (): Promise<ScienceVideo[]> =>
  (must(await db().from('videos').select('*').order('created_at', { ascending: false }).limit(500)) as VideoRow[]).map(rowToVideo);

export interface VideoInput {
  title: string;
  topicId: TopicId;
  url: string;
  description: string;
  duration: string;
  preQuestion: string;
  postQuestion: string;
}
export const saveVideo = async (input: VideoInput, file: File | null, existing?: ScienceVideo) => {
  const base = {
    title: input.title,
    topic_id: input.topicId,
    description: input.description,
    duration: input.duration || null,
    pre_question: input.preQuestion,
    post_question: input.postQuestion
  };
  let newPath: string | null = null;
  try {
    let fields: Record<string, unknown> = base;
    if (file) {
      newPath = await uploadFile('videos', file);
      fields = { ...base, storage_path: newPath, url: null, size_bytes: file.size };
    } else if (input.url.trim()) {
      fields = { ...base, url: input.url.trim(), storage_path: null, size_bytes: null };
    }
    if (existing) {
      must(await db().from('videos').update(fields).eq('id', existing.id));
      if (fields.url !== undefined || newPath) {
        if (existing.storagePath && existing.storagePath !== newPath) await removeFile(existing.storagePath);
      }
    } else {
      const me = await uid();
      must(await db().from('videos').insert({ ...fields, owner_id: me }));
    }
  } catch (e) {
    await removeFile(newPath);
    throw e;
  }
};

export const deleteVideo = async (v: ScienceVideo) => {
  must(await db().from('videos').delete().eq('id', v.id));
  await removeFile(v.storagePath);
};

export const setContentHidden = async (table: 'videos' | 'learning_resources', id: string, hidden: boolean) => {
  must(await db().from(table).update({ hidden }).eq('id', id));
};

// ===================== Quản trị =====================
export const listAllProfiles = async (): Promise<AuthProfile[]> =>
  must(await db().from('profiles').select('id, role, status, display_name, username, email, created_at').order('created_at', { ascending: false }).limit(2000)) as AuthProfile[];

export const adminSetUser = async (target: string, changes: { role?: 'teacher' | 'admin'; status?: 'pending' | 'active' | 'locked' }) => {
  must(await db().rpc('admin_set_user', { target, new_role: changes.role ?? null, new_status: changes.status ?? null }));
};
