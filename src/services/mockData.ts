import { LinkItem, StudyRecord, UserProfile, AccessLog, DEFAULT_SCHOOL_NAME } from '../types';

/**
 * Danh sách học liệu ban đầu: để trống để chỉ nạp dữ liệu thực tế từ Supabase
 * Tuyệt đối không dùng dữ liệu giả lập/demo
 */
export const INITIAL_LINKS: LinkItem[] = [];

/**
 * Bản ghi kết quả học tập ban đầu: để trống
 */
export const INITIAL_STUDY_RECORDS: StudyRecord[] = [];

/**
 * Tài khoản khởi tạo hệ thống (chỉ giữ tài khoản Admin quản trị viên)
 */
export const INITIAL_USERS: UserProfile[] = [
  {
    uid: 'admin-thaoninhbinh',
    displayName: 'Cô Thảo (Quản trị viên)',
    school: DEFAULT_SCHOOL_NAME,
    role: 'admin',
    assignedClass: 'Toàn trường',
    email: 'thaoninhbinh@gmail.com',
    pin: '999999',
    createdAt: '2026-08-15T08:00:00Z',
    lastLoginAt: '2026-10-16T07:00:00Z',
    subjects: ['toan', 'tiengviet', 'tienganh', 'diali', 'lichsu', 'tinhoc', 'congnghe', 'khoahoc', 'daoduc', 'hdtn'],
    approvalStatus: 'approved',
  },
];

/**
 * Nhật ký truy cập ban đầu: để trống
 */
export const INITIAL_ACCESS_LOGS: AccessLog[] = [];
