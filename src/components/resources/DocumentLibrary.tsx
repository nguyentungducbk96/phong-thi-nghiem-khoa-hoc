import React, { useState } from 'react';
import { LearningResource, ResourceFileType, TopicId } from '../../types';
import { SCIENCE_TOPICS } from '../../data/scienceData';
import { newId } from '../../utils/storage';
import {
  FileText,
  Download,
  ExternalLink,
  Plus,
  Search,
  Lock,
  Unlock,
  Bookmark,
  Pencil,
  Trash2,
  Upload,
  Info
} from 'lucide-react';

interface Props {
  resources: LearningResource[];
  bookmarks: string[];
  isTeacher: boolean;
  onAddResource: (resource: LearningResource) => void;
  onUpdateResource: (id: string, updated: Partial<LearningResource>) => void;
  onDeleteResource: (id: string) => void;
  onToggleBookmark: (id: string) => void;
}

const FILE_TYPES: { value: ResourceFileType; label: string }[] = [
  { value: 'pdf', label: 'PDF' },
  { value: 'docx', label: 'Word' },
  { value: 'pptx', label: 'PowerPoint' },
  { value: 'image', label: 'Hình ảnh' },
  { value: 'link', label: 'Trang web / học liệu' }
];

const isValidUrl = (u: string) => {
  try {
    const url = new URL(u.trim());
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

// Với link Google Drive dạng /file/d/<id>/..., tạo link tải trực tiếp.
// Các link khác: trả về chính link đó (trình duyệt sẽ tải hoặc mở tùy máy chủ).
const toDownloadUrl = (u: string): string => {
  const m = u.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/);
  if (m) return `https://drive.google.com/uc?export=download&id=${m[1]}`;
  return u;
};

const emptyForm = {
  title: '',
  description: '',
  topicId: 'khong-khi-nuoc' as TopicId,
  fileType: 'pdf' as ResourceFileType,
  audience: 'public' as 'public' | 'teacher_only',
  url: ''
};

export const DocumentLibrary: React.FC<Props> = ({
  resources,
  bookmarks,
  isTeacher,
  onAddResource,
  onUpdateResource,
  onDeleteResource,
  onToggleBookmark
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [onlyBookmarked, setOnlyBookmarked] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string>('');

  const visibleResources = resources.filter((res) => isTeacher || res.audience !== 'teacher_only');

  const filteredResources = visibleResources.filter((res) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      res.title.toLowerCase().includes(term) || res.description.toLowerCase().includes(term);
    const matchesType = fileTypeFilter === 'all' || res.fileType === fileTypeFilter;
    const matchesTopic = topicFilter === 'all' || res.topicId === topicFilter;
    const matchesBookmark = !onlyBookmarked || bookmarks.includes(res.id);
    return matchesSearch && matchesType && matchesTopic && matchesBookmark;
  });

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (res: LearningResource) => {
    setEditingId(res.id);
    setForm({
      title: res.title,
      description: res.description,
      topicId: res.topicId,
      fileType: res.fileType,
      audience: res.audience,
      url: res.url
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setFormError('Thầy cô hãy nhập tên tài liệu.');
      return;
    }
    if (!isValidUrl(form.url)) {
      setFormError('Đường dẫn chưa hợp lệ. Hãy dán link bắt đầu bằng https://');
      return;
    }
    const today = new Date().toLocaleDateString('vi-VN');
    const data = {
      title: form.title.trim(),
      description: form.description.trim(),
      topicId: form.topicId,
      fileType: form.fileType,
      audience: form.audience,
      url: form.url.trim()
    };
    if (editingId) {
      onUpdateResource(editingId, { ...data, updatedAt: today });
    } else {
      onAddResource({ id: newId('res'), ...data, uploadedAt: today });
    }
    setShowForm(false);
    setEditingId(null);
  };

  const handleDelete = (res: LearningResource) => {
    if (window.confirm(`Xóa tài liệu "${res.title}"? Thao tác này không hoàn tác được.`)) {
      onDeleteResource(res.id);
    }
  };

  const getFileBadge = (type: ResourceFileType) => {
    const styles: Record<ResourceFileType, string> = {
      pdf: 'bg-red-50 text-red-700 border-red-200',
      pptx: 'bg-orange-50 text-orange-700 border-orange-200',
      docx: 'bg-blue-50 text-blue-700 border-blue-200',
      image: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      link: 'bg-slate-50 text-slate-700 border-slate-200'
    };
    const label = FILE_TYPES.find((f) => f.value === type)?.label || 'Tài liệu';
    return (
      <span className={`border px-2 py-0.5 rounded text-[11px] font-bold ${styles[type] || styles.link}`}>
        {label}
      </span>
    );
  };

  const topicName = (id: TopicId) => SCIENCE_TOPICS.find((t) => t.id === id)?.name || '';

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Kho Tài Liệu Học Tập
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Phiếu học tập, bài giảng và học liệu Khoa học 4 do thầy cô chia sẻ
          </p>
        </div>

        {isTeacher && (
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Thêm tài liệu (đường dẫn)
          </button>
        )}
      </div>

      {/* Honest storage note */}
      <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 flex items-start gap-2">
        <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <span>
          Hiện tài liệu được lưu dưới dạng đường dẫn và chỉ lưu trên thiết bị này. Tải tệp lên và chia sẻ cho cả lớp sẽ có khi kết nối máy chủ.
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm tài liệu..."
            aria-label="Tìm kiếm tài liệu"
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500 shadow-2xs"
          />
        </div>

        <select
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
          aria-label="Lọc theo chủ đề"
          className="py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">Tất cả chủ đề</option>
          {SCIENCE_TOPICS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <select
          value={fileTypeFilter}
          onChange={(e) => setFileTypeFilter(e.target.value)}
          aria-label="Lọc theo loại tài liệu"
          className="py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">Tất cả loại</option>
          {FILE_TYPES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        <button
          onClick={() => setOnlyBookmarked(!onlyBookmarked)}
          aria-pressed={onlyBookmarked}
          className={`px-3 py-2 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-colors ${
            onlyBookmarked
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${onlyBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
          Cần xem lại
        </button>
      </div>

      {/* Resources Grid / Empty state */}
      {filteredResources.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">
            {visibleResources.length === 0 ? 'Chưa có tài liệu nào' : 'Không có tài liệu phù hợp với bộ lọc'}
          </h3>
          <p className="text-xs text-slate-500">
            {visibleResources.length === 0
              ? isTeacher
                ? 'Thầy cô bấm "Thêm tài liệu (đường dẫn)" để chia sẻ phiếu học tập, bài giảng...'
                : 'Khi thầy cô chia sẻ tài liệu, tài liệu sẽ hiện ở đây.'
              : 'Em thử đổi từ khóa hoặc bộ lọc nhé.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredResources.map((res) => {
            const isBookmarked = bookmarks.includes(res.id);
            return (
              <div
                key={res.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {getFileBadge(res.fileType)}
                      <span className="text-[11px] text-slate-400">{topicName(res.topicId)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isTeacher &&
                        (res.audience === 'teacher_only' ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Chỉ giáo viên
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                            <Unlock className="w-3 h-3" /> Học sinh xem được
                          </span>
                        ))}
                      <button
                        onClick={() => onToggleBookmark(res.id)}
                        aria-pressed={isBookmarked}
                        aria-label={isBookmarked ? 'Bỏ đánh dấu cần xem lại' : 'Đánh dấu cần xem lại'}
                        title={isBookmarked ? 'Bỏ đánh dấu' : 'Đánh dấu cần xem lại'}
                        className="p-1.5 rounded-lg hover:bg-amber-50"
                      >
                        <Bookmark
                          className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`}
                        />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                    {res.title}
                  </h3>
                  {res.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">
                      {res.description}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-2">
                    Ngày thêm: {res.uploadedAt}
                    {res.updatedAt ? ` · Sửa lần cuối: ${res.updatedAt}` : ''}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Mở tài liệu
                    </a>
                    {res.fileType !== 'link' && (
                      <a
                        href={toDownloadUrl(res.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> Tải về
                      </a>
                    )}
                  </div>
                  {isTeacher && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(res)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(res)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Xóa
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Resource Modal for Teachers */}
      {showForm && isTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="res-form-title"
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl space-y-4 border border-slate-200"
          >
            <h3 id="res-form-title" className="text-base font-bold text-slate-900">
              {editingId ? 'Sửa tài liệu' : 'Thêm tài liệu học tập'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label htmlFor="res-title" className="font-semibold text-slate-700 block mb-1">Tên tài liệu:</label>
                <input
                  id="res-title"
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ví dụ: Phiếu học tập thí nghiệm không khí"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="res-url" className="font-semibold text-slate-700 block mb-1">Đường dẫn tài liệu (URL):</label>
                <input
                  id="res-url"
                  type="url"
                  required
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://drive.google.com/... hoặc link khác"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="p-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-500 flex items-center gap-2">
                <Upload className="w-4 h-4 shrink-0" />
                <span>Tải tệp lên sẽ có khi kết nối máy chủ. Hiện thầy cô hãy dán đường dẫn tới tệp.</span>
              </div>
              <div>
                <label htmlFor="res-desc" className="font-semibold text-slate-700 block mb-1">Mô tả ngắn gọn:</label>
                <textarea
                  id="res-desc"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Nội dung, mục tiêu hoặc hướng dẫn sử dụng tài liệu..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="res-topic" className="font-semibold text-slate-700 block mb-1">Chủ đề:</label>
                <select
                  id="res-topic"
                  value={form.topicId}
                  onChange={(e) => setForm({ ...form, topicId: e.target.value as TopicId })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:border-indigo-500 focus:outline-none"
                >
                  {SCIENCE_TOPICS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="res-type" className="font-semibold text-slate-700 block mb-1">Loại tài liệu:</label>
                  <select
                    id="res-type"
                    value={form.fileType}
                    onChange={(e) => setForm({ ...form, fileType: e.target.value as ResourceFileType })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:border-indigo-500 focus:outline-none"
                  >
                    {FILE_TYPES.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="res-aud" className="font-semibold text-slate-700 block mb-1">Ai được xem:</label>
                  <select
                    id="res-aud"
                    value={form.audience}
                    onChange={(e) =>
                      setForm({ ...form, audience: e.target.value as 'public' | 'teacher_only' })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="public">Học sinh xem được</option>
                    <option value="teacher_only">Chỉ dành cho giáo viên</option>
                  </select>
                </div>
              </div>

              {formError && (
                <p role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-2xs"
                >
                  {editingId ? 'Lưu thay đổi' : 'Lưu tài liệu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
