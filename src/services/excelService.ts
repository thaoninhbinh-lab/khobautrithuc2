import * as XLSX from 'xlsx';
import { LinkItem } from '../types';
import { normalizeSubjectName, normalizeResourceType } from './storageService';

/**
 * Xuất file Excel danh sách học liệu chuẩn theo yêu cầu:
 * - Mỗi học liệu tương ứng với MỘT HÀNG (row) trong bảng tính.
 * - Mỗi thông số chi tiết là MỘT CỘT (column) riêng biệt:
 *   1. STT
 *   2. Mã học liệu
 *   3. Tên học liệu
 *   4. Môn học
 *   5. Khối lớp
 *   6. Thể loại học liệu (Trò chơi tương tác / Video / Khác)
 *   7. Đường link bài học
 *   8. Giáo viên đăng
 *   9. Lượt truy cập / làm bài
 *   10. Ngày đăng
 * - Sử dụng thư viện xlsx để xuất file trực tiếp, tự động căn chỉnh độ rộng cột dễ nhìn.
 */
export const exportLessonsToExcel = (
  lessons: LinkItem[],
  customFilename?: string
): void => {
  if (!lessons || lessons.length === 0) {
    alert('Không có học liệu nào để xuất file Excel!');
    return;
  }

  const rows = lessons.map((item, index) => {
    // 1. STT
    const stt = index + 1;

    // 2. Mã học liệu
    const maHocLieu = item.id;

    // 3. Tên học liệu
    const tenHocLieu = item.title;

    // 4. Môn học
    const monHoc = normalizeSubjectName(item.subject);

    // 5. Khối lớp
    const khoiLop = item.grade && Number(item.grade) > 0 ? `Lớp ${item.grade}` : 'Toàn trường';

    // 6. Thể loại học liệu (Trò chơi tương tác / Video / Khác)
    const normType = normalizeResourceType(item.resourceType);
    let theLoai = 'Trò chơi tương tác';
    if (normType === 'video') {
      theLoai = 'Video';
    } else if (normType === 'khac') {
      theLoai = 'Khác';
    }

    // 7. Đường link bài học
    const linkBaiHoc = item.url;

    // 8. Giáo viên đăng
    const giaoVien = item.creatorName || 'Giáo viên';

    // 9. Lượt truy cập / làm bài
    const luotTruyCap = Number(item.playCount || 0);

    // 10. Ngày đăng
    let ngayDang = '';
    if (item.createdAt) {
      try {
        const d = new Date(item.createdAt);
        ngayDang = !isNaN(d.getTime()) ? d.toLocaleDateString('vi-VN') : item.createdAt;
      } catch {
        ngayDang = item.createdAt;
      }
    }

    return {
      'STT': stt,
      'Mã học liệu': maHocLieu,
      'Tên học liệu': tenHocLieu,
      'Môn học': monHoc,
      'Khối lớp': khoiLop,
      'Thể loại học liệu': theLoai,
      'Đường link bài học': linkBaiHoc,
      'Giáo viên đăng': giaoVien,
      'Lượt truy cập / làm bài': luotTruyCap,
      'Ngày đăng': ngayDang,
    };
  });

  // Tạo Worksheet từ JSON data
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Tự động căn chỉnh độ rộng cột (Column Widths) để văn bản hiển thị rõ ràng
  worksheet['!cols'] = [
    { wch: 6 },   // STT
    { wch: 22 },  // Mã học liệu
    { wch: 45 },  // Tên học liệu
    { wch: 16 },  // Môn học
    { wch: 14 },  // Khối lớp
    { wch: 24 },  // Thể loại học liệu
    { wch: 50 },  // Đường link bài học
    { wch: 26 },  // Giáo viên đăng
    { wch: 24 },  // Lượt truy cập / làm bài
    { wch: 16 },  // Ngày đăng
  ];

  // Tạo Workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Thống kê học liệu');

  // Đặt tên file xuất
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = customFilename || `Thong_ke_hoc_lieu_Giao_vien_${dateStr}.xlsx`;

  // Tải file trực tiếp về máy người dùng
  XLSX.writeFile(workbook, filename);
};
