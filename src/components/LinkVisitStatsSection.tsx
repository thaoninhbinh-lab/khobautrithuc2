import React, { useState, useMemo } from 'react';
import { LinkItem, AccessLog, UserProfile, SubjectType, GradeLevel } from '../types';
import {
  computeLinkVisitStats,
  exportLinkStatsToCSV,
  LinkVisitAggregatedStat,
} from '../services/supabaseService';
import { getSupabaseConfig, testSupabaseConnection } from '../supabase/client';
import { normalizeResourceType, normalizeSubjectName } from '../services/storageService';
import {
  Eye,
  BookOpen,
  Calendar,
  TrendingUp,
  Sparkles,
  Search,
  Filter,
  Download,
  ExternalLink,
  Clock,
  ArrowUpDown,
  CheckCircle,
  Database,
  Flame,
  User,
  School,
  Layers,
  Activity,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface LinkVisitStatsSectionProps {
  links: LinkItem[];
  accessLogs: AccessLog[];
  currentUser: UserProfile | null;
  isAdmin: boolean;
  isTeacher: boolean;
  onOpenSupabaseTab: () => void;
  onRefreshData?: () => void;
}

export const LinkVisitStatsSection: React.FC<LinkVisitStatsSectionProps> = ({
  links,
  accessLogs,
  currentUser,
  isAdmin,
  isTeacher,
  onOpenSupabaseTab,
  onRefreshData,
}) => {
  // Bộ lọc phạm vi (đối với giáo viên: mặc định xem bài của chính mình)
  const [scope, setScope] = useState<'my_links' | 'all'>(
    isTeacher && !isAdmin ? 'my_links' : 'all'
  );

  // Bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<SubjectType | 'all'>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [sortBy, setSortBy] = useState<
    'total' | 'today' | '7days' | '30days' | 'latest' | 'title' | 'date'
  >('total');

  // Trạng thái Supabase
  const supaConfig = getSupabaseConfig();
  const [checkingSupa, setCheckingSupa] = useState(false);
  const [supaStatusMsg, setSupaStatusMsg] = useState<string | null>(null);

  const handleQuickCheckSupa = async () => {
    setCheckingSupa(true);
    const res = await testSupabaseConnection();
    setSupaStatusMsg(res.message);
    setCheckingSupa(false);
  };

  // 1. Lọc danh sách links theo vai trò người dùng (Giáo viên xem bài của mình)
  const scopedLinks = useMemo(() => {
    if (scope === 'my_links' && currentUser) {
      return links.filter(
        (l) =>
          l.creatorId === currentUser.uid ||
          (l.creatorName &&
            currentUser.displayName &&
            l.creatorName.trim().toLowerCase() === currentUser.displayName.trim().toLowerCase())
      );
    }
    return links;
  }, [links, scope, currentUser]);

  // 2. Tính toán thống kê theo danh sách bài học và access logs thực tế
  const {
    stats: allStats,
    totalVisits,
    todayTotalVisits,
    last7DaysTotalVisits,
    last30DaysTotalVisits,
  } = useMemo(() => {
    return computeLinkVisitStats(scopedLinks, accessLogs);
  }, [scopedLinks, accessLogs]);

  // 3. Lọc và sắp xếp bảng
  const filteredAndSortedStats = useMemo(() => {
    let result = allStats.filter((item) => {
      // Tìm kiếm theo tên học liệu, giáo viên
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchCreator = item.creatorName.toLowerCase().includes(q);
        const matchSchool = (item.creatorSchool || '').toLowerCase().includes(q);
        if (!matchTitle && !matchCreator && !matchSchool) return false;
      }

      // Lọc môn học
      if (selectedSubject !== 'all' && item.subject !== selectedSubject) {
        return false;
      }

      // Lọc khối lớp
      if (selectedGrade !== 'all') {
        const gNum = parseInt(selectedGrade, 10);
        if (item.grade !== gNum) return false;
      }

      // Lọc loại học liệu
      if (selectedType !== 'all') {
        const norm = normalizeResourceType(item.resourceType);
        if (selectedType === 'tro_choi' && norm !== 'tro_choi') return false;
        if (selectedType === 'video' && norm !== 'video') return false;
        if (selectedType === 'khac' && norm !== 'khac') return false;
        if (selectedType === 'quizizz' && item.resourceType !== 'quizizz') return false;
        if (selectedType === 'game_tuongtac' && item.resourceType !== 'game_tuongtac') return false;
      }

      // Lọc khoảng thời gian có truy cập
      if (timeFilter === 'today' && item.todayVisits === 0) return false;
      if (timeFilter === '7days' && item.last7DaysVisits === 0) return false;
      if (timeFilter === '30days' && item.last30DaysVisits === 0) return false;

      return true;
    });

    // Sắp xếp
    result.sort((a, b) => {
      switch (sortBy) {
        case 'total':
          return b.totalVisits - a.totalVisits;
        case 'today':
          return b.todayVisits - a.todayVisits;
        case '7days':
          return b.last7DaysVisits - a.last7DaysVisits;
        case '30days':
          return b.last30DaysVisits - a.last30DaysVisits;
        case 'latest': {
          const timeA = a.lastVisitedAt ? new Date(a.lastVisitedAt).getTime() : 0;
          const timeB = b.lastVisitedAt ? new Date(b.lastVisitedAt).getTime() : 0;
          return timeB - timeA;
        }
        case 'title':
          return a.title.localeCompare(b.title, 'vi');
        case 'date': {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        }
        default:
          return b.totalVisits - a.totalVisits;
      }
    });

    return result;
  }, [allStats, searchTerm, selectedSubject, selectedGrade, selectedType, timeFilter, sortBy]);

  // Phân trang khi dữ liệu lớn
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Reset về trang 1 khi thay đổi bộ lọc hoặc tìm kiếm
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSubject, selectedGrade, selectedType, timeFilter, sortBy, scope]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedStats.length / pageSize));
  const paginatedStats = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedStats.slice(start, start + pageSize);
  }, [filteredAndSortedStats, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Supabase Status Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-3xl p-5 shadow-lg border border-emerald-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black">
                {isTeacher && !isAdmin
                  ? 'Báo Cáo Lượt Truy Cập Học Liệu Của Giáo Viên'
                  : 'Hệ Thống Thống Kê Lượt Truy Cập Học Liệu Máy Chủ'}
              </h3>
              {supaConfig.isConfigured ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-400/20 text-emerald-300 border border-emerald-400/40">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Supabase Cloud Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  Đồng bộ Firebase / Cục bộ
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-200/80 mt-1">
              Dữ liệu lưu trữ bền vững trên máy chủ đám mây, tự động cập nhật thời gian thực khi học sinh mở bài làm bài.
            </p>
            {supaStatusMsg && (
              <p className="text-xs font-bold text-amber-200 mt-1 bg-black/20 px-2 py-0.5 rounded-md inline-block">
                ℹ️ {supaStatusMsg}
              </p>
            )}
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <button
              onClick={handleQuickCheckSupa}
              disabled={checkingSupa}
              className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-white/10"
              title="Kiểm tra kết nối Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checkingSupa ? 'animate-spin' : ''}`} />
              <span>{checkingSupa ? 'Đang kiểm tra...' : 'Test Kết Nối'}</span>
            </button>

            <button
              onClick={onOpenSupabaseTab}
              className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Activity className="w-4 h-4" />
              <span>Cấu Hình & SQL Migration</span>
            </button>
          </div>
        )}
      </div>

      {/* Scope Switcher for Teachers */}
      {isTeacher && !isAdmin && (
        <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-emerald-100 shadow-2xs">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-black text-slate-800">
              Phạm vi thống kê của Thầy/Cô:
            </span>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setScope('my_links')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                scope === 'my_links'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Học liệu của tôi ({links.filter((l) => l.creatorId === currentUser?.uid).length})
            </button>
            <button
              onClick={() => setScope('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                scope === 'all'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Toàn bộ học liệu ({links.length})
            </button>
          </div>
        </div>
      )}

      {/* 5 CHỈ SỐ THỐNG KÊ TỔNG QUAN THEO YÊU CẦU */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Tổng số lượt truy cập */}
        <div className="bg-white rounded-3xl p-5 border border-amber-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
              <Eye className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-caption-safe font-bold text-slate-500 uppercase tracking-wider">
              {isTeacher && scope === 'my_links' ? 'Lượt Bài Của Tôi' : 'Tổng Lượt Truy Cập'}
            </p>
            <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">
              {totalVisits.toLocaleString('vi-VN')}
            </p>
          </div>
          <p className="text-caption-safe font-semibold text-slate-400 mt-2">
            Tích lũy từ trước đến nay
          </p>
        </div>

        {/* 2. Tổng số học liệu hiện có */}
        <div className="bg-white rounded-3xl p-5 border border-purple-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-caption-safe font-bold text-slate-500 uppercase tracking-wider">
              {isTeacher && scope === 'my_links' ? 'Học Liệu Đã Đăng' : 'Tổng Số Học Liệu'}
            </p>
            <p className="text-2xl sm:text-3xl font-black text-purple-700 mt-1">
              {scopedLinks.length.toLocaleString('vi-VN')}
            </p>
          </div>
          <p className="text-caption-safe font-semibold text-slate-400 mt-2">
            Đang hoạt động trên web
          </p>
        </div>

        {/* 3. Lượt truy cập hôm nay */}
        <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
              <Calendar className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-caption-safe font-bold text-slate-500 uppercase tracking-wider">
              Lượt Hôm Nay
            </p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">
              {todayTotalVisits.toLocaleString('vi-VN')}
            </p>
          </div>
          <p className="text-caption-safe font-bold text-emerald-600 mt-2 flex items-center gap-1">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Từ 00:00 hôm nay</span>
          </p>
        </div>

        {/* 4. Lượt truy cập trong 7 ngày gần nhất */}
        <div className="bg-white rounded-3xl p-5 border border-teal-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-teal-600" />
            </div>
            <p className="text-caption-safe font-bold text-slate-500 uppercase tracking-wider">
              7 Ngày Gần Nhất
            </p>
            <p className="text-2xl sm:text-3xl font-black text-teal-700 mt-1">
              {last7DaysTotalVisits.toLocaleString('vi-VN')}
            </p>
          </div>
          <p className="text-caption-safe font-semibold text-slate-400 mt-2">
            1 tuần vừa qua
          </p>
        </div>

        {/* 5. Lượt truy cập trong 30 ngày gần nhất */}
        <div className="bg-white rounded-3xl p-5 border border-sky-100 shadow-xs flex flex-col justify-between col-span-2 lg:col-span-1">
          <div>
            <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-sky-600" />
            </div>
            <p className="text-caption-safe font-bold text-slate-500 uppercase tracking-wider">
              30 Ngày Gần Nhất
            </p>
            <p className="text-2xl sm:text-3xl font-black text-sky-700 mt-1">
              {last30DaysTotalVisits.toLocaleString('vi-VN')}
            </p>
          </div>
          <p className="text-caption-safe font-semibold text-slate-400 mt-2">
            1 tháng vừa qua
          </p>
        </div>
      </div>

      {/* FILTER, SEARCH VÀ XUẤT EXCEL CHO BẢNG HỌC LIỆU */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-100 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-title-section text-slate-900 flex items-center gap-2.5">
              <Layers className="w-6 h-6 text-emerald-600" />
              Bảng Thống Kê Chi Tiết Từng Học Liệu
            </h3>
            <p className="text-desc text-slate-600 font-semibold mt-1">
              Hiển thị số lượt truy cập hôm nay, 7 ngày, 30 ngày và tổng lượt của từng bài học
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => exportLinkStatsToCSV(filteredAndSortedStats)}
              className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-input-button flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4.5 h-4.5" />
              <span>Xuất Excel Thống Kê ({filteredAndSortedStats.length})</span>
            </button>
          </div>
        </div>

        {/* Thanh tìm kiếm và bộ lọc */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Ô tìm kiếm */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm tên học liệu, giáo viên, trường..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-input-button font-semibold outline-hidden focus:border-emerald-500 focus:bg-white text-slate-800"
            />
          </div>

          {/* Lọc Môn học */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value as any)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-input-button font-bold text-slate-700 outline-hidden"
          >
            <option value="all">Tất cả môn học</option>
            <option value="tinhoc">💻 Tin học</option>
            <option value="congnghe">⚙️ Công nghệ</option>
            <option value="khac">📦 Môn khác</option>
          </select>

          {/* Lọc Khối lớp */}
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-input-button font-bold text-slate-700 outline-hidden"
          >
            <option value="all">Tất cả khối lớp</option>
            <option value="3">Khối 3</option>
            <option value="4">Khối 4</option>
            <option value="5">Khối 5</option>
            <option value="0">Chung mọi khối</option>
          </select>

          {/* Lọc Loại học liệu */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-input-button font-bold text-slate-700 outline-hidden"
          >
            <option value="all">Tất cả loại bài</option>
            <option value="tro_choi">🎮 Trò chơi tương tác</option>
            <option value="video">🎥 Video bài học</option>
            <option value="khac">📁 Khác</option>
          </select>

          {/* Sắp xếp */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-input-button font-bold text-slate-700 outline-hidden"
          >
            <option value="total">🔥 Tổng lượt (Nhiều nhất)</option>
            <option value="today">⚡ Lượt hôm nay (Cao nhất)</option>
            <option value="7days">📈 Lượt 7 ngày (Cao nhất)</option>
            <option value="30days">🗓️ Lượt 30 ngày (Cao nhất)</option>
            <option value="latest">⏱️ Mới truy cập gần đây</option>
            <option value="title">🔤 Tên bài học (A - Z)</option>
            <option value="date">📅 Ngày đăng (Mới nhất)</option>
          </select>
        </div>

        {/* BẢNG THỐNG KÊ CHI TIẾT TỪNG HỌC LIỆU */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-main-body">
            <thead className="bg-emerald-50/80 text-emerald-950 font-black border-b border-emerald-100">
              <tr>
                <th className="py-3.5 px-3 text-center w-12">STT</th>
                <th className="py-3.5 px-4 min-w-[220px]">Tên học liệu</th>
                <th className="py-3.5 px-3 whitespace-nowrap">Môn học</th>
                <th className="py-3.5 px-3 whitespace-nowrap">Khối lớp</th>
                <th className="py-3.5 px-4 min-w-[140px]">Giáo viên đăng tải</th>
                <th className="py-3.5 px-3 whitespace-nowrap">Ngày đăng</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">
                  Tổng lượt
                </th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">
                  Hôm nay
                </th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">
                  7 ngày
                </th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">
                  30 ngày
                </th>
                <th className="py-3.5 px-4 whitespace-nowrap">
                  Truy cập gần nhất
                </th>
                <th className="py-3.5 px-3 text-center w-16">Mở</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-desc">
              {filteredAndSortedStats.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400 font-bold text-main-body">
                    Không tìm thấy học liệu nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                paginatedStats.map((item, index) => (
                  <tr
                    key={item.linkId}
                    className="hover:bg-emerald-50/40 transition-colors"
                  >
                    {/* STT */}
                    <td className="py-3.5 px-3 text-center font-bold text-slate-400 text-caption-safe">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>

                    {/* Tên học liệu */}
                    <td className="py-3.5 px-4">
                      {(() => {
                        const normType = normalizeResourceType(item.resourceType);
                        return (
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg shrink-0">
                              {normType === 'video'
                                ? '🎥'
                                : normType === 'khac'
                                ? '📁'
                                : '🎮'}
                            </span>
                            <div>
                              <p
                                className="font-black text-slate-900 line-clamp-1 hover:text-emerald-700 transition-colors text-main-body"
                                title={item.title}
                              >
                                {item.title}
                              </p>
                              <span
                                className={`inline-block text-caption-safe font-bold px-2 py-0.5 rounded-md mt-0.5 ${
                                  normType === 'video'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : normType === 'khac'
                                    ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {normType === 'video'
                                  ? 'Video bài học'
                                  : normType === 'khac'
                                  ? 'Khác'
                                  : 'Trò chơi'}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Môn học */}
                    <td className="py-3.5 px-3 whitespace-nowrap font-bold">
                      <span className="px-2.5 py-1 rounded-md text-caption-safe bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold">
                        {normalizeSubjectName(item.subject)}
                      </span>
                    </td>

                    {/* Khối lớp */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="font-extrabold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-caption-safe">
                        {item.grade === 0 ? 'Chung' : `Lớp ${item.grade}`}
                      </span>
                    </td>

                    {/* Giáo viên đăng tải */}
                    <td className="py-3.5 px-4">
                      <p className="font-black text-slate-800 text-main-body">
                        {item.creatorName || 'Giáo viên'}
                      </p>
                      {item.creatorSchool && (
                        <p className="text-caption-safe text-slate-500 font-medium truncate max-w-[140px]">
                          {item.creatorSchool}
                        </p>
                      )}
                    </td>

                    {/* Ngày đăng tải */}
                    <td className="py-3.5 px-3 whitespace-nowrap text-slate-500 text-caption-safe">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString('vi-VN')
                        : '-'}
                    </td>

                    {/* Tổng lượt truy cập từ trước đến nay */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="text-main-body font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200 inline-block min-w-[40px]">
                        {item.totalVisits}
                      </span>
                    </td>

                    {/* Lượt hôm nay */}
                    <td className="py-3.5 px-3 text-center">
                      {item.todayVisits > 0 ? (
                        <span className="font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg text-caption-safe inline-block animate-pulse">
                          +{item.todayVisits}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-bold text-caption-safe">0</span>
                      )}
                    </td>

                    {/* Lượt 7 ngày gần nhất */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-bold text-teal-800 text-caption-safe">
                        {item.last7DaysVisits}
                      </span>
                    </td>

                    {/* Lượt 30 ngày gần nhất */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-bold text-sky-800 text-caption-safe">
                        {item.last30DaysVisits}
                      </span>
                    </td>

                    {/* Thời điểm truy cập gần nhất */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-caption-safe">
                      {item.lastVisitedAt ? (
                        <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {new Date(item.lastVisitedAt).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            {new Date(item.lastVisitedAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300 italic">Chưa có lượt</span>
                      )}
                    </td>

                    {/* Mở xem bài */}
                    <td className="py-3.5 px-3 text-center">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex p-2 rounded-xl bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 transition-colors"
                        title="Mở liên kết học liệu"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Thanh Điều Hướng Phân Trang */}
        {filteredAndSortedStats.length > pageSize && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 text-desc">
            <p className="text-slate-600 font-semibold">
              Hiển thị <span className="font-black text-slate-800">{(currentPage - 1) * pageSize + 1}</span> -{' '}
              <span className="font-black text-slate-800">
                {Math.min(currentPage * pageSize, filteredAndSortedStats.length)}
              </span>{' '}
              trong tổng số <span className="font-black text-emerald-700">{filteredAndSortedStats.length}</span> học liệu
            </p>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Trang trước"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                // Hiển thị các trang gần trang hiện tại
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-[36px] h-9 rounded-xl font-bold text-input-button transition-all cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === currentPage - 2 ||
                  pageNum === currentPage + 2
                ) {
                  return (
                    <span key={pageNum} className="text-slate-400 px-1 text-desc font-bold">
                      ...
                    </span>
                  );
                }
                return null;
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Trang sau"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
