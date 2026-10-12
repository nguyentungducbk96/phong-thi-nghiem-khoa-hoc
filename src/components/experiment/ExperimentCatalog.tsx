import React, { useMemo, useState } from 'react';
import { Experiment, TopicId } from '../../types';
import { SCIENCE_TOPICS, countExperimentsByTopic } from '../../data/scienceData';
import { Search, FlaskConical, Clock, CheckCircle2, Heart, RotateCcw, X } from 'lucide-react';
import { FilterSelect, LoadMore, usePaged, fieldCls } from '../ui/ListControls';

interface Props {
  experiments: Experiment[];
  completedExpIds: string[];
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
  initialTopicId?: string;
  onSelectExperiment: (exp: Experiment) => void;
}

type SortKey = 'suggested' | 'name' | 'topic' | 'newest';
type DurationKey = 'all' | 'short' | 'long';
const PAGE_SIZE = 6;
const SHORT_MAX = 15; // phút

const topicName = (id: string) => SCIENCE_TOPICS.find((t) => t.id === id)?.name || '';
const topicOrder = (id: string) => SCIENCE_TOPICS.findIndex((t) => t.id === id);
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd');

export const ExperimentCatalog: React.FC<Props> = ({
  experiments,
  completedExpIds,
  favoriteIds,
  onToggleFavorite,
  initialTopicId,
  onSelectExperiment
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>(initialTopicId || 'all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [duration, setDuration] = useState<DurationKey>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'uncompleted'>('all');
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<SortKey>('suggested');

  const filtered = useMemo(() => {
    const q = norm(searchTerm.trim());
    const list = experiments
      .map((exp, index) => ({ exp, index }))
      .filter(({ exp }) => {
        const matchesSearch =
          !q || [exp.title, exp.description, exp.objective, topicName(exp.topicId)].some((t) => norm(t).includes(q));
        const matchesTopic = selectedTopic === 'all' || exp.topicId === selectedTopic;
        const matchesDiff = selectedDifficulty === 'all' || exp.difficulty === selectedDifficulty;
        const matchesDuration =
          duration === 'all' || (duration === 'short' ? exp.durationMinutes <= SHORT_MAX : exp.durationMinutes > SHORT_MAX);
        const isCompleted = completedExpIds.includes(exp.id);
        const matchesStatus = statusFilter === 'all' ? true : statusFilter === 'completed' ? isCompleted : !isCompleted;
        const matchesFav = !onlyFavorites || favoriteIds.includes(exp.id);
        return matchesSearch && matchesTopic && matchesDiff && matchesDuration && matchesStatus && matchesFav;
      });
    const cmpName = (a: Experiment, b: Experiment) => a.title.localeCompare(b.title, 'vi');
    if (sortBy === 'name') list.sort((a, b) => cmpName(a.exp, b.exp));
    else if (sortBy === 'topic') list.sort((a, b) => topicOrder(a.exp.topicId) - topicOrder(b.exp.topicId) || cmpName(a.exp, b.exp));
    // Thí nghiệm mới được thêm vào cuối danh mục, nên "mới nhất" = đảo thứ tự danh mục
    else if (sortBy === 'newest') list.sort((a, b) => b.index - a.index);
    return list.map((x) => x.exp);
  }, [experiments, searchTerm, selectedTopic, selectedDifficulty, duration, statusFilter, onlyFavorites, favoriteIds, completedExpIds, sortBy]);

  const resetKey = [searchTerm, selectedTopic, selectedDifficulty, duration, statusFilter, onlyFavorites, sortBy].join('|');
  const { visible, remaining, more } = usePaged(filtered, PAGE_SIZE, resetKey);

  const hasFilters =
    !!searchTerm || selectedTopic !== 'all' || selectedDifficulty !== 'all' || duration !== 'all' || statusFilter !== 'all' || onlyFavorites;
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedTopic('all');
    setSelectedDifficulty('all');
    setDuration('all');
    setStatusFilter('all');
    setOnlyFavorites(false);
  };

  const emptyTitle =
    onlyFavorites && favoriteIds.length === 0
      ? 'Em chưa có thí nghiệm yêu thích nào'
      : selectedTopic !== 'all' && countExperimentsByTopic(selectedTopic as TopicId) === 0
        ? 'Chủ đề này sắp có thí nghiệm'
        : 'Không tìm thấy thí nghiệm nào phù hợp';
  const emptyText =
    onlyFavorites && favoriteIds.length === 0
      ? 'Bấm vào hình trái tim trên mỗi thẻ thí nghiệm để lưu lại những bài em thích.'
      : 'Em hãy thử đổi từ khóa hoặc bỏ bớt bộ lọc nhé!';

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Đầu trang */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 shrink-0 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
              <FlaskConical className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Thư Viện Thí Nghiệm Ảo Khoa Học 4</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Mô phỏng tương tác chạy trực tiếp trên trình duyệt, có phản hồi khi em thao tác</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span>Tiến độ:</span>
          <span className="bg-cyan-50 text-cyan-800 font-bold px-3 py-1 rounded-full border border-cyan-200">
            {completedExpIds.length} / {experiments.length} bài
          </span>
        </div>
      </div>

      {/* Tìm kiếm, lọc, sắp xếp */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
        <div className="relative">
          <label htmlFor="exp-search" className="sr-only">
            Tìm thí nghiệm
          </label>
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="exp-search"
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên hoặc từ khóa: nam châm, ánh sáng..."
            className={`${fieldCls} pl-10`}
          />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
          <FilterSelect
            id="f-topic"
            label="Chủ đề"
            value={selectedTopic}
            onChange={setSelectedTopic}
            options={[
              { value: 'all', label: 'Tất cả chủ đề' },
              ...SCIENCE_TOPICS.map((t) => ({
                value: t.id,
                label: countExperimentsByTopic(t.id) === 0 ? `${t.name} (sắp có)` : t.name
              }))
            ]}
          />
          <FilterSelect
            id="f-diff"
            label="Mức độ"
            value={selectedDifficulty}
            onChange={setSelectedDifficulty}
            options={[
              { value: 'all', label: 'Tất cả mức độ' },
              { value: 'Dễ', label: 'Dễ' },
              { value: 'Trung bình', label: 'Trung bình' },
              { value: 'Thử thách', label: 'Thử thách' }
            ]}
          />
          <FilterSelect
            id="f-dur"
            label="Thời lượng"
            value={duration}
            onChange={(v) => setDuration(v as DurationKey)}
            options={[
              { value: 'all', label: 'Mọi thời lượng' },
              { value: 'short', label: `Ngắn (≤ ${SHORT_MAX} phút)` },
              { value: 'long', label: `Dài hơn ${SHORT_MAX} phút` }
            ]}
          />
          <FilterSelect
            id="f-status"
            label="Trạng thái"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as typeof statusFilter)}
            options={[
              { value: 'all', label: 'Tất cả' },
              { value: 'completed', label: 'Đã hoàn thành' },
              { value: 'uncompleted', label: 'Chưa làm' }
            ]}
          />
          <div className="col-span-2 lg:col-span-1">
            <FilterSelect
              id="f-sort"
              label="Sắp xếp"
              value={sortBy}
              onChange={(v) => setSortBy(v as SortKey)}
              options={[
                { value: 'suggested', label: 'Gợi ý' },
                { value: 'name', label: 'Tên A → Z' },
                { value: 'topic', label: 'Theo chủ đề' },
                { value: 'newest', label: 'Mới thêm gần đây' }
              ]}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
          <button
            onClick={() => setOnlyFavorites((v) => !v)}
            aria-pressed={onlyFavorites}
            className={`inline-flex items-center gap-1.5 px-3 min-h-11 rounded-xl border text-sm font-semibold transition-colors ${
              onlyFavorites ? 'bg-rose-50 text-rose-700 border-rose-300' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Heart className={`w-4 h-4 ${onlyFavorites ? 'fill-rose-500 text-rose-500' : ''}`} />
            Yêu thích ({favoriteIds.length})
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500" aria-live="polite">
              {filtered.length} thí nghiệm
            </span>
            {hasFilters && (
              <button onClick={resetFilters} className="inline-flex items-center gap-1 px-3 min-h-11 rounded-xl text-sm font-semibold text-cyan-700 hover:bg-cyan-50">
                <X className="w-4 h-4" /> Xóa bộ lọc
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Danh sách */}
      {filtered.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          {onlyFavorites && favoriteIds.length === 0 ? (
            <Heart className="w-12 h-12 text-rose-200 mx-auto" />
          ) : (
            <FlaskConical className="w-12 h-12 text-slate-300 mx-auto" />
          )}
          <h2 className="text-base font-bold text-slate-800">{emptyTitle}</h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">{emptyText}</p>
          {hasFilters && (
            <button onClick={resetFilters} className="inline-flex items-center gap-1.5 px-4 min-h-11 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold rounded-xl">
              <RotateCcw className="w-4 h-4" /> Đặt lại bộ lọc
            </button>
          )}
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {visible.map((exp) => {
              const isCompleted = completedExpIds.includes(exp.id);
              const fav = favoriteIds.includes(exp.id);
              return (
                <li
                  key={exp.id}
                  className="relative bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col group focus-within:ring-2 focus-within:ring-cyan-500"
                >
                  <div className="relative aspect-video sm:aspect-4/3 bg-slate-100 overflow-hidden">
                    <img
                      src={exp.thumbnailUrl}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="bg-slate-950/70 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-full">{exp.difficulty}</span>
                      {isCompleted && (
                        <span className="bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đã hoàn thành
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Nút yêu thích nằm trên lớp bấm của thẻ */}
                  <button
                    onClick={() => onToggleFavorite(exp.id)}
                    aria-pressed={fav}
                    aria-label={fav ? `Bỏ yêu thích: ${exp.title}` : `Yêu thích: ${exp.title}`}
                    className="absolute top-2 right-2 z-10 w-11 h-11 rounded-full bg-white/90 hover:bg-white shadow-sm flex items-center justify-center text-slate-500 hover:text-rose-500 transition-colors"
                  >
                    <Heart className={`w-5 h-5 ${fav ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>

                  <div className="p-4 sm:p-5 space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                      <span className="font-semibold text-cyan-700">{topicName(exp.topicId)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {exp.durationMinutes} phút
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900 group-hover:text-cyan-700 transition-colors leading-snug">
                      {/* Lớp phủ: bấm bất cứ đâu trên thẻ để mở thí nghiệm */}
                      <button
                        onClick={() => onSelectExperiment(exp)}
                        className="text-left after:absolute after:inset-0 after:content-[''] focus:outline-none"
                      >
                        {exp.title}
                      </button>
                    </h2>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{exp.description}</p>
                  </div>
                  <div className="p-4 sm:p-5 pt-0">
                    <div className="w-full min-h-11 px-4 rounded-xl bg-slate-50 group-hover:bg-cyan-600 group-hover:text-white text-slate-700 text-sm font-bold transition-colors flex items-center justify-center gap-1.5">
                      <FlaskConical className="w-4 h-4" />
                      Vào thực nghiệm 5 bước
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <LoadMore remaining={remaining} shown={visible.length} total={filtered.length} onMore={more} noun="thí nghiệm" />
        </>
      )}
    </div>
  );
};
