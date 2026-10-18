import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  BarChart3,
  HelpCircle,
  LogIn,
  LogOut,
  Plus,
  UserCheck,
  ChevronDown,
  Layers,
  GraduationCap,
  Users,
  ArrowLeft,
  Database,
} from 'lucide-react';

interface HeaderProps {
  currentTab: 'resources' | 'student-corner' | 'stats' | 'guide' | 'supabase';
  onTabChange: (tab: 'resources' | 'student-corner' | 'stats' | 'guide' | 'supabase') => void;
  onOpenAddModal: () => void;
  onOpenSharedModal: () => void;
  onOpenRoleLogin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  onOpenAddModal,
  onOpenRoleLogin,
}) => {
  const {
    user,
    isAuthenticated,
    isAdmin,
    isTeacher,
    isStudent,
    isFirebaseConfigured,
    logout,
  } = useAuth();

  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100/80 shadow-2xs">
      {/* Top Banner if in LocalStorage Mode - Chỉ hiển thị cho Quản trị viên */}
      {!isFirebaseConfigured && isAdmin && (
        <div className="bg-amber-500/10 border-b border-amber-200 text-amber-900 px-4 py-2 text-caption-safe text-center flex items-center justify-center gap-2 font-medium">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
          <span>
            Hệ thống đang hoạt động ở chế độ <strong>Lưu trữ Cục bộ (LocalStorage)</strong>. Tự động lưu tài khoản và học liệu an toàn!
          </span>
          <button
            onClick={() => onTabChange('guide')}
            className="underline hover:text-amber-700 ml-1 font-bold cursor-pointer text-caption-safe"
          >
            Hướng dẫn Deploy Vercel
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Bên trái: Nút quay lại nếu đang ở các tab quản trị / hướng dẫn / lịch sử, tự động căn chỉnh */}
          {currentTab !== 'resources' ? (
            <button
              onClick={() => onTabChange('resources')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-input-button border border-emerald-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Trở về Trang Chủ</span>
            </button>
          ) : (
            <div className="flex-1" />
          )}

          {/* Góc trên bên phải: Nút Đăng nhập & Menu Tài khoản */}
          <div className="flex items-center gap-2 sm:gap-3.5 flex-wrap">
            {/* Nút Cấu hình Supabase chỉ hiển thị với tài khoản Admin */}
            {isAuthenticated && isAdmin && (
              <button
                onClick={() => onTabChange('supabase')}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-input-button font-black transition-all cursor-pointer shadow-2xs ${
                  currentTab === 'supabase'
                    ? 'bg-gradient-to-r from-teal-700 to-emerald-700 text-white shadow-xs'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}
                title="Xem và quản lý cơ sở dữ liệu Supabase, kiểm tra 5 bảng và đồng bộ dữ liệu"
              >
                <Database className={`w-4 h-4 sm:w-5 sm:h-5 ${currentTab === 'supabase' ? 'text-white' : 'text-emerald-700'}`} />
                <span>⚡ Cấu hình Supabase</span>
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </button>
            )}

            {/* Phím tắt Thống kê (hiển thị cho Admin và Giáo viên) */}
            {isAuthenticated && (isAdmin || isTeacher) && (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => onTabChange('stats')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-input-button font-bold transition-all cursor-pointer ${
                    currentTab === 'stats'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200'
                  }`}
                  title={isAdmin ? 'Thống kê Quản trị & Lượt truy cập' : 'Thống kê học liệu của tôi'}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>{isAdmin ? 'Thống Kê' : 'Thống Kê Của Tôi'}</span>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => onTabChange('guide')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-input-button font-bold transition-all cursor-pointer ${
                      currentTab === 'guide'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200'
                    }`}
                    title="Hướng dẫn Deploy Vercel"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Deploy</span>
                  </button>
                )}
              </div>
            )}

            {/* Nút Thêm Học Liệu (khi là giáo viên hoặc admin) */}
            {isAuthenticated && (isAdmin || isTeacher) && (
              <button
                onClick={onOpenAddModal}
                className="flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-input-button shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
                <span className="hidden sm:inline">Thêm Học Liệu</span>
                <span className="sm:hidden">Thêm</span>
              </button>
            )}

            {/* Profile / Nút Đăng Nhập tại góc trên bên phải */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2.5 p-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-white border border-emerald-200 hover:border-emerald-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                >
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm sm:text-base font-extrabold border ${
                      user.role === 'admin'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : user.role === 'teacher'
                        ? 'bg-teal-100 text-teal-900 border-teal-300'
                        : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    }`}
                  >
                    {user.role === 'admin' ? '👑' : user.role === 'teacher' ? '📚' : '🎒'}
                  </div>

                  <div className="hidden sm:block text-left">
                    <p className="text-base sm:text-[17px] font-black text-slate-900 line-clamp-1 leading-tight">
                      {user.displayName}
                    </p>
                    <p className="text-caption-safe font-bold text-emerald-700 leading-none mt-0.5">
                      {user.role === 'admin'
                        ? '👑 Quản trị viên'
                        : user.role === 'teacher'
                        ? `📚 GV • ${user.school}`
                        : `🎒 Lớp ${user.assignedClass} • ${user.school}`}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
                </button>

                {showUserMenu && (
                  <div
                    className="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-emerald-100 py-3 z-50 animate-in fade-in zoom-in-95 duration-150"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <div className="px-5 py-3.5 border-b border-slate-100 bg-emerald-50/50">
                      <p className="text-base font-black text-slate-900">{user.displayName}</p>
                      <p className="text-caption-safe text-slate-600 font-semibold mt-0.5">
                        🏫 {user.school}
                      </p>
                      {user.assignedClass && (
                        <p className="text-caption-safe text-slate-600 font-semibold mt-0.5">
                          Lớp: {user.assignedClass}
                        </p>
                      )}
                      <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-caption-safe font-bold bg-emerald-100 text-emerald-900">
                        <UserCheck className="w-4 h-4" />
                        {user.role === 'admin'
                          ? 'Tài khoản Quản trị viên'
                          : user.role === 'teacher'
                          ? 'Tài khoản Giáo viên'
                          : 'Tài khoản Học sinh'}
                      </div>
                    </div>

                    <div className="py-2 text-input-button font-bold text-slate-700">
                      <button
                        onClick={() => onTabChange('resources')}
                        className="w-full px-5 py-2.5 text-left hover:bg-emerald-50 flex items-center gap-2.5 cursor-pointer text-input-button"
                      >
                        <Layers className="w-4 h-4 text-emerald-600" />
                        Kho học liệu
                      </button>

                      <button
                        onClick={() => onTabChange('student-corner')}
                        className="w-full px-5 py-2.5 text-left hover:bg-emerald-50 flex items-center gap-2.5 cursor-pointer text-input-button"
                      >
                        <GraduationCap className="w-4 h-4 text-amber-500" />
                        {isStudent ? 'Lịch sử học tập của em' : 'Góc học sinh'}
                      </button>

                      {isAdmin ? (
                        <>
                          <button
                            onClick={() => onTabChange('stats')}
                            className="w-full px-5 py-2.5 text-left hover:bg-emerald-50 flex items-center gap-2.5 cursor-pointer text-input-button"
                          >
                            <BarChart3 className="w-4 h-4 text-teal-600" />
                            Quản trị hệ thống & Thống kê
                          </button>

                          <button
                            onClick={() => onTabChange('guide')}
                            className="w-full px-5 py-2.5 text-left hover:bg-emerald-50 flex items-center gap-2.5 cursor-pointer text-input-button"
                          >
                            <HelpCircle className="w-4 h-4 text-sky-600" />
                            Hướng dẫn Deploy Vercel
                          </button>
                        </>
                      ) : isTeacher ? (
                        <button
                          onClick={() => onTabChange('stats')}
                          className="w-full px-5 py-2.5 text-left hover:bg-emerald-50 flex items-center gap-2.5 cursor-pointer text-input-button"
                        >
                          <BarChart3 className="w-4 h-4 text-teal-600" />
                          Thống kê lượt học liệu của tôi
                        </button>
                      ) : null}

                      <button
                        onClick={onOpenRoleLogin}
                        className="w-full px-5 py-2.5 text-left hover:bg-emerald-50 text-emerald-800 flex items-center gap-2.5 cursor-pointer border-t border-slate-100 mt-1.5 text-input-button"
                      >
                        <Users className="w-4 h-4 text-emerald-600" />
                        Đổi nhóm tài khoản đăng nhập
                      </button>
                    </div>

                    <div className="border-t border-slate-100 pt-1.5">
                      <button
                        onClick={logout}
                        className="w-full px-5 py-2.5 text-left text-input-button font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        Đăng xuất tài khoản
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Nút Đăng Nhập gọn gàng, hiện đại, tông màu xanh lá tại góc trên bên phải */
              <button
                onClick={onOpenRoleLogin}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-input-button shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
              >
                <LogIn className="w-5 h-5" />
                <span>Đăng Nhập</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
