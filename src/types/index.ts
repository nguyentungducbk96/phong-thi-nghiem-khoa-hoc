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
  experimentCount: number;
  curriculumStandard: string;
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
  students: {
    id: string;
    name: string;
    avatar: string;
    points: number;
    completedExperiments: number;
    lastActive: string;
    averageScore: number;
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

export interface LearningResource {
  id: string;
  title: string;
  description: string;
  topicId: TopicId;
  fileType: 'pdf' | 'docx' | 'pptx' | 'image';
  audience: 'public' | 'teacher_only';
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  downloadUrl?: string;
}

export interface ScienceVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  topicId: TopicId;
  description: string;
  duration: string;
  level: string;
  preQuestion: string;
  postQuestion: string;
  videoUrl: string;
  isFavorite?: boolean;
  viewCount: number;
}
