import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Experiment,
  NotebookEntry,
  LearningResource,
  ScienceVideo,
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
import { TeacherDashboard, PresentLauncher } from './components/teacher/TeacherDashboard';
import { AdminPanel } from './components/admin/AdminPanel';
import { StudentTasks } from './components/student/StudentTasks';
import { ImportLocalModal } from './components/student/ImportLocalModal';
import { LoginModal } from './components/auth/LoginModal';
import { ScienceAssistantModal } from './components/assistant/ScienceAssistantModal';
import { LoadingState, ErrorState } from './components/ui/States';
import { useToast } from './components/ui/Toast';
import { useAuth } from './auth/AuthContext';
import {
  loadData,
  migrateLegacyStorage,
  STORAGE_KEYS,
  newId,
  getStudentStore,
  StudentData,
  loadLocalSnapshot,
  hasLocalLearningData,
  isImportHandled,
  markImportHandled
} from './utils/storage';
import { importLocalToRemote } from './utils/remoteStore';
import {
  listResources,
  listVideos,
  saveResource,
  deleteResource,
  saveVideo,
  deleteVideo,
  listMyAssignments,
  listMySubmissions,
  submitAssignment,
  AssignmentRow,
  SubmissionRow
} from './lib/api';
import { friendlyError } from './lib/supabase';
import { computeBadges } from './utils/progress';
import { clickable } from './utils/a11y';

// Bỏ dữ liệu mẫu giả của phiên bản cũ trước khi đọc dữ liệu (chạy một lần khi tải trang)
migrateLegacyStorage();

const EMPTY_DATA: StudentData = {
  completedExpIds: [],
  studentPoints: 0,
  notebooks: [],
  quizAttempts: [],
  experimentResults: [],
  resourceBookmarks: [],
  favoriteVideoIds: []
};

export default function App() {
  const auth = useAuth();
  const toast = useToast();
  const role = auth.role; // 'guest' | 'student' | 'teacher' | 'admin'
  const isTeacher = role === 'teacher' || role === 'admin';
  const studentId = role === 'student' ? auth.profile!.id : null;
  const online = auth.configured && !!auth.session && auth.isActive;

  const [currentTab, setCurrentTab] = useState<string>('home');
  const [activeExperiment, setActiveExperiment] = useState<Experiment | null>(null);
  const [filterTopicId, setFilterTopicId] = useState<string | undefined>(undefined);
  const [quizStartId, setQuizStartId] = useState<string | undefined>(undefined);
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [showLogin, setShowLogin] = useState<boolean>(false);

  // ===== Dữ liệu học tập cá nhân: một kho duy nhất (local hoặc Supabase) =====
  const store = useMemo(() => getStudentStore(studentId), [studentId]);
  const [data, setData] = useState<StudentData>(() => loadLocalSnapshot());
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [importOffer, setImportOffer] = useState<StudentData | null>(null);

  const reloadData = useCallback(async () => {
    setDataLoading(true);
    setDataError(null);
    try {
      const d = await store.load();
      setData(d);
      if (store.mode === 'remote' && studentId && !isImportHandled(studentId)) {
        const local = loadLocalSnapshot();
        if (hasLocalLearningData(local)) setImportOffer(local);
        else markImportHandled(studentId);
      }
    } catch (e) {
      setDataError(friendlyError(e));
      if (store.mode === 'remote') setData(EMPTY_DATA);
    } finally {
      setDataLoading(false);
    }
  }, [store, studentId]);

  useEffect(() => {
    if (auth.loading) return;
    reloadData();
  }, [reloadData, auth.loading]);

  // Ghi xuống kho; lỗi thì báo và tải lại để giao diện khớp với dữ liệu thật
  const persist = useCallback(
    (fn: () => Promise<unknown>) => {
      fn().catch((e) => {
        toast.error(`Chưa lưu được: ${friendlyError(e)}`);
        reloadData();
      });
    },
    [toast, reloadData]
  );

  const { completedExpIds, studentPoints, notebooks: notebookEntries, quizAttempts, experimentResults, resourceBookmarks, favoriteVideoIds } = data;

  const badges = computeBadges({
    completedExpIds,
    totalExperiments: EXPERIMENTS_DATA.length,
    notebookCount: notebookEntries.length,
    quizAttempts
  });
  const badgeKey = badges.map((b) => b.id).join(',');
  useEffect(() => {
    if (store.mode === 'remote' && badgeKey && !dataLoading) {
      store.syncBadges(badgeKey.split(',')).catch(() => undefined);
    }
  }, [badgeKey, store, dataLoading]);

  // ===== Nhiệm vụ của học sinh =====
  const [myAssignments, setMyAssignments] = useState<AssignmentRow[]>([]);
  const [mySubmissions, setMySubmissions] = useState<SubmissionRow[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const loadTasks = useCallback(async () => {
    if (!studentId) {
      setMyAssignments([]);
      setMySubmissions([]);
      return;
    }
    setTasksLoading(true);
    setTasksError(null);
    try {
      const [a, s] = await Promise.all([listMyAssignments(), listMySubmissions(studentId)]);
      setMyAssignments(a);
      setMySubmissions(s);
    } catch (e) {
      setTasksError(friendlyError(e));
    } finally {
      setTasksLoading(false);
    }
  }, [studentId]);
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const submitFor = useCallback(
    async (match: (a: AssignmentRow) => boolean, rec: { experiment_result_id?: string; quiz_attempt_id?: string }, score: number, total: number) => {
      if (!studentId) return;
      const targets = myAssignments.filter(match);
      if (!targets.length) return;
      for (const a of targets) {
        await submitAssignment({ assignment_id: a.id, student_id: studentId, ...rec, score, total });
      }
      toast.success(targets.length === 1 ? `Đã nộp bài cho nhiệm vụ “${targets[0].title}”.` : `Đã nộp bài cho ${targets.length} nhiệm vụ.`);
      loadTasks();
    },
    [studentId, myAssignments, toast, loadTasks]
  );

  // ===== Tài liệu & video =====
  const [resources, setResources] = useState<LearningResource[]>(() => loadData<LearningResource[]>(STORAGE_KEYS.resources, []));
  const [remoteVideos, setRemoteVideos] = useState<ScienceVideo[]>([]);
  const localVideos = useRef<ScienceVideo[]>(loadData<ScienceVideo[]>(STORAGE_KEYS.videos, INITIAL_VIDEOS)).current;
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const loadContent = useCallback(async () => {
    if (!online) {
      setResources(loadData<LearningResource[]>(STORAGE_KEYS.resources, []));
      setRemoteVideos([]);
      setContentError(null);
      return;
    }
    setContentLoading(true);
    setContentError(null);
    try {
      const [r, v] = await Promise.all([listResources(), listVideos()]);
      setResources(r);
      setRemoteVideos(v);
    } catch (e) {
      setContentError(friendlyError(e));
    } finally {
      setContentLoading(false);
    }
  }, [online]);
  useEffect(() => {
    if (!auth.loading) loadContent();
  }, [loadContent, auth.loading]);

  const videos = useMemo(() => {
    if (!online) return localVideos;
    // Video giáo viên thêm (trực tuyến) + các mục có sẵn trong ứng dụng
    return [...remoteVideos, ...INITIAL_VIDEOS];
  }, [online, remoteVideos, localVideos]);
  const canEditContent = (ownerId?: string) => isTeacher && !!ownerId && (ownerId === auth.profile?.id || role === 'admin');

  // ===== Xử lí sự kiện =====
  const handleSelectExperiment = (exp: Experiment) => {
    setActiveExperiment(exp);
    setCurrentTab('experiment-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Chỉ cộng XP ở lần hoàn thành đầu tiên của mỗi thí nghiệm
  const handleCompleteExperiment = (expId: string, earnedScore: number) => {
    if (completedExpIds.includes(expId)) return;
    setData((d) => ({ ...d, completedExpIds: [...d.completedExpIds, expId], studentPoints: d.studentPoints + earnedScore }));
    persist(() => store.completeExperiment(expId, earnedScore));
  };

  const handleRecordExperimentResult = (result: ExperimentResult) => {
    setData((d) => ({ ...d, experimentResults: [result, ...d.experimentResults] }));
    persist(async () => {
      const id = await store.addExperimentResult(result);
      if (id) {
        await submitFor((a) => a.experiment_id === result.experimentId, { experiment_result_id: id }, result.correct, result.total);
      }
    });
  };

  const handleQuizComplete = (attempt: QuizAttempt) => {
    setData((d) => ({ ...d, quizAttempts: [attempt, ...d.quizAttempts], studentPoints: d.studentPoints + (attempt.xpAwarded || 0) }));
    persist(async () => {
      const id = await store.addQuizAttempt(attempt);
      if (id) await submitFor((a) => a.quiz_id === attempt.quizId, { quiz_attempt_id: id }, attempt.correct, attempt.total);
    });
  };

  const handleSaveToNotebook = (entryData: Omit<NotebookEntry, 'id'>) => {
    const entry: NotebookEntry = { ...entryData, id: newId('nb') };
    setData((d) => ({ ...d, notebooks: [entry, ...d.notebooks] }));
    persist(() => store.addNotebook(entry));
  };

  const handleUpdateNotebook = (id: string, updated: Partial<NotebookEntry>) => {
    setData((d) => ({ ...d, notebooks: d.notebooks.map((e) => (e.id === id ? { ...e, ...updated } : e)) }));
    persist(() => store.updateNotebook(id, updated));
  };

  const handleDeleteNotebook = (id: string) => {
    setData((d) => ({ ...d, notebooks: d.notebooks.filter((e) => e.id !== id) }));
    persist(() => store.deleteNotebook(id));
  };

  const handleToggleResourceBookmark = (id: string) => {
    const on = !resourceBookmarks.includes(id);
    setData((d) => ({ ...d, resourceBookmarks: on ? [...d.resourceBookmarks, id] : d.resourceBookmarks.filter((b) => b !== id) }));
    persist(() => store.setBookmark(id, on));
  };

  const handleToggleFavoriteVideo = (id: string) => {
    const on = !favoriteVideoIds.includes(id);
    setData((d) => ({ ...d, favoriteVideoIds: on ? [...d.favoriteVideoIds, id] : d.favoriteVideoIds.filter((b) => b !== id) }));
    persist(() => store.setFavoriteVideo(id, on));
  };

  const handleSelectTopicFromHome = (topicId: string) => {
    setFilterTopicId(topicId);
    setCurrentTab('experiments');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectExperimentById = (id: string) => {
    const exp = EXPERIMENTS_DATA.find((e) => e.id === id);
    if (exp) handleSelectExperiment(exp);
  };

  const handleLogout = async () => {
    await auth.signOut();
    setCurrentTab('home');
    toast.info('Đã đăng xuất. Em vẫn có thể dùng ứng dụng với tư cách khách.');
  };

  const selectTab = (tab: string) => {
    if (tab !== 'experiments') setFilterTopicId(undefined);
    if (tab === 'quiz') setQuizStartId(undefined);
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const storageNote = !auth.configured
    ? 'Chế độ ngoại tuyến: dữ liệu lưu trên thiết bị này'
    : studentId
      ? 'Kết quả của em được lưu trực tuyến'
      : online
        ? 'Đã đăng nhập'
        : 'Khách: dữ liệu lưu trên thiết bị này';

  const loginPrompt = (title: string, text: string) => (
    <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-3">
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>
      <p className="text-sm text-slate-500">{text}</p>
      {auth.configured && !auth.session && (
        <button onClick={() => setShowLogin(true)} className="min-h-[44px] px-5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold">
          Đăng nhập
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar
        currentTab={currentTab}
        onSelectTab={selectTab}
        studentPoints={studentPoints}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onOpenLogin={() => setShowLogin(true)}
        onLogout={handleLogout}
      />

      {/* Thông báo trạng thái lưu trữ / tài khoản */}
      {!auth.configured ? (
        <div className="bg-slate-800 text-slate-100 px-4 py-2 text-xs">
          <div className="max-w-7xl mx-auto">
            Chế độ ngoại tuyến: ứng dụng chưa được cấu hình máy chủ nên kết quả chỉ lưu trên thiết bị này; chưa có đăng nhập, góc giáo viên và chia sẻ tài liệu.
          </div>
        </div>
      ) : auth.loading ? null : !auth.session ? (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 text-xs">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Em đang dùng với tư cách khách — kết quả chỉ lưu trên máy này. Đăng nhập để lưu kết quả trực tuyến.</span>
            <button onClick={() => setShowLogin(true)} className="font-bold underline min-h-11 lg:min-h-10">Đăng nhập</button>
          </div>
        </div>
      ) : auth.profile?.status === 'pending' ? (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 text-xs">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Tài khoản giáo viên của thầy cô đang chờ quản trị viên duyệt. Trong lúc chờ, thầy cô vẫn xem được thí nghiệm như khách.</span>
            <button onClick={() => auth.refreshProfile()} className="font-bold underline min-h-11 lg:min-h-10">Kiểm tra lại</button>
          </div>
        </div>
      ) : auth.profile?.status === 'locked' ? (
        <div className="bg-rose-50 border-b border-rose-200 text-rose-900 px-4 py-2 text-xs">
          <div className="max-w-7xl mx-auto">Tài khoản này đang bị khóa. Hãy liên hệ thầy cô hoặc quản trị viên.</div>
        </div>
      ) : !auth.profile ? (
        <div className="bg-rose-50 border-b border-rose-200 text-rose-900 px-4 py-2 text-xs">
          <div className="max-w-7xl mx-auto">{auth.profileError || 'Tài khoản này chưa có hồ sơ trong hệ thống. Hãy liên hệ quản trị viên.'}</div>
        </div>
      ) : null}
      {dataError && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4">
          <ErrorState text={`Chưa tải được kết quả học tập: ${dataError}`} onRetry={reloadData} />
        </div>
      )}

      {/* Main Content Router */}
      <main className="flex-1">
        {dataLoading && store.mode === 'remote' && currentTab !== 'teacher' && currentTab !== 'admin' && (
          <LoadingState text="Đang tải kết quả học tập của em..." />
        )}

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
            favoriteIds={favoriteVideoIds}
            isTeacher={isTeacher}
            canUpload={isTeacher}
            canEdit={(v) => !!v.isRemote && canEditContent(v.ownerId)}
            loading={contentLoading}
            error={contentError}
            onRetry={loadContent}
            notice={
              !auth.configured
                ? 'Chế độ ngoại tuyến: chỉ hiện video có sẵn và video đã thêm trên thiết bị này.'
                : !online
                  ? 'Đăng nhập để xem video thầy cô chia sẻ cho lớp.'
                  : undefined
            }
            onSave={async (input, file, existing) => {
              await saveVideo(input, file, existing);
              await loadContent();
            }}
            onDelete={async (v) => {
              await deleteVideo(v);
              await loadContent();
            }}
            onToggleFavorite={handleToggleFavoriteVideo}
          />
        )}

        {/* TAB 6: DOCUMENTS */}
        {currentTab === 'documents' && (
          <DocumentLibrary
            resources={resources}
            bookmarks={resourceBookmarks}
            isTeacher={isTeacher}
            canEdit={(r) => canEditContent(r.ownerId)}
            loading={contentLoading}
            error={contentError}
            onRetry={loadContent}
            notice={
              !auth.configured
                ? 'Chế độ ngoại tuyến: chỉ hiện các đường dẫn đã lưu trên thiết bị này; tải tệp lên cần kết nối máy chủ.'
                : !online
                  ? 'Tài liệu được lưu trực tuyến và chỉ người có quyền mới xem được. Hãy đăng nhập để xem tài liệu thầy cô chia sẻ.'
                  : isTeacher
                    ? 'Tài liệu lưu trực tuyến trong kho riêng tư. “Chỉ dành cho giáo viên” thì học sinh không xem được.'
                    : undefined
            }
            onSave={async (input, file, existing) => {
              await saveResource(input, file, existing);
              await loadContent();
            }}
            onDelete={async (r) => {
              await deleteResource(r);
              await loadContent();
            }}
            onToggleBookmark={handleToggleResourceBookmark}
          />
        )}

        {/* TAB 7: QUIZ CHALLENGE */}
        {currentTab === 'quiz' && (
          <QuizChallenge
            key={quizStartId || 'quiz'}
            quizzes={INITIAL_QUIZZES}
            attempts={quizAttempts}
            onQuizComplete={handleQuizComplete}
            initialQuizId={quizStartId}
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
        {currentTab === 'teacher' &&
          (isTeacher ? (
            <TeacherDashboard
              experiments={EXPERIMENTS_DATA}
              quizzes={INITIAL_QUIZZES}
              onSelectExperimentToPresent={handleSelectExperiment}
            />
          ) : (
            <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 space-y-6">
              {!auth.configured
                ? loginPrompt(
                    'Góc giáo viên cần kết nối máy chủ',
                    'Ứng dụng đang chạy ngoại tuyến nên chưa quản lí được lớp học và tài khoản học sinh. Thầy cô vẫn có thể trình chiếu thí nghiệm bên dưới.'
                  )
                : auth.profile?.status === 'pending'
                  ? loginPrompt('Tài khoản đang chờ duyệt', 'Quản trị viên của trường cần duyệt tài khoản trước khi thầy cô tạo lớp và thêm học sinh.')
                  : role === 'student'
                    ? loginPrompt('Góc giáo viên dành cho thầy cô', 'Em hãy xem “Nhiệm vụ của em” để biết thầy cô giao bài gì nhé.')
                    : loginPrompt('Thầy cô hãy đăng nhập', 'Đăng nhập bằng tài khoản giáo viên đã được duyệt để tạo lớp, thêm học sinh, giao nhiệm vụ và xem kết quả.')}
              <PresentLauncher experiments={EXPERIMENTS_DATA} onOpen={handleSelectExperiment} />
            </div>
          ))}

        {/* NHIỆM VỤ CỦA EM */}
        {currentTab === 'tasks' &&
          (studentId ? (
            <StudentTasks
              assignments={myAssignments}
              submissions={mySubmissions}
              loading={tasksLoading}
              error={tasksError}
              onRetry={loadTasks}
              onOpenExperiment={handleSelectExperimentById}
              onOpenQuiz={(id) => {
                setQuizStartId(id);
                setCurrentTab('quiz');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          ) : (
            loginPrompt('Nhiệm vụ của em', 'Em hãy đăng nhập bằng tài khoản thầy cô phát để xem nhiệm vụ được giao.')
          ))}

        {/* QUẢN TRỊ */}
        {currentTab === 'admin' &&
          (role === 'admin' ? <AdminPanel /> : loginPrompt('Khu vực quản trị', 'Chỉ quản trị viên mới vào được khu vực này.'))}
      </main>

      {showLogin && (
        <LoginModal onClose={() => setShowLogin(false)} onSuccess={(msg) => toast.success(msg)} />
      )}

      {importOffer && studentId && (
        <ImportLocalModal
          local={importOffer}
          onSkip={() => {
            markImportHandled(studentId);
            setImportOffer(null);
          }}
          onImport={async () => {
            await importLocalToRemote(studentId, importOffer);
            markImportHandled(studentId);
            setImportOffer(null);
            toast.success('Đã đưa kết quả trên máy này vào tài khoản của em.');
            await reloadData();
          }}
        />
      )}

      {/* Socratic Learning Assistant "Bạn Khoa Học" Modal */}
      <ScienceAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onSelectExperimentById={handleSelectExperimentById}
      />

      {/* Chân trang */}
      <footer className="bg-white border-t border-slate-200 mt-12 sm:mt-16 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid gap-4 sm:grid-cols-2 sm:items-center text-sm text-slate-500">
          <div className="space-y-1">
            <p className="font-bold text-slate-800">Phòng Thí Nghiệm Khoa Học Thông Minh</p>
            <p className="text-xs">Khơi nguồn tò mò – Khám phá khoa học – Sáng tạo tương lai</p>
          </div>
          <div className="space-y-1 text-xs sm:text-right">
            <p>Dành cho học sinh và giáo viên Khoa học lớp 4</p>
            <p className="inline-flex items-center gap-1.5 text-slate-600">
              <span className={`w-2 h-2 rounded-full shrink-0 ${online ? 'bg-emerald-500' : 'bg-amber-400'}`} aria-hidden="true" />
              {storageNote}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
