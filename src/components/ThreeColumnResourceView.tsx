import React, { useState, useMemo, useRef, useEffect } from 'react';
import { LinkItem, ResourceType, SubjectCard } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  Gamepad2,
  Video,
  Sparkles,
  Pin,
  Heart,
  Copy,
  Check,
  Edit2,
  Trash2,
  Plus,
  Search,
  Lock,
  Layers,
  RotateCcw,
  BookOpen,
  Filter,
  Home,
  Download,
} from 'lucide-react';
import { DEFAULT_SUBJECT_CARDS, normalizeSubjectName, normalizeResourceType } from '../services/storageService';
import { exportLessonsToExcel } from '../services/excelService';

interface ThreeColumnResourceViewProps {
  links: LinkItem[];
  canManage: boolean;
  subjectCards?: SubjectCard[];
  selectedCardId?: string;
  onSelectCard?: (cardId: string) => void;
  onOpenLink: (item: LinkItem) => void;
  onCopyLink: (url: string) => void;
  onTogglePin: (item: LinkItem) => void;
  onToggleFavorite: (item: LinkItem) => void;
  onEdit: (item: LinkItem) => void;
  onDelete: (item: LinkItem) => void;
  onRecordScore: (item: LinkItem) => void;
  onAddNewToColumn: (subject: string, grade: number, type: ResourceType, className?: string) => void;
  onOpenShareModal: () => void;
  onAddSubjectClick?: () => void;
  onEditSubjectClick?: (card: SubjectCard) => void;
  onDeleteSubjectClick?: (card: SubjectCard) => void;
}

// Hàm gán màu sắc và biểu tượng nhận diện từng môn học cho huy hiệu trên thẻ học liệu
export const getSubjectBadgeInfo = (subjectStr: string) => {
  const std = normalizeSubjectName(subjectStr || '').toLowerCase();
  if (std.includes('toán') || std === 'toan') {
    return { name: 'Toán', icon: '🔢', bg: 'bg-amber-100 text-amber-950 border-amber-300' };
  }
  if (std.includes('việt') || std === 'tiengviet') {
    return { name: 'Tiếng Việt', icon: '📚', bg: 'bg-orange-100 text-orange-950 border-orange-300' };
  }
  if (std.includes('anh') || std === 'tienganh') {
    return { name: 'Tiếng Anh', icon: '🔤', bg: 'bg-sky-100 text-sky-950 border-sky-300' };
  }
  if (std.includes('địa') || std === 'diali') {
    return { name: 'Địa Lý', icon: '🗺️', bg: 'bg-cyan-100 text-cyan-950 border-cyan-300' };
  }
  if (std.includes('sử') || std === 'lichsu') {
    return { name: 'Lịch Sử', icon: '🚩', bg: 'bg-yellow-100 text-yellow-950 border-yellow-300' };
  }
  if (std.includes('tin') || std === 'tinhoc') {
    return { name: 'Tin học', icon: '🤖', bg: 'bg-indigo-100 text-indigo-950 border-indigo-300' };
  }
  if (std.includes('công') || std === 'congnghe') {
    return { name: 'Công nghệ', icon: '🌱', bg: 'bg-lime-100 text-lime-950 border-lime-300' };
  }
  if (std.includes('khoa') || std === 'khoahoc') {
    return { name: 'Khoa học', icon: '🧪', bg: 'bg-emerald-100 text-emerald-950 border-emerald-300' };
  }
  if (std.includes('đạo') || std === 'daoduc') {
    return { name: 'Đạo đức', icon: '💖', bg: 'bg-pink-100 text-pink-950 border-pink-300' };
  }
  if (std.includes('trải nghiệm') || std === 'hdtn') {
    return { name: 'HĐTN', icon: '🎨', bg: 'bg-yellow-100 text-yellow-950 border-yellow-300' };
  }
  return {
    name: normalizeSubjectName(subjectStr) || 'Môn học',
    icon: '📚',
    bg: 'bg-slate-100 text-slate-800 border-slate-200',
  };
};

// Hàm định kiểu dáng hoạt hình tươi sáng cho các nút danh mục môn học (Pastel, bo tròn 16px, badge tròn nhỏ)
export const getSubjectCardStyle = (subjectStr: string, isActive: boolean) => {
  const std = normalizeSubjectName(subjectStr || '').toLowerCase();

  // 1. TOÁN: "🔢 Toán" (nền vàng kem pastel)
  if (std.includes('toán') || std === 'toan') {
    return {
      icon: '🔢',
      bgClass: isActive
        ? 'bg-amber-300 text-amber-950 border-amber-400 shadow-md shadow-amber-300/40 ring-2 ring-amber-400 font-black'
        : 'bg-amber-50/90 text-amber-950 border-amber-200/90 hover:bg-amber-100/90 hover:border-amber-300 font-bold',
      badgeClass: isActive
        ? 'bg-amber-950 text-amber-100'
        : 'bg-amber-200/80 text-amber-950 border border-amber-300/80',
    };
  }

  // 2. TIẾNG VIỆT: "📚 Tiếng Việt" (nền cam đào nhẹ)
  if (std.includes('việt') || std === 'tiengviet') {
    return {
      icon: '📚',
      bgClass: isActive
        ? 'bg-orange-300 text-orange-950 border-orange-400 shadow-md shadow-orange-300/40 ring-2 ring-orange-400 font-black'
        : 'bg-orange-50/90 text-orange-950 border-orange-200/90 hover:bg-orange-100/90 hover:border-orange-300 font-bold',
      badgeClass: isActive
        ? 'bg-orange-950 text-orange-100'
        : 'bg-orange-200/80 text-orange-950 border border-orange-300/80',
    };
  }

  // 3. TIẾNG ANH: "🔤 Tiếng Anh" (nền xanh biển nhạt)
  if (std.includes('anh') || std === 'tienganh') {
    return {
      icon: '🔤',
      bgClass: isActive
        ? 'bg-sky-300 text-sky-950 border-sky-400 shadow-md shadow-sky-300/40 ring-2 ring-sky-400 font-black'
        : 'bg-sky-50/90 text-sky-950 border-sky-200/90 hover:bg-sky-100/90 hover:border-sky-300 font-bold',
      badgeClass: isActive
        ? 'bg-sky-950 text-sky-100'
        : 'bg-sky-200/80 text-sky-950 border border-sky-300/80',
    };
  }

  // 4. ĐỊA LÝ: "🗺️ Địa Lý" (nền xanh lơ nhạt)
  if (std.includes('địa') || std === 'diali') {
    return {
      icon: '🗺️',
      bgClass: isActive
        ? 'bg-cyan-300 text-cyan-950 border-cyan-400 shadow-md shadow-cyan-300/40 ring-2 ring-cyan-400 font-black'
        : 'bg-cyan-50/90 text-cyan-950 border-cyan-200/90 hover:bg-cyan-100/90 hover:border-cyan-300 font-bold',
      badgeClass: isActive
        ? 'bg-cyan-950 text-cyan-100'
        : 'bg-cyan-200/80 text-cyan-950 border border-cyan-300/80',
    };
  }

  // 5. LỊCH SỬ: "🚩 Lịch Sử" (nền vàng cát ấm)
  if (std.includes('sử') || std === 'lichsu') {
    return {
      icon: '🚩',
      bgClass: isActive
        ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-md shadow-amber-300/40 ring-2 ring-amber-400 font-black'
        : 'bg-yellow-50/90 text-yellow-950 border-yellow-200/90 hover:bg-yellow-100/90 hover:border-yellow-300 font-bold',
      badgeClass: isActive
        ? 'bg-amber-950 text-amber-100'
        : 'bg-yellow-200/80 text-yellow-950 border border-yellow-300/80',
    };
  }

  // 6. TIN HỌC: "🤖 Tin học" (nền xanh tím pastel nhẹ)
  if (std.includes('tin') || std === 'tinhoc') {
    return {
      icon: '🤖',
      bgClass: isActive
        ? 'bg-indigo-300 text-indigo-950 border-indigo-400 shadow-md shadow-indigo-300/40 ring-2 ring-indigo-400 font-black'
        : 'bg-indigo-50/90 text-indigo-950 border-indigo-200/90 hover:bg-indigo-100/90 hover:border-indigo-300 font-bold',
      badgeClass: isActive
        ? 'bg-indigo-950 text-indigo-100'
        : 'bg-indigo-200/80 text-indigo-950 border border-indigo-300/80',
    };
  }

  // 7. CÔNG NGHỆ: "🌱 Công nghệ" (nền xanh lá mầm)
  if (std.includes('công') || std === 'congnghe') {
    return {
      icon: '🌱',
      bgClass: isActive
        ? 'bg-lime-300 text-lime-950 border-lime-400 shadow-md shadow-lime-300/40 ring-2 ring-lime-400 font-black'
        : 'bg-lime-50/90 text-lime-950 border-lime-200/90 hover:bg-lime-100/90 hover:border-lime-300 font-bold',
      badgeClass: isActive
        ? 'bg-lime-950 text-lime-100'
        : 'bg-lime-200/80 text-lime-950 border border-lime-300/80',
    };
  }

  // 8. KHOA HỌC: "🧪 Khoa học" (nền xanh bạc hà)
  if (std.includes('khoa') || std === 'khoahoc') {
    return {
      icon: '🧪',
      bgClass: isActive
        ? 'bg-emerald-300 text-emerald-950 border-emerald-400 shadow-md shadow-emerald-300/40 ring-2 ring-emerald-400 font-black'
        : 'bg-emerald-50/90 text-emerald-950 border-emerald-200/90 hover:bg-emerald-100/90 hover:border-emerald-300 font-bold',
      badgeClass: isActive
        ? 'bg-emerald-950 text-emerald-100'
        : 'bg-emerald-200/80 text-emerald-950 border border-emerald-300/80',
    };
  }

  // 9. ĐẠO ĐỨC: "💖 Đạo đức" (nền hồng phấn)
  if (std.includes('đạo') || std === 'daoduc') {
    return {
      icon: '💖',
      bgClass: isActive
        ? 'bg-pink-300 text-pink-950 border-pink-400 shadow-md shadow-pink-300/40 ring-2 ring-pink-400 font-black'
        : 'bg-pink-50/90 text-pink-950 border-pink-200/90 hover:bg-pink-100/90 hover:border-pink-300 font-bold',
      badgeClass: isActive
        ? 'bg-pink-950 text-pink-100'
        : 'bg-pink-200/80 text-pink-950 border border-pink-300/80',
    };
  }

  // 10. HĐTN: "🎨 HĐTN" (nền vàng chanh)
  if (std.includes('trải nghiệm') || std === 'hdtn') {
    return {
      icon: '🎨',
      bgClass: isActive
        ? 'bg-yellow-300 text-yellow-950 border-yellow-400 shadow-md shadow-yellow-300/40 ring-2 ring-yellow-400 font-black'
        : 'bg-yellow-50/90 text-yellow-950 border-yellow-200/90 hover:bg-yellow-100/90 hover:border-yellow-300 font-bold',
      badgeClass: isActive
        ? 'bg-yellow-950 text-yellow-100'
        : 'bg-yellow-200/80 text-yellow-950 border border-yellow-300/80',
    };
  }

  return {
    icon: '📚',
    bgClass: isActive
      ? 'bg-teal-300 text-teal-950 border-teal-400 shadow-md shadow-teal-300/40 ring-2 ring-teal-400 font-black'
      : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100 font-bold',
    badgeClass: isActive
      ? 'bg-teal-950 text-teal-100'
      : 'bg-slate-200 text-slate-800 border border-slate-300',
  };
};

export const ThreeColumnResourceView: React.FC<ThreeColumnResourceViewProps> = ({
  links,
  canManage,
  subjectCards = DEFAULT_SUBJECT_CARDS,
  selectedCardId = 'all',
  onSelectCard,
  onOpenLink,
  onCopyLink,
  onTogglePin,
  onToggleFavorite,
  onEdit,
  onDelete,
  onRecordScore,
  onAddNewToColumn,
  onAddSubjectClick,
  onEditSubjectClick,
  onDeleteSubjectClick,
}) => {
  const { user, isAuthenticated, isAdmin, isTeacher } = useAuth();

  // Gom các thẻ lớp theo tên môn học chuẩn hóa
  const subjectGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        cards: SubjectCard[];
        icon?: string;
      }
    >();

    subjectCards.forEach((card) => {
      const stdName = normalizeSubjectName(card.name || 'Môn học');
      const key = stdName.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          name: stdName,
          cards: [],
          icon: card.icon,
        });
      }
      const grp = map.get(key)!;
      if (!grp.cards.some((c) => c.grade === card.grade)) {
        grp.cards.push(card);
      }
    });

    // Sắp xếp các lớp trong mỗi môn theo khối lớp tăng dần (grade 1 -> 5)
    map.forEach((grp) => {
      grp.cards.sort((a, b) => (a.grade || 0) - (b.grade || 0));
    });

    return Array.from(map.values());
  }, [subjectCards]);

  // Bộ lọc môn học và lớp
  // activeSubjectKey: null (Tất cả môn học) hoặc key môn học (ví dụ: 'toán', 'tin học')
  const [activeSubjectKey, setActiveSubjectKey] = useState<string | null>(null);

  // Bộ lọc Khối lớp nhanh: 'all' | 1 | 2 | 3 | 4 | 5
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<'all' | number>('all');

  // Thẻ lớp đang chọn cụ thể trong một môn (nếu có): 'all' hoặc id của thẻ như 'toan-1'
  const [internalCardId, setInternalCardId] = useState<string>(selectedCardId || 'all');
  const activeCardId = selectedCardId !== undefined ? selectedCardId : internalCardId;

  // Tìm thẻ môn/lớp đang chọn cụ thể nếu có
  const specificCard = useMemo(() => {
    if (!activeCardId || activeCardId === 'all' || activeCardId.startsWith('subject:')) {
      return null;
    }
    return subjectCards.find((c) => c.id === activeCardId) || null;
  }, [activeCardId, subjectCards]);

  // Nhóm môn học đang mở
  const activeGroup = useMemo(() => {
    if (!activeSubjectKey) return null;
    return subjectGroups.find((g) => g.name.toLowerCase() === activeSubjectKey) || null;
  }, [activeSubjectKey, subjectGroups]);

  // Bộ lọc tìm kiếm & loại học liệu
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [onlyPinned, setOnlyPinned] = useState(false);
  const [onlyFavorite, setOnlyFavorite] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'tro_choi' | 'video' | 'khac'>('all');

  // PHÂN TRANG (PAGINATION) - CỐ ĐỊNH 12 HỌC LIỆU MỖI TRANG
  const ITEMS_PER_PAGE = 12;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const resourceListRef = useRef<HTMLDivElement>(null);

  // Hàm cuộn mượt mà lên đầu khu vực danh sách bài học
  const scrollToResourceList = () => {
    if (resourceListRef.current) {
      resourceListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Tự động đặt lại về Trang 1 khi bấm lọc môn học, khối lớp, tìm kiếm hoặc chuyển tab
  useEffect(() => {
    setCurrentPage(1);
  }, [activeSubjectKey, selectedGradeFilter, searchQuery, filterType, onlyPinned, onlyFavorite, activeCardId]);

  // Xử lý khi nhấn biểu tượng Trang chủ (Home)
  const handleGoHome = () => {
    setActiveSubjectKey(null);
    setSelectedGradeFilter('all');
    setInternalCardId('all');
    setSearchQuery('');
    setFilterType('all');
    setOnlyPinned(false);
    setOnlyFavorite(false);
    setCurrentPage(1);
    if (onSelectCard) onSelectCard('all');
    scrollToResourceList();
  };

  // Xử lý khi nhấn vào một môn học trong danh mục
  const handleToggleSubject = (groupKey: string) => {
    if (activeSubjectKey === groupKey) {
      // Nhấn lại môn đang chọn -> Quay về Trang chủ xem toàn bộ học liệu
      handleGoHome();
    } else {
      setActiveSubjectKey(groupKey);
      const subCardId = `subject:${groupKey}`;
      setInternalCardId(subCardId);
      setCurrentPage(1);
      if (onSelectCard) onSelectCard(subCardId);
      scrollToResourceList();
    }
  };

  // Xử lý khi chuyển Tab (Tất cả, Trò chơi, Video, Khác) kèm cuộn mượt
  const handleTabChange = (type: 'all' | 'tro_choi' | 'video' | 'khac') => {
    setFilterType(type);
    setCurrentPage(1);
    scrollToResourceList();
  };

  // Xử lý khi đổi bộ lọc Khối Lớp nhanh kèm cuộn mượt
  const handleGradeFilterChange = (g: 'all' | number) => {
    setSelectedGradeFilter(g);
    setCurrentPage(1);
    scrollToResourceList();
  };

  // Xử lý khi chọn "Tất cả các lớp của môn học"
  const handleSelectAllClassesOfSubject = (groupKey: string) => {
    setActiveSubjectKey(groupKey);
    const subCardId = `subject:${groupKey}`;
    setInternalCardId(subCardId);
    setCurrentPage(1);
    if (onSelectCard) onSelectCard(subCardId);
    scrollToResourceList();
  };

  // Xử lý khi nhấn vào một lớp cụ thể của môn (ví dụ: Toán Lớp 1)
  const handleSelectCard = (id: string, groupKey: string) => {
    setActiveSubjectKey(groupKey);
    setInternalCardId(id);
    setCurrentPage(1);
    if (onSelectCard) onSelectCard(id);
    scrollToResourceList();
  };

  // Tổng số học liệu người dùng có quyền xem trên toàn bộ hệ thống
  const totalAccessibleCount = useMemo(() => {
    return links.filter((item) => {
      if (!item.isPublic) {
        if (!isAuthenticated || !user) return false;
        const isOwner = item.creatorId === user.uid;
        if (!isAdmin && !isOwner) return false;
      }
      return true;
    }).length;
  }, [links, isAuthenticated, user, isAdmin]);

  // ========================================================
  // LỌC HỌC LIỆU THEO TẤT CẢ TIÊU CHÍ:
  // 1. Quyền xem Công khai / Riêng tư
  // 2. Môn học (nếu chọn)
  // 3. Khối lớp cụ thể (nếu chọn thẻ lớp hoặc chọn lọc lớp)
  // 4. Tìm kiếm từ khóa
  // 5. Ghim / Yêu thích
  // ========================================================
  const sectionLinks = useMemo(() => {
    return links.filter((item) => {
      // 1. QUY TẮC BẢO MẬT VÀ PHÂN QUYỀN TRUY CẬP:
      // - Nếu CÔNG KHAI (isPublic === true): MỌI NGƯỜI (khách chưa đăng nhập, học sinh, GV) đều xem được.
      // - Nếu RIÊNG TƯ (isPublic === false): CHỈ hiển thị với Admin hoặc chính giáo viên đã tạo (creatorId).
      if (!item.isPublic) {
        if (!isAuthenticated || !user) return false;
        const isOwner = item.creatorId === user.uid;
        if (!isAdmin && !isOwner) return false;
      }

      // 2. LỌC THEO MÔN HỌC (nếu người dùng đang chọn một môn học cụ thể)
      if (activeSubjectKey) {
        const itemSub = (item.subject || '').toLowerCase().trim();
        const itemSubStd = normalizeSubjectName(itemSub).toLowerCase();
        const targetSubStd = activeSubjectKey.toLowerCase();

        const matchSubject =
          itemSub === targetSubStd ||
          itemSubStd === targetSubStd ||
          (targetSubStd.includes('toán') && (itemSub.includes('toan') || itemSub.includes('toán'))) ||
          (targetSubStd.includes('việt') && (itemSub.includes('tiengviet') || itemSub.includes('việt'))) ||
          (targetSubStd.includes('anh') && (itemSub.includes('tienganh') || itemSub.includes('anh'))) ||
          (targetSubStd.includes('địa') && (itemSub.includes('diali') || itemSub.includes('địa'))) ||
          (targetSubStd.includes('sử') && (itemSub.includes('lichsu') || itemSub.includes('sử'))) ||
          (targetSubStd.includes('tin') && (itemSub.includes('tinhoc') || itemSub.includes('tin'))) ||
          (targetSubStd.includes('công') && (itemSub.includes('congnghe') || itemSub.includes('công'))) ||
          (targetSubStd.includes('khoa') && (itemSub.includes('khoahoc') || itemSub.includes('khoa'))) ||
          (targetSubStd.includes('đạo') && (itemSub.includes('daoduc') || itemSub.includes('đạo'))) ||
          (targetSubStd.includes('trải nghiệm') && (itemSub.includes('hdtn') || itemSub.includes('trải nghiệm')));

        if (!matchSubject) return false;
      }

      // 3. LỌC THEO THẺ LỚP CỤ THỂ (nếu đang chọn một thẻ lớp cụ thể, ví dụ toan-1)
      if (specificCard) {
        const targetGrade = specificCard.grade;
        const matchGrade = item.grade === targetGrade || item.grade === 0;
        if (!matchGrade) return false;
      }

      // 4. BỘ LỌC KHỐI LỚP NHANH (Lớp 1, 2, 3, 4, 5)
      if (selectedGradeFilter !== 'all') {
        if (item.grade !== 0 && item.grade !== selectedGradeFilter) {
          return false;
        }
      }

      // 5. TÌM KIẾM THEO TỪ KHÓA
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText =
          item.title.toLowerCase().includes(q) ||
          (item.lesson && item.lesson.toLowerCase().includes(q)) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          (item.subject && item.subject.toLowerCase().includes(q)) ||
          (item.grade && `lớp ${item.grade}`.includes(q)) ||
          (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)));
        if (!matchText) return false;
      }

      // 6. LỌC GHIM / YÊU THÍCH
      if (onlyPinned && !item.isPinned) return false;
      if (onlyFavorite && !item.isFavorite) return false;

      return true;
    });
  }, [
    links,
    activeSubjectKey,
    specificCard,
    selectedGradeFilter,
    isAuthenticated,
    user,
    isAdmin,
    searchQuery,
    onlyPinned,
    onlyFavorite,
  ]);

  // PHÂN LOẠI THÀNH 3 DẠNG HỌC LIỆU: TRÒ CHƠI TƯƠNG TÁC, VIDEO VÀ KHÁC
  const gameLinks = useMemo(() => {
    return sectionLinks.filter((l) => normalizeResourceType(l.resourceType) === 'tro_choi');
  }, [sectionLinks]);

  const videoLinks = useMemo(() => {
    return sectionLinks.filter((l) => normalizeResourceType(l.resourceType) === 'video');
  }, [sectionLinks]);

  const otherLinks = useMemo(() => {
    return sectionLinks.filter((l) => normalizeResourceType(l.resourceType) === 'khac');
  }, [sectionLinks]);

  // Danh sách học liệu được hiển thị theo Tab đang chọn (Tất cả, Trò chơi, Video, Khác)
  const displayedLinks = useMemo(() => {
    if (filterType === 'tro_choi') return gameLinks;
    if (filterType === 'video') return videoLinks;
    if (filterType === 'khac') return otherLinks;
    return sectionLinks;
  }, [filterType, gameLinks, videoLinks, otherLinks, sectionLinks]);

  // TÍNH TOÁN PHÂN TRANG (TỐI ĐA 12 HỌC LIỆU MỖI TRANG)
  const totalItems = displayedLinks.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedLinks = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return displayedLinks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [displayedLinks, safeCurrentPage]);

  // Chuyển trang và cuộn mượt lên đầu danh sách bài học
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === safeCurrentPage) return;
    setCurrentPage(newPage);
    scrollToResourceList();
  };

  // Helper sinh danh sách số trang bo tròn mềm mại và dấu ba chấm khi danh sách dài
  const getPaginationRange = (current: number, total: number) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
      pages.push(total);
    } else if (current >= total - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = total - 4; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      pages.push(current - 1);
      pages.push(current);
      pages.push(current + 1);
      pages.push('...');
      pages.push(total);
    }
    return pages;
  };

  const handleCopy = (id: string, url: string) => {
    onCopyLink(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Xác định thông tin tiêu đề đang hiển thị
  const displayContext = useMemo(() => {
    if (!activeSubjectKey) {
      if (selectedGradeFilter !== 'all') {
        return {
          title: `Toàn Bộ Học Liệu - Khối Lớp ${selectedGradeFilter}`,
          subtitle: `Tổng hợp tất cả trò chơi học tập và video của các môn học Lớp ${selectedGradeFilter}`,
          badge: `🌟 Toàn bộ môn học • Lớp ${selectedGradeFilter}`,
          icon: '📚',
        };
      }
      return {
        title: 'Toàn Bộ Kho Học Liệu (Tất Cả Môn Học & Các Lớp)',
        subtitle: 'Mặc định tổng hợp toàn bộ trò chơi học tập và video bài giảng của 10 môn học Tiểu học từ Lớp 1 đến Lớp 5',
        badge: '🌟 Tất cả môn học & Tất cả khối lớp',
        icon: '📚',
      };
    }

    if (specificCard) {
      return {
        title: `${specificCard.name} ${specificCard.className}`,
        subtitle: `Kho học liệu môn ${specificCard.name} dành cho học sinh ${specificCard.className}`,
        badge: `${specificCard.icon || '📖'} ${specificCard.name} ${specificCard.className}`,
        icon: specificCard.icon || '📖',
      };
    }

    if (activeGroup) {
      if (selectedGradeFilter !== 'all') {
        return {
          title: `Môn ${activeGroup.name} - Lớp ${selectedGradeFilter}`,
          subtitle: `Các bài học và trò chơi môn ${activeGroup.name} dành cho Lớp ${selectedGradeFilter}`,
          badge: `${activeGroup.icon || '📖'} ${activeGroup.name} • Lớp ${selectedGradeFilter}`,
          icon: activeGroup.icon || '📖',
        };
      }
      return {
        title: `Môn ${activeGroup.name} (Tất Cả Các Lớp)`,
        subtitle: `Tổng hợp trò chơi học tập và video môn ${activeGroup.name} từ các khối lớp`,
        badge: `${activeGroup.icon || '📖'} Môn ${activeGroup.name} • Tất cả lớp`,
        icon: activeGroup.icon || '📖',
      };
    }

    return {
      title: 'Kho Học Liệu Tiểu Học',
      subtitle: 'Học vui mỗi ngày – Khám phá ngàn điều hay!',
      badge: '📚 Nguồn sáng tri thức',
      icon: '📚',
    };
  }, [activeSubjectKey, specificCard, activeGroup, selectedGradeFilter]);

  // Helper khi bấm nút "Thêm Trò Chơi" hoặc "Thêm Video"
  const handleAddNewResource = (type: ResourceType) => {
    let presetSubName = 'toan';
    let presetGrd = 1;
    let presetClass = 'Lớp 1';

    if (specificCard) {
      presetSubName = specificCard.name;
      presetGrd = specificCard.grade;
      presetClass = specificCard.className;
    } else if (activeGroup) {
      presetSubName = activeGroup.name;
      presetGrd = selectedGradeFilter !== 'all' ? selectedGradeFilter : (activeGroup.cards[0]?.grade || 1);
      presetClass = `Lớp ${presetGrd}`;
    } else if (selectedGradeFilter !== 'all') {
      presetGrd = selectedGradeFilter;
      presetClass = `Lớp ${presetGrd}`;
    }

    onAddNewToColumn(presetSubName, presetGrd, type, presetClass);
  };

  const isAllSubjectsActive = activeSubjectKey === null;

  return (
    <div className="space-y-6">
      {/* 1. KHU VỰC 10 MÔN HỌC MẶC ĐỊNH & KHỐI LỚP (TỐI ĐA 6 MÔN TRÊN MỘT HÀNG MÁY TÍNH) */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-emerald-100 shadow-xs">
        {/* Header quản lý môn học */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-2xl shadow-2xs shrink-0">
              📚
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-title-section text-slate-900 tracking-tight">
                  Danh mục Môn học
                </h3>
                {isAllSubjectsActive && (
                  <span className="px-3 py-0.5 rounded-full text-caption-safe font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Đang hiển thị toàn bộ {totalAccessibleCount} bài học
                  </span>
                )}
              </div>
              <p className="text-desc text-slate-600 font-semibold mt-1">
                Mặc định hiển thị toàn bộ học liệu. Bấm vào môn học để lọc nhanh theo môn hoặc bấm biểu tượng Trang chủ để xem tất cả.
              </p>
            </div>
          </div>

          {/* CHỈ ADMIN MỚI CÓ QUYỀN THÊM MÔN HỌC (Giáo viên KHÔNG có quyền thêm môn) */}
          {isAdmin && onAddSubjectClick && (
            <button
              onClick={onAddSubjectClick}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-input-button shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
              title="Chỉ Quản trị viên (Admin) mới có quyền thêm môn học mới"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>+ Thêm môn học (Admin)</span>
            </button>
          )}
        </div>

        {/* KHU VỰC DANH MỤC MÔN HỌC & NÚT TRANG CHỦ HOẠT HÌNH DỄ THƯƠNG */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3">
          {/* NÚT BIỂU TƯỢNG TRANG CHỦ HOẠT HÌNH (TẤT CẢ MÔN HỌC) */}
          <button
            type="button"
            onClick={handleGoHome}
            aria-label="Trang chủ - Xem tất cả môn học"
            title="Trang chủ - Xem tất cả môn học"
            className={`py-3.5 px-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none flex items-center justify-between sm:justify-center gap-3 shadow-2xs shrink-0 hover:-translate-y-1 hover:shadow-md active:translate-y-0 active:scale-95 ${
              isAllSubjectsActive
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-500 shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400 font-black'
                : 'bg-white text-slate-800 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 font-bold'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl shrink-0 leading-none">🏠</span>
              <span className="text-main-body font-black">Tất cả</span>
            </div>
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-2xs transition-transform ${
                isAllSubjectsActive ? 'bg-white text-emerald-800 scale-110 shadow-xs' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {totalAccessibleCount}
            </span>
          </button>

          {/* LƯỚI 10 MÔN HỌC HOẠT HÌNH NGỘ NGHĨNH (BO TRÒN 16PX, NỀN PASTEL, HIỆU ỨNG NẢY NHẸ) */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 w-full">
            {subjectGroups.map((group) => {
              const groupKey = group.name.toLowerCase();
              const isOpen = activeSubjectKey === groupKey;
              const style = getSubjectCardStyle(group.name, isOpen);

              // Đếm số bài của môn này
              const groupCount = links.filter((l) => {
                if (!l.isPublic) {
                  if (!isAuthenticated || !user) return false;
                  const isOwner = l.creatorId === user.uid;
                  if (!isAdmin && !isOwner) return false;
                }
                const lSub = normalizeSubjectName(l.subject || '').toLowerCase();
                return lSub === groupKey || l.subject === groupKey;
              }).length;

              return (
                <button
                  key={groupKey}
                  type="button"
                  onClick={() => handleToggleSubject(groupKey)}
                  aria-expanded={isOpen}
                  className={`py-3.5 px-3.5 rounded-2xl border transition-all duration-200 cursor-pointer select-none flex items-center justify-between gap-2 shadow-2xs hover:-translate-y-1 hover:shadow-md active:translate-y-0 active:scale-95 ${
                    style.bgClass
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-xl shrink-0 leading-none filter drop-shadow-2xs">{style.icon}</span>
                    <span className="text-main-body font-black truncate text-left tracking-tight">
                      {group.name}
                    </span>
                  </div>

                  {/* Huy hiệu tròn nhỏ xinh xắn nổi bật ở góc phải nút */}
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-2xs transition-transform ${
                      isOpen ? 'scale-110 shadow-xs' : ''
                    } ${style.badgeClass}`}
                  >
                    {groupCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. THANH TÌM KIẾM & BỘ LỌC TOÀN DIỆN (LỌC KHỐI LỚP 1-5, TÌM KIẾM, LOẠI BÀI) */}
      <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
          {/* Ô tìm kiếm từ khóa */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm bài học, môn học, lớp, chủ đề hoặc từ khóa..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-main-body font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 outline-hidden transition-all"
            />
          </div>

          {/* Bộ lọc Khối Lớp Nhanh: Tất cả khối lớp | Lớp 1 | Lớp 2 | Lớp 3 | Lớp 4 | Lớp 5 */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            <span className="text-caption-safe font-bold text-slate-500 flex items-center gap-1 shrink-0 mr-1">
              <Filter className="w-3.5 h-3.5 text-emerald-600" />
              <span>Khối:</span>
            </span>

            <button
              onClick={() => handleGradeFilterChange('all')}
              className={`px-3 py-1.5 rounded-xl text-caption-safe font-black transition-all cursor-pointer shrink-0 ${
                selectedGradeFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Tất cả lớp
            </button>

            {[1, 2, 3, 4, 5].map((g) => (
              <button
                key={g}
                onClick={() => handleGradeFilterChange(g)}
                className={`px-3 py-1.5 rounded-xl text-caption-safe font-black transition-all cursor-pointer shrink-0 ${
                  selectedGradeFilter === g
                    ? 'bg-emerald-600 text-white shadow-2xs ring-1 ring-emerald-500'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Lớp {g}
              </button>
            ))}
          </div>

          {/* Bộ lọc Ghim & Yêu thích */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={() => setOnlyPinned(!onlyPinned)}
              className={`px-3.5 py-2 rounded-xl text-input-button font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                onlyPinned
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Pin className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">Ghim</span>
            </button>

            <button
              onClick={() => setOnlyFavorite(!onlyFavorite)}
              className={`px-3.5 py-2 rounded-xl text-input-button font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                onlyFavorite
                  ? 'bg-rose-100 text-rose-900 border border-rose-300 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span className="hidden sm:inline">Thích</span>
            </button>
          </div>
        </div>

        {/* Thanh trạng thái bộ lọc đang áp dụng */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100 text-desc">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-600">Đang lọc xem:</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100 text-emerald-950 font-black border border-emerald-200">
              <span>{displayContext.icon}</span>
              <span>{displayContext.badge}</span>
            </span>

            {selectedGradeFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-100 text-sky-900 font-bold border border-sky-200">
                <span>Khối Lớp {selectedGradeFilter}</span>
              </span>
            )}

            {searchQuery.trim() && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold border border-amber-200">
                <span>Từ khóa: &quot;{searchQuery}&quot;</span>
              </span>
            )}

            <span className="text-slate-500 font-bold">
              • Tìm thấy <strong className="text-emerald-700">{sectionLinks.length}</strong> học liệu
            </span>
          </div>

          {/* Nút xóa nhanh tất cả bộ lọc */}
          {(!isAllSubjectsActive || selectedGradeFilter !== 'all' || searchQuery.trim() || onlyPinned || onlyFavorite) && (
            <button
              onClick={handleGoHome}
              aria-label="Trang chủ"
              title="Trang chủ - Xóa bộ lọc và xem toàn bộ học liệu"
              className="text-emerald-700 hover:text-emerald-900 font-black text-caption-safe flex items-center gap-1.5 cursor-pointer bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Trang chủ • Xem toàn bộ</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. THANH CHUYỂN TABS TRỰC QUAN (PHÍA TRÊN DANH SÁCH BÀI) */}
      <div
        ref={resourceListRef}
        id="resource-list-section"
        className="scroll-mt-4 bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-emerald-100 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3"
      >
        {/* Bộ 3 Tabs bo tròn mềm mại */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto p-1 bg-slate-100 rounded-2xl border border-slate-200/80 scrollbar-none">
          {/* TAB 1: TẤT CẢ */}
          <button
            type="button"
            onClick={() => handleTabChange('all')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-input-button font-black transition-all duration-200 cursor-pointer flex items-center gap-2 shrink-0 select-none ${
              filterType === 'all'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-700/20 ring-1 ring-emerald-500'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <span>🌟 Tất cả</span>
            <span
              className={`px-2 py-0.5 rounded-full text-caption-safe font-black ${
                filterType === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200/90 text-slate-700'
              }`}
            >
              {sectionLinks.length}
            </span>
          </button>

          {/* TAB 2: TRÒ CHƠI TƯƠNG TÁC */}
          <button
            type="button"
            onClick={() => handleTabChange('tro_choi')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-input-button font-black transition-all duration-200 cursor-pointer flex items-center gap-2 shrink-0 select-none ${
              filterType === 'tro_choi'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-700/20 ring-1 ring-emerald-500'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <span>🎮 Trò chơi tương tác</span>
            <span
              className={`px-2 py-0.5 rounded-full text-caption-safe font-black ${
                filterType === 'tro_choi' ? 'bg-white/20 text-white' : 'bg-slate-200/90 text-slate-700'
              }`}
            >
              {gameLinks.length}
            </span>
          </button>

          {/* TAB 3: VIDEO BÀI GIẢNG */}
          <button
            type="button"
            onClick={() => handleTabChange('video')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-input-button font-black transition-all duration-200 cursor-pointer flex items-center gap-2 shrink-0 select-none ${
              filterType === 'video'
                ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-700/20 ring-1 ring-rose-500'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <span>🎬 Video bài giảng</span>
            <span
              className={`px-2 py-0.5 rounded-full text-caption-safe font-black ${
                filterType === 'video' ? 'bg-white/20 text-white' : 'bg-slate-200/90 text-slate-700'
              }`}
            >
              {videoLinks.length}
            </span>
          </button>

          {/* TAB 4: KHÁC */}
          <button
            type="button"
            onClick={() => handleTabChange('khac')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-input-button font-black transition-all duration-200 cursor-pointer flex items-center gap-2 shrink-0 select-none ${
              filterType === 'khac'
                ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-700/20 ring-1 ring-sky-500'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <span>📁 Khác</span>
            <span
              className={`px-2 py-0.5 rounded-full text-caption-safe font-black ${
                filterType === 'khac' ? 'bg-white/20 text-white' : 'bg-slate-200/90 text-slate-700'
              }`}
            >
              {otherLinks.length}
            </span>
          </button>
        </div>

        {/* Nút thêm nhanh Trò chơi / Video / Khác cho Giáo viên và Admin */}
        {canManage && (
          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto flex-wrap">
            {(filterType === 'all' || filterType === 'tro_choi') && (
              <button
                type="button"
                onClick={() => handleAddNewResource('tro_choi')}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-caption-safe sm:text-input-button flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-200 shadow-2xs"
                title="Thêm Trò chơi học tập mới vào môn hiện tại"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>+ Trò chơi</span>
              </button>
            )}
            {(filterType === 'all' || filterType === 'video') && (
              <button
                type="button"
                onClick={() => handleAddNewResource('video')}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-caption-safe sm:text-input-button flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200 shadow-2xs"
                title="Thêm Video bài học mới vào môn hiện tại"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>+ Video</span>
              </button>
            )}
            {(filterType === 'all' || filterType === 'khac') && (
              <button
                type="button"
                onClick={() => handleAddNewResource('khac')}
                className="px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-caption-safe sm:text-input-button flex items-center gap-1.5 transition-colors cursor-pointer border border-sky-200 shadow-2xs"
                title="Thêm học liệu khác vào môn hiện tại"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>+ Khác</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4. LƯỚI HIỂN THỊ CHUNG TOÀN BỘ HỌC LIỆU (CSS GRID: 2 ĐẾN 3 CỘT CÂN ĐỐI) */}
      {displayedLinks.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-white border border-dashed border-emerald-200 shadow-xs">
          <span className="text-5xl block mb-3">
            {filterType === 'video' ? '🎬' : filterType === 'tro_choi' ? '🎮' : filterType === 'khac' ? '📁' : '🎯'}
          </span>
          <h3 className="text-title-section text-slate-800 font-bold mb-1">
            {filterType === 'video'
              ? 'Chưa có Video bài giảng nào phù hợp'
              : filterType === 'tro_choi'
              ? 'Chưa có Trò chơi tương tác nào phù hợp'
              : filterType === 'khac'
              ? 'Chưa có học liệu khác nào phù hợp'
              : 'Chưa có học liệu nào phù hợp'}
          </h3>
          <p className="text-desc text-slate-500 mb-5 max-w-md mx-auto">
            {searchQuery || selectedGradeFilter !== 'all' || activeSubjectKey
              ? 'Không tìm thấy học liệu khớp với bộ lọc hiện tại. Hãy thử chọn môn khác hoặc xóa bộ lọc.'
              : displayContext.subtitle}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {(!isAllSubjectsActive || selectedGradeFilter !== 'all' || searchQuery.trim() || onlyPinned || onlyFavorite) && (
              <button
                onClick={handleGoHome}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-input-button transition-colors cursor-pointer"
              >
                Xóa bộ lọc &amp; Xem tất cả
              </button>
            )}
            {canManage && (
              <>
                {(filterType === 'all' || filterType === 'tro_choi') && (
                  <button
                    onClick={() => handleAddNewResource('tro_choi')}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-input-button shadow-xs cursor-pointer"
                  >
                    + Thêm trò chơi tương tác
                  </button>
                )}
                {(filterType === 'all' || filterType === 'video') && (
                  <button
                    onClick={() => handleAddNewResource('video')}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-input-button shadow-xs cursor-pointer"
                  >
                    + Thêm video bài giảng
                  </button>
                )}
                {(filterType === 'all' || filterType === 'khac') && (
                  <button
                    onClick={() => handleAddNewResource('khac')}
                    className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-input-button shadow-xs cursor-pointer"
                  >
                    + Thêm học liệu khác
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {paginatedLinks.map((item) => {
            const isVideo = normalizeResourceType(item.resourceType) === 'video';
            const isOther = normalizeResourceType(item.resourceType) === 'khac';
            const isOwner = Boolean(
              user && (
                (item.creatorId && user.uid && String(item.creatorId) === String(user.uid)) ||
                (item.creatorName && user.displayName && item.creatorName.trim().toLowerCase() === user.displayName.trim().toLowerCase()) ||
                (item.creatorEmail && user.email && item.creatorEmail.trim().toLowerCase() === user.email.trim().toLowerCase())
              )
            );
            const isAssignedTeacher = Boolean(
              isTeacher && (
                (Array.isArray(user?.subjects) && user?.subjects.some((s) => s === item.subject || normalizeSubjectName(s) === normalizeSubjectName(item.subject))) ||
                (!user?.subjects || user.subjects.length === 0)
              )
            );
            const canEditOrDelete = isAdmin || isOwner || isAssignedTeacher;
            const subBadge = getSubjectBadgeInfo(item.subject);

            return (
              <div
                key={item.id}
                className={`group bg-white rounded-2xl sm:rounded-3xl p-5 border transition-all duration-200 flex flex-col justify-between shadow-2xs hover:shadow-md ${
                  item.isPinned
                    ? 'border-amber-300 ring-1 ring-amber-300/40 bg-amber-50/20'
                    : isVideo
                    ? 'border-rose-100 hover:border-rose-300'
                    : isOther
                    ? 'border-sky-100 hover:border-sky-300'
                    : 'border-emerald-100 hover:border-emerald-300'
                }`}
              >
                <div>
                  {/* Meta tags row: Huy hiệu Môn học + Khối lớp + Loại học liệu + Công khai/Riêng tư */}
                  <div className="flex items-center justify-between gap-1 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Huy hiệu môn học với màu sắc nhận diện riêng */}
                      <span
                        className={`text-caption-safe font-black px-2.5 py-0.5 rounded-md border flex items-center gap-1 ${subBadge.bg}`}
                      >
                        <span>{subBadge.icon}</span>
                        <span>{subBadge.name}</span>
                      </span>

                      {/* Huy hiệu Khối lớp với icon cặp sách dễ thương */}
                      <span className="text-caption-safe font-black px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1">
                        <span>🎒</span>
                        <span>{item.grade > 0 ? `Lớp ${item.grade}` : 'Toàn trường'}</span>
                      </span>

                      {/* Chỉ hiển thị huy hiệu Video nếu là Video bài giảng (đã loại bỏ hoàn toàn nhãn Trò chơi) */}
                      {isVideo && (
                        <span className="text-caption-safe font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1 bg-rose-100 text-rose-900 border border-rose-200">
                          <span>🎬 Video</span>
                        </span>
                      )}

                      {/* Hiển thị huy hiệu Khác */}
                      {isOther && (
                        <span className="text-caption-safe font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1 bg-sky-100 text-sky-900 border border-sky-200">
                          <span>📁 Khác</span>
                        </span>
                      )}

                      {/* Chỉ hiển thị nhãn Riêng tư nếu bài học ở chế độ riêng tư (đã ẩn nhãn Công khai) */}
                      {!item.isPublic && (
                        <span className="text-caption-safe font-bold px-2 py-0.5 rounded-md flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300">
                          <Lock className="w-3 h-3 text-amber-700" />
                          <span>Riêng tư</span>
                        </span>
                      )}
                    </div>

                    {/* Nút Ghim & Nút Yêu thích trái tim bo tròn hồng pastel dễ thương */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onToggleFavorite(item)}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-pink-100/70 transition-all cursor-pointer text-base leading-none select-none hover:scale-115 active:scale-90"
                        title={item.isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'}
                      >
                        {item.isFavorite ? '💖' : '🤍'}
                      </button>
                      {canManage && (
                        <button
                          onClick={() => onTogglePin(item)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 cursor-pointer transition-colors"
                          title="Ghim lên đầu"
                        >
                          <Pin
                            className={`w-4 h-4 ${
                              item.isPinned ? 'text-amber-600 fill-amber-600' : ''
                            }`}
                          />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tiêu đề học liệu */}
                  <h4
                    onClick={() => onOpenLink(item)}
                    className={`text-item-title font-black text-slate-900 transition-colors cursor-pointer leading-snug line-clamp-2 mb-2 ${
                      isVideo ? 'group-hover:text-rose-600' : 'group-hover:text-emerald-700'
                    }`}
                  >
                    {item.title}
                  </h4>

                  {/* Bài học / Chủ đề với icon ngôi sao lấp lánh ✨ */}
                  {item.lesson && (
                    <p
                      className={`text-desc font-bold flex items-center gap-1.5 mb-1.5 ${
                        isVideo ? 'text-rose-900' : 'text-emerald-900'
                      }`}
                    >
                      <span className="text-sm shrink-0 leading-none">✨</span>
                      <span className="truncate">{item.lesson}</span>
                    </p>
                  )}

                  {/* Mô tả tóm tắt */}
                  {item.description && (
                    <p className="text-desc text-slate-600 line-clamp-2 leading-relaxed mb-3">
                      {item.description}
                    </p>
                  )}

                  {/* Thông tin Cô giáo & Số bạn đã tham gia thi đua sôi nổi */}
                  <div className="flex items-center justify-between text-caption-safe text-slate-500 mb-3 font-semibold gap-2">
                    <span className="flex items-center gap-1.5 truncate max-w-[170px]">
                      <span className="text-base shrink-0 leading-none">👩‍🏫</span>
                      <strong className="text-slate-700 truncate">{item.creatorName || 'Giáo viên'}</strong>
                    </span>
                    <span className="font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200/70 shrink-0 flex items-center gap-1">
                      <span>🎉</span>
                      <span>{item.playCount || 0} bạn đã tham gia</span>
                    </span>
                  </div>
                </div>

                {/* Cụm nút thao tác ở chân thẻ: CĂN CHÍNH GIỮA (CENTER), THU GỌN VỪA VẶN, GAP ĐỀU */}
                <div
                  className={`pt-3 border-t flex items-center justify-center gap-2 flex-wrap ${
                    isVideo ? 'border-rose-100' : isOther ? 'border-sky-100' : 'border-emerald-100'
                  }`}
                >
                  {/* NÚT THAM GIA: Icon phi thuyền 🚀 phóng vào học liệu */}
                  <button
                    onClick={() => onOpenLink(item)}
                    className={`h-10 px-4 rounded-xl text-white font-black text-input-button inline-flex items-center justify-center gap-2 shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 ${
                      isVideo
                        ? 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-rose-500/20'
                        : isOther
                        ? 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 shadow-sky-500/20'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/20'
                    }`}
                  >
                    <span className="text-base shrink-0 leading-none">🚀</span>
                    <span>Tham gia</span>
                  </button>

                  {/* NÚT GHI NHẬN KẾT QUẢ / BÁO ĐIỂM: Chiếc cúp vàng 🏆 */}
                  <button
                    onClick={() => onRecordScore(item)}
                    title={isVideo ? 'Báo hoàn thành bài học' : 'Báo điểm / Ghi nhận kết quả'}
                    className="w-10 h-10 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 inline-flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 shadow-2xs text-lg leading-none"
                  >
                    <span role="img" aria-label="Cúp vàng">🏆</span>
                  </button>

                  {/* NÚT SAO CHÉP LIÊN KẾT: Icon móc xích 🔗 */}
                  <button
                    onClick={() => handleCopy(item.id, item.url)}
                    title="Sao chép link"
                    className="w-10 h-10 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 inline-flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 shadow-2xs text-base leading-none"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <span role="img" aria-label="Sao chép link">🔗</span>
                    )}
                  </button>

                  {/* CHỈ ADMIN HOẶC CHỦ SỞ HỮU MỚI ĐƯỢC SỬA / XÓA */}
                  {canEditOrDelete && (
                    <>
                      <button
                        onClick={() => onEdit(item)}
                        className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-emerald-700 border border-slate-200 inline-flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        title="Sửa học liệu"
                      >
                        <Edit2 className="w-4 h-4 shrink-0" />
                      </button>
                      <button
                        onClick={() => onDelete(item)}
                        className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-rose-100 text-slate-600 hover:text-rose-600 border border-slate-200 inline-flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        title="Xóa học liệu"
                      >
                        <Trash2 className="w-4 h-4 shrink-0" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* THANH ĐIỀU KHIỂN PHÂN TRANG (PAGINATION) CĂN CHÍNH GIỮA */}
        {totalPages > 1 && (
          <div className="mt-8 pt-4 border-t border-emerald-100 flex flex-col items-center justify-center gap-3 select-none">
            {/* Thông tin số lượng bài học hiển thị */}
            <div className="text-caption-safe sm:text-desc font-bold text-slate-500 text-center">
              Hiển thị bài <strong className="text-emerald-700 font-black">{(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}</strong> - <strong className="text-emerald-700 font-black">{Math.min(safeCurrentPage * ITEMS_PER_PAGE, totalItems)}</strong> trong tổng số <strong className="text-slate-800 font-black">{totalItems}</strong> học liệu • Trang <strong className="text-emerald-800 font-black">{safeCurrentPage}</strong> / {totalPages}
            </div>

            {/* Cụm nút điều hướng: Trang trước - Các số trang bo tròn mềm mại - Trang sau */}
            <div className="inline-flex items-center justify-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-white rounded-2xl sm:rounded-3xl border border-emerald-200 shadow-sm flex-wrap max-w-full">
              {/* Nút ◀ Trang trước */}
              <button
                type="button"
                onClick={() => handlePageChange(safeCurrentPage - 1)}
                disabled={safeCurrentPage === 1}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-input-button font-black flex items-center gap-1.5 transition-all duration-200 select-none ${
                  safeCurrentPage === 1
                    ? 'opacity-40 cursor-not-allowed text-slate-400 bg-slate-50'
                    : 'text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100 active:scale-95 cursor-pointer shadow-2xs'
                }`}
              >
                <span>◀</span>
                <span className="hidden sm:inline">Trang trước</span>
              </button>

              {/* Danh sách các số trang bo tròn mềm mại */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                {getPaginationRange(safeCurrentPage, totalPages).map((p, idx) => {
                  if (p === '...') {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        className="w-8 sm:w-10 h-9 sm:h-10 flex items-center justify-center text-slate-400 font-black select-none text-sm"
                      >
                        •••
                      </span>
                    );
                  }

                  const pageNum = p as number;
                  const isActive = pageNum === safeCurrentPage;

                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => handlePageChange(pageNum)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`w-9 sm:w-10 h-9 sm:h-10 rounded-xl sm:rounded-2xl text-input-button font-black transition-all duration-200 flex items-center justify-center cursor-pointer select-none ${
                        isActive
                          ? 'bg-emerald-700 text-white shadow-md shadow-emerald-800/30 ring-2 ring-emerald-600 scale-105'
                          : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200/80 shadow-2xs active:scale-95'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Nút Trang sau ▶ */}
              <button
                type="button"
                onClick={() => handlePageChange(safeCurrentPage + 1)}
                disabled={safeCurrentPage === totalPages}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-input-button font-black flex items-center gap-1.5 transition-all duration-200 select-none ${
                  safeCurrentPage === totalPages
                    ? 'opacity-40 cursor-not-allowed text-slate-400 bg-slate-50'
                    : 'text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100 active:scale-95 cursor-pointer shadow-2xs'
                }`}
              >
                <span className="hidden sm:inline">Trang sau</span>
                <span>▶</span>
              </button>
            </div>
          </div>
        )}
      </div>
    )}
    </div>
  );
};
