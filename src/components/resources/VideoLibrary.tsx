import React, { useState } from 'react';
import { ScienceVideo, TopicId } from '../../types';
import { SCIENCE_TOPICS } from '../../data/scienceData';
import { Play, Search, Heart, Clock, Eye, Plus, ExternalLink, HelpCircle } from 'lucide-react';

interface Props {
  videos: ScienceVideo[];
  isTeacher: boolean;
  onAddVideo: (video: ScienceVideo) => void;
  onToggleFavorite: (id: string) => void;
}

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
  isTeacher,
  onAddVideo,
  onToggleFavorite
}) => {
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

  const filteredVideos = videos.filter((v) => {
    const matchesSearch = v.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTopic = selectedTopic === 'all' || v.topicId === selectedTopic;
    return matchesSearch && matchesTopic;
  });

  const handleCreateVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    const newVid: ScienceVideo = {
      id: 'vid_' + Date.now(),
      title: newTitle,
      thumbnailUrl: './images/hero_smart_science_lab_1791767458426.jpg',
      topicId: newTopic,
      description: newDesc,
      duration: '04:00',
      level: 'Lớp 4',
      preQuestion: newPreQ || 'Hãy chú ý quan sát hiện tượng trong video',
      postQuestion: newPostQ || 'Hiện tượng vừa xem giải thích điều gì?',
      videoUrl: newUrl,
      viewCount: 1,
      isFavorite: false
    };

    onAddVideo(newVid);
    setShowAddModal(false);
    setNewTitle('');
    setNewUrl('');
    setNewDesc('');
    setNewPreQ('');
    setNewPostQ('');
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
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Thêm video bài giảng
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
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

      {/* Video Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((vid) => (
          <div
            key={vid.id}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              {/* Thumbnail Container */}
              <div className="relative aspect-video bg-slate-900 overflow-hidden cursor-pointer" onClick={() => setActiveVideo(vid)}>
                <img
                  src={vid.thumbnailUrl}
                  alt={vid.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-slate-950/30 flex items-center justify-center group-hover:bg-slate-950/20 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>
                {/* Duration chip */}
                <span className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                  {vid.duration}
                </span>
                {/* Favorite button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(vid.id);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/60 text-white hover:text-rose-400 transition-colors"
                >
                  <Heart className={`w-4 h-4 ${vid.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>
              </div>

              {/* Video Info */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Khoa học 4</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {vid.viewCount} lượt xem</span>
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
            <div className="p-4 pt-0">
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
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">{activeVideo.title}</h3>
              <button
                onClick={() => setActiveVideo(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕ Đóng
              </button>
            </div>

            {/* Video Player Box */}
            <div className="relative aspect-video rounded-xl bg-black overflow-hidden flex items-center justify-center">
              {toEmbedUrl(activeVideo.videoUrl) ? (
                <iframe
                  src={toEmbedUrl(activeVideo.videoUrl)!}
                  title={activeVideo.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
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
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Thêm video bài giảng mới</h3>
            <form onSubmit={handleCreateVideo} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tiêu đề video:</label>
                <input
                  type="text"
                  required
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
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Đường dẫn video (URL/Embed):</label>
                <input
                  type="text"
                  required
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://..."
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

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-2xs"
                >
                  Lưu video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
