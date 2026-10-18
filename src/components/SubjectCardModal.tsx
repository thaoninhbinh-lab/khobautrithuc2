import React, { useState, useEffect } from 'react';
import { SubjectCard } from '../types';
import {
  X,
  BookOpen,
  GraduationCap,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { getSubjectDefaultIcon, getSubjectDefaultColor } from '../services/supabaseService';
import { normalizeGradeClass } from '../utils/gradeUtils';

interface SubjectCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; className: string; description?: string }) => Promise<void>;
  editingCard: SubjectCard | null;
  existingCards: SubjectCard[];
  onOpenExistingCard?: (card: SubjectCard) => void;
}

const COMMON_SUBJECT_SUGGESTIONS = [
  'Toán',
  'Tiếng Việt',
  'Tiếng Anh',
  'Khoa học',
  'Lịch sử và Địa lí',
  'Đạo đức',
  'Tự nhiên và Xã hội',
  'Tin học',
  'Công nghệ',
  'Nghệ thuật',
  'Giáo dục thể chất',
  'Hoạt động trải nghiệm',
];

export const SubjectCardModal: React.FC<SubjectCardModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingCard,
  existingCards,
  onOpenExistingCard,
}) => {
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [duplicateCard, setDuplicateCard] = useState<SubjectCard | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingCard) {
      setName(editingCard.name);
      setClassName(editingCard.className);
      setDescription(editingCard.description || '');
    } else {
      setName('');
      setClassName('');
      setDescription('');
    }
    setErrorMsg('');
    setDuplicateCard(null);
  }, [editingCard, isOpen]);

  // Kết quả chuẩn hóa lớp học thời gian thực
  const normalizedResult = normalizeGradeClass(className);

  // Kiểm tra trùng lặp thời gian thực khi gõ
  const checkDuplicate = (subName: string, clsName: string) => {
    const cleanN = subName.trim().toLowerCase();
    const norm = normalizeGradeClass(clsName);
    if (!cleanN || !norm.isValid) {
      setDuplicateCard(null);
      return;
    }

    const dup = existingCards.find((c) => {
      const cNorm = normalizeGradeClass(c.className);
      const targetClass = cNorm.isValid ? cNorm.normalized : c.className.trim();
      return (
        c.id !== editingCard?.id &&
        c.name.trim().toLowerCase() === cleanN &&
        targetClass.toLowerCase() === norm.normalized.toLowerCase()
      );
    });

    setDuplicateCard(dup || null);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    setErrorMsg('');
    checkDuplicate(val, className);
  };

  const handleClassChange = (val: string) => {
    setClassName(val);
    setErrorMsg('');
    checkDuplicate(name, val);
  };

  const handleSelectSuggestion = (suggested: string) => {
    setName(suggested);
    setErrorMsg('');
    checkDuplicate(suggested, className);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMsg('Vui lòng nhập tên môn học.');
      return;
    }

    const norm = normalizeGradeClass(className);
    if (!norm.isValid) {
      setErrorMsg(norm.errorMessage || 'Lớp không hợp lệ! Vui lòng chỉ nhập số lớp từ 1 đến 5 (ví dụ: 1, 2, 3, 4, 5 hoặc 1A, 2A, 3B...).');
      return;
    }

    const cleanClass = norm.normalized; // Chuẩn hóa thành dạng thống nhất "Lớp 1", "Lớp 2", "Lớp 3",...

    if (duplicateCard) {
      setErrorMsg(`Môn học "${cleanName}" - ${cleanClass} đã tồn tại trong danh sách quản lý của bạn!`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: cleanName,
        className: cleanClass,
        description: description.trim(),
      });
      onClose();
    } catch (err: any) {
      if (err.code === 'DUPLICATE' && err.existingCard) {
        setDuplicateCard(err.existingCard);
      }
      setErrorMsg(err.message || 'Có lỗi xảy ra khi lưu thẻ môn học.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const previewIcon = getSubjectDefaultIcon(name || 'Toán');
  const previewColor = getSubjectDefaultColor(name || 'Toán');

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-emerald-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-2xl shadow-sm shadow-emerald-500/20">
              {editingCard ? '✏️' : '✨'}
            </div>
            <div>
              <h3 className="text-title-section text-slate-900">
                {editingCard ? 'Quản Trị Viên: Chỉnh Sửa Môn Học' : 'Quản Trị Viên: Thêm Môn Học Mới'}
              </h3>
              <p className="text-desc text-slate-600 font-semibold mt-1">
                Quản lý danh mục môn học dùng chung cho toàn trường (Chỉ Quản trị viên)
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

        {/* Thông báo lỗi */}
        {errorMsg && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-desc font-bold flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">
              <span>{errorMsg}</span>
              {duplicateCard && onOpenExistingCard && (
                <div className="mt-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenExistingCard(duplicateCard);
                      onClose();
                    }}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-caption-safe font-bold transition-colors cursor-pointer"
                  >
                    Mở thẻ "{duplicateCard.name} - {duplicateCard.className}" ngay ➔
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cảnh báo trùng lặp trực tiếp */}
        {duplicateCard && !errorMsg && (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-desc font-bold flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <p>Thẻ môn học "{name}" - "{className}" đã có sẵn trong danh sách của bạn!</p>
              {onOpenExistingCard && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenExistingCard(duplicateCard);
                    onClose();
                  }}
                  className="mt-2.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-caption-safe font-bold transition-colors cursor-pointer"
                >
                  Mở thẻ hiện có ➔
                </button>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Trường 1: Tên môn học */}
          <div>
            <label className="block text-main-body font-bold text-slate-800 mb-1.5">
              Tên môn học <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ví dụ: Toán, Tiếng Việt, Khoa học, Tiếng Anh..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-input-button font-bold text-slate-800 outline-hidden"
              />
            </div>

            {/* Gợi ý nhanh các môn học tiểu học */}
            <div className="mt-2.5">
              <span className="text-caption-safe font-bold text-slate-500 block mb-1.5">Gợi ý nhanh môn học:</span>
              <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
                {COMMON_SUBJECT_SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => handleSelectSuggestion(sug)}
                    className={`px-3 py-1.5 rounded-xl text-caption-safe font-bold transition-colors cursor-pointer border ${
                      name.trim().toLowerCase() === sug.toLowerCase()
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Trường 2: Lớp (Đổi nhãn thành Lớp, chỉ gợi ý 1-5, tự chuẩn hóa 1A, 2B -> Lớp 1, Lớp 2) */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="block text-main-body font-bold text-slate-800">
                Lớp <span className="text-rose-500">*</span>
              </label>
              <span className="text-caption-safe text-slate-500 font-medium">Chỉ chọn từ lớp 1 đến lớp 5</span>
            </div>

            {/* Danh sách chọn nhanh gồm 1, 2, 3, 4, 5 (hạn chế nhập sai theo yêu cầu) */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {[1, 2, 3, 4, 5].map((g) => {
                const label = `Lớp ${g}`;
                const isSelected = normalizedResult.isValid && normalizedResult.gradeNumber === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleClassChange(label)}
                    className={`px-3.5 py-1.5 rounded-xl text-caption-safe font-black transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                required
                value={className}
                onChange={(e) => handleClassChange(e.target.value)}
                placeholder="Nhập lớp 1, 2, 3, 4 hoặc 5"
                className={`w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border text-input-button font-bold text-slate-800 outline-hidden focus:bg-white focus:ring-2 transition-all ${
                  className.trim() && !normalizedResult.isValid
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'
                }`}
              />
            </div>

            {/* Hướng dẫn nhập liệu & thông báo tự động chuẩn hóa */}
            {className.trim() ? (
              normalizedResult.isValid ? (
                <p className="text-caption-safe text-emerald-700 font-bold mt-1.5 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Tự động lưu và hiển thị chuẩn: <strong className="text-emerald-900 underline">{normalizedResult.normalized}</strong></span>
                </p>
              ) : (
                <p className="text-caption-safe text-rose-600 font-bold mt-1.5 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{normalizedResult.errorMessage}</span>
                </p>
              )
            ) : (
              <p className="text-caption-safe text-slate-500 mt-1">
                Gợi ý: Nhập lớp 1, 2, 3, 4 hoặc 5 (hệ thống sẽ tự động chuẩn hóa 1A, 2B, 3C... thành Lớp 1, Lớp 2...).
              </p>
            )}
          </div>

          {/* Trường 3: Mô tả ngắn (tùy chọn) */}
          <div>
            <label className="block text-main-body font-bold text-slate-800 mb-1.5">
              Mô tả ngắn (tùy chọn)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ví dụ: Ôn tập kiến thức, bài tập trắc nghiệm và trò chơi"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 text-input-button font-medium text-slate-800 outline-hidden"
            />
          </div>

          {/* Xem trước thẻ hiển thị */}
          {name && (
            <div className="pt-2">
              <span className="text-caption-safe font-bold text-slate-500 block mb-2 uppercase tracking-wider">
                Xem trước thẻ môn học sẽ tạo:
              </span>
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center gap-3 min-h-[84px]">
                <div className="w-12 h-12 rounded-xl bg-white shadow-2xs border border-slate-200 flex items-center justify-center text-2xl shrink-0">
                  {previewIcon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <h4 className="text-card-title text-slate-900 truncate">
                      {name} – {normalizedResult.isValid ? normalizedResult.normalized : (className ? `Lớp ${className}` : 'Lớp ...')}
                    </h4>
                    <span className="text-caption-safe font-black px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
                      0 bài
                    </span>
                  </div>
                  <p className="text-desc text-slate-600 truncate mt-1">
                    {description || `Học liệu môn ${name} ${normalizedResult.isValid ? normalizedResult.normalized : className}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Nút hành động */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-input-button font-bold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || Boolean(duplicateCard)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-input-button font-black shadow-md shadow-emerald-700/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang lưu...' : editingCard ? 'Cập nhật thẻ môn học' : 'Lưu môn học'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
