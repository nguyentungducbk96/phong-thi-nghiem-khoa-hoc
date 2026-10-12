import React, { useState } from 'react';
import { Experiment, TopicId } from '../../types';
import { clickable } from '../../utils/a11y';
import { SCIENCE_TOPICS, countExperimentsByTopic } from '../../data/scienceData';
import { Search, FlaskConical, Clock, CheckCircle2, Filter, ArrowRight } from 'lucide-react';

interface Props {
  experiments: Experiment[];
  completedExpIds: string[];
  initialTopicId?: string;
  onSelectExperiment: (exp: Experiment) => void;
}

export const ExperimentCatalog: React.FC<Props> = ({
  experiments,
  completedExpIds,
  initialTopicId,
  onSelectExperiment
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>(initialTopicId || 'all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'uncompleted'>('all');

  const filteredExperiments = experiments.filter((exp) => {
    const matchesSearch =
      exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.objective.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTopic = selectedTopic === 'all' || exp.topicId === selectedTopic;
    const matchesDiff = selectedDifficulty === 'all' || exp.difficulty === selectedDifficulty;

    const isCompleted = completedExpIds.includes(exp.id);
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'completed'
        ? isCompleted
        : !isCompleted;

    return matchesSearch && matchesTopic && matchesDiff && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
              <FlaskConical className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Thư Viện Thí Nghiệm Ảo Khoa Học 4
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Mô phỏng tương tác chạy trực tiếp trên trình duyệt, có phản hồi khi em thao tác
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span>Tiến độ tổng thể:</span>
          <span className="bg-cyan-50 text-cyan-800 font-bold px-3 py-1 rounded-full border border-cyan-200">
            {completedExpIds.length} / {experiments.length} bài
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search box */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm tên thí nghiệm, từ khóa (ví dụ: không khí, nam châm, ánh sáng)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-cyan-500 focus:bg-white"
            />
          </div>

          {/* Difficulty */}
          <div className="sm:col-span-3">
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-cyan-500"
            >
              <option value="all">Tất cả mức độ</option>
              <option value="Dễ">Mức độ: Dễ</option>
              <option value="Trung bình">Mức độ: Trung bình</option>
              <option value="Thử thách">Mức độ: Thử thách</option>
            </select>
          </div>

          {/* Completion status */}
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-cyan-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="uncompleted">Chưa làm</option>
            </select>
          </div>
        </div>

        {/* Topic Horizontal Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100">
          <button
            onClick={() => setSelectedTopic('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border whitespace-nowrap transition-colors ${
              selectedTopic === 'all'
                ? 'bg-cyan-600 text-white border-cyan-700 shadow-2xs'
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
                  ? 'bg-cyan-600 text-white border-cyan-700 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {topic.name}
              {countExperimentsByTopic(topic.id) === 0 && (
                <span className="ml-1 text-[10px] font-normal opacity-80">(Sắp có)</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Experiments Grid */}
      {filteredExperiments.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <FlaskConical className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            {selectedTopic !== 'all' && countExperimentsByTopic(selectedTopic as TopicId) === 0
              ? 'Chủ đề này sắp có thí nghiệm'
              : 'Không tìm thấy thí nghiệm nào phù hợp'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Em hãy thử đổi từ khóa tìm kiếm hoặc bấm nút &quot;Tất cả chủ đề&quot; để xem đầy đủ danh mục nhé!
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedTopic('all');
              setSelectedDifficulty('all');
              setStatusFilter('all');
            }}
            className="px-4 py-2 bg-cyan-600 text-white text-xs font-bold rounded-xl"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExperiments.map((exp) => {
            const isCompleted = completedExpIds.includes(exp.id);

            return (
              <div
                key={exp.id}
                {...clickable(() => onSelectExperiment(exp), `Mở thí nghiệm: ${exp.title}`)}
                className="bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col justify-between group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
              >
                <div>
                  <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                    <img
                      src={exp.thumbnailUrl}
                      alt={exp.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span className="bg-slate-950/70 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                        {exp.difficulty}
                      </span>
                    </div>
                    {isCompleted && (
                      <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã hoàn thành
                      </div>
                    )}
                  </div>

                  <div className="p-5 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-semibold text-cyan-700">Khoa học 4</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {exp.durationMinutes} phút
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-cyan-700 transition-colors leading-snug">
                      {exp.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {exp.description}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <div className="w-full py-2.5 px-4 rounded-xl bg-slate-50 group-hover:bg-cyan-600 group-hover:text-white text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5">
                    <FlaskConical className="w-4 h-4" />
                    Vào thực nghiệm 5 bước
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
