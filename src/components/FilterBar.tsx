import React from 'react';
import { SubjectType, GradeLevel, ResourceType } from '../types';
import {
  Search,
  Filter,
  Pin,
  Heart,
  Globe,
  Lock,
  User,
  ArrowUpDown,
  X,
  Sparkles,
} from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedSubject: SubjectType | 'all';
  onSubjectChange: (s: SubjectType | 'all') => void;
  selectedGrade: GradeLevel | 'all';
  onGradeChange: (g: GradeLevel | 'all') => void;
  selectedType: ResourceType | 'all';
  onTypeChange: (t: ResourceType | 'all') => void;
  onlyPinned: boolean;
  onTogglePinned: () => void;
  onlyFavorite: boolean;
  onToggleFavorite: () => void;
  onlyMine: boolean;
  onToggleMine: () => void;
  onlyPublic: boolean;
  onTogglePublic: () => void;
  sortBy: 'pinned' | 'newest' | 'plays' | 'title';
  onSortChange: (sort: 'pinned' | 'newest' | 'plays' | 'title') => void;
  totalCount: number;
  filteredCount: number;
  isAuthenticated: boolean;
  onClearFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedSubject,
  onSubjectChange,
  selectedGrade,
  onGradeChange,
  selectedType,
  onTypeChange,
  onlyPinned,
  onTogglePinned,
  onlyFavorite,
  onToggleFavorite,
  onlyMine,
  onToggleMine,
  onlyPublic,
  onTogglePublic,
  sortBy,
  onSortChange,
  totalCount,
  filteredCount,
  isAuthenticated,
  onClearFilters,
}) => {
  const hasActiveFilters =
    searchQuery !== '' ||
    selectedSubject !== 'all' ||
    selectedGrade !== 'all' ||
    selectedType !== 'all' ||
    onlyPinned ||
    onlyFavorite ||
    onlyMine ||
    onlyPublic;

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xs border border-emerald-100/80 mb-6 space-y-4">
      {/* Search Input & Quick Sort Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm theo tên bài, chủ đề, từ khóa, Quizizz, link..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium text-slate-800 placeholder-slate-400 transition-all outline-hidden"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sắp xếp */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-slate-500 hidden sm:inline flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            Sắp xếp:
          </span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:border-emerald-500 outline-hidden cursor-pointer"
          >
            <option value="pinned">📌 Ghim lên đầu + Mới nhất</option>
            <option value="newest">⏰ Mới cập nhật</option>
            <option value="plays">🔥 Lượt chơi nhiều nhất</option>
            <option value="title">🔤 Tên bài A - Z</option>
          </select>
        </div>
      </div>

      {/* Tabs Filter by Subject & Grade */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
        {/* Môn học */}
        {/* Môn học - Dropdown 10 môn chuẩn hóa */}
        <div className="relative">
          <select
            value={selectedSubject}
            onChange={(e) => onSubjectChange(e.target.value as any)}
            className="px-3.5 py-2 rounded-2xl bg-slate-100/90 text-xs font-black text-slate-800 border border-slate-200 hover:border-emerald-300 outline-hidden cursor-pointer"
          >
            <option value="all">📚 Tất cả 10 môn học</option>
            <option value="toan">📐 Toán</option>
            <option value="tiengviet">📖 Tiếng Việt</option>
            <option value="tienganh">🔤 Tiếng Anh</option>
            <option value="diali">🌍 Địa Lý</option>
            <option value="lichsu">🏛️ Lịch Sử</option>
            <option value="tinhoc">💻 Tin học</option>
            <option value="congnghe">⚙️ Công nghệ</option>
            <option value="khoahoc">🔬 Khoa học</option>
            <option value="daoduc">⚖️ Đạo đức</option>
            <option value="hdtn">🌟 Hoạt động trải nghiệm</option>
          </select>
        </div>

        {/* Khối lớp 1 đến 5 */}
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl flex-wrap">
          <button
            onClick={() => onGradeChange('all')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedGrade === 'all'
                ? 'bg-white text-slate-800 shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả lớp
          </button>
          {[1, 2, 3, 4, 5].map((g) => (
            <button
              key={g}
              onClick={() => onGradeChange(g as any)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedGrade === g
                  ? 'bg-emerald-600 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Lớp {g}
            </button>
          ))}
        </div>

        {/* Loại học liệu - Chỉ 2 dạng: Trò chơi học tập và Video */}
        <div className="relative">
          <select
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value as any)}
            className="px-3.5 py-2 rounded-2xl bg-slate-100/90 text-xs font-black text-slate-800 border border-slate-200 hover:border-emerald-300 outline-hidden cursor-pointer"
          >
            <option value="all">🎯 Tất cả dạng học liệu</option>
            <option value="tro_choi">🎮 Trò chơi tương tác</option>
            <option value="video">🎥 Video bài giảng</option>
            <option value="khac">📁 Khác</option>
          </select>
        </div>
      </div>

      {/* Quick toggle pills: Ghim, Yêu thích, Công khai, Của tôi */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 font-bold mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Lọc nhanh:
          </span>

          <button
            onClick={onTogglePinned}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
              onlyPinned
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Pin className="w-3 h-3 text-amber-600" />
            Đã ghim
          </button>

          <button
            onClick={onToggleFavorite}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
              onlyFavorite
                ? 'bg-rose-100 text-rose-900 border border-rose-300'
                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
            Yêu thích
          </button>

          <button
            onClick={onTogglePublic}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
              onlyPublic
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Globe className="w-3 h-3 text-emerald-600" />
            Công khai
          </button>

          {isAuthenticated && (
            <button
              onClick={onToggleMine}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                onlyMine
                  ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <User className="w-3 h-3 text-indigo-600" />
              Của tôi tạo
            </button>
          )}

          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="px-2 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg font-bold underline transition-colors"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>

        {/* Counter badge */}
        <div className="text-[11px] font-bold text-slate-500 bg-emerald-50/70 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-emerald-600" />
          <span>
            Hiển thị <strong>{filteredCount}</strong> / <strong>{totalCount}</strong> học liệu
          </span>
        </div>
      </div>
    </div>
  );
};
