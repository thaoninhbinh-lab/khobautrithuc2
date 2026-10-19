import React, { useState } from 'react';
import { LinkItem } from '../types';
import {
  ExternalLink,
  Copy,
  Check,
  Pin,
  Heart,
  Lock,
  Edit2,
  Trash2,
  Award,
  Sparkles,
  Play,
  Calendar,
} from 'lucide-react';
import { normalizeSubjectName, normalizeResourceType } from '../services/storageService';

interface LinkCardProps {
  item: LinkItem;
  canManage: boolean;
  onOpenLink: (item: LinkItem) => void;
  onCopyLink: (url: string) => void;
  onTogglePin: (item: LinkItem) => void;
  onToggleFavorite: (item: LinkItem) => void;
  onEdit: (item: LinkItem) => void;
  onDelete: (item: LinkItem) => void;
  onRecordScore: (item: LinkItem) => void;
}

export const LinkCard: React.FC<LinkCardProps> = ({
  item,
  canManage,
  onOpenLink,
  onCopyLink,
  onTogglePin,
  onToggleFavorite,
  onEdit,
  onDelete,
  onRecordScore,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopyLink(item.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Trích xuất domain
  let hostname = '';
  try {
    hostname = new URL(item.url).hostname.replace('www.', '');
  } catch {
    hostname = item.url;
  }

  const isVideo = normalizeResourceType(item.resourceType) === 'video';
  const isOther = normalizeResourceType(item.resourceType) === 'khac';
  const subjectName = normalizeSubjectName(item.subject);

  return (
    <div
      className={`group relative bg-white rounded-3xl p-5 border transition-all duration-200 flex flex-col justify-between ${
        item.isPinned
          ? 'border-amber-300/90 shadow-md shadow-amber-500/10 ring-1 ring-amber-300/40 bg-gradient-to-b from-amber-50/20 to-white'
          : isVideo
          ? 'border-rose-100 hover:border-rose-300 shadow-xs hover:shadow-md'
          : isOther
          ? 'border-sky-100 hover:border-sky-300 shadow-xs hover:shadow-md'
          : 'border-emerald-100 hover:border-emerald-300 shadow-xs hover:shadow-md hover:shadow-emerald-900/5'
      }`}
    >
      <div>
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Môn học */}
            <span className="px-3 py-1 rounded-xl text-caption-safe font-black bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
              <span>{subjectName}</span>
            </span>

            {/* Khối lớp */}
            <span className="px-3 py-1 rounded-xl text-caption-safe font-black bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1.5">
              <span>🎒</span>
              <span>{item.grade > 0 ? `Lớp ${item.grade}` : 'Toàn trường'}</span>
            </span>

            {/* Chỉ hiển thị Video nếu là video (đã loại bỏ hoàn toàn nhãn Trò chơi) */}
            {isVideo && (
              <span className="px-3 py-1 rounded-xl text-caption-safe font-black flex items-center gap-1 bg-rose-100 text-rose-800 border border-rose-200">
                <span>🎬 Video bài giảng</span>
              </span>
            )}

            {/* Hiển thị Khác */}
            {isOther && (
              <span className="px-3 py-1 rounded-xl text-caption-safe font-black flex items-center gap-1 bg-sky-100 text-sky-800 border border-sky-200">
                <span>📁 Khác</span>
              </span>
            )}

            {/* Chỉ hiển thị nhãn Riêng tư nếu bài học ở chế độ riêng tư (đã ẩn nhãn Công khai) */}
            {!item.isPublic && (
              <span
                title="Chỉ bạn & Admin xem được"
                className="p-1.5 rounded-lg text-caption-safe flex items-center gap-1 text-amber-800 bg-amber-50 border border-amber-200"
              >
                <Lock className="w-4 h-4" />
                <span className="text-[11px] font-bold">Riêng tư</span>
              </span>
            )}
          </div>

          {/* Quick Actions: Favorite & Pin */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onToggleFavorite(item)}
              title={item.isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-pink-100/70 transition-all cursor-pointer text-base leading-none select-none hover:scale-115 active:scale-90"
            >
              {item.isFavorite ? '💖' : '🤍'}
            </button>

            {canManage && (
              <button
                onClick={() => onTogglePin(item)}
                title={item.isPinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  item.isPinned
                    ? 'text-amber-600 bg-amber-100/70 hover:bg-amber-200'
                    : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                }`}
              >
                <Pin className={`w-4.5 h-4.5 ${item.isPinned ? 'fill-amber-600' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <h3
          onClick={() => onOpenLink(item)}
          className="text-item-title font-black text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug cursor-pointer mb-2 line-clamp-2"
        >
          {item.title}
        </h3>

        {/* Lesson / Topic */}
        <div className="flex flex-col gap-1 text-desc text-slate-600 mb-2.5">
          {item.lesson && (
            <p className="font-bold text-emerald-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {item.lesson}
            </p>
          )}
          {item.topic && (
            <p className="text-slate-500 font-semibold line-clamp-1 italic text-caption-safe">
              {item.topic}
            </p>
          )}
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-desc text-slate-600 line-clamp-2 mb-3.5 leading-relaxed">
            {item.description}
          </p>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3.5">
            {item.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg text-caption-safe font-bold bg-slate-100 text-slate-600"
              >
                #{tag}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="text-caption-safe font-bold text-slate-400 self-center">
                +{item.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer & Actions */}
      <div className="pt-3.5 border-t border-slate-100 mt-2">
        {/* Creator & Plays Meta */}
        <div className="flex items-center justify-between text-caption-safe text-slate-500 mb-3 font-semibold gap-2">
          <span className="flex items-center gap-1.5 text-slate-600 truncate max-w-[150px]">
            <span className="text-base shrink-0 leading-none">👩‍🏫</span>
            <strong className="text-slate-700 truncate">{item.creatorName || 'Giáo viên'}</strong>
          </span>
          <span className="font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200/70 shrink-0 flex items-center gap-1">
            <span>🎉</span>
            <span>{item.playCount || 0} bạn đã tham gia</span>
          </span>
        </div>

        {/* Action Button Row */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {/* Nút Mở học liệu To & Nổi bật */}
          <button
            onClick={() => onOpenLink(item)}
            className={`h-10 px-4 rounded-xl font-black text-input-button inline-flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer shrink-0 text-white ${
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

          {/* Nút Ghi nhận kết quả làm bài */}
          <button
            onClick={() => onRecordScore(item)}
            title="Ghi nhận điểm số bài này"
            className="w-10 h-10 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 inline-flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 shadow-2xs text-lg leading-none"
          >
            <span role="img" aria-label="Cúp vàng">🏆</span>
          </button>

          {/* Nút Sao chép liên kết */}
          <button
            onClick={handleCopy}
            title="Sao chép liên kết"
            className="w-10 h-10 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 inline-flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 shadow-2xs text-base leading-none"
          >
            {copied ? (
              <Check className="w-4.5 h-4.5 text-emerald-600" />
            ) : (
              <span role="img" aria-label="Sao chép link">🔗</span>
            )}
          </button>

          {/* Sửa & Xóa (nếu có quyền) */}
          {canManage && (
            <>
              <button
                onClick={() => onEdit(item)}
                title="Chỉnh sửa liên kết"
                className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 inline-flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(item)}
                title="Xóa liên kết"
                className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 inline-flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
