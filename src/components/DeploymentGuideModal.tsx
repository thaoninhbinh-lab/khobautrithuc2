import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Server,
  Key,
  Shield,
  UploadCloud,
  ExternalLink,
  Terminal,
  Database,
  Layers,
  Sparkles,
} from 'lucide-react';

interface DeploymentGuideModalProps {
  onCopyNotice: (msg: string) => void;
}

export const DeploymentGuideModal: React.FC<DeploymentGuideModalProps> = ({ onCopyNotice }) => {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    onCopyNotice(`Đã sao chép ${keyName}!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const envSample = `VITE_FIREBASE_API_KEY=AIzaSyCTb16U3p5K09quKkLuqFg9P480dEdkhBk
VITE_FIREBASE_AUTH_DOMAIN=khobautrithuc.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=khobautrithuc
VITE_FIREBASE_STORAGE_BUCKET=khobautrithuc.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=98419353157
VITE_FIREBASE_APP_ID=1:98419353157:web:00fc092a8c4979952a652c`;

  const rulesSample = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /links/{linkId} {
      allow read: if resource.data.isPublic == true || request.auth.uid == resource.data.creatorId;
      allow create: if request.auth != null && request.resource.data.creatorId == request.auth.uid;
      allow update, delete: if request.auth != null && (resource.data.creatorId == request.auth.uid || request.auth.token.role == 'admin');
    }
    match /study_records/{recordId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
    }
  }
}`;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Cẩm Nang Kỹ Thuật Đầy Đủ
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Hướng Dẫn Triển Khai Lên Vercel & Kết Nối Firebase
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Ứng dụng NGUỒN SÁNG TRI THỨC! được thiết kế độc lập, bảo mật, sẵn sàng đưa lên Vercel chỉ với 4 bước đơn giản.
          </p>
        </div>
      </div>

      {/* Step Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => setActiveStep(1)}
          className={`p-3 rounded-2xl text-left border transition-all ${
            activeStep === 1
              ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-black shadow-2xs'
              : 'border-slate-200 hover:bg-slate-50 text-slate-600 font-bold'
          }`}
        >
          <div className="text-xs text-emerald-600 mb-1">Bước 1</div>
          <div className="text-sm">Tạo Firebase Project</div>
        </button>

        <button
          onClick={() => setActiveStep(2)}
          className={`p-3 rounded-2xl text-left border transition-all ${
            activeStep === 2
              ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-black shadow-2xs'
              : 'border-slate-200 hover:bg-slate-50 text-slate-600 font-bold'
          }`}
        >
          <div className="text-xs text-teal-600 mb-1">Bước 2</div>
          <div className="text-sm">Bật Google Sign-In & Firestore</div>
        </button>

        <button
          onClick={() => setActiveStep(3)}
          className={`p-3 rounded-2xl text-left border transition-all ${
            activeStep === 3
              ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-black shadow-2xs'
              : 'border-slate-200 hover:bg-slate-50 text-slate-600 font-bold'
          }`}
        >
          <div className="text-xs text-amber-600 mb-1">Bước 3</div>
          <div className="text-sm">Biến Môi Trường Vercel</div>
        </button>

        <button
          onClick={() => setActiveStep(4)}
          className={`p-3 rounded-2xl text-left border transition-all ${
            activeStep === 4
              ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-black shadow-2xs'
              : 'border-slate-200 hover:bg-slate-50 text-slate-600 font-bold'
          }`}
        >
          <div className="text-xs text-indigo-600 mb-1">Bước 4</div>
          <div className="text-sm">Đẩy GitHub & Deploy Vercel</div>
        </button>
      </div>

      {/* Step Contents */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-50/80 border border-slate-200/80 space-y-4 text-xs">
        {activeStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              Bước 1: Tạo dự án Firebase và lấy thông số cấu hình Web App
            </h3>
            <ol className="list-decimal pl-5 space-y-2 text-slate-700 leading-relaxed font-medium">
              <li>
                Truy cập <strong>https://console.firebase.google.com</strong> bằng tài khoản Google của bạn.
              </li>
              <li>
                Bấm <strong>"Add project"</strong> (Thêm dự án), đặt tên là <code className="bg-white px-2 py-0.5 rounded font-bold text-emerald-800">Kho-Bau-Tri-Thuc</code> rồi bấm Tiếp tục.
              </li>
              <li>
                Tại màn hình tổng quan, bấm vào biểu tượng Web <strong>&lt;/&gt;</strong> để đăng ký ứng dụng Web.
              </li>
              <li>
                Đặt tên Web App (ví dụ: <code className="bg-white px-2 py-0.5 rounded font-bold">kho-bau-web</code>), sau đó Firebase sẽ hiển thị đoạn mã chứa:
                <ul className="list-disc pl-5 mt-1 space-y-1 font-mono text-[11px] text-slate-600">
                  <li>apiKey</li>
                  <li>authDomain</li>
                  <li>projectId</li>
                  <li>storageBucket</li>
                  <li>messagingSenderId</li>
                  <li>appId</li>
                </ul>
              </li>
              <li>Lưu lại các thông số này để điền vào biến môi trường ở Bước 3.</li>
            </ol>
          </div>
        )}

        {activeStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-600" />
              Bước 2: Bật Google Sign-In & Tạo Firestore Database
            </h3>
            <div className="space-y-3 text-slate-700 leading-relaxed font-medium">
              <p>
                <strong>1. Bật xác thực Google Sign-In:</strong>
                <br />
                Vào mục <strong>Authentication</strong> &gt; <strong>Sign-in method</strong> &gt; Chọn <strong>Google</strong> &gt; Bấm <strong>Enable</strong> &gt; Nhập email hỗ trợ của bạn rồi bấm Save.
              </p>
              <p>
                <strong>2. Tạo cơ sở dữ liệu Cloud Firestore:</strong>
                <br />
                Vào mục <strong>Firestore Database</strong> &gt; Bấm <strong>Create database</strong> &gt; Chọn vị trí gần nhất (ví dụ <code className="bg-white px-1.5 py-0.5 rounded font-bold">asia-southeast1</code> hoặc bất kỳ) &gt; Bấm Next.
              </p>
              <p>
                <strong>3. Cập nhật Firestore Security Rules:</strong>
                <br />
                Vào tab <strong>Rules</strong> của Firestore, dán đoạn quy tắc bảo mật sau rồi bấm <strong>Publish</strong>:
              </p>

              <div className="relative mt-2">
                <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto">
                  {rulesSample}
                </pre>
                <button
                  onClick={() => copyToClipboard(rulesSample, 'Firestore Rules')}
                  className="absolute top-2 right-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] flex items-center gap-1.5"
                >
                  {copiedKey === 'Firestore Rules' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Sao chép Rules</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-500" />
              Bước 3: Cấu hình Biến Môi Trường (Environment Variables) trên Vercel
            </h3>
            <p className="text-slate-700 leading-relaxed font-medium">
              Khi deploy lên Vercel, vào mục <strong>Settings</strong> &gt; <strong>Environment Variables</strong> của dự án và thêm 6 biến tương ứng:
            </p>

            <div className="relative mt-2">
              <pre className="p-4 rounded-2xl bg-slate-900 text-amber-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
                {envSample}
              </pre>
              <button
                onClick={() => copyToClipboard(envSample, 'Mẫu biến môi trường')}
                className="absolute top-2 right-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] flex items-center gap-1.5"
              >
                {copiedKey === 'Mẫu biến môi trường' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Sao chép Mẫu .env</span>
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-medium">
              💡 <strong>Lưu ý quan trọng:</strong> Sau khi deploy lên Vercel, hãy sao chép tên miền Vercel (ví dụ: <code className="font-bold">kho-bau-tri-thuc.vercel.app</code>) và thêm vào danh sách <strong>Authorized domains</strong> trong Firebase Console (mục Authentication &gt; Settings &gt; Authorized domains) để đăng nhập Google không bị chặn!
            </div>
          </div>
        )}

        {activeStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-indigo-600" />
              Bước 4: Đẩy mã nguồn lên GitHub và Triển khai với Vercel
            </h3>
            <div className="space-y-3 text-slate-700 leading-relaxed font-medium">
              <p>
                <strong>1. Khởi tạo kho lưu trữ GitHub:</strong>
              </p>
              <div className="p-3 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-[11px] space-y-1">
                <p>git init</p>
                <p>git add .</p>
                <p>git commit -m "Kho bau tri thuc initial commit"</p>
                <p>git branch -M main</p>
                <p>git remote add origin https://github.com/Tên_GitHub_Của_Bạn/kho-bau-tri-thuc.git</p>
                <p>git push -u origin main</p>
              </div>

              <p>
                <strong>2. Kết nối và Deploy trên Vercel:</strong>
                <br />
                - Truy cập <strong>https://vercel.com</strong> và đăng nhập bằng tài khoản GitHub.
                <br />
                - Bấm <strong>"Add New..."</strong> &gt; <strong>"Project"</strong> &gt; Chọn repository <code className="bg-white px-2 py-0.5 rounded font-bold">kho-bau-tri-thuc</code>.
                <br />
                - Trong phần <strong>Environment Variables</strong>, dán các biến môi trường Firebase đã chuẩn bị ở Bước 3.
                <br />
                - Bấm <strong>Deploy</strong>. Vercel sẽ tự động build ứng dụng Vite React thành công trong khoảng 30 giây!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
