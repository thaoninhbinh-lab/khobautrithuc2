import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import {
  LinkItem,
  StudyRecord,
  SubjectType,
  GradeLevel,
  ResourceType,
  ToastMessage,
  UserProfile,
  AccessLog,
  SubjectCard,
  DEFAULT_SCHOOL_NAME,
} from './types';
import {
  fetchLinks,
  createLink,
  updateLinkItem,
  deleteLinkItem,
  fetchStudyRecords,
  createStudyRecord,
  deleteStudyRecord,
  fetchUsers,
  deleteUser,
  updateUserApproval,
  fetchAccessLogs,
  logAccess,
  exportBackupJSON,
  fetchSubjectCards,
  createSubjectCard,
  updateSubjectCard,
  deleteSubjectCard,
} from './services/storageService';
import {
  subscribeToSupabaseVisits,
  convertSupabaseVisitToAccessLog,
  incrementLessonPlayInSupabase,
} from './services/supabaseService';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { LinkModal } from './components/LinkModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { StudentScoreModal } from './components/StudentScoreModal';
import { StatsDashboard } from './components/StatsDashboard';
import { SharedCollectionModal } from './components/SharedCollectionModal';
import { DeploymentGuideModal } from './components/DeploymentGuideModal';
import { StudentCorner } from './components/StudentCorner';
import { ThreeColumnResourceView } from './components/ThreeColumnResourceView';
import { RoleLoginModal } from './components/RoleLoginModal';
import { SubjectCardModal } from './components/SubjectCardModal';
import { Toast } from './components/Toast';
import {
  Download,
  Database,
} from 'lucide-react';
import { SupabaseConfigSection } from './components/SupabaseConfigSection';

const MainApp: React.FC = () => {
  const { user, isAuthenticated, isAdmin, isTeacher, isStudent } = useAuth();

  // Dữ liệu chính
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [records, setRecords] = useState<StudyRecord[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [subjectCards, setSubjectCards] = useState<SubjectCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Tab hiện tại (thêm tab 'supabase' có thể truy cập trực tiếp từ Header)
  const [currentTab, setCurrentTab] = useState<'resources' | 'student-corner' | 'stats' | 'guide' | 'supabase'>('resources');

  // Preset khi bấm thêm bài vào đúng cột (Trò chơi học tập hoặc Video)
  const [presetSubject, setPresetSubject] = useState<SubjectType>('toan');
  const [presetGrade, setPresetGrade] = useState<GradeLevel>(1);
  const [presetType, setPresetType] = useState<ResourceType>('tro_choi');

  // Modal states
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isRoleLoginOpen, setIsRoleLoginOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LinkItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<LinkItem | null>(null);
  const [scoreTargetItem, setScoreTargetItem] = useState<LinkItem | null>(null);
  const [isSharedModalOpen, setIsSharedModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubjectCard, setEditingSubjectCard] = useState<SubjectCard | null>(null);
  const [deletingSubjectCard, setDeletingSubjectCard] = useState<SubjectCard | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Tải dữ liệu ban đầu
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [lList, rList, uList, logList, sCards] = await Promise.all([
          fetchLinks(),
          fetchStudyRecords(),
          fetchUsers(),
          fetchAccessLogs(),
          fetchSubjectCards(user),
        ]);
        setLinks(lList);
        setRecords(rList);
        setUsers(uList);
        setAccessLogs(logList);
        setSubjectCards(sCards);
        // Mặc định luôn để 'all' để người dùng xem toàn bộ học liệu của tất cả các môn và lớp
        if (selectedCardId !== 'all' && sCards.length > 0 && !sCards.some((c) => c.id === selectedCardId)) {
          setSelectedCardId('all');
        }
      } catch (err) {
        console.error('Lỗi nạp dữ liệu:', err);
        addToast('Có lỗi xảy ra khi nạp dữ liệu.', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // Cập nhật lại danh sách môn học khi đổi người dùng đăng nhập (đặc biệt Giáo viên)
  useEffect(() => {
    fetchSubjectCards(user).then((cards) => {
      setSubjectCards(cards);
      if (selectedCardId !== 'all' && cards.length > 0 && !cards.some((c) => c.id === selectedCardId)) {
        setSelectedCardId('all');
      }
    }).catch((err) => console.warn('Lỗi cập nhật môn học:', err));
  }, [user?.uid, user?.role]);

  // Đăng ký nhận thông báo thời gian thực từ Supabase Realtime khi có lượt truy cập mới
  useEffect(() => {
    const unsubscribe = subscribeToSupabaseVisits((newVisit) => {
      const convertedLog = convertSupabaseVisitToAccessLog(newVisit);
      setAccessLogs((prev) => {
        if (prev.some((p) => p.id === convertedLog.id)) return prev;
        return [convertedLog, ...prev];
      });
      // Cập nhật lượt chơi trực tiếp cho học liệu
      setLinks((prev) =>
        prev.map((l) =>
          l.id === convertedLog.linkId ? { ...l, playCount: (l.playCount || 0) + 1 } : l
        )
      );
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Hành động với liên kết: mở link, tăng lượt chơi và tự động ghi nhật ký truy cập
  const handleJoinLesson = async (item: LinkItem) => {
    // 1. Luôn mở liên kết đích trong tab mới để học sinh không bị gián đoạn học tập
    window.open(item.url, '_blank', 'noopener,noreferrer');

    // 2. Phản hồi tức thì trên giao diện (Optimistic UI)
    const optimisticCount = (item.playCount || 0) + 1;
    setLinks((prev) =>
      prev.map((l) => (l.id === item.id ? { ...l, playCount: optimisticCount } : l))
    );

    // 3. Cơ chế chống ghi nhận lặp ngoài ý muốn (Debounce 15 giây cho việc ghi vào cơ sở dữ liệu)
    const debounceKey = `kbtt_last_open_${user?.uid || 'guest'}_${item.id}`;
    const now = Date.now();
    const lastOpenStr = sessionStorage.getItem(debounceKey);
    const lastOpen = lastOpenStr ? Number(lastOpenStr) : 0;
    const DEBOUNCE_WINDOW_MS = 15000; // 15 giây

    if (now - lastOpen < DEBOUNCE_WINDOW_MS) {
      // Đang trong khoảng thời gian chống nhấp lặp: không cộng dồn và không ghi log trùng lặp
      return;
    }
    sessionStorage.setItem(debounceKey, String(now));

    // 4. Tăng số lượt chơi trên Supabase cho cả cột play_count và thuộc tính content->playCount
    try {
      const res = await incrementLessonPlayInSupabase(item.id);
      if (res.success && res.newPlayCount !== undefined) {
        setLinks((prev) =>
          prev.map((l) => (l.id === item.id ? { ...l, playCount: res.newPlayCount! } : l))
        );
      }
    } catch (e) {
      console.warn('Lỗi tăng play_count:', e);
    }

    // 5. Tự động ghi thêm 1 dòng nhật ký vào bảng link_visits và Access Logs
    try {
      const newLog = await logAccess({
        userId: user?.uid || 'guest',
        userName: user?.displayName || (user ? 'Học sinh' : 'Khách / Học sinh'),
        userRole: user?.role || 'student',
        school: user?.school || 'Tiểu học',
        className: user?.assignedClass || '',
        linkId: item.id,
        linkTitle: item.title,
        subject: item.subject,
        grade: item.grade,
        resourceType: item.resourceType,
        action: 'open_link',
        timestamp: new Date().toISOString(),
      });
      setAccessLogs((prev) => [newLog, ...prev]);
    } catch (e) {
      console.warn('Lỗi ghi access log:', e);
    }
  };

  const handleOpenLink = handleJoinLesson;

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    addToast('Đã sao chép liên kết vào bộ nhớ tạm!');
  };

  const handleTogglePin = async (item: LinkItem) => {
    const updated = !item.isPinned;
    await updateLinkItem(item.id, { isPinned: updated });
    setLinks((prev) => prev.map((l) => (l.id === item.id ? { ...l, isPinned: updated } : l)));
    addToast(updated ? 'Đã ghim học liệu lên đầu!' : 'Đã bỏ ghim học liệu.');
  };

  const handleToggleFavorite = async (item: LinkItem) => {
    const updated = !item.isFavorite;
    await updateLinkItem(item.id, { isFavorite: updated });
    setLinks((prev) => prev.map((l) => (l.id === item.id ? { ...l, isFavorite: updated } : l)));
    addToast(updated ? 'Đã thêm vào mục yêu thích ❤️' : 'Đã bỏ yêu thích.');
  };

  const handleSaveLink = async (data: Omit<LinkItem, 'id'>) => {
    try {
      if (editingItem) {
        await updateLinkItem(editingItem.id, data, user);
        setLinks((prev) =>
          prev.map((l) =>
            String(l.id) === String(editingItem.id) ? { ...l, ...data, id: l.id } : l
          )
        );
        addToast('Cập nhật học liệu thành công!', 'success');
        setEditingItem(null);
        setIsLinkModalOpen(false);
      } else {
        const created = await createLink(data);
        setLinks((prev) => [created, ...prev]);
        addToast(
          data.isPublic
            ? 'Đã thêm học liệu ở chế độ Công khai thành công! 🌐'
            : 'Đã thêm học liệu ở chế độ Riêng tư thành công! 🔒',
          'success'
        );
        setIsLinkModalOpen(false);
      }
    } catch (err: any) {
      addToast(err.message || 'Không thể lưu học liệu.', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    try {
      await deleteLinkItem(deletingItem.id, user);
      setLinks((prev) => prev.filter((l) => l.id !== deletingItem.id));
      addToast('Đã xóa học liệu thành công.');
    } catch (err: any) {
      addToast(err.message || 'Không thể xóa học liệu.', 'error');
    }
    setDeletingItem(null);
  };

  const handleSaveStudyRecord = async (record: Omit<StudyRecord, 'id'>) => {
    const created = await createStudyRecord(record);
    setRecords((prev) => [created, ...prev]);

    // Ghi nhật ký báo điểm
    try {
      const newLog = await logAccess({
        userId: user?.uid || 'student',
        userName: record.studentName,
        userRole: 'student',
        school: user?.school || record.school || DEFAULT_SCHOOL_NAME,
        className: record.className,
        linkId: record.linkId,
        linkTitle: record.linkTitle,
        subject: record.subject,
        grade: record.grade,
        resourceType: record.resourceType,
        action: 'submit_score',
        score: record.score,
        timestamp: new Date().toISOString(),
      });
      setAccessLogs((prev) => [newLog, ...prev]);
    } catch (e) {
      console.warn('Lỗi ghi log báo điểm:', e);
    }

    addToast('Ghi nhận kết quả học tập thành công! 🎉');
  };

  const handleDeleteStudyRecord = async (id: string) => {
    await deleteStudyRecord(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
    addToast('Đã xóa bản ghi kết quả.');
  };

  const handleDeleteUser = async (userId: string) => {
    await deleteUser(userId);
    setUsers((prev) => prev.filter((u) => u.uid !== userId));
    addToast('Đã xóa thành viên khỏi hệ thống thành công.');
  };

  const handleUpdateUserApproval = async (
    userId: string,
    status: 'approved' | 'rejected' | 'pending'
  ) => {
    const updated = await updateUserApproval(userId, status);
    setUsers(updated);
    addToast(
      status === 'approved'
        ? 'Đã phê duyệt tài khoản giáo viên thành công! Thầy/Cô đã có quyền quản lý học liệu.'
        : 'Đã cập nhật trạng thái phê duyệt giáo viên.',
      'success'
    );
  };

  // Bảo vệ tab Thống kê, Hướng dẫn Deploy và Cấu hình Supabase: Chỉ hiển thị với Quản trị viên (hoặc Giáo viên cho Thống kê)
  useEffect(() => {
    if (currentTab === 'stats' && !isAdmin && !isTeacher) {
      setCurrentTab('resources');
    }
    if (currentTab === 'guide' && !isAdmin) {
      setCurrentTab('resources');
    }
    if (currentTab === 'supabase' && !isAdmin) {
      setCurrentTab('resources');
    }
  }, [currentTab, isAdmin, isTeacher]);


  // Handlers cho Thẻ Môn học & Lớp (Giáo viên tự tạo môn học)
  const handleSaveSubjectCard = async (data: {
    name: string;
    className: string;
    description?: string;
  }) => {
    if (editingSubjectCard) {
      const updated = await updateSubjectCard(editingSubjectCard.id, data, user);
      setSubjectCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setSelectedCardId(updated.id);
      addToast(`Đã cập nhật môn "${updated.name} - ${updated.className}" thành công!`, 'success');
    } else {
      const created = await createSubjectCard(data, user);
      setSubjectCards((prev) => [created, ...prev]);
      setSelectedCardId(created.id);
      addToast(`Tạo môn học "${created.name} - ${created.className}" thành công! 🎉`, 'success');
    }
  };

  const handleDeleteSubjectCardConfirm = async () => {
    if (!deletingSubjectCard) return;

    const card = deletingSubjectCard;
    const cardName = (card.name || '').toLowerCase().trim();
    const cardId = card.id.toLowerCase();
    const cleanClass = (card.className || '').toLowerCase().trim();

    const count = links.filter((l) => {
      const lSub = (l.subject || '').toLowerCase().trim();
      const matchSub =
        lSub === cardId ||
        lSub === cardName ||
        (cardId.startsWith('tinhoc') && (lSub === 'tinhoc' || lSub.includes('tin'))) ||
        (cardId.startsWith('congnghe') && (lSub === 'congnghe' || lSub.includes('công')));

      const lText = (l.lesson || '') + ' ' + (l.title || '');
      const matchGrd =
        l.grade === card.grade ||
        l.grade === 0 ||
        (cleanClass && lText.toLowerCase().includes(cleanClass));

      return matchSub && matchGrd;
    }).length;

    try {
      await deleteSubjectCard(card.id, count, user);
      setSubjectCards((prev) => prev.filter((c) => c.id !== card.id));
      if (selectedCardId === card.id) {
        setSelectedCardId('all');
      }
      addToast(`Đã xóa thẻ môn học "${card.name} - ${card.className}" thành công.`, 'info');
      setDeletingSubjectCard(null);
    } catch (err: any) {
      addToast(err.message || 'Không thể xóa thẻ môn học.', 'error');
      setDeletingSubjectCard(null);
    }
  };

  // Mở modal thêm bài vào đúng mục đã chọn (Trò chơi học tập hoặc Video)
  const handleAddNewToColumn = (
    subject: string,
    grade: number,
    type: ResourceType,
    className?: string
  ) => {
    let normSub: SubjectType = 'toan';
    const lower = (subject || '').toLowerCase().trim();
    if (lower.includes('toán') || lower === 'toan') normSub = 'toan';
    else if (lower.includes('việt') || lower === 'tiengviet') normSub = 'tiengviet';
    else if (lower.includes('anh') || lower === 'tienganh') normSub = 'tienganh';
    else if (lower.includes('địa') || lower === 'diali') normSub = 'diali';
    else if (lower.includes('sử') || lower === 'lichsu') normSub = 'lichsu';
    else if (lower.includes('tin') || lower === 'tinhoc') normSub = 'tinhoc';
    else if (lower.includes('công') || lower.includes('cong')) normSub = 'congnghe';
    else if (lower.includes('khoa') || lower === 'khoahoc') normSub = 'khoahoc';
    else if (lower.includes('đạo') || lower === 'daoduc') normSub = 'daoduc';
    else if (lower.includes('trải nghiệm') || lower === 'hdtn') normSub = 'hdtn';
    else normSub = lower as SubjectType;

    setPresetSubject(normSub);
    setPresetGrade(((grade >= 1 && grade <= 5) ? grade : 1) as GradeLevel);
    setPresetType(type);
    setEditingItem(null);
    setIsLinkModalOpen(true);
  };

  const activeSubjectCard = selectedCardId === 'all'
    ? null
    : subjectCards.find((c) => c.id === selectedCardId) || null;

  return (
    <div className="min-h-screen flex flex-col bg-emerald-50/40">
      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* Header */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenAddModal={() => {
          setEditingItem(null);
          setIsLinkModalOpen(true);
        }}
        onOpenSharedModal={() => setIsSharedModalOpen(true)}
        onOpenRoleLogin={() => setIsRoleLoginOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB 1: KHO HỌC LIỆU */}
        {currentTab === 'resources' && (
          <div className="space-y-4">
            {/* Banner trang web Tin học & Công nghệ 3 - 4 - 5 thay thế cho dòng 3 cột / dạng lưới */}
            <HeroBanner
              onExploreClick={() => {
                const el = document.getElementById('three-column-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onOpenRoleLogin={() => setIsRoleLoginOpen(true)}
              onOpenAddModal={() => {
                setEditingItem(null);
                setIsLinkModalOpen(true);
              }}
            />

            {/* Thanh thông báo & lối tắt nhanh Cấu hình Supabase - Chỉ hiển thị cho tài khoản Admin */}
            {isAdmin && (
              <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-2xl bg-gradient-to-r from-teal-50 via-emerald-50 to-sky-50 border border-emerald-200 shadow-2xs mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-base sm:text-lg font-black text-slate-900">Cơ Sở Dữ Liệu Supabase</span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-caption-safe font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Đã kết nối Live
                      </span>
                    </div>
                    <p className="text-desc text-slate-600 font-medium mt-0.5">
                      Đã nạp kho học liệu 10 môn học vào Supabase • Tự động lưu bài mới, môn học và bảng điểm học sinh
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setCurrentTab('supabase')}
                  className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-input-button shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <span>⚡ Mở Cấu hình &amp; Kiểm tra 5 Bảng</span>
                </button>
              </div>
            )}

            {loading ? (
              <div className="py-24 text-center">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-main-body font-bold text-slate-600">Đang nạp kho học liệu Nguồn sáng tri thức...</p>
              </div>
            ) : (
              /* GIAO DIỆN 3 CỘT THEO MỤC (QUIZIZZ, GAME TƯƠNG TÁC, VIDEO BÀI HỌC) LÀ MẶC ĐỊNH */
              <div id="three-column-section">
                <ThreeColumnResourceView
                  links={links}
                  canManage={isAuthenticated && (isAdmin || isTeacher)}
                  subjectCards={subjectCards}
                  selectedCardId={selectedCardId}
                  onSelectCard={setSelectedCardId}
                  onOpenLink={handleOpenLink}
                  onCopyLink={handleCopyLink}
                  onTogglePin={handleTogglePin}
                  onToggleFavorite={handleToggleFavorite}
                  onEdit={(it) => {
                    setEditingItem(it);
                    setIsLinkModalOpen(true);
                  }}
                  onDelete={(it) => setDeletingItem(it)}
                  onRecordScore={(it) => setScoreTargetItem(it)}
                  onAddNewToColumn={handleAddNewToColumn}
                  onOpenShareModal={() => setIsSharedModalOpen(true)}
                  onAddSubjectClick={() => {
                    setEditingSubjectCard(null);
                    setIsSubjectModalOpen(true);
                  }}
                  onEditSubjectClick={(card) => {
                    setEditingSubjectCard(card);
                    setIsSubjectModalOpen(true);
                  }}
                  onDeleteSubjectClick={(card) => {
                    setDeletingSubjectCard(card);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GÓC HỌC SINH & LỊCH SỬ CÁ NHÂN */}
        {currentTab === 'student-corner' && (
          <StudentCorner
            links={links}
            records={records}
            accessLogs={accessLogs}
            onOpenLink={handleOpenLink}
            onRecordScore={(it) => setScoreTargetItem(it)}
          />
        )}

        {/* TAB 3: THỐNG KÊ LƯỢT TRUY CẬP & QUẢN TRỊ (DÀNH CHO QUẢN TRỊ VIÊN & GIÁO VIÊN) */}
        {currentTab === 'stats' && (isAdmin || isTeacher) && (
          <StatsDashboard
            records={records}
            links={links}
            users={users}
            accessLogs={accessLogs}
            onDeleteRecord={handleDeleteStudyRecord}
            onDeleteUser={handleDeleteUser}
            onUpdateUserApproval={handleUpdateUserApproval}
          />
        )}

        {/* TAB 4: HƯỚNG DẪN VERCEL & FIREBASE */}
        {currentTab === 'guide' && (
          <DeploymentGuideModal onCopyNotice={(msg) => addToast(msg, 'info')} />
        )}

        {/* TAB 5: CẤU HÌNH & KẾT NỐI SUPABASE DATABASE (CHỈ QUẢN TRỊ VIÊN) */}
        {currentTab === 'supabase' && isAdmin && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <SupabaseConfigSection onSuccessNotice={addToast} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-emerald-100 py-6 mt-12 text-center text-xs text-slate-500 font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base">✨</span>
            <span className="font-bold text-slate-800">Kho báu tri thức</span>
            <span>— Đồng hành cùng giáo viên & học sinh Tiểu học</span>
          </div>

          <div className="flex items-center gap-4 flex-wrap justify-center">
            {isAdmin && (
              <>
                <button
                  onClick={() => setCurrentTab('supabase')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>⚡ Cấu hình Supabase</span>
                </button>
                <span>•</span>
              </>
            )}
            <button
              onClick={() => exportBackupJSON(links)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Sao lưu dữ liệu JSON</span>
            </button>
            <span>•</span>
            <button
              onClick={() => setCurrentTab('guide')}
              className="text-xs font-bold text-teal-700 hover:text-teal-800 cursor-pointer"
            >
              Tài liệu Deploy Vercel
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <RoleLoginModal
        isOpen={isRoleLoginOpen}
        onClose={() => setIsRoleLoginOpen(false)}
        onSuccessNotice={(msg) => addToast(msg, 'success')}
      />

      <LinkModal
        isOpen={isLinkModalOpen}
        onClose={() => {
          setIsLinkModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveLink}
        editingItem={editingItem}
        defaultSubject={presetSubject}
        defaultGrade={presetGrade}
        defaultType={presetType}
        availableCards={subjectCards}
        activeCard={activeSubjectCard}
      />

      <SubjectCardModal
        isOpen={isSubjectModalOpen}
        onClose={() => {
          setIsSubjectModalOpen(false);
          setEditingSubjectCard(null);
        }}
        onSave={handleSaveSubjectCard}
        editingCard={editingSubjectCard}
        existingCards={subjectCards}
        onOpenExistingCard={(card) => {
          setSelectedCardId(card.id);
          setIsSubjectModalOpen(false);
          setEditingSubjectCard(null);
          addToast(`Đã chuyển tới thẻ môn học "${card.name} - ${card.className}"`);
        }}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deletingSubjectCard)}
        title="Xác nhận xóa môn học"
        itemName={deletingSubjectCard ? `${deletingSubjectCard.name} - ${deletingSubjectCard.className}` : ''}
        onConfirm={handleDeleteSubjectCardConfirm}
        onCancel={() => setDeletingSubjectCard(null)}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deletingItem)}
        title="Xác nhận xóa học liệu"
        itemName={deletingItem?.title || ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingItem(null)}
      />

      <StudentScoreModal
        isOpen={Boolean(scoreTargetItem)}
        onClose={() => setScoreTargetItem(null)}
        linkItem={scoreTargetItem}
        onSaveRecord={handleSaveStudyRecord}
      />

      <SharedCollectionModal
        isOpen={isSharedModalOpen}
        onClose={() => setIsSharedModalOpen(false)}
        onCopyNotice={(msg) => addToast(msg, 'info')}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
