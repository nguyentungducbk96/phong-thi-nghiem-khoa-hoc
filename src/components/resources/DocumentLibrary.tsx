import React, { useEffect, useState } from 'react';
import { FilterSelect, LoadMore, usePaged, fieldCls } from '../ui/ListControls';
import { LearningResource, ResourceFileType, TopicId } from '../../types';
import { SCIENCE_TOPICS } from '../../data/scienceData';
import { RESOURCE_ACCEPT, validateFile, formatBytes, signedUrl, ResourceInput } from '../../lib/api';
import { friendlyError } from '../../lib/supabase';
import { LoadingState, ErrorState, Spinner } from '../ui/States';
import { useToast } from '../ui/Toast';
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
  // Giáo viên đã được duyệt: được thêm tài liệu
  isTeacher: boolean;
  // Được sửa/xóa tài liệu này không (chủ sở hữu hoặc quản trị viên)
  canEdit: (res: LearningResource) => boolean;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  // Ghi chú về nơi lưu dữ liệu (khách / ngoại tuyến / trực tuyến)
  notice?: React.ReactNode;
  onSave: (input: ResourceInput, file: File | null, existing?: LearningResource) => Promise<void>;
  onDelete: (res: LearningResource) => Promise<void>;
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
  canEdit,
  loading,
  error,
  onRetry,
  notice,
  onSave,
  onDelete,
  onToggleBookmark
}) => {
  const toast = useToast();
  const [source, setSource] = useState<'file' | 'link'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<LearningResource | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [onlyBookmarked, setOnlyBookmarked] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'newest' | 'name' | 'topic'>('newest');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string>('');

  // Esc đóng hộp thoại (trừ khi đang lưu)
  useEffect(() => {
    if (!showForm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) setShowForm(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showForm, saving]);

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
  // "Mới cập nhật": theo ngày sửa (hoặc ngày thêm) dd/mm/yyyy; cùng ngày giữ thứ tự máy chủ trả về (mới trước)
  const viDateValue = (d?: string) => {
    const m = d?.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    return m ? new Date(+m[3], +m[2] - 1, +m[1]).getTime() : 0;
  };
  const sortedResources = filteredResources
    .map((r, i) => ({ r, i }))
    .sort((a, b) => {
      if (sortBy === 'name') return a.r.title.localeCompare(b.r.title, 'vi');
      if (sortBy === 'topic')
        return SCIENCE_TOPICS.findIndex((t) => t.id === a.r.topicId) - SCIENCE_TOPICS.findIndex((t) => t.id === b.r.topicId) || a.i - b.i;
      return viDateValue(b.r.updatedAt || b.r.uploadedAt) - viDateValue(a.r.updatedAt || a.r.uploadedAt) || a.i - b.i;
    })
    .map((x) => x.r);
  const { visible: pagedResources, remaining, more } = usePaged(
    sortedResources,
    8,
    [searchTerm, fileTypeFilter, topicFilter, onlyBookmarked, sortBy].join('|')
  );

  const openAdd = () => {
    setEditingId(null);
    setEditing(null);
    setSource('file');
    setFile(null);
    setForm(emptyForm);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (res: LearningResource) => {
    setEditingId(res.id);
    setEditing(res);
    setSource(res.kind === 'file' ? 'file' : 'link');
    setFile(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setFormError('Thầy cô hãy nhập tên tài liệu.');
      return;
    }
    if (source === 'file') {
      if (!file && !(editing && editing.kind === 'file')) {
        setFormError('Thầy cô hãy chọn tệp cần tải lên.');
        return;
      }
      if (file) {
        const err = validateFile(file, 'resource');
        if (err) {
          setFormError(err);
          return;
        }
      }
    } else if (!isValidUrl(form.url)) {
      setFormError('Đường dẫn chưa hợp lệ. Hãy dán link bắt đầu bằng https://');
      return;
    }
    setFormError('');
    setSaving(true);
    try {
      await onSave(
        {
          title: form.title.trim(),
          description: form.description.trim(),
          topicId: form.topicId,
          fileType: source === 'link' ? (form.fileType === 'link' || !editing || editing.kind === 'file' ? 'link' : form.fileType) : form.fileType,
          audience: form.audience,
          url: source === 'link' ? form.url.trim() : ''
        },
        source === 'file' ? file : null,
        editing || undefined
      );
      toast.success(editingId ? 'Đã lưu thay đổi tài liệu.' : 'Đã thêm tài liệu.');
      setShowForm(false);
      setEditingId(null);
      setEditing(null);
    } catch (err) {
      setFormError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (res: LearningResource) => {
    if (!window.confirm(`Xóa tài liệu "${res.title}"? Thao tác này không hoàn tác được.`)) return;
    setBusyId(res.id);
    try {
      await onDelete(res);
      toast.success('Đã xóa tài liệu.');
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setBusyId(null);
    }
  };

  // Tệp trong kho riêng tư: xin link có hạn rồi mở/tải
  const openStored = async (res: LearningResource, download: boolean) => {
    if (!res.storagePath) return;
    const win = download ? null : window.open('', '_blank');
    setBusyId(res.id);
    try {
      const url = await signedUrl(res.storagePath, download ? res.storagePath.split('/').pop() : undefined);
      if (download) window.location.assign(url);
      else if (win) win.location.href = url;
      else window.open(url, '_blank', 'noopener');
    } catch (err) {
      win?.close();
      toast.error(friendlyError(err));
    } finally {
      setBusyId(null);
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
            Thêm tài liệu
          </button>
        )}
      </div>

      {notice && (
        <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 flex items-start gap-2">
          <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <div className="min-w-0">{notice}</div>
        </div>
      )}
      {error && <ErrorState text={error} onRetry={onRetry} />}

      {/* Tìm kiếm, lọc, sắp xếp */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm tài liệu..."
            aria-label="Tìm kiếm tài liệu"
            className={`${fieldCls} pl-10`}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          <FilterSelect
            id="doc-topic"
            label="Chủ đề"
            value={topicFilter}
            onChange={setTopicFilter}
            options={[{ value: 'all', label: 'Tất cả chủ đề' }, ...SCIENCE_TOPICS.map((t) => ({ value: t.id, label: t.name }))]}
          />
          <FilterSelect
            id="doc-type"
            label="Loại tài liệu"
            value={fileTypeFilter}
            onChange={setFileTypeFilter}
            options={[{ value: 'all', label: 'Tất cả loại' }, ...FILE_TYPES.map((f) => ({ value: f.value, label: f.label }))]}
          />
          <div className="col-span-2 sm:col-span-1">
            <FilterSelect
              id="doc-sort"
              label="Sắp xếp"
              value={sortBy}
              onChange={(v) => setSortBy(v as typeof sortBy)}
              options={[
                { value: 'newest', label: 'Mới cập nhật' },
                { value: 'name', label: 'Tên A → Z' },
                { value: 'topic', label: 'Theo chủ đề' }
              ]}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
          <button
            onClick={() => setOnlyBookmarked(!onlyBookmarked)}
            aria-pressed={onlyBookmarked}
            className={`inline-flex items-center gap-1.5 px-3 min-h-11 text-sm font-semibold rounded-xl border transition-colors ${
              onlyBookmarked ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${onlyBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
            Cần xem lại ({bookmarks.filter((b) => visibleResources.some((r) => r.id === b)).length})
          </button>
          <span className="text-xs text-slate-500" aria-live="polite">
            {filteredResources.length} tài liệu
          </span>
        </div>
      </div>

      {/* Resources Grid / Empty state */}
      {loading ? (
        <LoadingState text="Đang tải tài liệu..." />
      ) : filteredResources.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">
            {visibleResources.length === 0 ? 'Chưa có tài liệu nào' : 'Không có tài liệu phù hợp với bộ lọc'}
          </h3>
          <p className="text-xs text-slate-500">
            {visibleResources.length === 0
              ? isTeacher
                ? 'Thầy cô bấm "Thêm tài liệu" để tải lên phiếu học tập, bài giảng hoặc dán đường dẫn.'
                : 'Khi thầy cô chia sẻ tài liệu, tài liệu sẽ hiện ở đây.'
              : 'Em thử đổi từ khóa hoặc bộ lọc nhé.'}
          </p>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pagedResources.map((res) => {
            const isBookmarked = bookmarks.includes(res.id);
            return (
              <div
                key={res.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 hover:shadow-md transition-all flex flex-col justify-between space-y-4 min-w-0"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      {getFileBadge(res.fileType)}
                      <span className="text-[11px] text-slate-400">{topicName(res.topicId)}</span>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
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
                        className="w-11 h-11 -m-1.5 flex items-center justify-center rounded-lg hover:bg-amber-50"
                      >
                        <Bookmark
                          className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`}
                        />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 [overflow-wrap:anywhere]">
                    {res.title}
                  </h3>
                  {res.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed [overflow-wrap:anywhere]">
                      {res.description}
                    </p>
                  )}
                  {res.hidden && (
                    <p className="text-[11px] font-semibold text-rose-700 mt-1">Đã bị quản trị viên ẩn</p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-2">
                    {res.sizeBytes ? `${formatBytes(res.sizeBytes)} · ` : ''}Ngày thêm: {res.uploadedAt}
                    {res.updatedAt ? ` · Sửa lần cuối: ${res.updatedAt}` : ''}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {res.storagePath ? (
                      <>
                        <button
                          onClick={() => openStored(res, false)}
                          disabled={busyId === res.id}
                          className="px-3 py-2 min-h-11 lg:min-h-10 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1"
                        >
                          {busyId === res.id ? <Spinner className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />} Mở tài liệu
                        </button>
                        <button
                          onClick={() => openStored(res, true)}
                          disabled={busyId === res.id}
                          className="px-3 py-2 min-h-11 lg:min-h-10 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" /> Tải về
                        </button>
                      </>
                    ) : (
                      <>
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 min-h-11 lg:min-h-10 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Mở tài liệu
                        </a>
                        {res.fileType !== 'link' && (
                          <a
                            href={toDownloadUrl(res.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="px-3 py-2 min-h-11 lg:min-h-10 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" /> Tải về
                          </a>
                        )}
                      </>
                    )}
                  </div>
                  {canEdit(res) && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(res)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(res)}
                        disabled={busyId === res.id}
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
        <LoadMore remaining={remaining} shown={pagedResources.length} total={sortedResources.length} onMore={more} noun="tài liệu" />
        </>
      )}

      {/* Add / Edit Resource Modal for Teachers */}
      {showForm && isTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="res-form-title"
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90dvh] overflow-y-auto p-4 sm:p-6 shadow-xl space-y-4 border border-slate-200"
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
              <fieldset>
                <legend className="font-semibold text-slate-700 block mb-1">Nguồn tài liệu:</legend>
                <div className="grid grid-cols-2 gap-2">
                  {(['file', 'link'] as const).map((k) => (
                    <label
                      key={k}
                      className={`min-h-[44px] flex items-center justify-center gap-2 rounded-xl border cursor-pointer font-semibold ${
                        source === k ? 'border-indigo-500 bg-indigo-50 text-indigo-800' : 'border-slate-300 text-slate-600'
                      }`}
                    >
                      <input type="radio" name="res-source" value={k} checked={source === k} onChange={() => setSource(k)} className="sr-only" />
                      {k === 'file' ? <Upload className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                      {k === 'file' ? 'Tải tệp lên' : 'Dán đường dẫn'}
                    </label>
                  ))}
                </div>
              </fieldset>
              {source === 'file' ? (
                <div>
                  <label htmlFor="res-file" className="font-semibold text-slate-700 block mb-1">
                    {editing?.kind === 'file' ? 'Thay tệp (để trống nếu giữ tệp cũ):' : 'Chọn tệp:'}
                  </label>
                  <input
                    id="res-file"
                    type="file"
                    accept={RESOURCE_ACCEPT}
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setFile(f);
                      setFormError(f ? validateFile(f, 'resource') || '' : '');
                    }}
                    className="w-full min-w-0 text-xs file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:font-semibold"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    PDF, Word (.docx), PowerPoint (.pptx) hoặc ảnh; tối đa 50 MB. Tệp được lưu riêng tư, chỉ người có quyền mới mở được.
                    {file ? ` Đã chọn: ${file.name} (${formatBytes(file.size)}).` : ''}
                  </p>
                </div>
              ) : (
                <div>
                  <label htmlFor="res-url" className="font-semibold text-slate-700 block mb-1">Đường dẫn tài liệu (URL):</label>
                  <input
                    id="res-url"
                    type="url"
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder="https://drive.google.com/... hoặc link khác"
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={source === 'file' ? 'hidden' : ''}>
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
                  disabled={saving}
                  className="px-4 py-2 min-h-[44px] text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 min-h-[44px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-xl transition-colors shadow-2xs inline-flex items-center gap-1.5"
                >
                  {saving && <Spinner />}
                  {saving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Lưu tài liệu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
