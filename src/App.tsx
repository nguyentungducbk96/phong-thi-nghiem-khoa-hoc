import React, { useState, useEffect } from 'react';
import { UserRole, Experiment, NotebookEntry, LearningResource, ScienceVideo, Assignment, Classroom } from './types';
import {
  SCIENCE_TOPICS,
  EXPERIMENTS_DATA,
  INITIAL_NOTEBOOKS,
  INITIAL_QUIZZES,
  INITIAL_CLASSROOMS,
  INITIAL_ASSIGNMENTS,
  INITIAL_RESOURCES,
  INITIAL_VIDEOS
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
import { soundManager } from './utils/audio';

export default function App() {
  // Current active navigation tab
  const [currentTab, setCurrentTab] = useState<string>('home');
  // Current user role: student, teacher, admin
  const [currentRole, setCurrentRole] = useState<UserRole>('student');
  // Currently active experiment (for 5-step flow)
  const [activeExperiment, setActiveExperiment] = useState<Experiment | null>(null);
  // Topic filter when navigating from topic cards
  const [filterTopicId, setFilterTopicId] = useState<string | undefined>(undefined);

  // Student progress state (stored in localStorage)
  const [completedExpIds, setCompletedExpIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('ssl_completed_exps');
    return saved ? JSON.parse(saved) : ['khong-khi-chiem-cho'];
  });

  const [studentPoints, setStudentPoints] = useState<number>(() => {
    const saved = localStorage.getItem('ssl_student_points');
    return saved ? Number(saved) : 180;
  });

  // Notebook Entries state
  const [notebookEntries, setNotebookEntries] = useState<NotebookEntry[]>(() => {
    const saved = localStorage.getItem('ssl_notebooks');
    return saved ? JSON.parse(saved) : INITIAL_NOTEBOOKS;
  });

  // Resources state
  const [resources, setResources] = useState<LearningResource[]>(() => {
    const saved = localStorage.getItem('ssl_resources');
    return saved ? JSON.parse(saved) : INITIAL_RESOURCES;
  });

  // Videos state
  const [videos, setVideos] = useState<ScienceVideo[]>(() => {
    const saved = localStorage.getItem('ssl_videos');
    return saved ? JSON.parse(saved) : INITIAL_VIDEOS;
  });

  // Classrooms state
  const [classrooms, setClassrooms] = useState<Classroom[]>(() => {
    const saved = localStorage.getItem('ssl_classrooms');
    return saved ? JSON.parse(saved) : INITIAL_CLASSROOMS;
  });

  // Assignments state
  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const saved = localStorage.getItem('ssl_assignments');
    return saved ? JSON.parse(saved) : INITIAL_ASSIGNMENTS;
  });

  // Assistant modal visibility
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('ssl_completed_exps', JSON.stringify(completedExpIds));
  }, [completedExpIds]);

  useEffect(() => {
    localStorage.setItem('ssl_student_points', String(studentPoints));
  }, [studentPoints]);

  useEffect(() => {
    localStorage.setItem('ssl_notebooks', JSON.stringify(notebookEntries));
  }, [notebookEntries]);

  useEffect(() => {
    localStorage.setItem('ssl_resources', JSON.stringify(resources));
  }, [resources]);

  useEffect(() => {
    localStorage.setItem('ssl_videos', JSON.stringify(videos));
  }, [videos]);

  useEffect(() => {
    localStorage.setItem('ssl_classrooms', JSON.stringify(classrooms));
  }, [classrooms]);

  useEffect(() => {
    localStorage.setItem('ssl_assignments', JSON.stringify(assignments));
  }, [assignments]);

  // Handlers
  const handleSelectExperiment = (exp: Experiment) => {
    setActiveExperiment(exp);
    setCurrentTab('experiment-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCompleteExperiment = (expId: string, earnedScore: number) => {
    if (!completedExpIds.includes(expId)) {
      setCompletedExpIds((prev) => [...prev, expId]);
    }
    setStudentPoints((p) => p + earnedScore);
  };

  const handleSaveToNotebook = (entryData: Omit<NotebookEntry, 'id'>) => {
    const newEntry: NotebookEntry = {
      ...entryData,
      id: 'nb_' + Date.now()
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

  const handleDeleteResource = (id: string) => {
    setResources((prev) => prev.filter((r) => r.id !== id));
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
              🔒 Đang đăng nhập với vai trò: <strong>{currentRole === 'teacher' ? 'GIÁO VIÊN' : 'QUẢN TRỊ VIÊN'}</strong>. Em có toàn quyền quản lý lớp học, phân công bài tập và đăng tải tài liệu.
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
                8 Chủ Đề Khoa Học Lớp 4 (Chương trình GDPT 2018)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Bấm vào từng chủ đề để khám phá các bài thực nghiệm tương tác phù hợp
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {SCIENCE_TOPICS.map((topic) => (
                <div
                  key={topic.id}
                  onClick={() => handleSelectTopicFromHome(topic.id)}
                  className="bg-white border border-slate-200 hover:border-cyan-400 rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer space-y-3"
                >
                  <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-200">
                    {topic.experimentCount} thí nghiệm
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{topic.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{topic.description}</p>
                  <span className="text-[11px] font-mono text-slate-400 block pt-2 border-t border-slate-100">
                    {topic.curriculumStandard}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: 5-STEP EXPERIMENT WORKFLOW */}
        {currentTab === 'experiment-detail' && activeExperiment && (
          <FiveStepExperimentFlow
            experiment={activeExperiment}
            onBack={() => setCurrentTab('experiments')}
            onSaveToNotebook={handleSaveToNotebook}
            onCompleteExperiment={handleCompleteExperiment}
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
            isTeacher={currentRole !== 'student'}
            onAddResource={handleAddResource}
            onDeleteResource={handleDeleteResource}
          />
        )}

        {/* TAB 7: QUIZ CHALLENGE */}
        {currentTab === 'quiz' && (
          <QuizChallenge
            quizzes={INITIAL_QUIZZES}
            onQuizComplete={(quizId, score) => {
              setStudentPoints((p) => p + score);
            }}
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
            onSelectExperimentToPresent={(exp) => {
              handleSelectExperiment(exp);
            }}
            onAddAssignment={handleAddAssignment}
            onAddClassroom={handleAddClassroom}
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
            <span>Dành cho học sinh & giáo viên Khoa học Lớp 4</span>
            <span>·</span>
            <span>GDPT 2018</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
