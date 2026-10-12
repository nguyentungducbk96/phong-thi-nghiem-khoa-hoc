// Chấm điểm và xáo trộn cho các dạng câu hỏi của "Thử thách nhà khoa học nhí".
import type { QuizQuestion, QuizQuestionType } from '../types';

// Đáp án học sinh, lưu nguyên dạng vào lịch sử (jsonb trên máy chủ)
//  - multiple_choice / prediction / application: chỉ số lựa chọn
//  - true_false: true/false
//  - matching: mảng, phần tử i = chỉ số "nguyên nhân" (theo pairs) ghép với hiện tượng i
//  - ordering: mảng chỉ số bước (theo steps) theo thứ tự em sắp xếp
//  - classification: mảng, phần tử i = chỉ số nhóm em chọn cho vật i
export type QuizAnswer = number | boolean | number[];

export const QUESTION_TYPE_LABEL: Record<QuizQuestionType, string> = {
  multiple_choice: 'Trắc nghiệm',
  true_false: 'Đúng hay sai',
  matching: 'Nối hiện tượng – nguyên nhân',
  ordering: 'Sắp xếp quy trình',
  classification: 'Phân loại',
  prediction: 'Dự đoán kết quả',
  application: 'Vận dụng thực tế'
};

export const isChoiceType = (t: QuizQuestionType) => t === 'multiple_choice' || t === 'prediction' || t === 'application';

const sameArray = (a: number[], b: number[]) => a.length === b.length && a.every((x, i) => x === b[i]);

export const gradeQuestion = (q: QuizQuestion, ans: QuizAnswer | undefined): boolean => {
  if (ans === undefined || ans === null) return false;
  switch (q.type) {
    case 'true_false':
      return ans === q.isTrue;
    case 'matching': {
      const n = q.pairs?.length || 0;
      return Array.isArray(ans) && ans.length === n && ans.every((r, i) => r === i);
    }
    case 'ordering': {
      const n = q.steps?.length || 0;
      return Array.isArray(ans) && sameArray(ans, Array.from({ length: n }, (_, i) => i));
    }
    case 'classification': {
      const items = q.items || [];
      return Array.isArray(ans) && ans.length === items.length && items.every((it, i) => ans[i] === it.bucket);
    }
    default:
      return ans === q.correctIndex;
  }
};

// Xáo trộn có hạt giống: cùng câu hỏi + cùng lần làm → cùng thứ tự (không nhảy khi vẽ lại)
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};
export const seededShuffle = (n: number, seed: string): number[] => {
  const idx = Array.from({ length: n }, (_, i) => i);
  let x = hash(seed) || 1;
  for (let i = n - 1; i > 0; i--) {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    const j = (x >>> 0) % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  // Không bao giờ đưa ra sẵn đúng thứ tự (với từ 2 phần tử)
  if (n > 1 && idx.every((v, i) => v === i)) idx.push(idx.shift()!);
  return idx;
};
