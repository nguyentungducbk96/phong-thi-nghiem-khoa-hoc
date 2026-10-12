import React, { useState, useEffect } from 'react';
import {
  UserRole,
  Experiment,
  NotebookEntry,
  LearningResource,
  ScienceVideo,
  Assignment,
  Classroom,
  QuizAttempt,
  ExperimentResult
} from './types';
import {
  SCIENCE_TOPICS,
  EXPERIMENTS_DATA,
  INITIAL_QUIZZES,
  INITIAL_VIDEOS,
  countExperimentsByTopic
} from './data/scienceData';
import { Navbar } from './components/layout/Navbar';
import { HomeView } from './components/home/HomeView';
import { ExperimentCatalog } from './components/experiment/ExperimentCatalog';
import { FiveStepExperimentFlow } from './components/experiment/FiveStepExperimentFlow';
import { ScientistNotebook } from './components/notebook/ScientistNotebook';
import { QuizChallenge } from './components/quiz/QuizChallenge';
import { VideoLibrary } from './components/resources/VideoLibrary';
import { DocumentLibrary } from './components/resources/DocumentLibrary';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { ScienceAssistantModal } from './components/assistant/ScienceAssistantModal';
import { loadData, saveData, migrateLegacyStorage, STORAGE_KEYS, newId } from './utils/storage';
import { computeBadges } from './utils/progress';
import { clickable } from './utils/a11y';

// Bỏ dữ liệu mẫu giả của phiên bản cũ trước khi đọc dữ liệu (chạy một lần khi tải trang)
migrateLegacyStorage();

export default function App() {
  // Current active navigation tab
  const [currentTab, setCurrentTab] = useState<string>('home');
  // Current user role: student, teacher, admin
  const [currentRole, setCurrentRole] = useState<UserRole>('student');
  // Currently active experiment (for 5-step flow)
  const [activeExperiment, setActiveExperiment] = useState<Experiment | null>(null);
  // Topic filter when navigating from topic cards
  const [filterTopicId, setFilterTopicId] = useState<string | undefined>(undefined);

  // Tiến độ học sinh: người dùng mới bắt đầu từ 0
  const [completedExpIds, setCompletedExpIds] = useState<string[]>(() =>
    loadData<string[]>(STORAGE_KEYS.completedExps, [])
  );
  const [studentPoints, setStudentPoints] = useState<number>(() =>
    loadData<number>(STORAGE_KEYS.studentPoints, 0)
  );
  const [notebookEntries, setNotebookEntries] = useState<NotebookEntry[]>(() =>
    loadData<NotebookEntry[]>(STORAGE_KEYS.notebooks, [])
  );
  const [resources, setResources] = useState<LearningResource[]>(() =>
    loadData<LearningResource[]>(STORAGE_KEYS.resources, [])
  );
  const [resourceBookmarks, setResourceBookmarks] = useState<string[]>(() =>
    loadData<string[]>(STORAGE_KEYS.resourceBookmarks, [])
  );
  const [videos, setVideos] = useState<ScienceVideo[]>(() =>
    loadData<ScienceVideo[]>(STORAGE_KEYS.videos, INITIAL_VIDEOS)
  );
  const [classrooms, setClassrooms] = useState<Classroom[]>(() =>
    loadData<Classroom[]>(STORAGE_KEYS.classrooms, [])
  );
  const [assignments, setAssignments] = useState<Assignment[]>(() =>
    loadData<Assignment[]>(STORAGE_KEYS.assignments, [])
  );
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>(() =>
    loadData<QuizAttempt[]>(STORAGE_KEYS.quizAttempts, [])
  );
  const [experimentResults, setExperimentResults] = useState<ExperimentResult[]>(() =>
    loadData<ExperimentResult[]>(STORAGE_KEYS.experimentResults, [])
  );

  // Assistant modal visibility
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);

  // Đồng bộ trạng thái xuống lớp lưu trữ
  useEffect(() => saveData(STORAGE_KEYS.completedExps, completedExpIds), [completedExpIds]);
  useEffect(() => saveData(STORAGE_KEYS.studentPoints, studentPoints), [studentPoints]);
  useEffect(() => saveData(STORAGE_KEYS.notebooks, notebookEntries), [notebookEntries]);
  useEffect(() => saveData(STORAGE_KEYS.resources, resources), [resources]);
  useEffect(() => saveData(STORAGE_KEYS.resourceBookmarks, resourceBookmarks), [resourceBookmarks]);
  useEffect(() => saveData(STORAGE_KEYS.videos, videos), [videos]);
  useEffect(() => saveData(STORAGE_KEYS.classrooms, classrooms), [classrooms]);
  useEffect(() => saveData(STORAGE_KEYS.assignments, assignments), [assignments]);
  useEffect(() => saveData(STORAGE_KEYS.quizAttempts, quizAttempts), [quizAttempts]);
  useEffect(() => saveData(STORAGE_KEYS.experimentResults, experimentResults), [experimentResults]);

  const badges = computeBadges({
    completedExpIds,
    totalExperiments: EXPERIMENTS_DATA.length,
    notebookCount: notebookEntries.length,
    quizAttempts
  });

  // Handlers
  const handleSelectExperiment = (exp: Experiment) => {
    setActiveExperiment(exp);
    setCurrentTab('experiment-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Chỉ cộng XP ở lần hoàn thành đầu tiên của mỗi thí nghiệm
  const handleCompleteExperiment = (expId: string, earnedScore: number) => {
    if (completedExpIds.includes(expId)) return;
    setCompletedExpIds((prev) => (prev.includes(expId) ? prev : [...prev, expId]));
    setStudentPoints((p) => p + earnedScore);
  };

  const handleRecordExperimentResult = (result: ExperimentResult) => {
    setExperimentResults((prev) => [result, ...prev]);
  };

  const handleQuizComplete = (attempt: QuizAttempt) => {
    setQuizAttempts((prev) => [attempt, ...prev]);
    if (attempt.xpAwarded > 0) setStudentPoints((p) => p + attempt.xpAwarded);
  };

  const handleSaveToNotebook = (entryData: Omit<NotebookEntry, 'id'>) => {
    const newEntry: NotebookEntry = {
      ...entryData,
      id: newId('nb')
    };
    setNotebookEntries((prev) => [newEntry, ...prev]);
  };

  const handleUpdateNotebook = (id: string, updated: Partial<NotebookEntry>) => {
    setNotebookEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updated } : e))
    );
  };

  const handleDeleteNotebook = (id: string) => {
    setNotebookEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleAddResource = (res: LearningResource) => {
    setResources((prev) => [res, ...prev]);
  };

  const handleUpdateResource = (id: string, updated: Partial<LearningResource>) => {
    setResources((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
  };

  const handleDeleteResource = (id: string) => {
    setResources((prev) => prev.filter((r) => r.id !== id));
    setResourceBookmarks((prev) => prev.filter((b) => b !== id));
  };

  const handleToggleResourceBookmark = (id: string) => {
    setResourceBookmarks((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]));
  };

  const handleAddVideo = (vid: ScienceVideo) => {
    setVideos((prev) => [vid, ...prev]);
  };

  const handleToggleFavoriteVideo = (id: string) => {
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, isFavorite: !v.isFavorite } : v))
    );
  };

  const handleAddAssignment = (asg: Assignment) => {
    setAssignments((prev) => [asg, ...prev]);
  };

  const handleAddClassroom = (cls: Classroom) => {
    setClassrooms((prev) => [...prev, cls]);
  };

  const handleUpdateClassroom = (id: string, updated: Partial<Classroom>) => {
    setClassrooms((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
  };

  const handleSelectTopicFromHome = (topicId: string) => {
    setFilterTopicId(topicId);
    setCurrentTab('experiments');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectExperimentById = (id: string) => {
    const exp = EXPERIMENTS_DATA.find((e) => e.id === id);
    if (exp) {
      handleSelectExperiment(exp);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Global Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab !== 'experiments') setFilterTopicId(undefined);
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        currentRole={currentRole}
        onSelectRole={setCurrentRole}
        studentPoints={studentPoints}
        onOpenAssistant={() => setIsAssistantOpen(true)}
      />

      {/* Role Notice Indicator Banner */}
      {currentRole !== 'student' && (
        <div className="bg-teal-900 text-teal-100 px-4 py-2 text-xs font-semibold flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <span>
              🔒 Đang xem với vai trò: <strong>{currentRole === 'teacher' ? 'GIÁO VIÊN' : 'QUẢN TRỊ VIÊN'}</strong>. Chưa có đăng nhập thật: dữ liệu chỉ lưu trên thiết bị này.
            </span>
            <button
              onClick={() => setCurrentRole('student')}
              className="text-[11px] underline hover:text-white"
            >
              Chuyển về giao diện Học sinh
            </button>
          </div>
        </div>
      )}

      {/* Main Content Router */}
      <main className="flex-1">
        {/* TAB 1: HOME */}
        {currentTab === 'home' && (
          <HomeView
            experiments={EXPERIMENTS_DATA}
            topics={SCIENCE_TOPICS}
            completedExpIds={completedExpIds}
            studentPoints={studentPoints}
            notebookCount={notebookEntries.length}
            badges={badges}
            onSelectExperiment={handleSelectExperiment}
            onSelectTopic={handleSelectTopicFromHome}
            onExploreAll={() => {
              setFilterTopicId(undefined);
              setCurrentTab('experiments');
            }}
          />
        )}

        {/* TAB 2: EXPERIMENT CATALOG */}
        {currentTab === 'experiments' && (
          <ExperimentCatalog
            experiments={EXPERIMENTS_DATA}
            completedExpIds={completedExpIds}
            initialTopicId={filterTopicId}
            onSelectExperiment={handleSelectExperiment}
          />
        )}

        {/* TAB 3: TOPICS CATALOG */}
        {currentTab === 'topics' && (
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Chủ đề khoa học lớp 4
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Bấm vào từng chủ đề để xem các thí nghiệm. Thầy cô có thể điều chỉnh chủ đề cho khớp với sách nhà trường đang dùng.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {SCIENCE_TOPICS.map((topic) => {
                const count = countExperimentsByTopic(topic.id);
                return (
                  <div
                    key={topic.id}
                    {...clickable(() => handleSelectTopicFromHome(topic.id), `Chủ đề ${topic.name}`)}
                    className="bg-white border border-slate-200 hover:border-cyan-400 rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer space-y-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                  >
                    {count > 0 ? (
                      <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-200">
                        {count} thí nghiệm
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                        Sắp có
                      </span>
                    )}
                    <h3 className="text-base font-bold text-slate-900">{topic.name}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{topic.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: 5-STEP EXPERIMENT WORKFLOW */}
        {currentTab === 'experiment-detail' && activeExperiment && (
          <FiveStepExperimentFlow
            key={activeExperiment.id}
            experiment={activeExperiment}
            isAlreadyCompleted={completedExpIds.includes(activeExperiment.id)}
            onBack={() => setCurrentTab('experiments')}
            onSaveToNotebook={handleSaveToNotebook}
            onCompleteExperiment={handleCompleteExperiment}
            onRecordResult={handleRecordExperimentResult}
          />
        )}

        {/* TAB 5: VIDEOS */}
        {currentTab === 'videos' && (
          <VideoLibrary
            videos={videos}
            isTeacher={currentRole !== 'student'}
            onAddVideo={handleAddVideo}
            onToggleFavorite={handleToggleFavoriteVideo}
          />
        )}

        {/* TAB 6: DOCUMENTS */}
        {currentTab === 'documents' && (
          <DocumentLibrary
            resources={resources}
            bookmarks={resourceBookmarks}
            isTeacher={currentRole !== 'student'}
            onAddResource={handleAddResource}
            onUpdateResource={handleUpdateResource}
            onDeleteResource={handleDeleteResource}
            onToggleBookmark={handleToggleResourceBookmark}
          />
        )}

        {/* TAB 7: QUIZ CHALLENGE */}
        {currentTab === 'quiz' && (
          <QuizChallenge
            quizzes={INITIAL_QUIZZES}
            attempts={quizAttempts}
            onQuizComplete={handleQuizComplete}
          />
        )}

        {/* TAB 8: SCIENTIST NOTEBOOK */}
        {currentTab === 'notebook' && (
          <ScientistNotebook
            entries={notebookEntries}
            onAddEntry={handleSaveToNotebook}
            onUpdateEntry={handleUpdateNotebook}
            onDeleteEntry={handleDeleteNotebook}
          />
        )}

        {/* TAB 9: TEACHER CORNER */}
        {currentTab === 'teacher' && (
          <TeacherDashboard
            classrooms={classrooms}
            assignments={assignments}
            experiments={EXPERIMENTS_DATA}
            quizzes={INITIAL_QUIZZES}
            quizAttempts={quizAttempts}
            experimentResults={experimentResults}
            deviceProgress={{
              completedCount: completedExpIds.length,
              points: studentPoints,
              notebookCount: notebookEntries.length
            }}
            onSelectExperimentToPresent={(exp) => {
              handleSelectExperiment(exp);
            }}
            onOpenNotebook={() => {
              setCurrentTab('notebook');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onAddAssignment={handleAddAssignment}
            onAddClassroom={handleAddClassroom}
            onUpdateClassroom={handleUpdateClassroom}
          />
        )}
      </main>

      {/* Socratic Learning Assistant "Bạn Khoa Học" Modal */}
      <ScienceAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onSelectExperimentById={handleSelectExperimentById}
      />

      {/* Standard Educational Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <span className="font-bold text-slate-800">
              Phòng Thí Nghiệm Khoa Học Thông Minh (Smart Science Lab)
            </span>
            <span className="mx-2">·</span>
            <span>Khơi nguồn tò mò – Khám phá khoa học – Sáng tạo tương lai</span>
          </div>

          <div className="flex items-center gap-4">
            <span>Dành cho học sinh & giáo viên Khoa học lớp 4</span>
            <span>·</span>
            <span>Dữ liệu đang lưu trên thiết bị này</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
