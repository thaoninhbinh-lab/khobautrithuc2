import React, { useState, useEffect } from 'react';
import { LinkItem, SubjectType, GradeLevel, ResourceType, SubjectCard } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  X,
  Link as LinkIcon,
  Globe,
  Lock,
  AlertCircle,
  Sparkles,
  BookOpen,
  GraduationCap,
  Layers,
  Gamepad2,
  Video,
} from 'lucide-react';
import { SYSTEM_DEFAULT_SUBJECTS, normalizeSubjectName, normalizeResourceType } from '../services/storageService';

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (linkData: Omit<LinkItem, 'id'>) => Promise<void>;
  editingItem: LinkItem | null;
  defaultSubject?: SubjectType;
  defaultGrade?: GradeLevel;
  defaultType?: ResourceType;
  availableCards?: SubjectCard[];
  activeCard?: SubjectCard | null;
}

export const LinkModal: React.FC<LinkModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
  defaultSubject = 'toan',
  defaultGrade = 1,
  defaultType = 'tro_choi',
  availableCards = [],
  activeCard = null,
}) => {
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('toan');
  const [grade, setGrade] = useState<GradeLevel>(1);
  const [lesson, setLesson] = useState('');
  const [topic, setTopic] = useState('');
  const [resourceType, setResourceType] = useState<ResourceType>('tro_choi');
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isPublic, setIsPublic] = useState(true); // true = Công khai, false = Riêng tư
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tìm đối tượng môn học tương ứng
  const currentSubjectConfig = SYSTEM_DEFAULT_SUBJECTS.find(
    (s) => s.id === selectedSubjectId || s.name.toLowerCase() === selectedSubjectId.toLowerCase()
  ) || SYSTEM_DEFAULT_SUBJECTS[0];

  // Danh sách các lớp hợp lệ của môn học đang chọn
  const validGradesForSubject = currentSubjectConfig.grades || [1, 2, 3, 4, 5];

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title);
      setUrl(editingItem.url);
      setDescription(editingItem.description || '');

      // Tìm subject ID chuẩn
      const itemSub = (editingItem.subject || '').toLowerCase().trim();
      const matched = SYSTEM_DEFAULT_SUBJECTS.find(
        (s) => s.id === itemSub || s.name.toLowerCase() === itemSub || itemSub.includes(s.id)
      );
      setSelectedSubjectId(matched?.id || 'toan');
      setGrade(editingItem.grade);

      setLesson(editingItem.lesson || '');
      setTopic(editingItem.topic || '');
      setResourceType(normalizeResourceType(editingItem.resourceType));
      setNotes(editingItem.notes || '');
      setTagsInput(editingItem.tags ? editingItem.tags.join(', ') : '');
      setIsPinned(editingItem.isPinned || false);
      setIsPublic(editingItem.isPublic !== undefined ? editingItem.isPublic : true);
    } else {
      // Khởi tạo dựa trên activeCard hoặc preset
      let initSubId = 'toan';
      let initGrade: GradeLevel = 1;

      if (activeCard) {
        const cName = normalizeSubjectName(activeCard.name).toLowerCase();
        const matched = SYSTEM_DEFAULT_SUBJECTS.find(
          (s) => s.id === activeCard.id.split('-')[0] || s.name.toLowerCase() === cName
        );
        if (matched) {
          initSubId = matched.id;
        }
        if (activeCard.grade && activeCard.grade >= 1 && activeCard.grade <= 5) {
          initGrade = activeCard.grade as GradeLevel;
        }
      } else {
        const defSubStr = String(defaultSubject).toLowerCase();
        const matched = SYSTEM_DEFAULT_SUBJECTS.find(
          (s) => s.id === defSubStr || s.name.toLowerCase() === defSubStr
        );
        if (matched) initSubId = matched.id;
        initGrade = defaultGrade;
      }

      // Đảm bảo khối lớp hợp lệ với môn
      const matchedConfig = SYSTEM_DEFAULT_SUBJECTS.find((s) => s.id === initSubId) || SYSTEM_DEFAULT_SUBJECTS[0];
      if (!matchedConfig.grades.includes(Number(initGrade))) {
        initGrade = (matchedConfig.grades[0] || 1) as GradeLevel;
      }

      setTitle('');
      setUrl('');
      setDescription('');
      setSelectedSubjectId(initSubId);
      setGrade(initGrade);
      setLesson('');
      setTopic('');
      setResourceType(normalizeResourceType(defaultType));
      setNotes('');
      setTagsInput('');
      setIsPinned(false);
      setIsPublic(true); // Mặc định Công khai
    }
    setErrorMsg('');
  }, [editingItem, isOpen, defaultSubject, defaultGrade, defaultType, activeCard]);

  // Khi thay đổi môn học, tự động cập nhật khối lớp hợp lệ
  const handleSubjectChange = (newSubId: string) => {
    setSelectedSubjectId(newSubId);
    const subConf = SYSTEM_DEFAULT_SUBJECTS.find((s) => s.id === newSubId);
    if (subConf && !subConf.grades.includes(Number(grade))) {
      setGrade(subConf.grades[0] as GradeLevel);
    }
  };

  // Tự động nhận diện loại học liệu từ URL
  const handleUrlChange = (value: string) => {
    setUrl(value);
    const lower = value.toLowerCase();
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
      setResourceType('video');
      if (!title) setTitle('Video Bài học: ');
    } else if (
      lower.includes('quizizz.com') ||
      lower.includes('wordwall.net') ||
      lower.includes('scratch.mit.edu') ||
      lower.includes('kahoot.it')
    ) {
      setResourceType('tro_choi');
      if (!title) setTitle('Trò chơi học tập: ');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tên học liệu.');
      return;
    }

    let cleanedUrl = url.trim();
    if (!cleanedUrl) {
      setErrorMsg('Vui lòng nhập đường dẫn học liệu (URL).');
      return;
    }

    if (!cleanedUrl.startsWith('http://') && !cleanedUrl.startsWith('https://')) {
      cleanedUrl = 'https://' + cleanedUrl;
    }

    try {
      new URL(cleanedUrl);
    } catch {
      setErrorMsg('Đường dẫn URL không hợp lệ. Vui lòng kiểm tra lại.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        url: cleanedUrl,
        description: description.trim(),
        subject: selectedSubjectId as SubjectType,
        grade,
        lesson: lesson.trim(),
        topic: topic.trim(),
        resourceType: normalizeResourceType(resourceType),
        notes: notes.trim(),
        tags,
        isPinned,
        isPublic,
        isFavorite: editingItem ? editingItem.isFavorite : false,
        playCount: editingItem ? editingItem.playCount : 0,
        createdAt: editingItem ? editingItem.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        creatorId: user?.uid || 'guest-user',
        creatorName: user?.displayName || 'Thầy/Cô Giáo',
        creatorSchool: user?.school || 'Tiểu học',
        creatorEmail: user?.email || '',
        creatorRole: user?.role || 'teacher',
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Có lỗi xảy ra khi lưu học liệu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full my-8 p-6 sm:p-8 shadow-2xl border border-emerald-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl shadow-2xs">
              {editingItem ? '✏️' : '✨'}
            </div>
            <div>
              <h3 className="text-title-section text-slate-900">
                {editingItem ? 'Chỉnh Sửa Học Liệu' : 'Thêm Học Liệu Mới'}
              </h3>
              <p className="text-desc text-slate-600 font-semibold mt-1">
                Phân loại đúng môn học, khối lớp và đưa vào kho học liệu chung của hệ thống
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-desc font-bold flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* 1. Tên học liệu */}
          <div>
            <label className="block text-main-body font-bold text-slate-800 mb-1.5">
              1. Tên học liệu <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Trò chơi lắp ghép đèn học"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-input-button font-bold text-slate-800 outline-hidden"
            />
          </div>

          {/* 2. Chọn Môn học & Chọn Lớp sử dụng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Môn học */}
            <div>
              <label className="block text-main-body font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>2. Chọn Môn học <span className="text-rose-500">*</span></span>
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-input-button font-bold text-slate-800 focus:border-emerald-500 outline-hidden"
              >
                {SYSTEM_DEFAULT_SUBJECTS.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.icon} Môn {sub.name} (Lớp {sub.grades.join(', ')})
                  </option>
                ))}
              </select>
            </div>

            {/* Khối lớp sử dụng: Chỉ hiển thị các lớp hợp lệ của môn đó */}
            <div>
              <label className="block text-main-body font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <span>Chọn Lớp sử dụng <span className="text-rose-500">*</span></span>
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value) as GradeLevel)}
                className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-input-button font-bold text-slate-800 focus:border-emerald-500 outline-hidden"
              >
                {validGradesForSubject.map((g) => (
                  <option key={g} value={g}>
                    Lớp {g} (Môn {currentSubjectConfig.name} Lớp {g})
                  </option>
                ))}
              </select>
              <p className="text-caption-safe text-slate-500 mt-1">
                Môn {currentSubjectConfig.name} gồm: Lớp {validGradesForSubject.join(', ')}
              </p>
            </div>
          </div>

          {/* 3. Chọn Loại học liệu (ĐÚNG 2 LỰA CHỌN: TRÒ CHƠI HỌC TẬP & VIDEO) */}
          <div>
            <label className="block text-main-body font-bold text-slate-800 mb-1.5">
              3. Chọn Loại học liệu <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setResourceType('tro_choi')}
                className={`p-3.5 rounded-2xl border cursor-pointer flex items-center gap-3 transition-all select-none ${
                  resourceType === 'tro_choi'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black shadow-xs ring-2 ring-emerald-400'
                    : 'bg-slate-50 border-slate-200 text-slate-600 font-semibold hover:bg-slate-100'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl shrink-0">
                  🎮
                </div>
                <div>
                  <p className="text-main-body font-black text-emerald-900">Trò chơi học tập</p>
                  <p className="text-caption-safe text-slate-500 font-medium">
                    Quizizz, Wordwall, Kahoot, Scratch, trắc nghiệm tương tác
                  </p>
                </div>
              </div>

              <div
                onClick={() => setResourceType('video')}
                className={`p-3.5 rounded-2xl border cursor-pointer flex items-center gap-3 transition-all select-none ${
                  resourceType === 'video'
                    ? 'bg-rose-50 border-rose-500 text-rose-950 font-black shadow-xs ring-2 ring-rose-400'
                    : 'bg-slate-50 border-slate-200 text-slate-600 font-semibold hover:bg-slate-100'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center text-xl shrink-0">
                  🎥
                </div>
                <div>
                  <p className="text-main-body font-black text-rose-900">Video</p>
                  <p className="text-caption-safe text-slate-500 font-medium">
                    Video bài học, bài giảng hoạt hình 3D, clip thực hành
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Đường dẫn URL học liệu */}
          <div>
            <label className="block text-main-body font-bold text-slate-800 mb-1.5">
              4. Đường dẫn liên kết (URL) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                required
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://quizizz.com/..., https://youtube.com/..., https://wordwall.net/..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-input-button font-bold text-slate-800 outline-hidden"
              />
            </div>
            <p className="text-caption-safe text-slate-500 mt-1">
              Hỗ trợ link Quizizz, Wordwall, Scratch, YouTube, Canva, Google Drive...
            </p>
          </div>

          {/* 5. Chọn Chế độ: Riêng tư hoặc Công khai */}
          <div>
            <label className="block text-main-body font-bold text-slate-800 mb-1.5">
              5. Chọn chế độ hiển thị <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setIsPublic(true)}
                className={`p-3.5 rounded-2xl border cursor-pointer flex items-start gap-3 transition-all select-none ${
                  isPublic
                    ? 'bg-sky-50 border-sky-500 text-sky-950 font-black shadow-xs ring-2 ring-sky-400'
                    : 'bg-slate-50 border-slate-200 text-slate-600 font-semibold hover:bg-slate-100'
                }`}
              >
                <Globe className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-main-body font-black text-sky-900">🌐 Chế độ Công khai</p>
                  <p className="text-caption-safe text-slate-500 font-medium mt-1 leading-snug">
                    Hiển thị trên trang chủ cho mọi người (học sinh, giáo viên khác, khách chưa đăng nhập đều xem và dùng được)
                  </p>
                </div>
              </div>

              <div
                onClick={() => setIsPublic(false)}
                className={`p-3.5 rounded-2xl border cursor-pointer flex items-start gap-3 transition-all select-none ${
                  !isPublic
                    ? 'bg-amber-50 border-amber-500 text-amber-950 font-black shadow-xs ring-2 ring-amber-400'
                    : 'bg-slate-50 border-slate-200 text-slate-600 font-semibold hover:bg-slate-100'
                }`}
              >
                <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-main-body font-black text-amber-900">🔒 Chế độ Riêng tư</p>
                  <p className="text-caption-safe text-slate-500 font-medium mt-1 leading-snug">
                    Chỉ hiển thị với Admin và tài khoản giáo viên tải lên (không lộ với người khác)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Các trường bổ sung hữu ích: Bài học & Mô tả */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div>
              <label className="block text-main-body font-bold text-slate-800 mb-1.5">
                Tên bài học (Tùy chọn)
              </label>
              <input
                type="text"
                value={lesson}
                onChange={(e) => setLesson(e.target.value)}
                placeholder="Ví dụ: Bài 2: Sử dụng đèn học"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 text-input-button font-medium text-slate-800 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-main-body font-bold text-slate-800 mb-1.5">
                Chủ đề / Phần học (Tùy chọn)
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ví dụ: Phần 1: Công nghệ và đời sống"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 text-input-button font-medium text-slate-800 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-main-body font-bold text-slate-800 mb-1.5">
              Mô tả ngắn
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Giới thiệu nội dung, số lượng câu hỏi hoặc mục tiêu bài học..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 text-input-button font-medium text-slate-800 outline-hidden"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <span className="text-caption-safe font-bold text-slate-700">
                Ghim học liệu này lên đầu
              </span>
            </label>
          </div>

          {/* Nút hành động */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-input-button font-bold transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-input-button font-black shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : editingItem ? 'Lưu Thay Đổi' : 'Thêm Học Liệu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
