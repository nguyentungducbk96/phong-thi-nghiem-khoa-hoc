import React, { useEffect, useState } from 'react';
import { ScienceVideo, TopicId } from '../../types';
import { SCIENCE_TOPICS } from '../../data/scienceData';
import { Play, Search, Heart, Plus, HelpCircle, Pencil, Trash2, Info, Upload, Link2 } from 'lucide-react';
import { VIDEO_ACCEPT, validateFile, formatBytes, signedUrl, VideoInput } from '../../lib/api';
import { friendlyError } from '../../lib/supabase';
import { LoadingState, ErrorState, Spinner } from '../ui/States';
import { useToast } from '../ui/Toast';

interface Props {
  videos: ScienceVideo[];
  favoriteIds: string[];
  isTeacher: boolean;
  // Cho phép tải tệp MP4 lên kho (chỉ khi đã kết nối máy chủ)
  canUpload: boolean;
  canEdit: (v: ScienceVideo) => boolean;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  notice?: React.ReactNode;
  onSave: (input: VideoInput, file: File | null, existing?: ScienceVideo) => Promise<void>;
  onDelete: (v: ScienceVideo) => Promise<void>;
  onToggleFavorite: (id: string) => void;
}

const isDirectVideo = (u: string) => /\.(mp4|webm|ogg)(\?|#|$)/i.test(u);

// Trình phát: tệp trong kho riêng tư → xin link có hạn; MP4 trực tiếp → <video>; còn lại → iframe
const VideoPlayer: React.FC<{ video: ScienceVideo }> = ({ video }) => {
  const [src, setSrc] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setSrc(null);
    setErr(null);
    if (video.storagePath) {
      signedUrl(video.storagePath)
        .then((u) => alive && setSrc(u))
        .catch((e) => alive && setErr(friendlyError(e)));
    }
    return () => {
      alive = false;
    };
  }, [video.storagePath]);

  if (video.storagePath) {
    if (err) return <div className="text-white text-sm p-4 text-center">{err}</div>;
    if (!src) return <div className="text-white text-sm flex items-center gap-2"><Spinner /> Đang tải video...</div>;
    return <video src={src} controls playsInline className="w-full h-full bg-black" />;
  }
  if (video.videoUrl && isDirectVideo(video.videoUrl)) {
    return <video src={video.videoUrl} controls playsInline className="w-full h-full bg-black" />;
  }
  const embed = toEmbedUrl(video.videoUrl);
  if (embed) {
    return (
      <iframe
        src={embed}
        title={video.title}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  return null;
};

// Chuyển link YouTube (watch, youtu.be, shorts, embed) hoặc link .mp4 thành địa chỉ phát được
const toEmbedUrl = (url?: string): string | null => {
  if (!url || !url.trim()) return null;
  const u = url.trim();
  const m = u.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (m) return `https://www.youtube-nocookie.com/embed/${m[1]}?rel=0`;
  if (/^https?:\/\//.test(u)) return u;
  return null;
};

export const VideoLibrary: React.FC<Props> = ({
  videos,
  favoriteIds,
  isTeacher,
  canUpload,
  canEdit,
  loading,
  error,
  onRetry,
  notice,
  onSave,
  onDelete,
  onToggleFavorite
}) => {
  const toast = useToast();
  const [editing, setEditing] = useState<ScienceVideo | null>(null);
  const [source, setSource] = useState<'link' | 'file'>('link');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const isFav = (v: ScienceVideo) => favoriteIds.includes(v.id);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<TopicId | 'all'>('all');
  const [activeVideo, setActiveVideo] = useState<ScienceVideo | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New video form
  const [newTitle, setNewTitle] = useState<string>('');
  const [newTopic, setNewTopic] = useState<TopicId>('khong-khi-nuoc');
  const [newUrl, setNewUrl] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newPreQ, setNewPreQ] = useState<string>('');
  const [newPostQ, setNewPostQ] = useState<string>('');
  const [newDuration, setNewDuration] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);

  const filteredVideos = videos.filter((v) => {
    const matchesSearch = v.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTopic = selectedTopic === 'all' || v.topicId === selectedTopic;
    const matchesFav = !onlyFavorites || isFav(v);
    return matchesSearch && matchesTopic && matchesFav;
  });

  // Esc đóng trình phát / hộp thoại thêm video
  useEffect(() => {
    if (!activeVideo && !showAddModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (activeVideo) setActiveVideo(null);
      else if (!saving) setShowAddModal(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [activeVideo, showAddModal, saving]);

  const resetForm = () => {
    setNewTitle('');
    setNewUrl('');
    setNewDesc('');
    setNewPreQ('');
    setNewPostQ('');
    setNewDuration('');
    setFile(null);
    setFormError('');
  };

  const openAdd = () => {
    resetForm();
    setEditing(null);
    setSource('link');
    setShowAddModal(true);
  };

  const openEdit = (v: ScienceVideo) => {
    setEditing(v);
    setNewTitle(v.title);
    setNewTopic(v.topicId);
    setNewUrl(v.videoUrl || '');
    setNewDesc(v.description);
    setNewPreQ(v.preQuestion);
    setNewPostQ(v.postQuestion);
    setNewDuration(v.duration || '');
    setFile(null);
    setSource(v.storagePath ? 'file' : 'link');
    setFormError('');
    setShowAddModal(true);
  };

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFormError('Thầy cô hãy nhập tiêu đề video.');
      return;
    }
    if (source === 'link') {
      if (!newUrl.trim() || !toEmbedUrl(newUrl)) {
        setFormError('Đường dẫn chưa hợp lệ. Hãy dán link bắt đầu bằng https://');
        return;
      }
    } else {
      if (!file && !editing?.storagePath) {
        setFormError('Thầy cô hãy chọn tệp MP4.');
        return;
      }
      if (file) {
        const err = validateFile(file, 'video');
        if (err) {
          setFormError(err);
          return;
        }
      }
    }
    const duration = newDuration.trim();
    if (duration && !/^\d{1,3}:[0-5]\d$/.test(duration)) {
      setFormError('Thời lượng ghi theo dạng phút:giây, ví dụ 04:15 (hoặc để trống).');
      return;
    }
    setFormError('');
    setSaving(true);
    try {
      await onSave(
        {
          title: newTitle.trim(),
          topicId: newTopic,
          url: source === 'link' ? newUrl.trim() : '',
          description: newDesc.trim(),
          duration,
          preQuestion: newPreQ.trim() || 'Hãy chú ý quan sát hiện tượng trong video',
          postQuestion: newPostQ.trim() || 'Hiện tượng vừa xem giải thích điều gì?'
        },
        source === 'file' ? file : null,
        editing || undefined
      );
      toast.success(editing ? 'Đã lưu thay đổi video.' : 'Đã thêm video.');
      setShowAddModal(false);
      setEditing(null);
      resetForm();
    } catch (err) {
      setFormError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (v: ScienceVideo) => {
    if (!window.confirm(`Xóa video "${v.title}"?`)) return;
    setBusyId(v.id);
    try {
      await onDelete(v);
      toast.success('Đã xóa video.');
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <Play className="w-4 h-4 fill-current" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Kho Video Khoa Học
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Các đoạn phim thí nghiệm trực quan, phóng sự khoa học sinh động có câu hỏi định hướng tư duy
          </p>
        </div>

        {isTeacher && (
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Thêm video bài giảng
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
      {loading && <LoadingState text="Đang tải video..." />}

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-auto sm:min-w-[240px] flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm video..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-500 shadow-2xs"
          />
        </div>

        {/* Topic tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setSelectedTopic('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border whitespace-nowrap transition-colors ${
              selectedTopic === 'all'
                ? 'bg-rose-600 text-white border-rose-700'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Tất cả chủ đề
          </button>
          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            aria-pressed={onlyFavorites}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border whitespace-nowrap transition-colors flex items-center gap-1 ${
              onlyFavorites
                ? 'bg-rose-50 text-rose-700 border-rose-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-rose-500 text-rose-500' : ''}`} /> Yêu thích
          </button>
          {SCIENCE_TOPICS.map((topic) => (
            <button
              key={topic.id}
              onClick={() => setSelectedTopic(topic.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border whitespace-nowrap transition-colors ${
                selectedTopic === topic.id
                  ? 'bg-rose-600 text-white border-rose-700'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {topic.name}
            </button>
          ))}
        </div>
      </div>

      {filteredVideos.length === 0 && (
        <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 text-sm text-slate-500">
          {videos.length === 0
            ? 'Chưa có video nào. Thầy cô có thể thêm đường dẫn video bài giảng.'
            : 'Không có video nào phù hợp với bộ lọc.'}
        </div>
      )}

      {/* Video Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((vid) => (
          <div
            key={vid.id}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              {/* Thumbnail Container */}
              <div className="relative aspect-video bg-slate-900 overflow-hidden">
                <img
                  src={vid.thumbnailUrl}
                  alt={vid.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <button
                  onClick={() => setActiveVideo(vid)}
                  aria-label={`Xem video: ${vid.title}`}
                  className="absolute inset-0 bg-slate-950/30 flex items-center justify-center group-hover:bg-slate-950/20 transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-400"
                >
                  <div className="w-12 h-12 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </button>
                {/* Duration chip: chỉ hiện khi có thời lượng thật */}
                {vid.duration && (
                  <span className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                    {vid.duration}
                  </span>
                )}
                {!vid.videoUrl && !vid.storagePath && (
                  <span className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                    Chưa có video
                  </span>
                )}
                {/* Favorite button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(vid.id);
                  }}
                  aria-label={isFav(vid) ? 'Bỏ yêu thích' : 'Đánh dấu yêu thích'}
                  aria-pressed={isFav(vid)}
                  className="absolute top-2 right-2 z-10 p-2 rounded-full bg-slate-900/60 text-white hover:text-rose-400 transition-colors"
                >
                  <Heart className={`w-4 h-4 ${isFav(vid) ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>
              </div>

              {/* Video Info */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{SCIENCE_TOPICS.find((t) => t.id === vid.topicId)?.name || 'Khoa học 4'}</span>
                  <span>{vid.level}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-rose-600 transition-colors">
                  {vid.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {vid.description}
                </p>
              </div>
            </div>

            {/* Questions Teaser */}
            <div className="p-4 pt-0 space-y-2">
              {vid.hidden && <p className="text-[11px] font-semibold text-rose-700">Đã bị quản trị viên ẩn</p>}
              {canEdit(vid) && (
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(vid)}
                    className="flex-1 min-h-[40px] text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl flex items-center justify-center gap-1"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(vid)}
                    disabled={busyId === vid.id}
                    className="flex-1 min-h-[40px] text-xs font-semibold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 rounded-xl flex items-center justify-center gap-1"
                  >
                    {busyId === vid.id ? <Spinner className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />} Xóa
                  </button>
                </div>
              )}
              <button
                onClick={() => setActiveVideo(vid)}
                className="w-full py-2 bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5" /> Xem và trả lời câu hỏi
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Video Watch & Reflection Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" aria-label={activeVideo.title} className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4 border border-slate-200">
            <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 min-w-0 break-words">{activeVideo.title}</h3>
              <button
                onClick={() => setActiveVideo(null)}
                className="text-slate-500 hover:text-slate-800 text-sm font-bold shrink-0 min-h-[40px] px-2"
              >
                ✕ Đóng
              </button>
            </div>

            {/* Video Player Box */}
            <div className="relative aspect-video rounded-xl bg-black overflow-hidden flex items-center justify-center">
              {activeVideo.storagePath || toEmbedUrl(activeVideo.videoUrl) ? (
                <VideoPlayer video={activeVideo} />
              ) : (
                <>
                  <img
                    src={activeVideo.thumbnailUrl}
                    alt={activeVideo.title}
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/50 text-white p-4 text-center">
                    <span className="text-sm font-semibold">Chưa có video cho bài này</span>
                    <span className="text-xs text-slate-300">Giáo viên vui lòng bổ sung đường dẫn video.</span>
                  </div>
                </>
              )}
            </div>

            {/* Pre & Post Questions */}
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                <strong className="block font-semibold">❓ Câu hỏi định hướng trước khi xem:</strong>
                <p>{activeVideo.preQuestion}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 space-y-1">
                <strong className="block font-semibold">💡 Câu hỏi suy ngẫm sau khi xem:</strong>
                <p>{activeVideo.postQuestion}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Video Modal for Teachers */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="vid-form-title" className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-xl space-y-4 border border-slate-200">
            <h3 id="vid-form-title" className="text-base font-bold text-slate-900">{editing ? 'Sửa video' : 'Thêm video bài giảng mới'}</h3>
            <form onSubmit={handleCreateVideo} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tiêu đề video:</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Thí nghiệm sự truyền nhiệt qua các vật..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-rose-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Chủ đề khoa học:</label>
                <select
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value as TopicId)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-rose-500 focus:outline-none bg-white"
                >
                  {SCIENCE_TOPICS.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              {canUpload && (
                <fieldset>
                  <legend className="font-semibold text-slate-700 block mb-1">Nguồn video:</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {(['link', 'file'] as const).map((k) => (
                      <label
                        key={k}
                        className={`min-h-[44px] flex items-center justify-center gap-2 rounded-xl border cursor-pointer font-semibold ${
                          source === k ? 'border-rose-500 bg-rose-50 text-rose-800' : 'border-slate-300 text-slate-600'
                        }`}
                      >
                        <input type="radio" name="vid-source" value={k} checked={source === k} onChange={() => setSource(k)} className="sr-only" />
                        {k === 'link' ? <Link2 className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                        {k === 'link' ? 'Dán đường dẫn' : 'Tải MP4 lên'}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
              {source === 'link' || !canUpload ? (
                <div>
                  <label htmlFor="vid-url" className="font-semibold text-slate-700 block mb-1">Đường dẫn video (YouTube hoặc link .mp4):</label>
                  <input
                    id="vid-url"
                    type="text"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-rose-500 focus:outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label htmlFor="vid-file" className="font-semibold text-slate-700 block mb-1">
                    {editing?.storagePath ? 'Thay tệp MP4 (để trống nếu giữ tệp cũ):' : 'Chọn tệp MP4:'}
                  </label>
                  <input
                    id="vid-file"
                    type="file"
                    accept={VIDEO_ACCEPT}
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setFile(f);
                      setFormError(f ? validateFile(f, 'video') || '' : '');
                    }}
                    className="w-full min-w-0 text-xs file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-rose-50 file:text-rose-700 file:font-semibold"
                  />
                  <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-1">
                    Tối đa 50 MB (khoảng vài phút video). Với video dài hoặc nặng, thầy cô nên đăng lên YouTube ở chế độ
                    “Không công khai” rồi dán đường dẫn — phát mượt hơn và không tốn dung lượng kho.
                    {file ? ` Đã chọn: ${file.name} (${formatBytes(file.size)}).` : ''}
                  </p>
                </div>
              )}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Thời lượng (không bắt buộc):</label>
                <input
                  type="text"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  placeholder="Ví dụ: 04:15"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-rose-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Câu hỏi định hướng trước khi xem:</label>
                <input
                  type="text"
                  value={newPreQ}
                  onChange={(e) => setNewPreQ(e.target.value)}
                  placeholder="Em hãy chú ý quan sát..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-rose-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Câu hỏi kiểm tra sau khi xem:</label>
                <input
                  type="text"
                  value={newPostQ}
                  onChange={(e) => setNewPostQ(e.target.value)}
                  placeholder="Hiện tượng chứng minh điều gì?"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-rose-500 focus:outline-none"
                />
              </div>

              <p className="text-[11px] text-slate-500">
                Chỉ dùng video từ nguồn được phép sử dụng.
                {!canUpload && ' Tải tệp video lên cần đăng nhập tài khoản giáo viên đã được duyệt.'}
              </p>
              {formError && (
                <p role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">
                  {formError}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormError('');
                  }}
                  disabled={saving}
                  className="px-4 py-2 min-h-[44px] text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 min-h-[44px] font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 rounded-xl transition-colors shadow-2xs inline-flex items-center gap-1.5"
                >
                  {saving && <Spinner />}
                  {saving ? 'Đang lưu...' : 'Lưu video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
