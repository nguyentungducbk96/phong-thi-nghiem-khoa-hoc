import React from 'react';
import { Experiment, ScienceTopic } from '../../types';
import {
  Compass,
  FlaskConical,
  Sparkles,
  ArrowRight,
  Clock,
  Award,
  BookOpen,
  CheckCircle2,
  Zap,
  Droplets,
  Sun,
  Flame,
  Leaf,
  HeartPulse,
  Globe2
} from 'lucide-react';

interface Props {
  experiments: Experiment[];
  topics: ScienceTopic[];
  completedExpIds: string[];
  studentPoints: number;
  onSelectExperiment: (exp: Experiment) => void;
  onSelectTopic: (topicId: string) => void;
  onExploreAll: () => void;
}

export const HomeView: React.FC<Props> = ({
  experiments,
  topics,
  completedExpIds,
  studentPoints,
  onSelectExperiment,
  onSelectTopic,
  onExploreAll
}) => {
  // Topic icons mapping
  const getTopicIcon = (id: string) => {
    switch (id) {
      case 'chat':
        return <Sparkles className="w-5 h-5" />;
      case 'nang-luong':
        return <Zap className="w-5 h-5" />;
      case 'khong-khi-nuoc':
        return <Droplets className="w-5 h-5" />;
      case 'anh-sang-am-thanh':
        return <Sun className="w-5 h-5" />;
      case 'nhiet':
        return <Flame className="w-5 h-5" />;
      case 'thuc-vat-dong-vat':
        return <Leaf className="w-5 h-5" />;
      case 'con-nguoi-suc-khoe':
        return <HeartPulse className="w-5 h-5" />;
      case 'sinh-vat-moi-truong':
        return <Globe2 className="w-5 h-5" />;
      default:
        return <FlaskConical className="w-5 h-5" />;
    }
  };

  const featuredExperiments = experiments.slice(0, 3);

  return (
    <div className="space-y-12 pb-16">
      {/* 1. WELCOME HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cyan-900 via-sky-900 to-indigo-950 text-white rounded-3xl mx-4 sm:mx-6 mt-6 p-6 sm:p-12 shadow-xl border border-sky-800/40">
        <div className="relative z-10 max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-semibold text-cyan-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Chương trình Giáo dục Phổ thông Khoa học Lớp 4</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Chào mừng nhà khoa học nhí!
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-amber-300 mt-1">
              Hôm nay em muốn khám phá điều gì?
            </span>
          </h1>

          <p className="text-sm sm:text-base text-sky-100/90 leading-relaxed max-w-xl">
            Khẩu hiệu: <strong>“Khơi nguồn tò mò – Khám phá khoa học – Sáng tạo tương lai”</strong>. 
            Thực hiện thí nghiệm ảo tương tác 100%, tự mình kiểm chứng giả thuyết và ghi lại kết quả vào sổ tay cá nhân.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onSelectExperiment(experiments[0])}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-bold text-sm shadow-lg shadow-orange-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <FlaskConical className="w-4 h-4" />
              Vào phòng thí nghiệm
            </button>
            <button
              onClick={onExploreAll}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-semibold text-sm border border-white/20 transition-all"
            >
              <Compass className="w-4 h-4 text-cyan-300" />
              Bắt đầu khám phá
            </button>
          </div>
        </div>

        {/* Ambient Hero Illustration Backdrop */}
        <div className="absolute right-0 top-0 bottom-0 w-full lg:w-1/2 opacity-25 lg:opacity-40 pointer-events-none mix-blend-screen overflow-hidden">
          <img
            src="./images/hero_smart_science_lab_1791767458426.jpg"
            alt="Smart Science Lab"
            className="w-full h-full object-cover object-right"
          />
        </div>
      </section>

      {/* 2. HÀNH TRÌNH NHÀ KHOA HỌC (STUDENT QUEST PROGRESS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider">
                Hành trình nhà khoa học nhí
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                Tiến độ khám phá của em
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Huy hiệu đạt được:</span>
              <span className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                ⭐ Thám Tử Không Khí
              </span>
              <span className="text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                🧲 Bậc Thầy Từ Tính
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
            <div className="p-4 rounded-2xl bg-cyan-50/50 border border-cyan-100">
              <span className="text-xs font-medium text-slate-500 block">Thí nghiệm hoàn thành</span>
              <span className="text-2xl sm:text-3xl font-black text-cyan-800 font-mono mt-1 block">
                {completedExpIds.length} / {experiments.length}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
              <span className="text-xs font-medium text-slate-500 block">Điểm kinh nghiệm</span>
              <span className="text-2xl sm:text-3xl font-black text-amber-600 font-mono mt-1 block">
                +{studentPoints} XP
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
              <span className="text-xs font-medium text-slate-500 block">Bài ghi chép sổ tay</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-800 font-mono mt-1 block">
                2 bản
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
              <span className="text-xs font-medium text-slate-500 block">Cấp bậc nhà nghiên cứu</span>
              <span className="text-base sm:text-lg font-black text-indigo-800 mt-1 block">
                Nhà Sáng Chế Tập Sự
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. THÍ NGHIỆM NỔI BẬT (FEATURED EXPERIMENTS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider">
              Khám phá nổi bật
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
              Thí nghiệm ảo tương tác được đề xuất
            </h2>
          </div>
          <button
            onClick={onExploreAll}
            className="text-xs font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1"
          >
            Xem tất cả {experiments.length} thí nghiệm <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredExperiments.map((exp) => {
            const isCompleted = completedExpIds.includes(exp.id);

            return (
              <div
                key={exp.id}
                onClick={() => onSelectExperiment(exp)}
                className="bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  {/* Thumbnail */}
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

                  {/* Card Content */}
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
                    Vào thực nghiệm ngay
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. KHU VỰC CHỦ ĐỀ KHOA HỌC LỚP 4 (CURRICULUM TOPICS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div>
          <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider">
            Chương trình Khoa học Lớp 4
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
            8 Chủ đề kiến thức tự nhiên
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Được cấu hình theo nội dung chương trình GDPT 2018 môn Khoa học lớp 4
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topics.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelectTopic(t.id)}
              className="text-left bg-white border border-slate-200 hover:border-cyan-400 rounded-2xl p-5 hover:shadow-md transition-all group space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 group-hover:from-cyan-100 group-hover:to-blue-100 text-slate-700 group-hover:text-cyan-700 flex items-center justify-center transition-colors">
                {getTopicIcon(t.id)}
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">
                  {t.name}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {t.curriculumStandard}
                </p>
                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {t.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-400 group-hover:text-cyan-700">
                <span>{t.experimentCount} bài thí nghiệm</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 5. GHI NHỚ AN TOÀN VÀ PHƯƠNG PHÁP KHOA HỌC */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-sky-50/70 border border-sky-200 rounded-3xl p-6 sm:p-8 flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-bold text-sky-800 uppercase tracking-wide flex items-center gap-1.5">
              <Award className="w-4 h-4" /> Nguyên tắc nhà khoa học nhí
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Quy trình học tập 5 bước chuẩn mực
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              1. Khám phá ➔ 2. Đưa ra dự đoán ➔ 3. Trực tiếp thực nghiệm ➔ 4. Quan sát & Giải thích ➔ 5. Rút ra kết luận & Vận dụng đời sống. 
              Các mô phỏng hỗ trợ học tập trực quan an toàn, không thay thế cho các trải nghiệm thực tế với thiên nhiên.
            </p>
          </div>

          <button
            onClick={() => onSelectExperiment(experiments[0])}
            className="px-5 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
          >
            Trải nghiệm ngay
          </button>
        </div>
      </section>
    </div>
  );
};
