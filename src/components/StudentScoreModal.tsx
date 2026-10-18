import React, { useState, useEffect } from 'react';
import { LinkItem, StudyRecord, DEFAULT_SCHOOL_NAME } from '../types';
import { useAuth } from '../contexts/AuthContext';
import confetti from 'canvas-confetti';
import { X, Award, CheckCircle, Star, Sparkles } from 'lucide-react';

interface StudentScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkItem: LinkItem | null;
  onSaveRecord: (record: Omit<StudyRecord, 'id'>) => Promise<void>;
}

export const StudentScoreModal: React.FC<StudentScoreModalProps> = ({
  isOpen,
  onClose,
  linkItem,
  onSaveRecord,
}) => {
  const { user } = useAuth();

  const [studentName, setStudentName] = useState('');
  const [className, setClassName] = useState('4A');
  const [score, setScore] = useState<number>(10);
  const [correctAnswers, setCorrectAnswers] = useState<number>(15);
  const [totalQuestions, setTotalQuestions] = useState<number>(15);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successBadge, setSuccessBadge] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setStudentName(user.displayName);
      if (user.assignedClass && user.assignedClass.includes('Lớp')) {
        setClassName(user.assignedClass.replace('Lớp ', ''));
      }
    } else {
      setStudentName('');
    }
    setSuccessBadge(null);
  }, [user, isOpen]);

  const fireConfetti = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !linkItem) return;

    let badge = 'Ngôi Sao Tri Thức';
    if (score >= 9) badge = 'Hiệp Sĩ Xuất Sắc 🌟';
    else if (score >= 7) badge = 'Ong Vàng Chăm Chỉ 🐝';
    else badge = 'Chiến Binh Cố Gắng 💪';

    setIsSubmitting(true);
    try {
      await onSaveRecord({
        userId: user?.uid || 'guest-student',
        studentName: studentName.trim(),
        school: user?.school || DEFAULT_SCHOOL_NAME,
        className: className.trim().toUpperCase(),
        linkId: linkItem.id,
        linkTitle: linkItem.title,
        subject: linkItem.subject,
        grade: linkItem.grade,
        lesson: linkItem.lesson || '',
        resourceType: linkItem.resourceType,
        platform: linkItem.url.includes('quizizz.com') ? 'Quizizz' : 'Nền tảng khác',
        attemptsCount: 1,
        score: Number(score),
        maxScore: 10,
        correctAnswers: Number(correctAnswers),
        totalQuestions: Number(totalQuestions),
        status: 'completed',
        completedAt: new Date().toISOString(),
        badgeEarned: badge,
      });

      setSuccessBadge(badge);
      fireConfetti();

      setTimeout(() => {
        onClose();
        setSuccessBadge(null);
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !linkItem) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 animate-in fade-in zoom-in-95 duration-150 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {successBadge ? (
          <div className="text-center py-6">
            <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-4xl mx-auto mb-3 animate-bounce shadow-md">
              🏆
            </div>
            <h3 className="text-title-section font-black text-slate-900">Chúc Mừng Em!</h3>
            <p className="text-main-body font-bold text-emerald-700 mt-1.5">
              Đã ghi nhận điểm số: <span className="text-title-section font-black">{score}/10</span>
            </p>
            <div className="mt-3.5 inline-block px-4 py-2 rounded-full bg-amber-100 border border-amber-300 text-amber-950 font-black text-caption-safe">
              Huy hiệu nhận được: {successBadge}
            </div>
            <p className="text-caption-safe text-slate-400 mt-4">Tự động đóng sau giây lát...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl">
                ⭐
              </div>
              <div>
                <h3 className="text-title-section font-black text-slate-900 leading-tight">
                  Ghi Nhận Kết Quả Học Tập
                </h3>
                <p className="text-desc text-slate-600 font-semibold line-clamp-1 mt-0.5">
                  {linkItem.title}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-main-body font-bold text-slate-800 mb-1.5">
                  Họ và tên học sinh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 text-input-button font-bold text-slate-800 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-main-body font-bold text-slate-800 mb-1.5">Lớp</label>
                  <input
                    type="text"
                    required
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="3A, 4B, 5C..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-input-button font-bold text-slate-800 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-main-body font-bold text-slate-800 mb-1.5">
                    Điểm số (Thang 10)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    required
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-input-button font-bold text-slate-800 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-main-body font-bold text-slate-800 mb-1.5">
                    Số câu đúng
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={correctAnswers}
                    onChange={(e) => setCorrectAnswers(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-input-button font-bold text-slate-800 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-main-body font-bold text-slate-800 mb-1.5">
                    Tổng số câu
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={totalQuestions}
                    onChange={(e) => setTotalQuestions(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-input-button font-bold text-slate-800 outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-600 hover:from-amber-600 hover:to-teal-700 text-white font-black text-input-button shadow-md shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>{isSubmitting ? 'Đang lưu...' : 'Lưu Kết Quả & Nhận Thưởng'}</span>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
