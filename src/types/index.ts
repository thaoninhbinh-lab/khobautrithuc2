export type SubjectType =
  | 'toan'
  | 'tiengviet'
  | 'tienganh'
  | 'diali'
  | 'lichsu'
  | 'tinhoc'
  | 'congnghe'
  | 'khoahoc'
  | 'daoduc'
  | 'hdtn'
  | (string & {});

export type GradeLevel = 1 | 2 | 3 | 4 | 5 | 0 | number;

/**
 * Tên trường học mặc định của hệ thống
 * Có thể được ghi đè bởi giáo viên/học sinh và lưu riêng vào hồ sơ người dùng
 */
export const DEFAULT_SCHOOL_NAME = 'Trường Tiểu học B Hải Xuân';

/**
 * Hệ thống Nguồn sáng tri thức chỉ còn đúng 2 loại học liệu:
 * 1. 'tro_choi': Trò chơi học tập (Quizizz, Wordwall, Kahoot, Scratch, trắc nghiệm tương tác)
 * 2. 'video': Video (Video bài giảng, hoạt hình, clip hướng dẫn thực hành)
 */
export type ResourceType =
  | 'tro_choi'
  | 'video'
  | 'khac'
  // Legacy types được tự động chuẩn hóa sang 3 loại chính
  | 'quizizz'
  | 'game_tuongtac'
  | 'ontap'
  | 'kiemtra'
  | 'tracnghiem'
  | 'tailieu';

export type ColumnCategory = 'tro_choi' | 'video' | 'khac';

export interface SubjectCard {
  id: string;
  name: string;
  grade: number;
  className: string;
  description?: string;
  icon?: string;
  themeColor: string;
  creatorId?: string;
  creatorName?: string;
  isDefault?: boolean;
  createdAt?: string;
}

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  description: string;
  subject: SubjectType;
  grade: GradeLevel;
  lesson: string; // ví dụ: "Bài 1: Thông tin và quyết định"
  topic: string;  // ví dụ: "Chủ đề A: Máy tính và em"
  resourceType: ResourceType;
  notes?: string;
  tags: string[];
  isPinned: boolean;
  isPublic: boolean; // true = Công khai, false = Riêng tư
  isFavorite: boolean;
  playCount: number;
  createdAt: string;
  updatedAt: string;
  creatorId: string;
  creatorName: string;
  creatorSchool?: string;
  creatorEmail?: string;
  creatorRole: 'admin' | 'teacher' | 'student';
}

export interface StudyRecord {
  id: string;
  userId: string;
  studentName: string;
  school?: string;
  className: string; // ví dụ: "3A", "4B", "5C"
  linkId: string;
  linkTitle: string;
  subject: SubjectType;
  grade: GradeLevel;
  lesson: string;
  resourceType: ResourceType;
  platform: string; // Quizizz, Azota, v.v.
  attemptsCount: number;
  score: number; // Thang 10 hoặc 100
  maxScore: number;
  correctAnswers?: number;
  totalQuestions?: number;
  status: 'completed' | 'in_progress';
  completedAt: string;
  badgeEarned?: string;
}

export interface AccessLog {
  id: string;
  userId: string;
  userName: string;
  userRole: 'admin' | 'teacher' | 'student';
  school: string;
  className?: string; // Lớp (đối với học sinh)
  linkId: string;
  linkTitle: string;
  subject: SubjectType;
  grade: GradeLevel;
  resourceType: ResourceType;
  action: 'open_link' | 'submit_score';
  score?: number;
  timestamp: string;
}

export const SCHOOL_CLASSES = [
  // Khối 1
  '1A', '1B', '1C', '1D',
  // Khối 2
  '2A', '2B', '2C', '2D',
  // Khối 3
  '3A', '3B', '3C', '3D',
  // Khối 4
  '4A', '4B', '4C', '4D',
  // Khối 5
  '5A', '5B', '5C', '5D',
] as const;

export interface UserProfile {
  uid: string;
  displayName: string; // Họ tên
  school: string;      // Trường
  assignedClass?: string; // Lớp (Học sinh) hoặc Lớp phụ trách (Giáo viên)
  role: 'admin' | 'teacher' | 'student';
  email?: string;
  photoURL?: string;
  createdAt: string;
  lastLoginAt: string;
  subjects?: string[]; // Môn học của giáo viên
  approvalStatus?: 'approved' | 'pending' | 'rejected'; // Giáo viên cần duyệt, học sinh tự duyệt
  pin?: string; // Mã PIN đăng nhập của Giáo viên / Quản trị viên
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
