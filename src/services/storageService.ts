import { LinkItem, StudyRecord, UserProfile, AccessLog, SubjectCard, ResourceType, DEFAULT_SCHOOL_NAME } from '../types';
import { INITIAL_LINKS, INITIAL_STUDY_RECORDS, INITIAL_USERS, INITIAL_ACCESS_LOGS } from './mockData';
import { db, isFirebaseConfigured } from '../firebase/config';
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  setDoc,
} from 'firebase/firestore';
import { getSupabaseConfig } from '../supabase/client';
import {
  recordLinkVisitInSupabase,
  fetchLinkVisitsFromSupabase,
  convertSupabaseVisitToAccessLog,
  fetchProfilesFromSupabase,
  saveProfileToSupabase,
  deleteProfileFromSupabase,
  fetchLessonsFromSupabase,
  createLessonInSupabase,
  updateLessonInSupabase,
  deleteLessonInSupabase,
  fetchLearningResultsFromSupabase,
  createLearningResultInSupabase,
  deleteLearningResultInSupabase,
  fetchSubjectCardsFromSupabase,
  saveSubjectCardToSupabase,
  deleteSubjectCardFromSupabase,
  getSubjectDefaultIcon,
  getSubjectDefaultColor,
} from './supabaseService';

const STORAGE_KEY_LINKS = 'kbtt_links_v3_revamp';
const STORAGE_KEY_RECORDS = 'kbtt_records_v3_revamp';
const STORAGE_KEY_USERS = 'kbtt_users_v3_revamp';
const STORAGE_KEY_LOGS = 'kbtt_logs_v3_revamp';
export const STORAGE_KEY_TEACHER_SCHOOLS = 'kbtt_teacher_school_records_v1';
export const STORAGE_KEY_LAST_SCHOOL = 'kbtt_last_used_school_name';
const STORAGE_KEY_SUBJECT_CARDS = 'kbtt_subject_cards_v3_revamp';

// ========================================================
// 10 MÔN HỌC MẶC ĐỊNH CHUẨN CỦA HỆ THỐNG
// ========================================================
export interface SystemSubjectConfig {
  id: string;
  name: string;
  icon: string;
  themeColor: string;
  grades: number[];
  description: string;
}

export const SYSTEM_DEFAULT_SUBJECTS: SystemSubjectConfig[] = [
  {
    id: 'toan',
    name: 'Toán',
    icon: '🔢',
    themeColor: 'blue',
    grades: [1, 2, 3, 4, 5],
    description: 'Số học, phép tính & toán tư duy',
  },
  {
    id: 'tiengviet',
    name: 'Tiếng Việt',
    icon: '📚',
    themeColor: 'rose',
    grades: [1, 2, 3, 4, 5],
    description: 'Tập đọc, chính tả, luyện từ và câu',
  },
  {
    id: 'tienganh',
    name: 'Tiếng Anh',
    icon: '🔤',
    themeColor: 'indigo',
    grades: [1, 2, 3, 4, 5],
    description: 'Từ vựng, ngữ pháp & giao tiếp thiếu nhi',
  },
  {
    id: 'diali',
    name: 'Địa Lý',
    icon: '🗺️',
    themeColor: 'teal',
    grades: [3, 4, 5],
    description: 'Địa lý Việt Nam, bản đồ & thiên nhiên',
  },
  {
    id: 'lichsu',
    name: 'Lịch Sử',
    icon: '🚩',
    themeColor: 'amber',
    grades: [3, 4, 5],
    description: 'Lịch sử dựng nước và giữ nước hào hùng',
  },
  {
    id: 'tinhoc',
    name: 'Tin học',
    icon: '🤖',
    themeColor: 'emerald',
    grades: [1, 2, 3, 4, 5],
    description: 'Làm quen máy tính, soạn thảo, internet & Scratch',
  },
  {
    id: 'congnghe',
    name: 'Công nghệ',
    icon: '🌱',
    themeColor: 'orange',
    grades: [3, 4, 5],
    description: 'Đồ dùng điện, lắp ghép mô hình kỹ thuật & STEM',
  },
  {
    id: 'khoahoc',
    name: 'Khoa học',
    icon: '🧪',
    themeColor: 'purple',
    grades: [4, 5],
    description: 'Con người, sức khỏe, vật chất & năng lượng',
  },
  {
    id: 'daoduc',
    name: 'Đạo đức',
    icon: '💖',
    themeColor: 'red',
    grades: [1, 2, 3, 4, 5],
    description: 'Kỹ năng sống, lòng nhân ái & chuẩn mực',
  },
  {
    id: 'hdtn',
    name: 'HĐTN',
    icon: '🎨',
    themeColor: 'amber',
    grades: [1, 2, 3, 4, 5],
    description: 'Hoạt động trải nghiệm sáng tạo & kỹ năng',
  },
];

// Khởi tạo các thẻ mặc định theo đúng các lớp yêu cầu
export const DEFAULT_SUBJECT_CARDS: SubjectCard[] = SYSTEM_DEFAULT_SUBJECTS.flatMap((sub) =>
  sub.grades.map((g) => ({
    id: `${sub.id}-${g}`,
    name: sub.name,
    grade: g,
    className: `Lớp ${g}`,
    icon: sub.icon,
    themeColor: sub.themeColor,
    description: `${sub.name} Lớp ${g} - ${sub.description}`,
    isDefault: true,
  }))
);

// Chuẩn hóa loại học liệu về đúng 2 loại: 'tro_choi' hoặc 'video'
export const normalizeResourceType = (type: any): ResourceType => {
  if (type === 'video') return 'video';
  return 'tro_choi';
};

// Chuẩn hóa tên môn học để gom nhóm
export const normalizeSubjectName = (name: string): string => {
  const trimmed = (name || '').trim();
  const lower = trimmed.toLowerCase();
  if (lower === 'toán' || lower === 'toan') return 'Toán';
  if (lower === 'tiếng việt' || lower === 'tieng viet' || lower === 'tiengviet') return 'Tiếng Việt';
  if (lower === 'tiếng anh' || lower === 'tieng anh' || lower === 'english') return 'Tiếng Anh';
  if (lower === 'địa lý' || lower === 'địa lí' || lower === 'dia ly' || lower === 'diali') return 'Địa Lý';
  if (lower === 'lịch sử' || lower === 'lich su' || lower === 'lichsu') return 'Lịch Sử';
  if (lower === 'tin học' || lower === 'tin hoc' || lower === 'tinhoc') return 'Tin học';
  if (lower === 'công nghệ' || lower === 'cong nghe' || lower === 'congnghe') return 'Công nghệ';
  if (lower === 'khoa học' || lower === 'khoa hoc' || lower === 'khoahoc') return 'Khoa học';
  if (lower === 'đạo đức' || lower === 'dao duc' || lower === 'daoduc') return 'Đạo đức';
  if (lower === 'hđtn' || lower === 'hdtn' || lower.includes('trải nghiệm')) return 'HĐTN';
  return trimmed;
};

// ========================================================
// QUẢN LÝ KHO HỌC LIỆU CHUNG (LINKS)
// ========================================================

// Lấy danh sách liên kết từ Supabase thực tế (không dùng dữ liệu giả lập)
export const fetchLinks = async (): Promise<LinkItem[]> => {
  // 1. Nguồn dữ liệu chính: Bảng lessons trên Supabase Database
  const supaConf = getSupabaseConfig();
  if (supaConf.isConfigured) {
    try {
      const supaLessons = await fetchLessonsFromSupabase();
      // Chuẩn hóa loại học liệu về đúng 2 loại: tro_choi hoặc video
      const normalized = (supaLessons || []).map((l) => ({
        ...l,
        resourceType: normalizeResourceType(l.resourceType),
      }));
      saveLocalLinks(normalized);
      return normalized;
    } catch (e: any) {
      console.warn('Lỗi đọc lessons từ Supabase:', e);
      throw new Error(e?.message || 'Không thể tải học liệu từ máy chủ Supabase. Vui lòng thử lại.');
    }
  }

  // 2. Chế độ LocalStorage (khi chưa kết nối Supabase)
  const saved = localStorage.getItem(STORAGE_KEY_LINKS);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map((l) => ({
          ...l,
          resourceType: normalizeResourceType(l.resourceType),
        }));
      }
    } catch {
      // parse fallback
    }
  }

  // Khi chưa có dữ liệu, trả về mảng rỗng [] (tuyệt đối không dùng dữ liệu giả)
  return [];
};

// Lưu danh sách liên kết vào LocalStorage
const saveLocalLinks = (links: LinkItem[]) => {
  localStorage.setItem(STORAGE_KEY_LINKS, JSON.stringify(links));
};

// Thêm liên kết mới vào kho học liệu chung
export const createLink = async (item: Omit<LinkItem, 'id'>): Promise<LinkItem> => {
  let createdId: string | null = null;
  const normalizedItem = {
    ...item,
    resourceType: normalizeResourceType(item.resourceType),
  };

  // 1. Ghi vào bảng lessons trên Supabase
  const supaConf = getSupabaseConfig();
  if (supaConf.isConfigured) {
    try {
      createdId = await createLessonInSupabase(normalizedItem);
    } catch (e) {
      console.warn('Lỗi ghi Supabase lesson:', e);
    }
  }

  // 2. Ghi dự phòng lên Firebase Firestore
  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, 'links'), normalizedItem);
      createdId = createdId || docRef.id;
    } catch (err) {
      console.warn('Lỗi thêm tài liệu Firestore, lưu cục bộ:', err);
    }
  }

  const current = await fetchLinks();
  const newItem: LinkItem = {
    ...normalizedItem,
    id: createdId || ('link_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)),
  };
  const updated = [newItem, ...current];
  saveLocalLinks(updated);
  return newItem;
};

// Cập nhật liên kết
export const updateLinkItem = async (
  id: string,
  updates: Partial<LinkItem>,
  user?: UserProfile | null
): Promise<void> => {
  const current = await fetchLinks();
  const existing = current.find((l) => l.id === id);

  // Kiểm tra quyền: Chỉ Admin hoặc chính chủ sở hữu mới được sửa
  if (user && user.role !== 'admin' && existing && existing.creatorId !== user.uid) {
    throw new Error('Bạn chỉ có quyền chỉnh sửa học liệu do chính mình tạo!');
  }

  const normalizedUpdates = {
    ...updates,
    ...(updates.resourceType ? { resourceType: normalizeResourceType(updates.resourceType) } : {}),
  };

  // 1. Cập nhật bảng lessons trên Supabase
  const supaConf = getSupabaseConfig();
  if (supaConf.isConfigured) {
    try {
      await updateLessonInSupabase(id, normalizedUpdates);
    } catch (e) {
      console.warn('Lỗi cập nhật Supabase lesson:', e);
    }
  }

  // 2. Cập nhật Firestore nếu có
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'links', id);
      await updateDoc(docRef, normalizedUpdates);
    } catch (err) {
      console.warn('Lỗi cập nhật Firestore:', err);
    }
  }

  const updated = current.map((item) => (item.id === id ? { ...item, ...normalizedUpdates } : item));
  saveLocalLinks(updated);
};

// Xóa liên kết
export const deleteLinkItem = async (id: string, user?: UserProfile | null): Promise<void> => {
  const current = await fetchLinks();
  const existing = current.find((l) => l.id === id);

  // Kiểm tra quyền: Chỉ Admin hoặc chính chủ sở hữu mới được xóa
  if (user && user.role !== 'admin' && existing && existing.creatorId !== user.uid) {
    throw new Error('Bạn chỉ có quyền xóa học liệu do chính mình tạo!');
  }

  // 1. Xóa trong bảng lessons trên Supabase
  const supaConf = getSupabaseConfig();
  if (supaConf.isConfigured) {
    try {
      await deleteLessonInSupabase(id);
    } catch (e) {
      console.warn('Lỗi xóa Supabase lesson:', e);
    }
  }

  // 2. Xóa trong Firestore
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'links', id));
    } catch (err) {
      console.warn('Lỗi xóa Firestore:', err);
    }
  }

  const updated = current.filter((item) => item.id !== id);
  saveLocalLinks(updated);
};

// ========================================================
// QUẢN LÝ KẾT QUẢ HỌC TẬP (STUDY RECORDS)
// ========================================================

export const fetchStudyRecords = async (): Promise<StudyRecord[]> => {
  const supaConf = getSupabaseConfig();
  if (supaConf.isConfigured) {
    try {
      const supaRecs = await fetchLearningResultsFromSupabase();
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(supaRecs || []));
      return supaRecs || [];
    } catch (e) {
      console.warn('Lỗi đọc learning_results từ Supabase:', e);
    }
  }

  const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
};

export const createStudyRecord = async (record: Omit<StudyRecord, 'id'>): Promise<StudyRecord> => {
  let createdId: string | null = null;
  const supaConf = getSupabaseConfig();
  if (supaConf.isConfigured) {
    try {
      createdId = await createLearningResultInSupabase(record);
    } catch (e) {
      console.warn('Lỗi lưu Supabase learning_result:', e);
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, 'study_records'), record);
      createdId = createdId || docRef.id;
    } catch (err) {
      console.warn('Lỗi lưu study_record Firestore:', err);
    }
  }

  const current = await fetchStudyRecords();
  const newRec: StudyRecord = {
    ...record,
    id: createdId || ('rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)),
  };
  const updated = [newRec, ...current];
  localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(updated));
  return newRec;
};

export const deleteStudyRecord = async (id: string): Promise<void> => {
  const supaConf = getSupabaseConfig();
  if (supaConf.isConfigured) {
    try {
      await deleteLearningResultInSupabase(id);
    } catch (e) {
      console.warn('Lỗi xóa Supabase learning_result:', e);
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'study_records', id));
    } catch (err) {
      console.warn('Lỗi xóa study_record Firestore:', err);
    }
  }

  const current = await fetchStudyRecords();
  const updated = current.filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(updated));
};

export const exportRecordsToCSV = (records: StudyRecord[]): void => {
  const headers = [
    'Mã bản ghi',
    'Họ và tên học sinh',
    'Lớp',
    'Tên bài học/Học liệu',
    'Môn học',
    'Khối lớp',
    'Loại học liệu',
    'Nền tảng',
    'Điểm số',
    'Số câu đúng',
    'Tổng số câu',
    'Huy hiệu đạt được',
    'Thời gian hoàn thành',
  ];

  const rows = records.map((r) => [
    `"${r.id}"`,
    `"${r.studentName}"`,
    `"${r.className}"`,
    `"${r.linkTitle.replace(/"/g, '""')}"`,
    `"${r.subject}"`,
    `"Lớp ${r.grade}"`,
    `"${r.resourceType === 'video' ? 'Video' : 'Trò chơi học tập'}"`,
    `"${r.platform || 'Trực tuyến'}"`,
    `"${r.score}"`,
    `"${r.correctAnswers || '-'}"`,
    `"${r.totalQuestions || '-'}"`,
    `"${r.badgeEarned || ''}"`,
    `"${new Date(r.completedAt).toLocaleString('vi-VN')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Ket_qua_hoc_tap_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportBackupJSON = (links: LinkItem[]): void => {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(links, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `KhoBauTriThuc_Backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ========================================================
// QUẢN LÝ THÀNH VIÊN / NGƯỜI DÙNG (USERS)
// ========================================================

export const fetchUsers = async (): Promise<UserProfile[]> => {
  const supaConf = getSupabaseConfig();
  let supaUsers: UserProfile[] = [];
  if (supaConf.isConfigured) {
    try {
      supaUsers = await fetchProfilesFromSupabase();
    } catch (e) {
      console.warn('Lỗi đọc profiles từ Supabase, fallback:', e);
    }
  }

  // Lấy danh sách tài khoản cục bộ hiện có trong localStorage để không làm mất tài khoản chưa kịp đồng bộ
  let localUsers: UserProfile[] = [];
  const saved = localStorage.getItem(STORAGE_KEY_USERS);
  if (saved) {
    try {
      localUsers = JSON.parse(saved);
    } catch {}
  }

  // Kết hợp an toàn: Supabase là nguồn chân thực, bổ sung tài khoản cục bộ hợp lệ chưa có trên Supabase
  const mergedMap = new Map<string, UserProfile>();

  // 1. Thêm INITIAL_USERS
  for (const u of INITIAL_USERS) {
    mergedMap.set(u.uid, u);
  }
  // 2. Thêm localUsers
  for (const u of localUsers) {
    if (u && u.uid) mergedMap.set(u.uid, u);
  }
  // 3. Thêm supaUsers (ghi đè với dữ liệu mới nhất từ Supabase)
  for (const u of supaUsers) {
    if (u && u.uid) mergedMap.set(u.uid, u);
  }

  const finalUsers = Array.from(mergedMap.values());
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(finalUsers));
  return finalUsers;
};

/**
 * Lấy tên trường đã lưu của một giáo viên cụ thể theo tên
 * Ưu tiên:
 * 1. Bản đồ trường học giáo viên trong localStorage (STORAGE_KEY_TEACHER_SCHOOLS)
 * 2. Hồ sơ giáo viên trong danh sách users (Supabase/localStorage)
 * 3. Dữ liệu giáo viên ban đầu (INITIAL_USERS)
 */
export const getSavedSchoolForTeacher = (teacherName: string): string | null => {
  if (!teacherName || !teacherName.trim()) return null;
  const key = teacherName.trim().toLowerCase();

  // 1. Kiểm tra trong bộ nhớ đệm trường học giáo viên
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TEACHER_SCHOOLS);
    if (raw) {
      const map = JSON.parse(raw);
      if (map && typeof map === 'object' && map[key] && String(map[key]).trim()) {
        return String(map[key]).trim();
      }
    }
  } catch {}

  // 2. Kiểm tra trong danh sách users đã lưu
  try {
    const rawUsers = localStorage.getItem(STORAGE_KEY_USERS);
    if (rawUsers) {
      const users: UserProfile[] = JSON.parse(rawUsers);
      const found = users.find(
        (u) =>
          u.role === 'teacher' &&
          u.displayName.trim().toLowerCase() === key &&
          u.school &&
          u.school.trim()
      );
      if (found) {
        return found.school.trim();
      }
    }
  } catch {}

  // 3. Kiểm tra trong INITIAL_USERS (mock ban đầu)
  const initialFound = INITIAL_USERS.find(
    (u) =>
      u.role === 'teacher' &&
      u.displayName.trim().toLowerCase() === key &&
      u.school &&
      u.school.trim()
  );
  if (initialFound) {
    return initialFound.school.trim();
  }

  return null;
};

/**
 * Lưu thông tin trường học riêng biệt của từng giáo viên
 * Đảm bảo thông tin trường của giáo viên này không ghi đè lên giáo viên khác
 */
export const saveTeacherSchoolRecord = (teacherName: string, schoolName: string): void => {
  if (!teacherName || !teacherName.trim() || !schoolName || !schoolName.trim()) return;
  const key = teacherName.trim().toLowerCase();
  const cleanSchool = schoolName.trim();
  try {
    let map: Record<string, string> = {};
    const raw = localStorage.getItem(STORAGE_KEY_TEACHER_SCHOOLS);
    if (raw) {
      try {
        map = JSON.parse(raw);
      } catch {}
    }
    map[key] = cleanSchool;
    localStorage.setItem(STORAGE_KEY_TEACHER_SCHOOLS, JSON.stringify(map));
    localStorage.setItem(STORAGE_KEY_LAST_SCHOOL, cleanSchool);
  } catch (e) {
    console.warn('Lỗi lưu trường học giáo viên vào localStorage:', e);
  }
};

export const registerOrLoginUser = async (data: {
  name: string;
  school: string;
  className?: string;
  email?: string;
  pin?: string;
  role: 'admin' | 'teacher' | 'student';
  subjects?: string[];
}): Promise<UserProfile> => {
  const currentUsers = await fetchUsers();
  const cleanedName = data.name.trim();
  const cleanedSchool = data.school.trim() || DEFAULT_SCHOOL_NAME;
  const cleanedClass = (data.className || '').trim();
  const cleanedEmail = (data.email || '').trim().toLowerCase();
  const cleanedPin = (data.pin || '').trim();
  const now = new Date().toISOString();

  // Kiểm soát phân quyền và chống leo thang đặc quyền bất hợp pháp
  if (data.role === 'admin') {
    if (cleanedPin !== '999999' && cleanedEmail !== 'thaoninhbinh@gmail.com') {
      throw new Error('Mã PIN quản trị viên không chính xác!');
    }
  } else if (data.role === 'teacher') {
    if (!cleanedPin) {
      throw new Error('Vui lòng nhập mã PIN giáo viên!');
    }
    // Xác minh mã PIN giáo viên mặc định hoặc mã PIN cá nhân đã đăng ký
    const existingTeacher = currentUsers.find(
      (u) => u.role === 'teacher' && u.displayName.trim().toLowerCase() === cleanedName.toLowerCase()
    );
    if (cleanedPin !== '123456') {
      if (!existingTeacher || (existingTeacher.pin && existingTeacher.pin !== cleanedPin)) {
        throw new Error('Mã PIN giáo viên không chính xác!');
      }
    }
  }

  // Lưu thông tin trường học riêng biệt nếu là giáo viên
  if (data.role === 'teacher' && cleanedSchool) {
    saveTeacherSchoolRecord(cleanedName, cleanedSchool);
  }

  // Kiểm tra tài khoản đã tồn tại chưa:
  // - Giáo viên: nhận diện theo email (nếu có) hoặc cùng tên giáo viên + vai trò teacher
  // - Quản trị: nhận diện theo email admin hoặc cùng tên + vai trò admin
  // - Học sinh: nhận diện chặt chẽ theo Tên + Lớp + Trường + vai trò student
  const existingIndex = currentUsers.findIndex((u) => {
    if (cleanedEmail && u.email && u.email.toLowerCase() === cleanedEmail) return true;
    const sameName = u.displayName.trim().toLowerCase() === cleanedName.toLowerCase();
    const sameRole = u.role === data.role;

    if (data.role === 'teacher') {
      return sameName && sameRole;
    }
    if (data.role === 'admin') {
      return (sameName || (cleanedEmail && u.email?.toLowerCase() === cleanedEmail)) && sameRole;
    }

    const sameSchool = (u.school || '').trim().toLowerCase() === cleanedSchool.toLowerCase();
    const sameClass = (u.assignedClass || '').trim().toLowerCase() === cleanedClass.toLowerCase();
    return sameName && sameSchool && sameClass && sameRole;
  });

  if (existingIndex !== -1) {
    const existing = currentUsers[existingIndex];
    const updated: UserProfile = {
      ...existing,
      displayName: cleanedName,
      school: cleanedSchool,
      lastLoginAt: now,
      assignedClass: cleanedClass || existing.assignedClass,
      email: cleanedEmail || existing.email,
      pin: cleanedPin || existing.pin || (data.role === 'admin' ? '999999' : data.role === 'teacher' ? '123456' : undefined),
      subjects: data.subjects || existing.subjects,
      approvalStatus: existing.approvalStatus || 'approved',
    };
    currentUsers[existingIndex] = updated;

    const supaConf = getSupabaseConfig();
    if (supaConf.isConfigured) {
      const syncResult = await saveProfileToSupabase(updated);
      if (!syncResult.success) {
        console.error('Không thể cập nhật hồ sơ người dùng lên Supabase:', syncResult.error);
      }
    }

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'users', updated.uid), updated);
      } catch (e) {
        console.warn('Lỗi cập nhật user Firestore:', e);
      }
    }
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(currentUsers));
    return updated;
  }

  // Tạo tài khoản mới nếu chưa tồn tại
  const newUid =
    (data.role === 'admin' ? 'admin-' : data.role === 'teacher' ? 'teacher-' : 'student-') +
    Date.now() +
    '-' +
    Math.random().toString(36).substring(2, 6);

  const approvalStatus: 'approved' | 'pending' | 'rejected' =
    data.role === 'admin' ? 'approved' : data.role === 'student' ? 'approved' : 'pending';

  const newUser: UserProfile = {
    uid: newUid,
    displayName: cleanedName,
    school: cleanedSchool,
    assignedClass: cleanedClass,
    email: cleanedEmail || undefined,
    pin: cleanedPin || (data.role === 'admin' ? '999999' : data.role === 'teacher' ? '123456' : undefined),
    role: data.role,
    createdAt: now,
    lastLoginAt: now,
    subjects: data.subjects,
    approvalStatus,
  };

  const updatedUsers = [newUser, ...currentUsers];

  const supaConf = getSupabaseConfig();
  if (supaConf.isConfigured) {
    const syncResult = await saveProfileToSupabase(newUser);
    if (!syncResult.success) {
      console.error('Không thể lưu hồ sơ mới lên Supabase:', syncResult.error);
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'users', newUid), newUser);
    } catch (e) {
      console.warn('Lỗi tạo user Firestore:', e);
    }
  }
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));
  return newUser;
};

export const updateUserApproval = async (
  userId: string,
  status: 'approved' | 'rejected' | 'pending'
): Promise<UserProfile[]> => {
  const currentUsers = await fetchUsers();
  const updated = currentUsers.map((u) =>
    u.uid === userId ? { ...u, approvalStatus: status } : u
  );

  const targetUser = updated.find((u) => u.uid === userId);
  const supaConf = getSupabaseConfig();
  if (targetUser && supaConf.isConfigured) {
    const syncResult = await saveProfileToSupabase(targetUser);
    if (!syncResult.success) {
      console.error('Không thể cập nhật trạng thái duyệt người dùng lên Supabase:', syncResult.error);
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'users', userId), { approvalStatus: status });
    } catch (e) {
      console.warn('Lỗi duyệt user Firestore:', e);
    }
  }
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updated));
  return updated;
};

export const deleteUser = async (userId: string): Promise<void> => {
  const supaConf = getSupabaseConfig();
  if (supaConf.isConfigured) {
    try {
      const ok = await deleteProfileFromSupabase(userId);
      if (!ok) {
        console.warn(`Không thể xóa hồ sơ ${userId} trên Supabase`);
      }
    } catch (err) {
      console.error(`Lỗi ngoại lệ khi xóa hồ sơ ${userId} trên Supabase:`, err);
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (e) {
      console.warn('Lỗi xóa user Firestore:', e);
    }
  }

  const currentUsers = await fetchUsers();
  const filtered = currentUsers.filter((u) => u.uid !== userId);
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(filtered));
};

// ========================================================
// THEO DÕI LƯỢT TRUY CẬP (ACCESS LOGS)
// ========================================================

export const fetchAccessLogs = async (): Promise<AccessLog[]> => {
  const supaConf = getSupabaseConfig();
  if (supaConf.isConfigured) {
    try {
      const supaVisits = await fetchLinkVisitsFromSupabase();
      return (supaVisits || []).map(convertSupabaseVisitToAccessLog);
    } catch (err) {
      console.warn('Lỗi đọc dữ liệu link_visits từ Supabase:', err);
    }
  }

  const saved = localStorage.getItem(STORAGE_KEY_LOGS);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
};

export const logAccess = async (data: Omit<AccessLog, 'id'>): Promise<AccessLog> => {
  let createdId: string | undefined;

  const supaConf = getSupabaseConfig();
  if (supaConf.isConfigured) {
    try {
      const supaRes = await recordLinkVisitInSupabase({
        link_id: data.linkId,
        link_title: data.linkTitle,
        user_id: data.userId,
        user_name: data.userName,
        user_role: data.userRole,
        school: data.school,
        class_name: data.className,
        subject: data.subject,
        grade: data.grade,
        resource_type: normalizeResourceType(data.resourceType),
      });
      if (supaRes?.id) {
        createdId = supaRes.id;
      }
    } catch (err) {
      console.warn('Lỗi ghi Supabase link_visits:', err);
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, 'access_logs'), data);
      createdId = createdId || docRef.id;
    } catch (e) {
      console.warn('Lỗi ghi Firestore access_logs:', e);
    }
  }

  const currentLogs = await fetchAccessLogs();
  const newLog: AccessLog = {
    ...data,
    id: createdId || ('log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)),
  };
  const updatedLogs = [newLog, ...currentLogs];
  localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(updatedLogs));
  return newLog;
};

export const exportAccessLogsToCSV = (logs: AccessLog[]): void => {
  const headers = [
    'Mã nhật ký',
    'Thời gian truy cập',
    'Họ tên người dùng',
    'Vai trò',
    'Lớp',
    'Trường',
    'Tên bài học/Học liệu',
    'Môn học',
    'Khối lớp',
    'Loại học liệu',
    'Hành động',
    'Điểm số',
  ];

  const rows = logs.map((l) => [
    `"${l.id}"`,
    `"${new Date(l.timestamp).toLocaleString('vi-VN')}"`,
    `"${l.userName}"`,
    `"${l.userRole === 'admin' ? 'Quản trị' : l.userRole === 'teacher' ? 'Giáo viên' : 'Học sinh'}"`,
    `"${l.className || '-'}"`,
    `"${l.school || '-'}"`,
    `"${l.linkTitle.replace(/"/g, '""')}"`,
    `"${l.subject}"`,
    `"Lớp ${l.grade}"`,
    `"${l.resourceType === 'video' ? 'Video' : 'Trò chơi học tập'}"`,
    `"${l.action === 'submit_score' ? 'Báo điểm' : 'Mở học liệu'}"`,
    `"${l.score !== undefined ? l.score : '-'}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Lich_su_truy_cap_hoc_lieu_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ========================================================
// QUẢN LÝ THẺ MÔN HỌC & LỚP (TỰ ĐỘNG GOM TRÙNG LẶP)
// ========================================================

/**
 * Gom nhóm danh mục môn học và lớp dùng chung:
 * Khi nhiều giáo viên tạo cùng môn và cùng khối lớp, hệ thống nhận diện và gom thành 1 thẻ duy nhất.
 */
export const fetchSubjectCards = async (user?: UserProfile | null): Promise<SubjectCard[]> => {
  let customCards: SubjectCard[] = [];

  // 1. Thử lấy từ Supabase
  const supaConf = getSupabaseConfig();
  if (supaConf.isConfigured) {
    try {
      const supaSubjects = await fetchSubjectCardsFromSupabase();
      if (supaSubjects && supaSubjects.length > 0) {
        customCards = supaSubjects.filter((s) => !DEFAULT_SUBJECT_CARDS.some((d) => d.id === s.id));
      }
    } catch (e) {
      console.warn('Lỗi đọc subjects từ Supabase:', e);
    }
  }

  // 2. Dự phòng nạp thêm từ LocalStorage
  const saved = localStorage.getItem(STORAGE_KEY_SUBJECT_CARDS);
  if (saved) {
    try {
      const parsed: SubjectCard[] = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        parsed.forEach((localCard) => {
          if (
            !customCards.some((c) => c.id === localCard.id) &&
            !DEFAULT_SUBJECT_CARDS.some((d) => d.id === localCard.id)
          ) {
            customCards.push(localCard);
          }
        });
      }
    } catch {}
  }

  // 3. TỰ ĐỘNG GOM MÔN HỌC VÀ LỚP TRÙNG NHAU GIỮA CÁC GIÁO VIÊN:
  // Khởi tạo Map với các thẻ mặc định
  const mergedMap = new Map<string, SubjectCard>();

  DEFAULT_SUBJECT_CARDS.forEach((card) => {
    const normName = normalizeSubjectName(card.name).toLowerCase();
    const key = `${normName}_${card.grade}`;
    mergedMap.set(key, card);
  });

  // Gom thêm các thẻ do Admin tạo (nếu có môn mới ngoài 10 môn mặc định)
  customCards.forEach((c) => {
    const normName = normalizeSubjectName(c.name).toLowerCase();
    const key = `${normName}_${c.grade}`;
    if (!mergedMap.has(key)) {
      mergedMap.set(key, {
        ...c,
        name: normalizeSubjectName(c.name),
        className: c.className.startsWith('Lớp') ? c.className : `Lớp ${c.grade || c.className}`,
      });
    }
  });

  const finalCards = Array.from(mergedMap.values());

  // Lưu cache LocalStorage
  localStorage.setItem(STORAGE_KEY_SUBJECT_CARDS, JSON.stringify(customCards));

  return finalCards;
};

// Tạo môn học mới: CHỈ DÀNH CHO ADMIN
export const createSubjectCard = async (
  data: {
    name: string;
    className: string;
    description?: string;
  },
  user?: UserProfile | null
): Promise<SubjectCard> => {
  // BẮT BUỘC: Giáo viên không có quyền thêm môn học. Chỉ Admin mới có quyền!
  if (!user || user.role !== 'admin') {
    throw new Error('Giáo viên không có quyền thêm môn học. Chỉ Quản trị viên (Admin) mới có quyền thêm môn học mới!');
  }

  const cleanName = normalizeSubjectName(data.name);
  const cleanClass = data.className.trim();

  if (!cleanName) {
    throw new Error('Vui lòng nhập tên môn học!');
  }
  if (!cleanClass) {
    throw new Error('Vui lòng nhập lớp!');
  }

  const matchedGrade = cleanClass.match(/\d+/);
  const gradeNumber = matchedGrade ? parseInt(matchedGrade[0], 10) : 0;

  // Kiểm tra trùng lặp
  const existingCards = await fetchSubjectCards(user);
  const isDuplicate = existingCards.some((c) => {
    const sameName = normalizeSubjectName(c.name).toLowerCase() === cleanName.toLowerCase();
    const sameGrade = c.grade === gradeNumber;
    return sameName && sameGrade;
  });

  if (isDuplicate) {
    throw new Error(`Môn học "${cleanName} - Lớp ${gradeNumber}" đã tồn tại trong danh mục chung!`);
  }

  const now = new Date().toISOString();
  const newId = `sub_${cleanName.toLowerCase().replace(/\s+/g, '')}_${gradeNumber}_${Date.now()}`;

  const newCard: SubjectCard = {
    id: newId,
    name: cleanName,
    grade: gradeNumber,
    className: `Lớp ${gradeNumber}`,
    description: data.description?.trim() || `Học liệu môn ${cleanName} Lớp ${gradeNumber}`,
    icon: getSubjectDefaultIcon(cleanName),
    themeColor: getSubjectDefaultColor(cleanName),
    creatorId: user.uid,
    creatorName: user.displayName || 'Quản trị viên',
    isDefault: false,
    createdAt: now,
  };

  const supaConf = getSupabaseConfig();
  if (supaConf.isConfigured) {
    try {
      await saveSubjectCardToSupabase(newCard);
    } catch (e) {
      console.warn('Lỗi lưu thẻ môn học Supabase:', e);
    }
  }

  const saved = localStorage.getItem(STORAGE_KEY_SUBJECT_CARDS);
  let localList: SubjectCard[] = [];
  if (saved) {
    try {
      localList = JSON.parse(saved);
    } catch {
      localList = [];
    }
  }
  const updatedList = [newCard, ...localList];
  localStorage.setItem(STORAGE_KEY_SUBJECT_CARDS, JSON.stringify(updatedList));

  return newCard;
};

// Sửa môn học: CHỈ DÀNH CHO ADMIN
export const updateSubjectCard = async (
  id: string,
  updates: {
    name?: string;
    className?: string;
    description?: string;
  },
  user?: UserProfile | null
): Promise<SubjectCard> => {
  if (!user || user.role !== 'admin') {
    throw new Error('Chỉ Quản trị viên (Admin) mới có quyền chỉnh sửa danh mục môn học!');
  }

  const allCards = await fetchSubjectCards(user);
  const targetIndex = allCards.findIndex((c) => c.id === id);
  if (targetIndex === -1) {
    throw new Error('Không tìm thấy môn học cần chỉnh sửa!');
  }

  const existing = allCards[targetIndex];
  const updatedName = updates.name ? normalizeSubjectName(updates.name) : existing.name;
  const updatedClass = updates.className ? updates.className.trim() : existing.className;
  const matchedGrade = updatedClass.match(/\d+/);
  const gradeNumber = matchedGrade ? parseInt(matchedGrade[0], 10) : existing.grade;

  const updatedCard: SubjectCard = {
    ...existing,
    name: updatedName,
    className: `Lớp ${gradeNumber}`,
    grade: gradeNumber,
    description: updates.description !== undefined ? updates.description.trim() : existing.description,
    icon: getSubjectDefaultIcon(updatedName),
    themeColor: getSubjectDefaultColor(updatedName),
  };

  const supaConf = getSupabaseConfig();
  if (supaConf.isConfigured) {
    try {
      await saveSubjectCardToSupabase(updatedCard);
    } catch (e) {
      console.warn('Lỗi cập nhật thẻ môn học Supabase:', e);
    }
  }

  const saved = localStorage.getItem(STORAGE_KEY_SUBJECT_CARDS);
  let localList: SubjectCard[] = [];
  if (saved) {
    try {
      localList = JSON.parse(saved);
    } catch {
      localList = [];
    }
  }
  const updatedLocal = localList.map((c) => (c.id === id ? updatedCard : c));
  localStorage.setItem(STORAGE_KEY_SUBJECT_CARDS, JSON.stringify(updatedLocal));

  return updatedCard;
};

// Xóa môn học: CHỈ DÀNH CHO ADMIN
export const deleteSubjectCard = async (
  id: string,
  associatedLinksCount: number,
  user?: UserProfile | null
): Promise<void> => {
  if (!user || user.role !== 'admin') {
    throw new Error('Chỉ Quản trị viên (Admin) mới có quyền xóa môn học!');
  }

  if (DEFAULT_SUBJECT_CARDS.some((d) => d.id === id)) {
    throw new Error('Không thể xóa thẻ môn học mặc định trong danh mục 10 môn của hệ thống!');
  }

  if (associatedLinksCount > 0) {
    throw new Error(
      `Môn học này hiện đang có ${associatedLinksCount} học liệu trong hệ thống! Vui lòng di chuyển hoặc xóa các học liệu trước.`
    );
  }

  const supaConf = getSupabaseConfig();
  if (supaConf.isConfigured) {
    try {
      await deleteSubjectCardFromSupabase(id);
    } catch (e) {
      console.warn('Lỗi xóa thẻ môn học Supabase:', e);
    }
  }

  const saved = localStorage.getItem(STORAGE_KEY_SUBJECT_CARDS);
  if (saved) {
    try {
      const localList: SubjectCard[] = JSON.parse(saved);
      const filtered = localList.filter((c) => c.id !== id);
      localStorage.setItem(STORAGE_KEY_SUBJECT_CARDS, JSON.stringify(filtered));
    } catch {}
  }
};
