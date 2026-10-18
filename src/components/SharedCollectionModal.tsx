import React, { useState } from 'react';
import { SubjectType, GradeLevel } from '../types';
import { X, Copy, Check, Share2, Globe, Sparkles, BookOpen } from 'lucide-react';

interface SharedCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCopyNotice: (msg: string) => void;
}

export const SharedCollectionModal: React.FC<SharedCollectionModalProps> = ({
  isOpen,
  onClose,
  onCopyNotice,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<SubjectType | 'all'>('tinhoc');
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | 'all'>(4);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const origin = window.location.origin;
  const shareUrl = `${origin}/?subject=${selectedSubject}&grade=${selectedGrade}&publicOnly=true`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    onCopyNotice('Đã sao chép đường dẫn bộ sưu tập chia sẻ thành công!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-emerald-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl">
              <Share2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Chia Sẻ Bộ Sưu Tập Học Liệu
              </h3>
              <p className="text-xs text-slate-500 font-semibold">
                Gửi link cho học sinh, phụ huynh hoặc đồng nghiệp mở trực tiếp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Môn học</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-hidden"
              >
                <option value="all">Tất cả môn học</option>
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

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Khối lớp</label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value === 'all' ? 'all' : (Number(e.target.value) as any))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-hidden"
              >
                <option value="all">Toàn bộ khối 1-5</option>
                <option value={1}>Lớp 1</option>
                <option value={2}>Lớp 2</option>
                <option value={3}>Lớp 3</option>
                <option value={4}>Lớp 4</option>
                <option value={5}>Lớp 5</option>
              </select>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
              <Globe className="w-4 h-4 text-emerald-600" />
              <span>Liên kết chia sẻ công khai:</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-emerald-200 font-mono text-xs text-slate-700 break-all select-all">
              {shareUrl}
            </div>
            <p className="text-[11px] text-emerald-800 font-medium">
              💡 Học sinh khi mở đường link này sẽ chỉ thấy các bài học, trò chơi Quizizz công khai đã được chọn, giao diện thoáng đãng, dễ chơi và không yêu cầu đăng nhập.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold"
            >
              Đóng
            </button>
            <button
              onClick={handleCopy}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Đã sao chép link!' : 'Sao chép đường dẫn'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
