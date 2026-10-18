import React from 'react';
import bannerWebp from '../assets/banner-kho-bau-tri-thuc.webp';
import bannerPng from '../assets/banner-kho-bau-tri-thuc.png';

interface HeroBannerProps {
  onExploreClick?: () => void;
  onOpenRoleLogin?: () => void;
  onOpenAddModal?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = () => {
  return (
    <div className="w-full mb-6">
      {/* Chiều cao ban đầu nguyên bản 100% theo đúng tỷ lệ ảnh gốc: 2103px x 748px */}
      <div
        className="w-full relative overflow-hidden rounded-2xl md:rounded-3xl shadow-lg shadow-emerald-900/10 border border-emerald-400/30 bg-emerald-950/5 transition-all aspect-[2103/748]"
        style={{ aspectRatio: '2103 / 748' }}
      >
        <picture className="w-full h-full block">
          <source srcSet={bannerWebp} type="image/webp" />
          <img
            src={bannerPng}
            alt="NGUỒN SÁNG TRI THỨC! - Học vui mỗi ngày – Khám phá ngàn điều hay!"
            title="NGUỒN SÁNG TRI THỨC! - Học vui mỗi ngày – Khám phá ngàn điều hay!"
            className="w-full h-full object-cover object-center block select-none"
            loading="eager"
            decoding="async"
            onError={(e) => {
              // Fallback to absolute public path if relative asset fails
              if (e.currentTarget.src !== '/banner-kho-bau-tri-thuc.png') {
                e.currentTarget.src = '/banner-kho-bau-tri-thuc.png';
              }
            }}
          />
        </picture>
      </div>
    </div>
  );
};
