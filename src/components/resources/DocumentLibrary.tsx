import React, { useState } from 'react';
import { LearningResource, TopicId } from '../../types';
import { SCIENCE_TOPICS } from '../../data/scienceData';
import { FileText, Download, Eye, Plus, Search, Lock, Unlock, FileCheck } from 'lucide-react';

interface Props {
  resources: LearningResource[];
  isTeacher: boolean;
  onAddResource: (resource: LearningResource) => void;
  onDeleteResource: (id: string) => void;
}

export const DocumentLibrary: React.FC<Props> = ({
  resources,
  isTeacher,
  onAddResource,
  onDeleteResource
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [previewResource, setPreviewResource] = useState<LearningResource | null>(null);

  // New resource form state
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [topicId, setTopicId] = useState<TopicId>('khong-khi-nuoc');
  const [fileType, setFileType] = useState<'pdf' | 'docx' | 'pptx' | 'image'>('pdf');
  const [audience, setAudience] = useState<'public' | 'teacher_only'>('public');

  const filteredResources = resources.filter((res) => {
    // If student, hide teacher_only resources!
    if (!isTeacher && res.audience === 'teacher_only') return false;

    const matchesSearch =
      res.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = fileTypeFilter === 'all' || res.fileType === fileTypeFilter;

    return matchesSearch && matchesType;
  });

  const handleCreateResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newRes: LearningResource = {
      id: 'res_' + Date.now(),
      title,
      description,
      topicId,
      fileType,
      audience,
      size: '2.5 MB',
      uploadedBy: isTeacher ? 'Giáo viên phụ trách' : 'Nhà khoa học nhí',
      uploadedAt: new Date().toLocaleDateString('vi-VN')
    };

    onAddResource(newRes);
    setShowAddModal(false);
    setTitle('');
    setDescription('');
  };

  const getFileBadge = (type: string) => {
    switch (type) {
      case 'pdf':
        return <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-[11px] font-bold">PDF</span>;
      case 'pptx':
        return <span className="bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded text-[11px] font-bold">PowerPoint</span>;
      case 'docx':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-bold">Word DOCX</span>;
      case 'image':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-bold">Hình ảnh</span>;
      default:
        return <span className="bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-bold">Tài liệu</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Kho Tài Liệu Học Tập
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kế hoạch bài dạy, slide giáo án điện tử, phiếu học tập và sơ đồ thí nghiệm Khoa học 4
          </p>
        </div>

        {isTeacher && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Tải lên tài liệu mới
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm tài liệu..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {['all', 'pdf', 'pptx', 'docx', 'image'].map((t) => (
            <button
              key={t}
              onClick={() => setFileTypeFilter(t)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border whitespace-nowrap transition-colors ${
                fileTypeFilter === t
                  ? 'bg-indigo-600 text-white border-indigo-700'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t === 'all'
                ? 'Tất cả định dạng'
                : t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Table / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredResources.map((res) => (
          <div
            key={res.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {getFileBadge(res.fileType)}
                  <span className="text-[11px] text-slate-400">{res.size}</span>
                </div>
                {res.audience === 'teacher_only' ? (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Chỉ dành cho giáo viên
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                    <Unlock className="w-3 h-3" /> Công khai học sinh
                  </span>
                )}
              </div>

              <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                {res.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {res.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Đăng bởi: <strong className="text-slate-600">{res.uploadedBy}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewResource(res)}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> Xem trước
                </button>
                <button
                  onClick={() => alert(`Đang tải tệp: ${res.title} (${res.size})`)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Tải về
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewResource && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">{previewResource.title}</h3>
              </div>
              <button
                onClick={() => setPreviewResource(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕ Đóng
              </button>
            </div>

            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs leading-relaxed">
              <div className="flex justify-between text-slate-500 pb-2 border-b border-slate-200">
                <span>Định dạng: {previewResource.fileType.toUpperCase()}</span>
                <span>Dung lượng: {previewResource.size}</span>
                <span>Ngày đăng: {previewResource.uploadedAt}</span>
              </div>
              <p className="text-slate-700 font-medium">{previewResource.description}</p>
              <div className="bg-white p-4 rounded-lg border border-slate-200 text-center text-slate-500">
                📄 [Trình duyệt đã nạp nội dung tài liệu chuẩn Khoa học lớp 4]
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPreviewResource(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  alert(`Đang tải tệp: ${previewResource.title}`);
                  setPreviewResource(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-4 h-4" /> Tải về máy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Resource Modal for Teachers */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Tải lên tài liệu học tập mới</h3>
            <form onSubmit={handleCreateResource} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tên tài liệu:</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Kế hoạch bài dạy Bài 5: Nước và Không khí"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mô tả ngắn gọn:</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nội dung, mục tiêu hoặc hướng dẫn sử dụng tài liệu..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Định dạng tệp:</label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="pdf">Tệp PDF (.pdf)</option>
                    <option value="pptx">Slide PowerPoint (.pptx)</option>
                    <option value="docx">Word (.docx)</option>
                    <option value="image">Hình ảnh (.jpg, .png)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phân quyền xem:</label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="public">Công khai cho học sinh</option>
                    <option value="teacher_only">Chỉ dành cho giáo viên</option>
                  </select>
                </div>
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
                  className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-2xs"
                >
                  Lưu tài liệu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
