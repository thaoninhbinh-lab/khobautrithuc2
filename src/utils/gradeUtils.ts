/**
 * Tiện ích chuẩn hóa dữ liệu khối lớp học tiểu học theo quy định chuẩn:
 * - Chấp nhận các giá trị: 1, 1A, 1B, 1C, 2, 2A, 3, 3A, 4, 4B, 5, 5C, "Lớp 3", " 3A ",...
 * - Tự động chuẩn hóa về dạng thống nhất: "Lớp 1", "Lớp 2", "Lớp 3", "Lớp 4", "Lớp 5"
 * - Trả về isValid = false đối với các giá trị không hợp lệ (ví dụ: 0, 6, 6A, ký tự không có số lớp).
 */

export interface GradeNormalizationResult {
  isValid: boolean;
  normalized: string; // "Lớp 1", "Lớp 2", "Lớp 3", "Lớp 4", "Lớp 5"
  gradeNumber: number; // 1, 2, 3, 4, 5
  rawInput: string;
  errorMessage?: string;
}

export const VALID_GRADES = [1, 2, 3, 4, 5] as const;

export const normalizeGradeClass = (input: string | number | null | undefined): GradeNormalizationResult => {
  if (input === null || input === undefined) {
    return {
      isValid: false,
      normalized: '',
      gradeNumber: 0,
      rawInput: '',
      errorMessage: 'Vui lòng nhập lớp 1, 2, 3, 4 hoặc 5.',
    };
  }

  const rawStr = String(input).trim();
  if (!rawStr) {
    return {
      isValid: false,
      normalized: '',
      gradeNumber: 0,
      rawInput: '',
      errorMessage: 'Vui lòng nhập lớp 1, 2, 3, 4 hoặc 5.',
    };
  }

  // Loại bỏ các tiền tố thông dụng: "Lớp", "Lop", "Khối", "Khoi" và khoảng trắng
  const cleaned = rawStr.replace(/^(lớp|lop|khối|khoi)\s*/i, '').trim();

  // Kiểm tra định dạng: Bắt đầu bằng 1 chữ số từ 1 đến 5, theo sau có thể là chữ cái phụ (A, B, C, a, b...)
  // Ví dụ khớp: "1", "1A", "1a", "2", "2B", "3", "3A", " 3A ", "4", "4C", "5", "5A"
  const match = cleaned.match(/^([1-5])\s*([a-zA-Z]*)$/i);
  if (match) {
    const num = parseInt(match[1], 10);
    return {
      isValid: true,
      normalized: `Lớp ${num}`,
      gradeNumber: num,
      rawInput: rawStr,
    };
  }

  // Nếu không nhận diện được số lớp từ 1 đến 5, báo lỗi rõ ràng
  return {
    isValid: false,
    normalized: rawStr,
    gradeNumber: 0,
    rawInput: rawStr,
    errorMessage: 'Lớp không hợp lệ! Vui lòng chỉ nhập số lớp từ 1 đến 5 (ví dụ: 1, 2, 3, 4, 5 hoặc 1A, 2A, 3B...).',
  };
};
