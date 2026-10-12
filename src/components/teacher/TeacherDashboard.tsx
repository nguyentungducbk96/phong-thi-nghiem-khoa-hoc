import React, { useState } from 'react';
import { Classroom, Assignment, Experiment, Quiz, QuizAttempt, ExperimentResult } from '../../types';
import { newId } from '../../utils/storage';
import { formatDateTime } from '../../utils/progress';
import {
  Users,
  Plus,
  Calendar,
  FileSpreadsheet,
  AlertCircle,
  Send,
  BookOpen,
  Trash2,
  Info,
  Monitor
} from 'lucide-react';

interface DeviceProgress {
  completedCount: number;
  points: number;
  notebookCount: number;
}

interface Props {
  classrooms: Classroom[];
  assignments: Assignment[];
  experiments: Experiment[];
  quizzes: Quiz[];
  quizAttempts: QuizAttempt[];
  experimentResults: ExperimentResult[];
  deviceProgress: DeviceProgress;
  onSelectExperimentToPresent: (exp: Experiment) => void;
  onOpenNotebook: () => void;
  onAddAssignment: (assignment: Assignment) => void;
  onAddClassroom: (classroom: Classroom) => void;
  onUpdateClassroom: (id: string, updated: Partial<Classroom>) => void;
}

const NO_DATA = 'Chưa có dữ liệu';

const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

const formatDueDate = (iso: string) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}/${m}/${y}` : iso;
};

interface MissedQuestion {
  key: string;
  source: string;
  question: string;
  wrong: number;
  seen: number;
}

export const TeacherDashboard: React.FC<Props> = ({
  classrooms,
  assignments,
  experiments,
  quizzes,
  quizAttempts,
  experimentResults,
  deviceProgress,
  onSelectExperimentToPresent,
  onOpenNotebook,
  onAddAssignment,
  onAddClassroom,
  onUpdateClassroom
}) => {
  const [activeTab, setActiveTab] = useState<'classes' | 'assignments' | 'analytics'>('classes');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(classrooms[0]?.id ?? null);
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [showClassModal, setShowClassModal] = useState<boolean>(false);
  const [presentExpId, setPresentExpId] = useState<string>(experiments[0]?.id ?? '');

  // New assignment form
  const [assignTitle, setAssignTitle] = useState<string>('');
  const [assignExpId, setAssignExpId] = useState<string>(experiments[0]?.id ?? '');
  const [assignDueDate, setAssignDueDate] = useState<string>('');
  const [assignType, setAssignType] = useState<'individual' | 'group'>('individual');

  // New class form
  const [newClassName, setNewClassName] = useState<string>('');
  const [newSchool, setNewSchool] = useState<string>('');

  // Add student form
  const [newStudentName, setNewStudentName] = useState<string>('');

  const selectedClass =
    classrooms.find((c) => c.id === selectedClassId) || classrooms[0] || null;

  // ---- Thống kê câu hỏi hay sai: chỉ từ các lần làm bài thật trên thiết bị này ----
  const missedQuestions: MissedQuestion[] = [];
  quizzes.forEach((quiz) => {
    const qAttempts = quizAttempts.filter((a) => a.quizId === quiz.id);
    if (qAttempts.length === 0) return;
    quiz.questions.forEach((q) => {
      const wrong = qAttempts.filter((a) => a.wrongQuestionIds.includes(q.id)).length;
      missedQuestions.push({
        key: `${quiz.id}:${q.id}`,
        source: quiz.title,
        question: q.question,
        wrong,
        seen: qAttempts.length
      });
    });
  });
  experiments.forEach((exp) => {
    const results = experimentResults.filter((r) => r.experimentId === exp.id);
    if (results.length === 0) return;
    exp.postQuestions.forEach((q) => {
      const key = `${exp.id}:${q.id}`;
      const wrong = results.filter((r) => r.wrongQuestionIds.includes(key)).length;
      missedQuestions.push({ key, source: exp.title, question: q.question, wrong, seen: results.length });
    });
  });
  const missedSorted = missedQuestions
    .filter((m) => m.wrong > 0)
    .sort((a, b) => b.wrong / b.seen - a.wrong / a.seen);
  const totalAnswerSessions = quizAttempts.length + experimentResults.length;

  // ---- Xuất CSV: chỉ dữ liệu thật đang có trên thiết bị ----
  const hasExportData =
    (selectedClass?.students.length ?? 0) > 0 || quizAttempts.length > 0 || experimentResults.length > 0;

  const handleExportCSV = () => {
    const lines: string[] = [];
    if (selectedClass) {
      lines.push(csvCell(`Danh sách lớp ${selectedClass.name} (mã ${selectedClass.code})`));
      lines.push(['STT', 'Họ và tên'].map(csvCell).join(','));
      selectedClass.students.forEach((st, idx) => {
        lines.push([idx + 1, st.name].map(csvCell).join(','));
      });
      if (selectedClass.students.length === 0) lines.push(csvCell('Chưa có học sinh'));
      lines.push('');
    }
    lines.push(csvCell('Kết quả làm bài trên thiết bị này (chưa đồng bộ giữa các máy)'));
    lines.push(['Loại', 'Tên bài', 'Thời gian', 'Số câu đúng', 'Tổng số câu'].map(csvCell).join(','));
    quizAttempts.forEach((a) => {
      lines.push(['Thử thách', a.quizTitle, formatDateTime(a.date), a.correct, a.total].map(csvCell).join(','));
    });
    experimentResults.forEach((r) => {
      lines.push(
        ['Thí nghiệm', r.experimentTitle, formatDateTime(r.date), r.correct, r.total].map(csvCell).join(',')
      );
    });
    if (quizAttempts.length === 0 && experimentResults.length === 0) lines.push(csvCell(NO_DATA));

    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bao_Cao_${selectedClass?.code || 'thiet_bi'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    const expObj = experiments.find((ex) => ex.id === assignExpId);
    if (!expObj) return;

    const newAsg: Assignment = {
      id: newId('asg'),
      classId: selectedClass.id,
      title: assignTitle.trim() || `Nhiệm vụ: ${expObj.title}`,
      experimentId: expObj.id,
      experimentTitle: expObj.title,
      assignedDate: new Date().toLocaleDateString('vi-VN'),
      dueDate: formatDueDate(assignDueDate),
      targetType: assignType,
      targetName: assignType === 'individual' ? 'Cá nhân' : 'Nhóm',
      status: 'active',
      submissionsCount: 0,
      totalStudents: selectedClass.students.length
    };

    onAddAssignment(newAsg);
    setShowAssignModal(false);
    setAssignTitle('');
    setAssignDueDate('');
    setActiveTab('assignments');
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const newCode = 'KH4-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const newCls: Classroom = {
      id: newId('cls'),
      name: newClassName.trim(),
      code: newCode,
      school: newSchool.trim(),
      grade: 'Lớp 4',
      teacherName: '',
      studentCount: 0,
      students: []
    };

    onAddClassroom(newCls);
    setSelectedClassId(newCls.id);
    setShowClassModal(false);
    setNewClassName('');
    setNewSchool('');
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newStudentName.trim();
    if (!selectedClass || !name) return;
    const students = [...selectedClass.students, { id: newId('st'), name, avatar: '🧑‍🎓' }];
    onUpdateClassroom(selectedClass.id, { students, studentCount: students.length });
    setNewStudentName('');
  };

  const handleRemoveStudent = (studentId: string, name: string) => {
    if (!selectedClass) return;
    if (!window.confirm(`Xóa ${name} khỏi danh sách lớp?`)) return;
    const students = selectedClass.students.filter((s) => s.id !== studentId);
    onUpdateClassroom(selectedClass.id, { students, studentCount: students.length });
  };

  const tabClass = (tab: string) =>
    `px-4 py-2 text-xs font-bold rounded-xl transition-all ${
      activeTab === tab ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'text-slate-600 hover:bg-slate-100'
    }`;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Góc Giáo Viên & Quản Lý Lớp Học
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quản lý lớp, giao nhiệm vụ thí nghiệm, xem kết quả và trình chiếu giảng dạy
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAssignModal(true)}
            disabled={!selectedClass}
            title={!selectedClass ? 'Hãy tạo lớp học trước' : undefined}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl transition-colors shadow-xs"
          >
            <Send className="w-4 h-4" />
            Giao bài tập mới
          </button>
          <button
            onClick={handleExportCSV}
            disabled={!hasExportData}
            title={!hasExportData ? 'Chưa có dữ liệu để xuất' : undefined}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 rounded-xl transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Xuất báo cáo CSV
          </button>
        </div>
      </div>

      {/* Honest data notice */}
      <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 flex items-start gap-2">
        <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <span>
          Ứng dụng chưa kết nối máy chủ: lớp học, nhiệm vụ và kết quả chỉ lưu trên thiết bị này. Tiến độ của từng học sinh trên máy khác sẽ xem được khi kết nối máy chủ.
        </span>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setActiveTab('classes')} className={tabClass('classes')}>
            Lớp & Học sinh
          </button>
          <button onClick={() => setActiveTab('assignments')} className={tabClass('assignments')}>
            Nhiệm vụ đã giao ({assignments.length})
          </button>
          <button onClick={() => setActiveTab('analytics')} className={tabClass('analytics')}>
            Câu hỏi hay trả lời sai
          </button>
        </div>

        {/* Class selector */}
        <div className="flex items-center gap-2">
          {classrooms.length > 0 && (
            <select
              value={selectedClass?.id ?? ''}
              onChange={(e) => setSelectedClassId(e.target.value)}
              aria-label="Chọn lớp"
              className="p-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
            >
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowClassModal(true)}
            className="flex items-center gap-1 p-1.5 px-2.5 text-xs text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl font-bold"
            title="Tạo lớp học mới"
          >
            <Plus className="w-4 h-4" /> Tạo lớp
          </button>
        </div>
      </div>

      {/* TAB 1: Classes & Students */}
      {activeTab === 'classes' && (
        <div className="space-y-6">
          {!selectedClass ? (
            <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Chưa có lớp học nào</h3>
              <p className="text-xs text-slate-500">Thầy cô tạo lớp học đầu tiên để thêm học sinh và giao nhiệm vụ.</p>
              <button
                onClick={() => setShowClassModal(true)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl"
              >
                Tạo lớp học
              </button>
            </div>
          ) : (
            <>
              {/* Class Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase">Mã tham gia lớp</span>
                  <span className="text-lg font-black text-teal-700 font-mono tracking-wider">{selectedClass.code}</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase">Sĩ số học sinh</span>
                  <span className="text-lg font-black text-slate-900">{selectedClass.students.length} em</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase">Điểm trung bình lớp</span>
                  <span className="text-sm font-bold text-slate-400">{NO_DATA}</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase">Tỉ lệ hoàn thành bài</span>
                  <span className="text-sm font-bold text-slate-400">{NO_DATA}</span>
                </div>
              </div>

              {/* Student Roster Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Danh sách học sinh lớp {selectedClass.name}
                  </h3>
                  {selectedClass.school && (
                    <span className="text-xs text-slate-400">Trường: {selectedClass.school}</span>
                  )}
                </div>

                <form onSubmit={handleAddStudent} className="p-4 border-b border-slate-100 flex flex-wrap gap-2">
                  <label htmlFor="new-student" className="sr-only">Tên học sinh</label>
                  <input
                    id="new-student"
                    type="text"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="Nhập tên học sinh rồi bấm Thêm"
                    className="flex-1 min-w-[200px] p-2 text-xs border border-slate-300 rounded-xl focus:border-teal-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newStudentName.trim()}
                    className="px-3.5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 rounded-xl"
                  >
                    Thêm học sinh
                  </button>
                </form>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-4">STT</th>
                        <th className="py-3 px-4">Học sinh</th>
                        <th className="py-3 px-4">Tiến độ học tập</th>
                        <th className="py-3 px-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedClass.students.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-400">
                            Chưa có học sinh nào trong lớp. Thầy cô có thể nhập tên học sinh ở ô phía trên.
                          </td>
                        </tr>
                      ) : (
                        selectedClass.students.map((st, idx) => (
                          <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                            <td className="py-3 px-4 font-semibold text-slate-900">{st.name}</td>
                            <td className="py-3 px-4 text-slate-400">{NO_DATA}</td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleRemoveStudent(st.id, st.name)}
                                className="text-xs font-semibold text-rose-600 hover:underline inline-flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Xóa
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Device-local results */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900">Kết quả học tập trên thiết bị này</h3>
              <button
                onClick={onOpenNotebook}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg"
              >
                <BookOpen className="w-3.5 h-3.5" /> Xem sổ tay trên thiết bị này
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">Thí nghiệm hoàn thành</span>
                <strong className="text-base text-slate-900">
                  {deviceProgress.completedCount}/{experiments.length}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">Điểm XP</span>
                <strong className="text-base text-slate-900">{deviceProgress.points}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">Bài ghi sổ tay</span>
                <strong className="text-base text-slate-900">{deviceProgress.notebookCount}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">Lần làm bài đã chấm</span>
                <strong className="text-base text-slate-900">{totalAnswerSessions}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Assignments */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          {assignments.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 text-sm text-slate-500">
              Chưa giao nhiệm vụ nào.
              {classrooms.length === 0 && ' Thầy cô hãy tạo lớp học trước.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.map((asg) => {
                const cls = classrooms.find((c) => c.id === asg.classId);
                return (
                  <div
                    key={asg.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5" /> Hạn nộp: {asg.dueDate || 'Không đặt hạn'}
                      </span>
                      <span className="font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                        {asg.targetType === 'individual' ? 'Cá nhân' : 'Nhóm'}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{asg.title}</h3>
                    <p className="text-xs text-slate-500">
                      Thí nghiệm: <strong>{asg.experimentTitle}</strong>
                      {cls && <> · Lớp: <strong>{cls.name}</strong></>}
                    </p>
                    <p className="text-xs text-slate-400">
                      Giao ngày {asg.assignedDate}. Theo dõi bài nộp sẽ có khi kết nối máy chủ.
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Common Missed Questions Analytics */}
      {activeTab === 'analytics' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900">Câu hỏi hay trả lời sai</h3>
          </div>
          <p className="text-xs text-slate-500">
            Tính từ {totalAnswerSessions} lần làm bài (thử thách và câu hỏi sau thí nghiệm) trên thiết bị này.
          </p>

          {missedSorted.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
              {totalAnswerSessions === 0 ? NO_DATA : 'Chưa có câu nào bị trả lời sai.'}
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {missedSorted.map((m, idx) => (
                <div
                  key={m.key}
                  className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1 text-xs"
                >
                  <div className="flex flex-wrap justify-between gap-2 font-bold text-amber-900">
                    <span>
                      {idx + 1}. {m.question}
                    </span>
                    <span className="text-rose-700">
                      Sai {m.wrong}/{m.seen} lần ({Math.round((m.wrong / m.seen) * 100)}%)
                    </span>
                  </div>
                  <p className="text-slate-500">Trong: {m.source}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Presentation Mode Quick Launcher */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold flex items-center gap-2">
            <Monitor className="w-4 h-4" /> Trình chiếu thí nghiệm lên màn hình lớp học
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Mở thí nghiệm rồi bấm “Trình chiếu toàn màn hình” để cả lớp cùng quan sát
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={presentExpId}
            onChange={(e) => setPresentExpId(e.target.value)}
            aria-label="Chọn thí nghiệm để trình chiếu"
            className="bg-slate-800 border border-slate-700 text-white text-xs p-2.5 rounded-xl focus:outline-none"
          >
            {experiments.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              const exp = experiments.find((ex) => ex.id === presentExpId);
              if (exp) onSelectExperimentToPresent(exp);
            }}
            className="px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
          >
            Mở thí nghiệm
          </button>
        </div>
      </div>

      {/* Create Assignment Modal */}
      {showAssignModal && selectedClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="asg-title"
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-slate-200"
          >
            <h3 id="asg-title" className="text-base font-bold text-slate-900">
              Giao nhiệm vụ cho lớp {selectedClass.name}
            </h3>
            <form onSubmit={handleCreateAssignment} className="space-y-3 text-xs">
              <div>
                <label htmlFor="asg-name" className="font-semibold text-slate-700 block mb-1">Tiêu đề nhiệm vụ:</label>
                <input
                  id="asg-name"
                  type="text"
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  placeholder="Để trống sẽ dùng tên thí nghiệm"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="asg-exp" className="font-semibold text-slate-700 block mb-1">Chọn thí nghiệm:</label>
                <select
                  id="asg-exp"
                  value={assignExpId}
                  onChange={(e) => setAssignExpId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:border-teal-500 focus:outline-none"
                >
                  {experiments.map((ex) => (
                    <option key={ex.id} value={ex.id}>{ex.title}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="asg-due" className="font-semibold text-slate-700 block mb-1">Hạn hoàn thành:</label>
                  <input
                    id="asg-due"
                    type="date"
                    value={assignDueDate}
                    onChange={(e) => setAssignDueDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="asg-type" className="font-semibold text-slate-700 block mb-1">Hình thức:</label>
                  <select
                    id="asg-type"
                    value={assignType}
                    onChange={(e) => setAssignType(e.target.value as 'individual' | 'group')}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:border-teal-500 focus:outline-none"
                  >
                    <option value="individual">Cá nhân từng em</option>
                    <option value="group">Làm việc nhóm</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-2xs"
                >
                  Giao bài
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Class Modal */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cls-title"
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200"
          >
            <h3 id="cls-title" className="text-base font-bold text-slate-900">Tạo lớp học mới</h3>
            <form onSubmit={handleCreateClass} className="space-y-3 text-xs">
              <div>
                <label htmlFor="cls-name" className="font-semibold text-slate-700 block mb-1">Tên lớp học:</label>
                <input
                  id="cls-name"
                  type="text"
                  required
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Ví dụ: Lớp 4A3"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="cls-school" className="font-semibold text-slate-700 block mb-1">Trường học (không bắt buộc):</label>
                <input
                  id="cls-school"
                  type="text"
                  value={newSchool}
                  onChange={(e) => setNewSchool(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-2xs"
                >
                  Tạo lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
