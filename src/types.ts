export type PropositionType = 'axiom' | 'definition' | 'proposition' | 'theorem' | 'corollary' | string;

export interface PropositionNode {
  id: string;
  type: PropositionType;
  title: string;
  statement: string;
  proof_sketch: string;
  note?: string;
  full_proof?: string;
  depends_on: string[]; // List of upstream proposition IDs this node directly relies on
  position?: { x: number; y: number };
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

