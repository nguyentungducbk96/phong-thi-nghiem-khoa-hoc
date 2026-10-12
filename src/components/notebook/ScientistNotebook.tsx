import React, { useState } from 'react';
import { NotebookEntry } from '../../types';
import { BookOpen, Calendar, Edit3, Trash2, Printer, Plus, Search, Sparkles, Check } from 'lucide-react';

interface Props {
  entries: NotebookEntry[];
  onAddEntry: (entry: Omit<NotebookEntry, 'id'>) => void;
  onUpdateEntry: (id: string, updated: Partial<NotebookEntry>) => void;
  onDeleteEntry: (id: string) => void;
}

export const ScientistNotebook: React.FC<Props> = ({
  entries,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedEntry, setSelectedEntry] = useState<NotebookEntry | null>(
    entries.length > 0 ? entries[0] : null
  );
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editNote, setEditNote] = useState<string>('');
  const [editObservation, setEditObservation] = useState<string>('');
  const [editQuestion, setEditQuestion] = useState<string>('');
  const [showNewModal, setShowNewModal] = useState<boolean>(false);

  // New entry form state
  const [newTitle, setNewTitle] = useState<string>('');
  const [newHypothesis, setNewHypothesis] = useState<string>('');
  const [newObservation, setNewObservation] = useState<string>('');
  const [newConclusion, setNewConclusion] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');

  const filteredEntries = entries.filter(
    (e) =>
      e.experimentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.conclusion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrint = () => {
    window.print();
  };

  const startEdit = (entry: NotebookEntry) => {
    setEditNote(entry.studentNotes || '');
    setEditObservation(entry.observation || '');
    setEditQuestion(entry.questionsExplored || '');
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (selectedEntry) {
      const updated = {
        studentNotes: editNote.trim(),
        observation: editObservation.trim(),
        questionsExplored: editQuestion.trim() || undefined
      };
      onUpdateEntry(selectedEntry.id, updated);
      setSelectedEntry({ ...selectedEntry, ...updated });
      setIsEditing(false);
    }
  };

  const emptyText = <span className="italic text-slate-400">(Chưa ghi)</span>;

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newObj: Omit<NotebookEntry, 'id'> = {
      experimentId: 'custom_' + Date.now(),
      experimentTitle: newTitle,
      date: new Date().toLocaleDateString('vi-VN'),
      hypothesis: newHypothesis.trim(),
      operations: '',
      observation: newObservation.trim(),
      conclusion: newConclusion.trim(),
      studentNotes: newNotes.trim()
    };

    onAddEntry(newObj);
    setShowNewModal(false);
    setNewTitle('');
    setNewHypothesis('');
    setNewObservation('');
    setNewConclusion('');
    setNewNotes('');
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Sổ Tay Nhà Khoa Học Nhí
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Nơi ghi chép lại các giả thuyết, quy trình, hiện tượng quan sát và kết luận sau mỗi thí nghiệm
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Ghi chép mới
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-2xs"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            In sổ tay / Xuất PDF
          </button>
        </div>
      </div>

      {/* Main Grid: Entries List (Left) & Detailed Entry (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Search & List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm bài ghi chép..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 shadow-2xs"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredEntries.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
                Chưa có bài ghi chép nào phù hợp. Hãy làm thí nghiệm và lưu vào sổ tay nhé!
              </div>
            ) : (
              filteredEntries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => {
                    setSelectedEntry(entry);
                    setIsEditing(false);
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedEntry?.id === entry.id
                      ? 'bg-cyan-50/70 border-cyan-400 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-slate-400" /> {entry.date}
                    </span>
                    <span className="text-cyan-700 font-semibold">Khoa học 4</span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                    {entry.experimentTitle}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    <strong>Kết luận:</strong> {entry.conclusion || '(Chưa ghi)'}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Full Entry Viewer */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          {selectedEntry ? (
            <>
              {/* Header */}
              <div className="border-b border-slate-100 pb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5" /> Ngày thực hiện: {selectedEntry.date}
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                    {selectedEntry.experimentTitle}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => (isEditing ? setIsEditing(false) : startEdit(selectedEntry))}
                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors text-xs flex items-center gap-1"
                    title="Chỉnh sửa phần em tự viết"
                  >
                    <Edit3 className="w-4 h-4 text-cyan-600" />
                    <span>{isEditing ? 'Đang sửa' : 'Sửa bài ghi'}</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Em có chắc chắn muốn xóa bài ghi chép này không?')) {
                        onDeleteEntry(selectedEntry.id);
                        setSelectedEntry(null);
                      }
                    }}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-xs"
                    title="Xóa bài ghi"
                    aria-label="Xóa bài ghi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 4 Standard Lab Blocks */}
              <div className="space-y-4">
                {/* 1. Hypothesis */}
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1">
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
                    1. Giả thuyết ban đầu (Dự đoán):
                  </span>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                    {selectedEntry.hypothesis || emptyText}
                  </p>
                </div>

                {/* 2. Operations & Procedure */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    2. Các thao tác em đã làm <span className="normal-case font-normal">(ứng dụng tự ghi lại)</span>:
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {selectedEntry.operations || emptyText}
                  </p>
                </div>

                {/* 3. Observations */}
                <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-200/80 space-y-1">
                  <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wide">
                    3. Điều em quan sát được:
                  </span>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      aria-label="Điều em quan sát được"
                      value={editObservation}
                      onChange={(e) => setEditObservation(e.target.value)}
                      className="w-full text-xs p-3 rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    />
                  ) : (
                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                      {selectedEntry.observation || emptyText}
                    </p>
                  )}
                </div>

                {/* 4. Scientific Conclusion */}
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                    4. Kết luận khoa học rút ra:
                  </span>
                  <p className="text-xs sm:text-sm text-emerald-950 font-bold leading-relaxed">
                    {selectedEntry.conclusion || emptyText}
                  </p>
                </div>

                {/* 5. Student Custom Reflection Notes */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Cảm nghĩ & Điều em muốn tìm hiểu thêm:
                  </span>

                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        aria-label="Cảm nghĩ của em"
                        placeholder="Cảm nghĩ hoặc điều em phát hiện..."
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                      />
                      <input
                        type="text"
                        aria-label="Câu hỏi em muốn tìm hiểu thêm"
                        placeholder="Câu hỏi em muốn tìm hiểu thêm..."
                        value={editQuestion}
                        onChange={(e) => setEditQuestion(e.target.value)}
                        className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Lưu lại
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs text-slate-700 italic leading-relaxed">
                        {selectedEntry.studentNotes || 'Chưa có ghi chú bổ sung.'}
                      </p>
                      {selectedEntry.questionsExplored && (
                        <p className="text-xs text-slate-700 leading-relaxed">
                          <strong>Câu hỏi muốn tìm hiểu thêm:</strong> {selectedEntry.questionsExplored}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-slate-400 text-sm">
              Chọn một bài ghi chép từ danh sách bên trái để xem chi tiết.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Manual Lab Entry */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              Ghi chép thí nghiệm mới vào Sổ tay
            </h3>
            <form onSubmit={handleCreateNew} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tên thí nghiệm:</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Thử nghiệm lọc nước bằng cát sỏi"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Dự đoán ban đầu:</label>
                <input
                  type="text"
                  value={newHypothesis}
                  onChange={(e) => setNewHypothesis(e.target.value)}
                  placeholder="Điều em nghĩ sẽ xảy ra..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Hiện tượng quan sát:</label>
                <textarea
                  rows={2}
                  value={newObservation}
                  onChange={(e) => setNewObservation(e.target.value)}
                  placeholder="Nước sau khi qua lớp cát sỏi trở nên trong hơn..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Kết luận:</label>
                <textarea
                  rows={2}
                  value={newConclusion}
                  onChange={(e) => setNewConclusion(e.target.value)}
                  placeholder="Lớp cát sỏi giữ lại các hạt cặn bẩn trong nước..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Ghi chú riêng:</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Ý tưởng hoặc câu hỏi mở rộng..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors shadow-2xs"
                >
                  Lưu vào sổ tay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
