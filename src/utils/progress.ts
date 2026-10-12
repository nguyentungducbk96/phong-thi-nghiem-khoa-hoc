// Tính huy hiệu, cấp bậc và điểm từ dữ liệu thật của học sinh (không gán sẵn).
import { QuizAttempt } from '../types';

export interface Badge {
  id: string;
  icon: string;
  name: string;
  description: string;
}

export const XP_PER_QUIZ_CORRECT = 10;
export const QUIZ_BADGE_THRESHOLD = 0.8; // đúng từ 80% trở lên
export const XP_EXPERIMENT_COMPLETE = 50;
export const XP_PER_EXPERIMENT_CORRECT = 25;

interface ProgressInput {
  completedExpIds: string[];
  totalExperiments: number;
  notebookCount: number;
  quizAttempts: QuizAttempt[];
}

export const computeBadges = ({
  completedExpIds,
  totalExperiments,
  notebookCount,
  quizAttempts
}: ProgressInput): Badge[] => {
  const badges: Badge[] = [];
  const done = (id: string) => completedExpIds.includes(id);

  if (completedExpIds.length >= 1) {
    badges.push({ id: 'first_exp', icon: '🧪', name: 'Bước chân đầu tiên', description: 'Hoàn thành thí nghiệm đầu tiên' });
  }
  if (done('khong-khi-chiem-cho')) {
    badges.push({ id: 'air', icon: '⭐', name: 'Thám tử không khí', description: 'Hoàn thành thí nghiệm không khí chiếm chỗ' });
  }
  if (done('nam-cham-hut-vat-nao')) {
    badges.push({ id: 'magnet', icon: '🧲', name: 'Bậc thầy nam châm', description: 'Hoàn thành thí nghiệm nam châm' });
  }
  if (done('mach-dien-don-gian')) {
    badges.push({ id: 'circuit', icon: '💡', name: 'Kỹ sư điện nhí', description: 'Hoàn thành thí nghiệm mạch điện' });
  }
  if (notebookCount >= 3) {
    badges.push({ id: 'notebook', icon: '📒', name: 'Người ghi chép chăm chỉ', description: 'Có từ 3 bài ghi chép trong sổ tay' });
  }
  if (quizAttempts.some((a) => a.total > 0 && a.correct / a.total >= QUIZ_BADGE_THRESHOLD)) {
    badges.push({ id: 'quiz', icon: '🏅', name: 'Thợ săn tri thức', description: 'Đúng từ 80% trở lên trong một thử thách' });
  }
  if (totalExperiments > 0 && completedExpIds.length >= totalExperiments) {
    badges.push({ id: 'all', icon: '🏆', name: 'Nhà khoa học toàn năng', description: 'Hoàn thành tất cả thí nghiệm' });
  }
  return badges;
};

export const computeRank = (xp: number): string => {
  if (xp >= 600) return 'Nhà khoa học nhí xuất sắc';
  if (xp >= 300) return 'Nhà nghiên cứu nhí';
  if (xp >= 100) return 'Nhà thám hiểm nhí';
  return 'Nhà khoa học tập sự';
};

// XP của một lần làm thử thách: chỉ cộng phần cải thiện so với lần tốt nhất trước đó,
// để làm lại cùng một bài không "cày" thêm điểm.
export const computeQuizXp = (correct: number, previousAttempts: QuizAttempt[]): number => {
  const bestPrev = previousAttempts.reduce((m, a) => Math.max(m, a.correct), 0);
  return Math.max(0, correct - bestPrev) * XP_PER_QUIZ_CORRECT;
};

export const formatDateTime = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
};
