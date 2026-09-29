import React from 'react';
import { PropositionStatus } from '../../types';

interface IconProps {
  size?: number;
  className?: string;
}

/** 存疑 / 待证 (Doubt) — 几何问号徽标 */
export const DoubtVectorIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="9.5" strokeOpacity="0.35" />
    <path d="M9.3 9.2a2.8 2.8 0 0 1 5.3 1.1c0 1.8-2.6 2.3-2.6 4" />
    <circle cx="12" cy="17.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

/** 核心结论 (Core) — 几何四芒星/八角星徽标 */
export const CoreStarVectorIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon
      points="12 2.5 14.8 8.6 21.5 9.4 16.5 14 17.8 20.6 12 17.3 6.2 20.6 7.5 14 2.5 9.4 9.2 8.6 12 2.5"
      fill="currentColor"
      fillOpacity="0.2"
    />
  </svg>
);

/** 待复习 (Review) — 双弧循环演进图标 */
export const ReviewCycleVectorIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 11a8.1 8.1 0 0 0-15.5-2m-.5-4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
);

/** 已证 / 已掌握 (Verified) — 几何盾牌对勾图标 */
export const VerifiedCheckVectorIcon: React.FC<IconProps> = ({ size = 14, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="9.5" strokeOpacity="0.35" />
    <path d="m8.2 12.3 2.6 2.6 5.2-5.4" />
  </svg>
);

/** 根据命题状态自动渲染对应的统一矢量图标 */
export const StatusVectorIcon: React.FC<{ status: PropositionStatus; size?: number; className?: string }> = ({
  status,
  size = 13,
  className = '',
}) => {
  switch (status) {
    case 'doubt':
      return <DoubtVectorIcon size={size} className={className} />;
    case 'core':
      return <CoreStarVectorIcon size={size} className={className} />;
    case 'review':
      return <ReviewCycleVectorIcon size={size} className={className} />;
    case 'verified':
      return <VerifiedCheckVectorIcon size={size} className={className} />;
    default:
      return null;
  }
};

/** 压感手写笔矢量图标 (Stylus Pen) */
export const StylusPenVectorIcon: React.FC<IconProps> = ({ size = 16, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M17.5 3.5a2.12 2.12 0 0 1 3 3L8 19l-4.5 1.5L5 16Z" />
    <path d="m15 6 3 3" />
    <path d="M3.5 20.5c2 0 4.5.5 7-1.5 2.5-2 5-1 7.5-1" strokeOpacity="0.55" />
  </svg>
);

/** PDF 文献讲义批注矢量图标 (PDF Note) */
export const PdfNoteVectorIcon: React.FC<IconProps> = ({ size = 16, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="13" y2="17" />
  </svg>
);

/** AI 星芒矢量图标 (替代原始 ✨ Emoji) */
export const SparkleAiVectorIcon: React.FC<IconProps> = ({ size = 15, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path
      d="M12 3l2.2 6.3L20.5 11.5l-6.3 2.2L12 20l-2.2-6.3L3.5 11.5l6.3-2.2L12 3z"
      fill="currentColor"
      fillOpacity="0.18"
    />
    <path d="M19 3v4M21 5h-4M5 17v3M6.5 18.5h-3" />
  </svg>
);

/** 饮品/赞助矢量图标 (替代原始 🥤 Emoji) */
export const TeaCupVectorIcon: React.FC<IconProps> = ({ size = 16, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
    <line x1="6" y1="2" x2="6" y2="4" />
    <line x1="10" y1="2" x2="10" y2="4" />
    <line x1="14" y1="2" x2="14" y2="4" />
  </svg>
);

/** 防手掌误触矢量图标 (Stylus Only / Palm Rejection) */
export const PalmRejectVectorIcon: React.FC<IconProps> = ({ size = 15, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
    <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" />
    <path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" />
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    <line x1="3" y1="3" x2="21" y2="21" />
  </svg>
);
