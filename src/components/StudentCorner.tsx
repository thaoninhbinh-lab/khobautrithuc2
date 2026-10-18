import React, { useState } from 'react';
import { LinkItem, StudyRecord, AccessLog } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  Trophy,
  Sparkles,
  Play,
  Award,
  Gamepad2,
  Clock,
  History,
  Video,
} from 'lucide-react';
import { normalizeSubjectName, normalizeResourceType } from '../services/storageService';

interface StudentCornerProps {
  links: LinkItem[];
  records: StudyRecord[];
  accessLogs: AccessLog[];
  onOpenLink: (item: LinkItem) => void;
  onRecordScore: (item: LinkItem) => void;
}

export const StudentCorner: React.FC<StudentCornerProps> = ({
  links,
  records,
  accessLogs,
  onOpenLink,
  onRecordScore,
}) => {
  const { user } = useAuth();
  const [selectedGrade, setSelectedGrade] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [activeSubTab, setActiveSubTab] = useState<'challenges' | 'history'>('challenges');

  // Lọc các học liệu công khai cho khối lớp đang chọn
  const gradeLinks = links.filter(
    (l) => l.isPublic && (l.grade === selectedGrade || l.grade === 0)
  );

  // Lịch sử truy cập của học sinh
  const myAccessLogs = user
    ? accessLogs.filter(
        (log) =>
          log.userId === user.uid ||
          log.userName.toLowerCase() === user.displayName.toLowerCase()
      )
    : accessLogs.slice(0, 15);

  // Các bài đạt điểm của học sinh
  const myRecords = user
    ? records.filter(
        (r) =>
          r.userId === user.uid ||
          r.studentName.toLowerCase() === user.displayName.toLowerCase()
      )
    : records.slice(0, 10);

  const totalPoints = myRecords.reduce((acc, r) => acc + (r.score >= 8 ? 100 : 50), 0);

  return (
    <div className="space-y-6">
      {/* Student Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 p-6 sm:p-8 text-white shadow-lg shadow-emerald-700/15">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-amber-200 text-caption-safe font-black mb-3">
            <Sparkles className="w-4 h-4" />
            Đấu Trường Trí Tuệ Tiểu Học
          </div>
          <h2 className="text-title-main text-white tracking-tight leading-tight">
            {user ? `Chào mừng ${user.displayName} (${user.assignedClass || 'Học sinh'})! 🚀` : 'Chào Mừng Em Đến Với Góc Học Sinh! 🚀'}
          </h2>
          <p className="text-emerald-50 text-main-body font-semibold mt-2 leading-relaxed">
            Khám phá các Trò chơi học tập và Video bài học của 10 môn học. Ghi nhận điểm thưởng và xem lại lịch sử học tập của mình!
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-2 rounded-xl text-desc font-bold">
              <Trophy className="w-5 h-5 text-amber-300" />
              <span>Điểm thưởng tích lũy: <strong className="text-amber-300">{totalPoints} ⭐</strong></span>
            </div>
            <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-2 rounded-xl text-desc font-bold">
              <History className="w-5 h-5 text-emerald-300" />
              <span>Đã truy cập: <strong>{myAccessLogs.length} lần</strong></span>
            </div>
          </div>
        </div>

        <div className="absolute right-4 -bottom-6 text-8xl opacity-30 sm:opacity-50 select-none pointer-events-none">
          🏰
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-emerald-100 shadow-2xs w-fit">
        <button
          onClick={() => setActiveSubTab('challenges')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-input-button font-black transition-all cursor-pointer ${
            activeSubTab === 'challenges'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-emerald-800'
          }`}
        >
          <Gamepad2 className="w-5 h-5" />
          <span>Vào Học &amp; Chơi Game</span>
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-input-button font-black transition-all cursor-pointer ${
            activeSubTab === 'history'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-emerald-800'
          }`}
        >
          <History className="w-5 h-5" />
          <span>Lịch Sử Truy Cập Của Em ({myAccessLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: VÀO HỌC & CHƠI GAME */}
      {activeSubTab === 'challenges' && (
        <div className="space-y-6">
          {/* Grade Selector Tabs từ Lớp 1 đến Lớp 5 */}
          <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-emerald-100 shadow-xs">
            <span className="text-card-title text-slate-800 flex items-center gap-2 font-black">
              <Gamepad2 className="w-5 h-5 text-emerald-600" />
              Chọn khối lớp của em:
            </span>

            <div className="flex items-center gap-2 flex-wrap">
              {[1, 2, 3, 4, 5].map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGrade(g as any)}
                  className={`px-4 sm:px-5 py-2.5 rounded-xl text-input-button font-black transition-all cursor-pointer ${
                    selectedGrade === g
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Lớp {g} {g === 1 ? '🌱' : g === 2 ? '🎒' : g === 3 ? '🚀' : g === 4 ? '⭐' : '👑'}
                </button>
              ))}
            </div>
          </div>

          {/* Challenges Grid */}
          <div>
            <h3 className="text-title-section text-slate-900 mb-4 flex items-center gap-2.5">
              <span>Học liệu công khai dành cho Lớp {selectedGrade}</span>
              <span className="text-caption-safe sm:text-desc font-black px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {gradeLinks.length} bài
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {gradeLinks.map((link) => {
                const isVideo = normalizeResourceType(link.resourceType) === 'video';
                const subjectName = normalizeSubjectName(link.subject);

                return (
                  <div
                    key={link.id}
                    className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 rounded-xl text-caption-safe font-black bg-emerald-100 text-emerald-800">
                          {subjectName} {link.grade > 0 && `Lớp ${link.grade}`}
                        </span>

                        <span
                          className={`text-caption-safe font-black px-2.5 py-1 rounded-lg flex items-center gap-1 ${
                            isVideo
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {isVideo ? (
                            <>
                              <Video className="w-3.5 h-3.5" />
                              <span>Video</span>
                            </>
                          ) : (
                            <>
                              <Gamepad2 className="w-3.5 h-3.5" />
                              <span>Trò chơi học tập</span>
                            </>
                          )}
                        </span>
                      </div>

                      <h4 className="text-item-title text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug mb-1.5">
                        {link.title}
                      </h4>

                      {link.lesson && (
                        <p className="text-desc font-bold text-slate-700 mb-2">
                          {link.lesson}
                        </p>
                      )}

                      {link.description && (
                        <p className="text-desc text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                          {link.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-2.5 flex-wrap">
                      <button
                        onClick={() => onOpenLink(link)}
                        className={`h-10 px-4 rounded-xl text-white font-black text-input-button inline-flex items-center justify-center gap-2 shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 ${
                          isVideo
                            ? 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-rose-500/20'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/20'
                        }`}
                      >
                        <span className="text-base shrink-0 leading-none">🚀</span>
                        <span>Tham gia</span>
                      </button>

                      <button
                        onClick={() => onRecordScore(link)}
                        className="h-10 px-3.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-input-button border border-amber-200 inline-flex items-center justify-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 shadow-2xs"
                        title="Báo kết quả học tập"
                      >
                        <span className="text-base shrink-0 leading-none" role="img" aria-label="Cúp">🏆</span>
                        <span>Báo Điểm</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LỊCH SỬ TRUY CẬP CỦA HỌC SINH */}
      {activeSubTab === 'history' && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-100 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div>
              <h3 className="text-title-section text-slate-900 flex items-center gap-2.5">
                <History className="w-6 h-6 text-emerald-600" />
                Lịch sử truy cập và bài làm của em
              </h3>
              <p className="text-desc text-slate-600 font-semibold mt-1">
                Xem lại danh sách các Trò chơi học tập và Video em đã mở
              </p>
            </div>

            <span className="text-caption-safe sm:text-desc font-black px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200">
              Tổng số {myAccessLogs.length} lượt học
            </span>
          </div>

          {myAccessLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-main-body font-bold">Em chưa có lượt truy cập nào.</p>
              <p className="text-desc mt-1">Hãy nhấn vào các trò chơi ở mục trên để bắt đầu học nhé!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myAccessLogs.map((log) => {
                const matchedLink = links.find((l) => l.id === log.linkId);
                const isVideo = normalizeResourceType(log.resourceType) === 'video';
                const subjectName = normalizeSubjectName(log.subject);

                return (
                  <div
                    key={log.id}
                    className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/70 rounded-2xl px-3.5 transition-colors"
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 mt-0.5 ${
                          isVideo
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {isVideo ? '🎥' : '🎮'}
                      </div>
                      <div>
                        <h4 className="text-main-body font-black text-slate-900 line-clamp-1">
                          {log.linkTitle}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2.5 text-caption-safe font-semibold text-slate-600 mt-1">
                          <span>{subjectName} {log.grade > 0 && `Lớp ${log.grade}`}</span>
                          <span>•</span>
                          <span>{isVideo ? 'Video' : 'Trò chơi học tập'}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(log.timestamp).toLocaleString('vi-VN')}
                          </span>
                          {log.score !== undefined && (
                            <>
                              <span>•</span>
                              <span className="text-amber-800 font-black bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                                ⭐ Đạt: {log.score}/10 điểm
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {matchedLink && (
                      <button
                        onClick={() => onOpenLink(matchedLink)}
                        className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-input-button font-bold transition-colors cursor-pointer self-end sm:self-center flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Mở lại bài</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
