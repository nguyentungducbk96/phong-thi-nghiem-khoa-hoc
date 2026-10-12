import React, { useState } from 'react';
import { Classroom, Assignment, Experiment } from '../../types';
import {
  Users,
  Plus,
  BookOpen,
  Calendar,
  CheckCircle,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  Send,
  Eye,
  Award
} from 'lucide-react';

interface Props {
  classrooms: Classroom[];
  assignments: Assignment[];
  experiments: Experiment[];
  onSelectExperimentToPresent: (exp: Experiment) => void;
  onAddAssignment: (assignment: Assignment) => void;
  onAddClassroom: (classroom: Classroom) => void;
}

export const TeacherDashboard: React.FC<Props> = ({
  classrooms,
  assignments,
  experiments,
  onSelectExperimentToPresent,
  onAddAssignment,
  onAddClassroom
}) => {
  const [activeTab, setActiveTab] = useState<'classes' | 'assignments' | 'analytics'>('classes');
  const [selectedClass, setSelectedClass] = useState<Classroom>(classrooms[0]);
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [showClassModal, setShowClassModal] = useState<boolean>(false);

  // New assignment form
  const [assignTitle, setAssignTitle] = useState<string>('');
  const [assignExpId, setAssignExpId] = useState<string>(experiments[0].id);
  const [assignDueDate, setAssignDueDate] = useState<string>('20/10/2026');
  const [assignType, setAssignType] = useState<'individual' | 'group'>('individual');

  // New class form
  const [newClassName, setNewClassName] = useState<string>('');
  const [newSchool, setNewSchool] = useState<string>('Trường Tiểu học Nguyễn Du');

  // Export CSV report
  const handleExportCSV = () => {
    const headers = 'STT,Họ và tên,Điểm tích lũy (XP),Thí nghiệm hoàn thành,Điểm trung bình (%),Hoạt động cuối\n';
    const rows = selectedClass.students
      .map(
        (st, idx) =>
          `${idx + 1},"${st.name}",${st.points},${st.completedExperiments},${st.averageScore}%,"${st.lastActive}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bao_Cao_${selectedClass.code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const expObj = experiments.find((e) => e.id === assignExpId);
    if (!expObj) return;

    const newAsg: Assignment = {
      id: 'asg_' + Date.now(),
      classId: selectedClass.id,
      title: assignTitle || `Nhiệm vụ: ${expObj.title}`,
      experimentId: expObj.id,
      experimentTitle: expObj.title,
      assignedDate: new Date().toLocaleDateString('vi-VN'),
      dueDate: assignDueDate,
      targetType: assignType,
      targetName: assignType === 'individual' ? 'Cả lớp' : 'Các nhóm',
      status: 'active',
      submissionsCount: 0,
      totalStudents: selectedClass.studentCount
    };

    onAddAssignment(newAsg);
    setShowAssignModal(false);
    setAssignTitle('');
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const newCode = 'KH4-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const newCls: Classroom = {
      id: 'cls_' + Date.now(),
      name: newClassName,
      code: newCode,
      school: newSchool,
      grade: 'Lớp 4',
      teacherName: 'Giáo viên phụ trách',
      studentCount: 0,
      students: []
    };

    onAddClassroom(newCls);
    setSelectedClass(newCls);
    setShowClassModal(false);
    setNewClassName('');
  };

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
            Quản lý học sinh, giao nhiệm vụ thí nghiệm, phân tích kết quả học tập và trình chiếu giảng dạy
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-xs"
          >
            <Send className="w-4 h-4" />
            Giao bài tập mới
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Xuất báo cáo CSV
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('classes')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'classes'
                ? 'bg-teal-50 text-teal-800 border border-teal-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Danh sách Lớp & Học sinh
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'assignments'
                ? 'bg-teal-50 text-teal-800 border border-teal-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Nhiệm vụ đã giao ({assignments.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'analytics'
                ? 'bg-teal-50 text-teal-800 border border-teal-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Thống kê câu hỏi hay sai
          </button>
        </div>

        {/* Class selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedClass.id}
            onChange={(e) => {
              const cls = classrooms.find((c) => c.id === e.target.value);
              if (cls) setSelectedClass(cls);
            }}
            className="p-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
          >
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowClassModal(true)}
            className="p-1.5 text-xs text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl font-bold"
            title="Tạo lớp học mới"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TAB 1: Classes & Students */}
      {activeTab === 'classes' && (
        <div className="space-y-6">
          {/* Class Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Mã tham gia lớp</span>
              <span className="text-lg font-black text-teal-700 font-mono tracking-wider">{selectedClass.code}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Sĩ số học sinh</span>
              <span className="text-lg font-black text-slate-900">{selectedClass.students.length || selectedClass.studentCount} em</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Điểm trung bình lớp</span>
              <span className="text-lg font-black text-emerald-600">92.5%</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Tỉ lệ hoàn thành bài</span>
              <span className="text-lg font-black text-cyan-600">87.5%</span>
            </div>
          </div>

          {/* Student Roster Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Danh sách học sinh lớp {selectedClass.name}
              </h3>
              <span className="text-xs text-slate-400">
                Trường: {selectedClass.school}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Học sinh</th>
                    <th className="py-3 px-4">Điểm tích lũy (XP)</th>
                    <th className="py-3 px-4">Thí nghiệm đã làm</th>
                    <th className="py-3 px-4">Điểm trung bình</th>
                    <th className="py-3 px-4">Hoạt động cuối</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedClass.students.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Chưa có học sinh nào trong lớp. Hãy gửi mã tham gia <strong className="font-mono text-teal-700">{selectedClass.code}</strong> cho học sinh!
                      </td>
                    </tr>
                  ) : (
                    selectedClass.students.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                          <span className="text-base">{st.avatar}</span>
                          <span>{st.name}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-600">
                          +{st.points} XP
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="bg-cyan-50 text-cyan-800 border border-cyan-200 px-2 py-0.5 rounded font-bold">
                            {st.completedExperiments}/7 bài
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-600 font-mono">
                          {st.averageScore}%
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {st.lastActive}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => alert(`Xem sổ tay học tập của ${st.name}`)}
                            className="text-xs font-semibold text-teal-700 hover:underline"
                          >
                            Xem sổ tay
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Assignments */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.map((asg) => {
              const percent = Math.round((asg.submissionsCount / asg.totalStudents) * 100);

              return (
                <div
                  key={asg.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5" /> Hạn nộp: {asg.dueDate}
                      </span>
                      <span className="font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                        {asg.targetName}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {asg.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Thí nghiệm: <strong>{asg.experimentTitle}</strong>
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-500">Tiến độ nộp bài:</span>
                      <span className="font-bold text-slate-800">
                        {asg.submissionsCount} / {asg.totalStudents} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-teal-600 h-full rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Common Missed Questions Analytics */}
      {activeTab === 'analytics' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900">
              Phân tích các câu hỏi học sinh thường trả lời sai
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Dữ liệu tổng hợp từ các bài kiểm tra giúp giáo viên định hướng lại nội dung cần ôn tập trên lớp
          </p>

          <div className="space-y-3 pt-2">
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-amber-900">
                <span>1. &quot;Nước chuyển từ thể lỏng sang thể khí được gọi là sự ngưng tụ.&quot;</span>
                <span className="text-rose-600">42% học sinh nhầm lẫn</span>
              </div>
              <p className="text-slate-700">
                <strong>Nguyên nhân học sinh hay sai:</strong> Học sinh thường nhầm lẫn giữa hai khái niệm &quot;bay hơi&quot; và &quot;ngưng tụ&quot;.
              </p>
              <p className="text-teal-800 font-medium">
                <strong>Gợi ý sư phạm:</strong> Cho học sinh quan sát lại nắp vung nồi cơm điện để nhấn mạnh: gặp lạnh mới ngưng tụ.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-amber-900">
                <span>2. &quot;Đồng xu bằng nhôm có bị nam châm hút không?&quot;</span>
                <span className="text-rose-600">38% học sinh nhầm lẫn</span>
              </div>
              <p className="text-slate-700">
                <strong>Nguyên nhân học sinh hay sai:</strong> Thói quen nghĩ rằng tất cả kim loại đều bị nam châm hút.
              </p>
              <p className="text-teal-800 font-medium">
                <strong>Gợi ý sư phạm:</strong> Cho học sinh thử nghiệm thực tế phân biệt nhôm, đồng với sắt và niken.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Presentation Mode Quick Launcher */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold flex items-center gap-2">
            Chế độ Trình chiếu Giảng dạy lên Màn hình Lớp học
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Chọn bất kỳ thí nghiệm nào để mở giao diện trình chiếu toàn màn hình điều khiển cho cả lớp quan sát
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            id="exp-present-select"
            className="bg-slate-800 border border-slate-700 text-white text-xs p-2.5 rounded-xl focus:outline-none"
          >
            {experiments.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              const el = document.getElementById('exp-present-select') as HTMLSelectElement;
              const exp = experiments.find((e) => e.id === el.value);
              if (exp) onSelectExperimentToPresent(exp);
            }}
            className="px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
          >
            Mở trình chiếu ngay
          </button>
        </div>
      </div>

      {/* Create Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Giao nhiệm vụ thí nghiệm cho lớp</h3>
            <form onSubmit={handleCreateAssignment} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tiêu đề nhiệm vụ:</label>
                <input
                  type="text"
                  required
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  placeholder="Ví dụ: Nhiệm vụ tuần 7: Khám phá mạch điện kín"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Chọn thí nghiệm:</label>
                <select
                  value={assignExpId}
                  onChange={(e) => setAssignExpId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:border-teal-500 focus:outline-none"
                >
                  {experiments.map((e) => (
                    <option key={e.id} value={e.id}>{e.title}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Hạn hoàn thành:</label>
                  <input
                    type="text"
                    value={assignDueDate}
                    onChange={(e) => setAssignDueDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Hình thức:</label>
                  <select
                    value={assignType}
                    onChange={(e) => setAssignType(e.target.value as any)}
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Tạo lớp học mới</h3>
            <form onSubmit={handleCreateClass} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tên lớp học:</label>
                <input
                  type="text"
                  required
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Ví dụ: Lớp 4A3 - Khám Phá Tự Nhiên"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Trường học:</label>
                <input
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
