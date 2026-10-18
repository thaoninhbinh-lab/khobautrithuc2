import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DEFAULT_SCHOOL_NAME } from '../types';
import { getSavedSchoolForTeacher, STORAGE_KEY_LAST_SCHOOL } from '../services/storageService';
import {
  X,
  ShieldCheck,
  School,
  User,
  AlertCircle,
  LogIn,
  KeyRound,
  Eye,
  EyeOff,
  GraduationCap,
  Sparkles,
  Building2,
  CheckCircle2,
} from 'lucide-react';

interface RoleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessNotice: (msg: string) => void;
}

export const RoleLoginModal: React.FC<RoleLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccessNotice,
}) => {
  const { loginAsTeacher, loginAsStudent, loginAsAdmin, loginWithGoogle } = useAuth();

  // Tab chọn nhóm người dùng: 'student' | 'teacher' | 'admin'
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | 'admin'>('student');

  // Form Học sinh
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState<string>('');
  const [studentSchool, setStudentSchool] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_LAST_SCHOOL) || DEFAULT_SCHOOL_NAME;
  });

  // Form Giáo viên: Họ tên, Trường, Mã PIN
  const [teacherName, setTeacherName] = useState('');
  const [teacherSchool, setTeacherSchool] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_LAST_SCHOOL) || DEFAULT_SCHOOL_NAME;
  });
  const [hasManuallyEditedSchool, setHasManuallyEditedSchool] = useState(false);
  const [detectedSavedSchool, setDetectedSavedSchool] = useState<string | null>(null);
  const [teacherPin, setTeacherPin] = useState('');
  const [showTeacherPin, setShowTeacherPin] = useState(false);

  // Form Admin: Họ tên, Mã PIN
  const [adminName, setAdminName] = useState('Cô Thảo');
  const [adminPin, setAdminPin] = useState('');
  const [showAdminPin, setShowAdminPin] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setAdminPin('');
      // Cập nhật trường mặc định từ cấu hình / bộ nhớ nếu trường đang trống
      const lastSchool = localStorage.getItem(STORAGE_KEY_LAST_SCHOOL) || DEFAULT_SCHOOL_NAME;
      if (!studentSchool.trim()) setStudentSchool(lastSchool);
      if (!teacherSchool.trim()) setTeacherSchool(lastSchool);
    }
  }, [isOpen]);

  // Tự động kiểm tra trường đã lưu khi giáo viên nhập tên
  const handleTeacherNameChange = (val: string) => {
    setTeacherName(val);
    setErrorMsg('');

    const trimmed = val.trim();
    if (trimmed) {
      const saved = getSavedSchoolForTeacher(trimmed);
      if (saved) {
        setDetectedSavedSchool(saved);
        // Nếu giáo viên chưa tự tay gõ trường mới, tự động điền trường đã lưu
        if (!hasManuallyEditedSchool) {
          setTeacherSchool(saved);
        }
      } else {
        setDetectedSavedSchool(null);
      }
    } else {
      setDetectedSavedSchool(null);
    }
  };

  // Khôi phục tên trường đã lưu khi nhấn vào gợi ý
  const handleApplySavedSchool = (saved: string) => {
    setTeacherSchool(saved);
    setHasManuallyEditedSchool(false);
  };

  if (!isOpen) return null;

  // 1. Submit Học sinh: Họ tên + Lớp + Trường (Mặc định: Trường Tiểu học B Hải Xuân)
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!studentName.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên của học sinh.');
      return;
    }
    if (!studentClass.trim()) {
      setErrorMsg('Vui lòng nhập lớp học của em (Ví dụ: 3A, 4B, 5A…).');
      return;
    }
    if (!studentSchool.trim()) {
      setErrorMsg('Vui lòng nhập tên trường học (không được để trống hoặc chỉ có khoảng trắng).');
      return;
    }

    setIsSubmitting(true);
    try {
      const u = await loginAsStudent(studentName.trim(), studentClass.trim(), studentSchool.trim());
      onSuccessNotice(`Chào mừng em ${u.displayName} (${u.assignedClass}) đã vào học! 🎉`);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi đăng nhập học sinh.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Submit Giáo viên: Họ tên, Trường học (tùy chỉnh), Mã PIN (123456)
  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanTeacherName = teacherName.trim();
    const cleanTeacherSchool = teacherSchool.trim();
    const cleanTeacherPin = teacherPin.trim();

    if (!cleanTeacherName) {
      setErrorMsg('Vui lòng nhập họ và tên giáo viên.');
      return;
    }

    // Kiểm tra dữ liệu trường học: không chấp nhận chỉ gồm khoảng trắng
    if (!cleanTeacherSchool) {
      setErrorMsg('Vui lòng nhập tên trường của thầy/cô (không được để trống hoặc chỉ gồm khoảng trắng).');
      return;
    }

    if (!cleanTeacherPin) {
      setErrorMsg('Vui lòng nhập mã PIN giáo viên!');
      return;
    }

    if (cleanTeacherPin !== '123456') {
      setErrorMsg('Mã PIN không chính xác. Vui lòng nhập lại!');
      return;
    }

    setIsSubmitting(true);
    try {
      const u = await loginAsTeacher(
        cleanTeacherName,
        cleanTeacherSchool,
        cleanTeacherPin
      );

      if (u.approvalStatus === 'approved') {
        onSuccessNotice(`Chào mừng thầy/cô ${u.displayName} (${u.school})! Đăng nhập thành công.`);
      } else {
        onSuccessNotice(`Đăng ký tài khoản giáo viên ${u.displayName} thành công! Đang chờ Admin duyệt.`);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Mã PIN không chính xác. Vui lòng nhập lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Submit Admin: Họ tên và Mã PIN (999999)
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanAdminName = adminName.trim();
    const cleanAdminPin = adminPin.trim();

    if (!cleanAdminName) {
      setErrorMsg('Vui lòng nhập họ và tên quản trị viên.');
      return;
    }
    if (!cleanAdminPin) {
      setErrorMsg('Vui lòng nhập mã PIN quản trị!');
      return;
    }
    if (cleanAdminPin !== '999999') {
      setErrorMsg('Mã PIN không chính xác. Vui lòng nhập lại!');
      return;
    }

    setIsSubmitting(true);
    try {
      const u = await loginAsAdmin(cleanAdminName, cleanAdminPin);
      onSuccessNotice(`Đăng nhập Quản trị viên thành công: ${u.displayName} 👑`);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Mã PIN không chính xác. Vui lòng nhập lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full my-6 p-6 sm:p-8 shadow-2xl border border-emerald-100 animate-in fade-in zoom-in-95 duration-150 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Đóng cửa sổ"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title & Branding NGUỒN SÁNG TRI THỨC */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-caption-safe font-black mb-2 shadow-2xs">
            <span className="text-base">✨</span>
            <span className="tracking-wide">NGUỒN SÁNG TRI THỨC</span>
          </div>

          <h2 className="text-title-section text-slate-900 tracking-tight">
            Đăng Nhập Hệ Thống
          </h2>
          <p className="text-desc text-slate-600 font-semibold mt-1">
            Học vui mỗi ngày – Khám phá ngàn điều hay!
          </p>
        </div>

        {/* 3 Nút Chọn Nhóm Người Dùng (Học Sinh, Giáo Viên, Quản Trị) */}
        <div className="grid grid-cols-3 gap-2.5 p-1.5 bg-slate-100/90 rounded-2xl mb-5 border border-slate-200/80">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('student');
              setErrorMsg('');
            }}
            className={`py-3 px-2 rounded-xl text-input-button font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
              selectedRole === 'student'
                ? 'bg-white text-emerald-800 shadow-xs border border-emerald-300 ring-2 ring-emerald-500/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="text-xl">🎒</span>
            <span>Học Sinh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('teacher');
              setErrorMsg('');
            }}
            className={`py-3 px-2 rounded-xl text-input-button font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
              selectedRole === 'teacher'
                ? 'bg-white text-teal-800 shadow-xs border border-teal-300 ring-2 ring-teal-500/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="text-xl">📚</span>
            <span>Giáo Viên</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('admin');
              setErrorMsg('');
            }}
            className={`py-3 px-2 rounded-xl text-input-button font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
              selectedRole === 'admin'
                ? 'bg-white text-amber-900 shadow-xs border border-amber-300 ring-2 ring-amber-500/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="text-xl">👑</span>
            <span>Quản Trị</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-desc font-bold flex items-center gap-2.5 animate-in fade-in duration-150">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* BIỂU MẪU 1: HỌC SINH (Nhận diện thân thiện cho học sinh Tiểu học) */}
        {/* ========================================================= */}
        {selectedRole === 'student' && (
          <form onSubmit={handleStudentSubmit} className="space-y-4">
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200">
              <span className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg shadow-2xs shrink-0">
                🎒
              </span>
              <div>
                <p className="text-caption-safe font-black text-emerald-950 uppercase tracking-wide">
                  Dành cho Học Sinh Lớp 1 đến Lớp 5
                </p>
                <p className="text-desc text-emerald-800 font-semibold">
                  Không cần tài khoản email • Tự động lưu điểm và lịch sử học tập
                </p>
              </div>
            </div>

            <div>
              <label className="block text-main-body font-bold text-slate-800 mb-1.5">
                Họ và tên học sinh <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600" />
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-input-button font-bold text-slate-800 outline-hidden transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-main-body font-bold text-slate-800 mb-1.5">
                  Lớp học <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600" />
                  <input
                    type="text"
                    required
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    placeholder="Ví dụ: 3A, 4B, 5A…"
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-input-button font-bold text-slate-800 outline-hidden transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-main-body font-bold text-slate-800 mb-1.5">
                  Trường học <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <School className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-emerald-600" />
                  <input
                    type="text"
                    required
                    value={studentSchool}
                    onChange={(e) => setStudentSchool(e.target.value)}
                    placeholder="Trường Tiểu học B Hải Xuân"
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-input-button font-bold text-slate-800 outline-hidden transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-input-button shadow-md shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-5 h-5" />
                <span>{isSubmitting ? 'Đang vào bài...' : 'Vào Tham Gia Học Ngay 🚀'}</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* BIỂU MẪU 2: GIÁO VIÊN (Nhận diện chuyên nghiệp & Tự do nhập trường) */}
        {/* ========================================================= */}
        {selectedRole === 'teacher' && (
          <form onSubmit={handleTeacherSubmit} className="space-y-4">
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-teal-50/80 border border-teal-200">
              <span className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center text-lg shadow-2xs shrink-0">
                📚
              </span>
              <div>
                <p className="text-caption-safe font-black text-teal-950 uppercase tracking-wide">
                  Dành cho Thầy / Cô Giáo
                </p>
                <p className="text-desc text-teal-800 font-semibold">
                  Đăng học liệu • Quản lý trò chơi và bài giảng theo trường của mình
                </p>
              </div>
            </div>

            <div>
              <label className="block text-main-body font-bold text-slate-800 mb-1.5">
                Họ và tên giáo viên <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-600" />
                <input
                  type="text"
                  required
                  value={teacherName}
                  onChange={(e) => handleTeacherNameChange(e.target.value)}
                  placeholder="Ví dụ: Cô Mai Hương hoặc Thầy Tuấn Anh"
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-input-button font-bold text-slate-800 outline-hidden transition-all"
                />
              </div>

              {/* Thông báo nhận diện trường đã lưu từ hồ sơ của thầy/cô */}
              {detectedSavedSchool && (
                <div className="mt-2 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between gap-2 text-caption-safe">
                  <div className="flex items-center gap-1.5 text-teal-900 font-bold truncate">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span className="truncate">
                      Hồ sơ đã lưu: <strong>{detectedSavedSchool}</strong>
                    </span>
                  </div>
                  {teacherSchool !== detectedSavedSchool && (
                    <button
                      type="button"
                      onClick={() => handleApplySavedSchool(detectedSavedSchool)}
                      className="text-teal-700 hover:text-teal-900 font-black underline shrink-0 cursor-pointer"
                    >
                      Dùng trường này
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* TRƯỜNG HỌC: Cho phép giáo viên tự nhập và chỉnh sửa tên trường */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-main-body font-bold text-slate-800">
                  Trường học <span className="text-rose-500">*</span>
                </label>
                <span className="text-caption-safe text-slate-500 font-semibold">
                  Thầy/cô có thể sửa tên trường
                </span>
              </div>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-600" />
                <input
                  type="text"
                  required
                  value={teacherSchool}
                  onChange={(e) => {
                    setTeacherSchool(e.target.value);
                    setHasManuallyEditedSchool(true);
                    setErrorMsg('');
                  }}
                  placeholder="Nhập tên trường của thầy/cô"
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-input-button font-bold text-slate-800 outline-hidden transition-all"
                />
              </div>
              <p className="text-caption-safe text-slate-500 font-medium mt-1">
                Tên trường sẽ được tự động lưu vào hồ sơ cá nhân và hiển thị lại ở lần đăng nhập sau.
              </p>
            </div>

            <div>
              <label className="block text-main-body font-bold text-slate-800 mb-1.5">
                Mã PIN giáo viên <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-600" />
                <input
                  type={showTeacherPin ? 'text' : 'password'}
                  required
                  value={teacherPin}
                  onChange={(e) => {
                    setTeacherPin(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="Nhập mã PIN giáo viên (Mặc định: 123456)"
                  className="w-full pl-12 pr-12 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-input-button font-bold text-slate-800 outline-hidden tracking-wider transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowTeacherPin(!showTeacherPin)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1.5 cursor-pointer"
                  title={showTeacherPin ? 'Ẩn mã PIN' : 'Hiện mã PIN'}
                >
                  {showTeacherPin ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-input-button shadow-md shadow-teal-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-5 h-5" />
                <span>{isSubmitting ? 'Đang xác thực...' : 'Đăng Nhập Giáo Viên 🔑'}</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* BIỂU MẪU 3: QUẢN TRỊ VIÊN (Admin) */}
        {/* ========================================================= */}
        {selectedRole === 'admin' && (
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-50/80 border border-amber-200">
              <span className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center text-lg shadow-2xs shrink-0">
                👑
              </span>
              <div>
                <p className="text-caption-safe font-black text-amber-950 uppercase tracking-wide">
                  Quản Trị Viên Hệ Thống
                </p>
                <p className="text-desc text-amber-900 font-semibold">
                  Toàn quyền thêm môn học, duyệt giáo viên và kiểm tra CSDL Supabase
                </p>
              </div>
            </div>

            <div>
              <label className="block text-main-body font-bold text-slate-800 mb-1.5">
                Họ tên quản trị viên <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600" />
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Nhập họ tên quản trị viên"
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-amber-50/40 border border-amber-300 text-input-button font-bold text-slate-900 focus:bg-white focus:border-amber-500 outline-hidden shadow-2xs transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-main-body font-bold text-slate-800 mb-1.5">
                Mã PIN <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600" />
                <input
                  type={showAdminPin ? 'text' : 'password'}
                  required
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="Nhập mã PIN quản trị"
                  className="w-full pl-12 pr-12 py-3 rounded-2xl bg-amber-50/40 border border-amber-300 text-input-button font-bold text-slate-900 focus:bg-white focus:border-amber-500 outline-hidden shadow-2xs tracking-wider transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPin(!showAdminPin)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1.5 cursor-pointer"
                  title={showAdminPin ? 'Ẩn mã PIN' : 'Hiện mã PIN'}
                >
                  {showAdminPin ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2 space-y-2.5">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-input-button shadow-md shadow-amber-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>{isSubmitting ? 'Đang kiểm tra...' : 'Đăng Nhập Quản Trị Viên 👑'}</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setIsSubmitting(true);
                  try {
                    await loginWithGoogle();
                    onSuccessNotice('Đăng nhập Google Quản trị thành công!');
                    onClose();
                  } catch (e: any) {
                    setErrorMsg(e.message || 'Lỗi đăng nhập Google');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className="w-full py-3 px-4 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-input-button flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Hoặc Xác Thực Nhanh Bằng Tài Khoản Google</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
