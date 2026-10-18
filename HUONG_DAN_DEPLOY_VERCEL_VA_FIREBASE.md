# 💎 KHO BÁU TRI THỨC! - HƯỚNG DẪN CÀI ĐẶT, CẤU HÌNH FIREBASE VÀ DEPLOY VERCEL

Kho lưu trữ, quản lý và chia sẻ trò chơi Quizizz, bài ôn tập môn **Tin học** (Lớp 3, 4, 5) và **Công nghệ** (Lớp 3, 4, 5).

---

## 1. Cấu trúc thư mục dự án
```text
├── .env.example                     # Mẫu biến môi trường Firebase & Vercel
├── firestore.rules                  # Quy tắc bảo mật Firestore Security Rules
├── package.json                     # Danh sách thư viện và scripts
├── tsconfig.json                    # Cấu hình TypeScript
├── vite.config.ts                   # Cấu hình Vite
├── index.html                       # Entry point HTML tiếng Việt
└── src/
    ├── types/
    │   └── index.ts                 # Định nghĩa kiểu dữ liệu (LinkItem, StudyRecord, UserProfile)
    ├── firebase/
    │   └── config.ts                # Cấu hình kết nối Firebase & fallback LocalStorage
    ├── services/
    │   ├── storageService.ts        # Quản lý dữ liệu Firestore/LocalStorage, xuất Excel CSV UTF-8
    │   └── mockData.ts              # Kho dữ liệu mẫu chuẩn môn Tin học & Công nghệ 3-5
    ├── contexts/
    │   └── AuthContext.tsx          # Quản lý xác thực Google Sign-In & Phân quyền
    ├── components/
    │   ├── Header.tsx               # Thanh điều hướng, thông tin tài khoản, đăng nhập/đăng xuất
    │   ├── FilterBar.tsx            # Tìm kiếm, lọc theo Môn (Tin học, Công nghệ), Khối lớp (3, 4, 5), Loại học liệu
    │   ├── LinkCard.tsx             # Thẻ học liệu sinh động, nút mở bài, sao chép link, ghim, yêu thích
    │   ├── LinkModal.tsx            # Form thêm/sửa học liệu với kiểm tra URL, tự thêm https://
    │   ├── DeleteConfirmModal.tsx   # Hộp thoại xác nhận xóa an toàn
    │   ├── StudentScoreModal.tsx    # Ghi nhận kết quả làm bài của học sinh (pháo hoa Confetti + huy hiệu)
    │   ├── StatsDashboard.tsx       # Bảng điều khiển phân tích kết quả, biểu đồ cột & xuất Excel
    │   ├── StudentCorner.tsx        # Góc thử thách học tập dành riêng cho học sinh
    │   ├── SharedCollectionModal.tsx# Sinh liên kết chia sẻ bộ sưu tập học liệu công khai
    │   ├── DeploymentGuideModal.tsx # Hướng dẫn triển khai tích hợp trực tiếp trong ứng dụng
    │   └── Toast.tsx                # Thông báo hành động thành công/lỗi
    ├── App.tsx                      # Component chính điều phối ứng dụng
    ├── main.tsx                     # Khởi tạo React
    └── index.css                    # Tailwind CSS v4 và styles toàn cục
```

---

## 2. Hướng dẫn chạy thử trên máy tính (Local)
1. Cài đặt các gói thư viện:
   ```bash
   npm install
   ```
2. Khởi chạy máy chủ phát triển:
   ```bash
   npm run dev
   ```
3. Mở trình duyệt tại địa chỉ: `http://localhost:3000`.

*Ghi chú:* Ngay cả khi chưa điền thông tin Firebase, ứng dụng vẫn tự động hoạt động mượt mà ở chế độ **Lưu trữ Cục bộ (LocalStorage / Thử nghiệm)** với đầy đủ dữ liệu mẫu chuẩn chương trình GDPT 2018!

---

## 3. Các bước thiết lập Firebase Authentication & Firestore
### Bước 3.1: Tạo dự án Firebase
1. Truy cập [Firebase Console](https://console.firebase.google.com) và đăng nhập bằng tài khoản Google.
2. Nhấn **"Add project"** (Thêm dự án), đặt tên là `Kho-Bau-Tri-Thuc` và nhấn **Continue**.
3. Tại trang tổng quan của dự án, nhấn vào biểu tượng **Web `</>`** để đăng ký ứng dụng Web.
4. Đặt tên (ví dụ: `kho-bau-web`), sau đó Firebase sẽ hiển thị đoạn mã cấu hình:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyCTb16U3p5K09quKkLuqFg9P480dEdkhBk",
     authDomain: "khobautrithuc.firebaseapp.com",
     projectId: "khobautrithuc",
     storageBucket: "khobautrithuc.firebasestorage.app",
     messagingSenderId: "98419353157",
     appId: "1:98419353157:web:00fc092a8c4979952a652c"
   };
   ```

### Bước 3.2: Bật Google Sign-In
1. Trong menu bên trái của Firebase Console, chọn **Authentication** > chọn tab **Sign-in method**.
2. Nhấn vào nhà cung cấp **Google** > Bật công tắc **Enable**.
3. Chọn email hỗ trợ của dự án (Project support email) rồi nhấn **Save**.

### Bước 3.3: Tạo Firestore Database & Cập nhật Rules
1. Trong menu bên trái, chọn **Firestore Database** > Nhấn **Create database**.
2. Chọn vị trí máy chủ (khuyên dùng `asia-southeast1` hoặc khu vực gần bạn) > Nhấn **Next**.
3. Chọn chế độ bất kỳ, sau đó vào tab **Rules** (Quy tắc), sao chép nội dung từ file `firestore.rules` vào và nhấn **Publish**.

---

## 4. Thiết lập biến môi trường trên Vercel & Deploy
1. Đẩy mã nguồn lên kho lưu trữ GitHub của bạn:
   ```bash
   git init
   git add .
   git commit -m "Khởi tạo Kho Báu Tri Thức"
   git branch -M main
   git remote add origin https://github.com/TÊN_GITHUB_CỦA_BẠN/kho-bau-tri-thuc.git
   git push -u origin main
   ```
2. Đăng nhập vào [Vercel](https://vercel.com) bằng tài khoản GitHub.
3. Nhấn **"Add New..."** > **"Project"** > Chọn repository `kho-bau-tri-thuc`.
4. Trong mục **Environment Variables**, thêm 6 biến môi trường tương ứng:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
5. Nhấn nút **Deploy**. Vercel sẽ tự động build ứng dụng chỉ trong 30 giây!

### ⚠️ Bước bổ sung sau khi Deploy:
Sau khi Vercel cấp tên miền cho bạn (ví dụ: `kho-bau-tri-thuc.vercel.app`):
- Vào lại **Firebase Console** > **Authentication** > tab **Settings** > mục **Authorized domains**.
- Nhấn **Add domain** và thêm tên miền Vercel của bạn vào danh sách để tính năng Google Sign-In hoạt động trơn tru.
