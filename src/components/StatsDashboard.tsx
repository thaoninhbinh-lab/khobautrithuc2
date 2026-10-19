import React, { useState } from 'react';
import { StudyRecord, SubjectType, GradeLevel, UserProfile, AccessLog, LinkItem } from '../types';
import { exportRecordsToCSV, exportAccessLogsToCSV, normalizeResourceType } from '../services/storageService';
import { useAuth } from '../contexts/AuthContext';
import {
  BarChart3,
  Download,
  Users,
  Award,
  BookOpen,
  Search,
  Filter,
  CheckCircle,
  TrendingUp,
  Trash2,
  Calendar,
  School,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  Gamepad2,
  Video,
  Eye,
  UserX,
  Layers,
} from 'lucide-react';

import { LinkVisitStatsSection } from './LinkVisitStatsSection';
import { SupabaseConfigSection } from './SupabaseConfigSection';
import { Database } from 'lucide-react';

interface StatsDashboardProps {
  records: StudyRecord[];
  links: LinkItem[];
  users: UserProfile[];
  accessLogs: AccessLog[];
  onDeleteRecord: (id: string) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateUserApproval?: (userId: string, status: 'approved' | 'rejected' | 'pending') => void;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  records,
  links,
  users,
  accessLogs,
  onDeleteRecord,
  onDeleteUser,
  onUpdateUserApproval,
}) => {
  const { user, isAdmin, isTeacher, isStudent } = useAuth();

  // Chế độ xem:
  // 'item_visits': Thống kê lượt truy cập từng học liệu (Trọng tâm)
  // 'stats': Thống kê tổng quan (Phân bố học sinh & học liệu)
  // 'access_logs': Nhật ký truy cập từng học sinh
  // 'members': Quản lý thành viên (Admin)
  // 'supabase': Cấu hình Supabase & SQL Migration
  const [subTab, setSubTab] = useState<'item_visits' | 'stats' | 'access_logs' | 'members' | 'supabase'>('item_visits');

  // Bộ lọc lượt truy cập
  const [logSearch, setLogSearch] = useState('');
  const [logClass, setLogClass] = useState<string>('all');
  const [logSubject, setLogSubject] = useState<SubjectType | 'all'>('all');
  const [logType, setLogType] = useState<string>('all');

  // Bộ lọc thành viên
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userClassFilter, setUserClassFilter] = useState<string>('all');

  // Xóa thành viên confirmation
  const [deleteCandidate, setDeleteCandidate] = useState<UserProfile | null>(null);

  // 1. TÍNH TOÁN CÁC CHỈ SỐ QUẢN TRỊ YÊU CẦU:
  // - Số lượng tài khoản giáo viên
  const teacherCount = users.filter((u) => u.role === 'teacher').length;
  // - Số lượng tài khoản học sinh
  const studentCount = users.filter((u) => u.role === 'student').length;

  // - Số lượng tài khoản học sinh của mỗi lớp
  const studentsByClass: Record<string, number> = {};
  users
    .filter((u) => u.role === 'student' && u.assignedClass)
    .forEach((u) => {
      const cls = u.assignedClass!.toUpperCase();
      studentsByClass[cls] = (studentsByClass[cls] || 0) + 1;
    });

  const classList = Object.keys(studentsByClass).sort();

  // - Số lượng học liệu theo 3 loại: Trò chơi học tập, Video, Khác
  const gameCount = links.filter((l) => normalizeResourceType(l.resourceType) === 'tro_choi').length;
  const videoCount = links.filter((l) => normalizeResourceType(l.resourceType) === 'video').length;
  const otherCount = links.filter((l) => normalizeResourceType(l.resourceType) === 'khac').length;

  // Tổng số lượt truy cập
  const totalAccessCount = accessLogs.length;

  // Điểm số trung bình
  const avgScore =
    records.length > 0
      ? (records.reduce((acc, r) => acc + r.score, 0) / records.length).toFixed(1)
      : '0.0';

  // Lọc lượt truy cập theo lớp của giáo viên nếu là giáo viên đăng nhập
  const displayedLogs = accessLogs.filter((log) => {
    // Nếu giáo viên có lớp phụ trách cụ thể
    if (isTeacher && !isAdmin && user?.assignedClass && user.assignedClass.includes('Lớp')) {
      const teacherClass = user.assignedClass.replace('Lớp ', '').toUpperCase();
      if (log.className && log.className !== teacherClass) return false;
    }

    if (logSearch.trim()) {
      const q = logSearch.toLowerCase();
      const match =
        log.userName.toLowerCase().includes(q) ||
        log.linkTitle.toLowerCase().includes(q) ||
        (log.className && log.className.toLowerCase().includes(q));
      if (!match) return false;
    }

    if (logClass !== 'all' && log.className !== logClass) return false;
    if (logSubject !== 'all' && log.subject !== logSubject) return false;
    if (logType !== 'all' && log.resourceType !== logType) return false;

    return true;
  });

  // Lọc danh sách thành viên
  const displayedUsers = users.filter((u) => {
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      const match =
        u.displayName.toLowerCase().includes(q) ||
        u.school.toLowerCase().includes(q) ||
        (u.assignedClass && u.assignedClass.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false;
    if (userClassFilter !== 'all' && u.assignedClass !== userClassFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs for Dashboard */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-3 sm:p-4 rounded-3xl border border-emerald-100 shadow-xs">
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-full lg:w-auto overflow-x-auto">
          <button
            onClick={() => setSubTab('item_visits')}
            className={`px-4 py-2.5 rounded-xl text-input-button font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              subTab === 'item_visits'
                ? 'bg-white text-emerald-950 shadow-xs border border-emerald-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📈 Thống Kê Lượt Học Liệu
          </button>

          <button
            onClick={() => setSubTab('stats')}
            className={`px-4 py-2.5 rounded-xl text-input-button font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              subTab === 'stats'
                ? 'bg-white text-emerald-900 shadow-xs border border-emerald-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 Phân Bố Học Sinh
          </button>

          <button
            onClick={() => setSubTab('access_logs')}
            className={`px-4 py-2.5 rounded-xl text-input-button font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              subTab === 'access_logs'
                ? 'bg-white text-teal-900 shadow-xs border border-teal-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📋 Lượt Từng Học Sinh ({accessLogs.length})
          </button>

          {isAdmin && (
            <button
              onClick={() => setSubTab('members')}
              className={`px-4 py-2.5 rounded-xl text-input-button font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                subTab === 'members'
                  ? 'bg-white text-amber-900 shadow-xs border border-amber-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              👥 Thành Viên ({users.length})
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setSubTab('supabase')}
              className={`px-4 py-2.5 rounded-xl text-input-button font-black transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                subTab === 'supabase'
                  ? 'bg-white text-teal-950 shadow-xs border border-teal-300'
                  : 'text-teal-800 hover:text-teal-950 bg-teal-50/50'
              }`}
            >
              <span>⚡ Supabase & SQL</span>
            </button>
          )}
        </div>

        {subTab === 'access_logs' && (
          <button
            onClick={() => exportAccessLogsToCSV(displayedLogs)}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-input-button flex items-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Download className="w-5 h-5" />
            <span>Xuất Excel Lượt Truy Cập</span>
          </button>
        )}

        {subTab === 'stats' && (
          <button
            onClick={() => exportRecordsToCSV(records)}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-input-button flex items-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Download className="w-5 h-5" />
            <span>Xuất Báo Cáo Điểm Số</span>
          </button>
        )}
      </div>

      {/* ========================================================= */}
      {/* TAB 0: THỐNG KÊ LƯỢT TRUY CẬP HỌC LIỆU (TRỌNG TÂM YÊU CẦU) */}
      {/* ========================================================= */}
      {subTab === 'item_visits' && (
        <LinkVisitStatsSection
          links={links}
          accessLogs={accessLogs}
          currentUser={user}
          isAdmin={isAdmin}
          isTeacher={isTeacher}
          onOpenSupabaseTab={() => setSubTab('supabase')}
        />
      )}

      {/* ========================================================= */}
      {/* TAB 4: CẤU HÌNH SUPABASE & SQL MIGRATION (CHỈ ADMIN) */}
      {/* ========================================================= */}
      {subTab === 'supabase' && isAdmin && (
        <SupabaseConfigSection />
      )}

      {/* ========================================================= */}
      {/* TAB 1: THỐNG KÊ TỔNG QUAN (4 THẺ CHÍNH + BIỂU ĐỒ) */}
      {/* ========================================================= */}
      {subTab === 'stats' && (
        <div className="space-y-6">
          {/* 4 Chỉ số cốt lõi yêu cầu trong phần I */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* 1. Số lượng tài khoản giáo viên */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-teal-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center text-xl mb-3">
                  <GraduationCap className="w-6 h-6 text-teal-600" />
                </div>
                <p className="text-stat font-bold text-slate-500">Số tài khoản Giáo viên</p>
                <p className="text-3xl sm:text-4xl font-black text-slate-900 mt-1">
                  {teacherCount} <span className="text-main-body font-bold text-teal-700">thầy cô</span>
                </p>
              </div>
              <p className="text-caption-safe text-slate-400 font-semibold mt-2">Đang giảng dạy hệ thống</p>
            </div>

            {/* 2. Số lượng tài khoản học sinh */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl mb-3">
                  <Users className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="text-stat font-bold text-slate-500">Số tài khoản Học sinh</p>
                <p className="text-3xl sm:text-4xl font-black text-emerald-700 mt-1">
                  {studentCount} <span className="text-main-body font-bold text-slate-500">em học sinh</span>
                </p>
              </div>
              <p className="text-caption-safe text-slate-400 font-semibold mt-2">Tham gia các khối lớp</p>
            </div>

            {/* 3. Số lượng học liệu theo từng loại */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-purple-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center text-xl mb-3">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-stat font-bold text-slate-500">Tổng số học liệu</p>
                <p className="text-3xl sm:text-4xl font-black text-purple-700 mt-1">
                  {links.length} <span className="text-main-body font-bold text-slate-500">học liệu</span>
                </p>
              </div>
              <div className="mt-2 text-caption-safe font-bold text-slate-600 flex flex-wrap gap-1.5">
                <span className="text-emerald-700">🎮 {gameCount} Trò chơi</span> •{' '}
                <span className="text-rose-600">🎥 {videoCount} Video</span> •{' '}
                <span className="text-sky-700">📁 {otherCount} Khác</span>
              </div>
            </div>

            {/* 4. Tổng số lượt truy cập vào từng học liệu */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-amber-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl mb-3">
                  <Eye className="w-6 h-6 text-amber-600" />
                </div>
                <p className="text-stat font-bold text-slate-500">Tổng lượt truy cập học liệu</p>
                <p className="text-3xl sm:text-4xl font-black text-amber-600 mt-1">
                  {totalAccessCount} <span className="text-main-body font-bold text-slate-500">lượt mở bài</span>
                </p>
              </div>
              <p className="text-caption-safe font-semibold text-slate-500 mt-2">
                Điểm trung bình: <strong className="text-teal-700 text-stat">{avgScore}/10</strong>
              </p>
            </div>
          </div>

          {/* Biểu đồ phân bố: Số lượng tài khoản học sinh của mỗi lớp & Học liệu */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cột học sinh mỗi lớp */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-100 shadow-xs">
              <h3 className="text-title-section text-slate-900 mb-4 flex items-center gap-2.5">
                <Users className="w-6 h-6 text-emerald-600" />
                Số lượng tài khoản học sinh của mỗi lớp
              </h3>

              <div className="space-y-3.5">
                {classList.length === 0 ? (
                  <p className="text-desc text-slate-400">Chưa có học sinh nào đăng nhập.</p>
                ) : (
                  classList.map((cls) => {
                    const count = studentsByClass[cls] || 0;
                    const maxInClass = Math.max(...Object.values(studentsByClass), 1);
                    const pct = Math.round((count / maxInClass) * 100);

                    return (
                      <div key={cls}>
                        <div className="flex justify-between text-main-body font-bold mb-1">
                          <span className="text-slate-800 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                            Lớp {cls}
                          </span>
                          <span className="text-emerald-700">{count} học sinh</span>
                        </div>
                        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Phân bố loại học liệu: 2 loại Trò chơi học tập và Video */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-100 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-title-section text-slate-900 mb-4 flex items-center gap-2.5">
                  <Layers className="w-6 h-6 text-emerald-600" />
                  Số lượng học liệu theo 2 dạng học liệu
                </h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-main-body font-bold mb-1">
                      <span className="text-emerald-800">🎮 Trò chơi học tập</span>
                      <span>{gameCount} bài ({links.length ? Math.round((gameCount / links.length) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${links.length ? (gameCount / links.length) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-main-body font-bold mb-1">
                      <span className="text-rose-700">🎥 Video Bài Học</span>
                      <span>{videoCount} video ({links.length ? Math.round((videoCount / links.length) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${links.length ? (videoCount / links.length) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-5 flex items-center justify-between text-main-body font-bold text-slate-700">
                <span>💻 Tin học: {links.filter((l) => l.subject === 'tinhoc').length} bài</span>
                <span>⚙️ Công nghệ: {links.filter((l) => l.subject === 'congnghe').length} bài</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CHI TIẾT SỐ LƯỢT TRUY CẬP VÀO TỪNG HỌC LIỆU VỚI TỪNG HỌC SINH */}
      {/* ========================================================= */}
      {subTab === 'access_logs' && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-100 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-title-section text-slate-900 flex items-center gap-2.5">
                <Eye className="w-6 h-6 text-teal-600" />
                Chi tiết số lượt truy cập vào từng học liệu với từng học sinh
              </h3>
              <p className="text-desc text-slate-600 font-semibold mt-1">
                Ghi nhận từng hành động mở bài, chơi game và điểm số của học sinh
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Tìm tên học sinh, bài học..."
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-input-button font-semibold text-slate-800 outline-hidden"
              />
            </div>

            <select
              value={logClass}
              onChange={(e) => setLogClass(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-input-button font-bold text-slate-700 outline-hidden"
            >
              <option value="all">Tất cả lớp</option>
              {classList.map((c) => (
                <option key={c} value={c}>
                  Lớp {c}
                </option>
              ))}
            </select>

            <select
              value={logSubject}
              onChange={(e) => setLogSubject(e.target.value as any)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-input-button font-bold text-slate-700 outline-hidden"
            >
              <option value="all">Tất cả môn học</option>
              <option value="tinhoc">💻 Tin học</option>
              <option value="congnghe">⚙️ Công nghệ</option>
            </select>

            <select
              value={logType}
              onChange={(e) => setLogType(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-input-button font-bold text-slate-700 outline-hidden"
            >
              <option value="all">Tất cả loại học liệu</option>
              <option value="quizizz">⚡ Game Quizizz</option>
              <option value="game_tuongtac">🎮 Game Tương tác</option>
              <option value="video">🎥 Video Bài học</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-main-body">
              <thead className="bg-teal-50/70 text-teal-950 font-black border-b border-teal-100">
                <tr>
                  <th className="py-3.5 px-3 whitespace-nowrap">Thời gian</th>
                  <th className="py-3.5 px-4">Họ và tên học sinh</th>
                  <th className="py-3.5 px-3">Lớp</th>
                  <th className="py-3.5 px-4">Trường học</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Tên học liệu đã truy cập</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Môn & Khối</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Loại học liệu</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">Hành động</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">Điểm số</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-desc">
                {displayedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400 font-bold text-main-body">
                      Không có lượt truy cập nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  displayedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap text-caption-safe">
                        {new Date(log.timestamp).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900 text-main-body">{log.userName}</td>
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-1 rounded-md font-bold bg-teal-50 text-teal-800 border border-teal-200 text-caption-safe">
                          {log.className || '-'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-caption-safe truncate max-w-[140px]">
                        {log.school || '-'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 text-main-body max-w-xs truncate" title={log.linkTitle}>
                        {log.linkTitle}
                      </td>
                      <td className="py-3.5 px-3 text-slate-700 font-bold whitespace-nowrap text-caption-safe">
                        {log.subject === 'tinhoc' ? 'Tin học' : 'Công nghệ'} {log.grade}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-md text-caption-safe font-bold ${
                            log.resourceType === 'quizizz'
                              ? 'bg-purple-100 text-purple-800'
                              : log.resourceType === 'video'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {log.resourceType === 'quizizz'
                            ? '⚡ Quizizz'
                            : log.resourceType === 'video'
                            ? '🎥 Video'
                            : '🎮 Tương tác'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-caption-safe font-black ${
                            log.action === 'submit_score'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {log.action === 'submit_score' ? '🏆 Báo điểm' : '👀 Mở xem bài'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-black">
                        {log.score !== undefined ? (
                          <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md text-main-body">
                            {log.score}/10
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: QUẢN LÝ & XÓA THÀNH VIÊN (CHỨC NĂNG QUẢN TRỊ) */}
      {/* ========================================================= */}
      {subTab === 'members' && isAdmin && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-100 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-title-section text-slate-900 flex items-center gap-2.5">
                <Users className="w-6 h-6 text-amber-600" />
                Quản lý & Xóa thành viên hệ thống
              </h3>
              <p className="text-desc text-slate-600 font-semibold mt-1">
                Hệ thống tự động thêm người dùng khi đăng nhập. Quản trị viên có toàn quyền xóa tài khoản.
              </p>
            </div>

            <div className="text-caption-safe font-black px-4 py-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-200">
              Tổng số: {users.length} tài khoản ({teacherCount} Giáo viên, {studentCount} Học sinh)
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Tìm tên, trường học..."
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-input-button font-semibold text-slate-800 outline-hidden"
              />
            </div>

            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-input-button font-bold text-slate-700 outline-hidden"
            >
              <option value="all">Tất cả nhóm người dùng</option>
              <option value="teacher">📚 Giáo viên ({teacherCount})</option>
              <option value="student">🎒 Học sinh ({studentCount})</option>
              <option value="admin">👑 Quản trị viên</option>
            </select>

            <select
              value={userClassFilter}
              onChange={(e) => setUserClassFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-input-button font-bold text-slate-700 outline-hidden"
            >
              <option value="all">Tất cả lớp</option>
              {classList.map((c) => (
                <option key={c} value={c}>
                  Lớp {c}
                </option>
              ))}
            </select>
          </div>

          {/* Members Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-main-body">
              <thead className="bg-amber-50/70 text-amber-950 font-black border-b border-amber-100">
                <tr>
                  <th className="py-3.5 px-4">Họ và tên</th>
                  <th className="py-3.5 px-3">Nhóm tài khoản</th>
                  <th className="py-3.5 px-3">Email / Liên hệ</th>
                  <th className="py-3.5 px-3">Lớp</th>
                  <th className="py-3.5 px-4">Trường học</th>
                  <th className="py-3.5 px-3">Trạng thái duyệt</th>
                  <th className="py-3.5 px-3 text-center">Phê duyệt GV</th>
                  <th className="py-3.5 px-3 text-center">Xóa thành viên</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-main-body">
                {displayedUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-black text-slate-900 flex items-center gap-2.5 text-main-body">
                      <span className="text-xl">
                        {u.role === 'admin' ? '👑' : u.role === 'teacher' ? '📚' : '🎒'}
                      </span>
                      <span>{u.displayName}</span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-3 py-1 rounded-lg font-bold text-caption-safe ${
                          u.role === 'admin'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : u.role === 'teacher'
                            ? 'bg-teal-100 text-teal-900 border border-teal-300'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}
                      >
                        {u.role === 'admin'
                          ? 'Quản trị viên'
                          : u.role === 'teacher'
                          ? 'Giáo viên'
                          : 'Học sinh'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 text-caption-safe">
                      {u.email || '-'}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-slate-800 text-main-body">
                      {u.assignedClass || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-caption-safe">{u.school || '-'}</td>
                    <td className="py-3.5 px-3">
                      {u.role === 'student' ? (
                        <span className="px-3 py-1 rounded-full text-caption-safe font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ✅ Tự động duyệt
                        </span>
                      ) : u.role === 'teacher' ? (
                        u.approvalStatus === 'approved' ? (
                          <span className="px-3 py-1 rounded-full text-caption-safe font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ✅ Đã phê duyệt
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-caption-safe font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                            ⏳ Chờ Admin duyệt
                          </span>
                        )
                      ) : (
                        <span className="px-3 py-1 rounded-full text-caption-safe font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          👑 Quản trị tối cao
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {u.role === 'teacher' && onUpdateUserApproval ? (
                        u.approvalStatus === 'approved' ? (
                          <button
                            onClick={() => onUpdateUserApproval(u.uid, 'pending')}
                            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-caption-safe border border-amber-200 transition-colors cursor-pointer"
                            title="Tạm ngừng hoặc thu hồi quyền giáo viên"
                          >
                            Thu hồi
                          </button>
                        ) : (
                          <button
                            onClick={() => onUpdateUserApproval(u.uid, 'approved')}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-caption-safe shadow-xs transition-colors cursor-pointer"
                            title="Phê duyệt tài khoản giáo viên ngay"
                          >
                            ✓ Duyệt ngay
                          </button>
                        )
                      ) : (
                        <span className="text-slate-300 text-caption-safe">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {u.role !== 'admin' ? (
                        <button
                          onClick={() => setDeleteCandidate(u)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-caption-safe transition-colors cursor-pointer inline-flex items-center gap-1.5"
                          title="Xóa tài khoản này khỏi hệ thống"
                        >
                          <UserX className="w-4 h-4" />
                          <span>Xóa</span>
                        </button>
                      ) : (
                        <span className="text-slate-300 text-caption-safe">Không thể xóa</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-2xl border border-rose-100 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 text-2xl">
              <UserX className="w-7 h-7" />
            </div>
            <h3 className="text-card-title font-black text-slate-900">Xác Nhận Xóa Thành Viên</h3>
            <p className="text-desc text-slate-600 mt-2 mb-5 leading-relaxed">
              Bạn có chắc chắn muốn xóa tài khoản <strong>"{deleteCandidate.displayName}"</strong> (
              {deleteCandidate.role === 'teacher' ? 'Giáo viên' : 'Học sinh'} - {deleteCandidate.school}) khỏi hệ thống?
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-input-button hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  onDeleteUser(deleteCandidate.uid);
                  setDeleteCandidate(null);
                }}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-input-button shadow-md shadow-rose-600/20 active:scale-95 transition-all cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
