export type UserRole = 'student' | 'teacher' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  grade: string;
  school: string;
  points: number;
  badges: string[];
}

export type TopicId = 
  | 'chat'
  | 'nang-luong'
  | 'khong-khi-nuoc'
  | 'anh-sang-am-thanh'
  | 'nhiet'
  | 'thuc-vat-dong-vat'
  | 'con-nguoi-suc-khoe'
  | 'sinh-vat-moi-truong';

export interface ScienceTopic {
  id: TopicId;
  name: string;
  iconName: string;
  color: string;
  description: string;
}

export interface Experiment {
  id: string;
  title: string;
  englishTitle: string;
  topicId: TopicId;
  grade: number;
  durationMinutes: number;
  difficulty: 'Dễ' | 'Trung bình' | 'Thử thách';
  thumbnailUrl: string;
  description: string;
  objective: string;
  inquiryQuestion: string;
  backgroundKnowledge: string;
  equipment: string[];
  procedureSteps: string[];
  safetyWarning?: string;
  predictionOptions: {
    id: string;
    text: string;
    isCorrect?: boolean;
    explanation: string;
  }[];
  postQuestions: {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
  scientificConclusion: string;
  realWorldApplication: {
    title: string;
    scenario: string;
    question: string;
    answer: string;
  };
}

export interface NotebookEntry {
  id: string;
  experimentId: string;
  experimentTitle: string;
  date: string;
  hypothesis: string;
  operations: string;
  observation: string;
  conclusion: string;
  studentNotes: string;
  questionsExplored?: string;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'matching' | 'ordering';
  question: string;
  options?: string[];
  correctIndex?: number;
  isTrue?: boolean;
  pairs?: { left: string; right: string }[];
  steps?: string[];
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  topicId: TopicId;
  durationMinutes: number;
  description: string;
  questions: QuizQuestion[];
}

export interface Classroom {
  id: string;
  name: string;
  code: string;
  school: string;
  grade: string;
  teacherName: string;
  studentCount: number;
  // Danh sách học sinh do giáo viên nhập. Tiến độ học tập của từng em chỉ có
  // khi kết nối máy chủ (giai đoạn sau), nên ở đây chỉ lưu tên.
  students: {
    id: string;
    name: string;
    avatar: string;
  }[];
}

export interface Assignment {
  id: string;
  classId: string;
  title: string;
  experimentId: string;
  experimentTitle: string;
  assignedDate: string;
  dueDate: string;
  targetType: 'individual' | 'group';
  targetName: string;
  status: 'active' | 'completed' | 'expired';
  submissionsCount: number;
  totalStudents: number;
}

export type ResourceFileType = 'pdf' | 'docx' | 'pptx' | 'image' | 'link';

export interface LearningResource {
  id: string;
  title: string;
  description: string;
  topicId: TopicId;
  fileType: ResourceFileType;
  audience: 'public' | 'teacher_only';
  // Đường dẫn ngoài (kind = 'link') — với tệp tải lên thì để trống và dùng storagePath
  url: string;
  uploadedAt: string;
  updatedAt?: string;
  // Các trường chỉ có khi dữ liệu đến từ máy chủ
  kind?: 'file' | 'link';
  storagePath?: string | null;
  ownerId?: string;
  classId?: string | null;
  hidden?: boolean;
  sizeBytes?: number | null;
  mimeType?: string | null;
}

export interface ScienceVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  topicId: TopicId;
  description: string;
  // Để trống nếu giáo viên không nhập thời lượng
  duration?: string;
  level: string;
  preQuestion: string;
  postQuestion: string;
  videoUrl: string;
  isFavorite?: boolean;
  // Video do giáo viên thêm trên máy chủ
  storagePath?: string | null;
  ownerId?: string;
  hidden?: boolean;
  isRemote?: boolean;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  date: string; // ISO
  correct: number;
  total: number;
  xpAwarded: number;
  wrongQuestionIds: string[];
  answers?: Record<string, unknown>;
}

export interface ExperimentResult {
  id: string;
  experimentId: string;
  experimentTitle: string;
  date: string; // ISO
  predictionId: string | null;
  predictionCorrect: boolean;
  correct: number;
  total: number;
  wrongQuestionIds: string[];
  answers?: Record<string, number>;
  actions?: string[];
  observation?: string;
}

// Hồ sơ đăng nhập (bảng profiles trên Supabase)
export type AccountStatus = 'pending' | 'active' | 'locked';
export interface AuthProfile {
  id: string;
  role: UserRole;
  status: AccountStatus;
  display_name: string;
  username: string | null;
  email: string | null;
  created_at?: string;
}
