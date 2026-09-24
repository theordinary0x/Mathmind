export type PropositionType = 'axiom' | 'definition' | 'proposition' | 'theorem' | 'corollary' | 'remark' | string;

export type PropositionStatus = 'doubt' | 'review' | 'core' | 'verified';

export interface StatusConfig {
  id: PropositionStatus;
  label: string;
  icon: string;
  color: string;
  darkColor: string;
  badgeBg: string;
  darkBadgeBg: string;
}

export const PROPOSITION_STATUSES: Record<PropositionStatus, StatusConfig> = {
  doubt: {
    id: 'doubt',
    label: '存疑',
    icon: '❓',
    color: '#D97706',
    darkColor: '#FBBF24',
    badgeBg: '#FEF3C7',
    darkBadgeBg: '#451A03'
  },
  review: {
    id: 'review',
    label: '需复习',
    icon: '🔄',
    color: '#2563EB',
    darkColor: '#60A5FA',
    badgeBg: '#DBEAFE',
    darkBadgeBg: '#172554'
  },
  core: {
    id: 'core',
    label: '重点',
    icon: '★',
    color: '#DC2626',
    darkColor: '#F87171',
    badgeBg: '#FEE2E2',
    darkBadgeBg: '#450A0A'
  },
  verified: {
    id: 'verified',
    label: '已证毕',
    icon: '✔',
    color: '#059669',
    darkColor: '#34D399',
    badgeBg: '#D1FAE5',
    darkBadgeBg: '#022C22'
  }
};

export interface PropositionNode {
  id: string;
  type: PropositionType;
  title: string;
  statement: string;
  proof_sketch: string;
  note?: string;
  full_proof?: string;
  examples?: string[]; // Multiple mathematical examples / calculation demonstrations
  depends_on: string[]; // List of upstream proposition IDs this node directly relies on
  position?: { x: number; y: number };
  status?: PropositionStatus;
  tags?: string[];
}


export interface GraphDataset {
  version: string;
  updatedAt: string;
  nodes: PropositionNode[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  dataset: GraphDataset;
}

export type ThemeMode = 'dark' | 'paper' | 'system';
export type AppTheme = 'dark' | 'paper';
export type CornerStyle = 'rounded' | 'sharp';
export type SurfaceMaterial = 'glass' | 'solid';

export type BackgroundPresetType = 
  | 'paper' 
  | 'chalkboard' 
  | 'grid' 
  | 'dots' 
  | 'dark' 
  | 'custom' 
  | 'parchment';

export interface CanvasSettings {
  preventBrowserContextMenu: boolean;
  backgroundPreset: BackgroundPresetType;
  customBgImage?: string;
  bgOpacity: number;
  bgBlur: number;
  bgRepeat: boolean;
}

export const DEFAULT_CANVAS_SETTINGS: CanvasSettings = {
  preventBrowserContextMenu: true,
  backgroundPreset: 'dots',
  bgOpacity: 0.9,
  bgBlur: 0,
  bgRepeat: false
};

export interface TypeConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  darkColor: string;
  darkBgColor: string;
  darkBorderColor: string;
  shape: 'rectangle';
}

export const NODE_TYPES: Record<string, TypeConfig> = {
  axiom: {
    label: '公理',
    color: '#1E3A8A',
    bgColor: '#F0F7FF',
    borderColor: '#2563EB',
    darkColor: '#89B4FA',
    darkBgColor: '#182436',
    darkBorderColor: '#5888C4',
    shape: 'rectangle'
  },
  definition: {
    label: '定义',
    color: '#065F46',
    bgColor: '#F0FDF4',
    borderColor: '#059669',
    darkColor: '#A6E3A1',
    darkBgColor: '#162C22',
    darkBorderColor: '#4CA47A',
    shape: 'rectangle'
  },
  proposition: {
    label: '命题',
    color: '#5B21B6',
    bgColor: '#F5F3FF',
    borderColor: '#7C3AED',
    darkColor: '#C4B5FD',
    darkBgColor: '#241738',
    darkBorderColor: '#8B5CF6',
    shape: 'rectangle'
  },
  theorem: {
    label: '定理',
    color: '#991B1B',
    bgColor: '#FEF2F2',
    borderColor: '#DC2626',
    darkColor: '#F38BA8',
    darkBgColor: '#341B20',
    darkBorderColor: '#C45766',
    shape: 'rectangle'
  },
  corollary: {
    label: '推论',
    color: '#92400E',
    bgColor: '#FFFBEB',
    borderColor: '#D97706',
    darkColor: '#FAB387',
    darkBgColor: '#362415',
    darkBorderColor: '#C8833B',
    shape: 'rectangle'
  },
  remark: {
    label: '注记',
    color: '#0E7490',
    bgColor: '#ECFEFF',
    borderColor: '#0891B2',
    darkColor: '#CFFAFE',
    darkBgColor: '#16272B',
    darkBorderColor: '#22D3EE',
    shape: 'rectangle'
  }
};

export type AutoSaveMode = 'realtime' | '5s' | '15s' | '30s' | '1m' | '5m' | 'manual';

export interface AutoSaveOption {
  mode: AutoSaveMode;
  label: string;
  intervalMs: number;
  description: string;
}

export const AUTO_SAVE_OPTIONS: AutoSaveOption[] = [
  {
    mode: 'realtime',
    label: '实时保存 (即时同步)',
    intervalMs: 0,
    description: '任何修改毫秒级即时存入本地'
  },
  {
    mode: '5s',
    label: '每 5 秒自动保存',
    intervalMs: 5000,
    description: '有修改时每 5 秒自动同步'
  },
  {
    mode: '15s',
    label: '每 15 秒自动保存',
    intervalMs: 15000,
    description: '每 15 秒检查并同步一次'
  },
  {
    mode: '30s',
    label: '每 30 秒自动保存',
    intervalMs: 30000,
    description: '每 30 秒检查并同步一次'
  },
  {
    mode: '1m',
    label: '每 1 分钟自动保存',
    intervalMs: 60000,
    description: '每 1 分钟检查并同步一次'
  },
  {
    mode: '5m',
    label: '每 5 分钟自动保存',
    intervalMs: 300000,
    description: '每 5 分钟检查并同步一次'
  },
  {
    mode: 'manual',
    label: '手动保存 (Ctrl+S)',
    intervalMs: 0,
    description: '关闭自动保存，使用 Ctrl+S 保存'
  }
];

