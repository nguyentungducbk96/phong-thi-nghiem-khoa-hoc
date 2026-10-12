import React, { useState } from 'react';
import { Modal, btnPrimary, btnSecondary } from '../ui/Modal';
import { Spinner } from '../ui/States';
import type { StudentData } from '../../utils/storage';

interface Props {
  local: StudentData;
  onImport: () => Promise<void>;
  onSkip: () => void;
}

export const ImportLocalModal: React.FC<Props> = ({ local, onImport, onSkip }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <Modal title="Đưa kết quả trên máy này vào tài khoản?" onClose={busy ? () => undefined : onSkip}>
      <div className="space-y-3 text-sm text-slate-700">
        <p>Trên máy này đang có kết quả em đã làm khi chưa đăng nhập:</p>
        <ul className="list-disc pl-5 text-xs space-y-1">
          <li>{local.completedExpIds.length} thí nghiệm đã hoàn thành</li>
          <li>{local.quizAttempts.length} lần làm thử thách</li>
          <li>{local.experimentResults.length} lần trả lời câu hỏi thí nghiệm</li>
          <li>{local.notebooks.length} bài ghi sổ tay</li>
        </ul>
        <p className="text-xs text-slate-500">
          Chỉ chọn “Đưa vào tài khoản” nếu đây là kết quả của chính em. Điểm XP sẽ được tính lại từ các kết quả này.
        </p>
        {error && <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">{error}</p>}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <button className={btnSecondary} onClick={onSkip} disabled={busy}>Không, bỏ qua</button>
          <button
            className={btnPrimary}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError('');
              try {
                await onImport();
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Chưa đưa được dữ liệu lên, thử lại nhé.');
                setBusy(false);
              }
            }}
          >
            {busy && <Spinner />} Đưa vào tài khoản
          </button>
        </div>
      </div>
    </Modal>
  );
};
