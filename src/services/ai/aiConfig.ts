import { AiProvider, AiSettings } from '../../types/ai';

export interface ProviderMeta {
  name: string;
  defaultBaseUrl: string;
  defaultModel: string;
  candidateModels: string[];
  docUrl: string;
  supportsImage: boolean;
  supportsPdf: boolean;
}

export const PROVIDER_CONFIGS: Record<AiProvider, ProviderMeta> = {
  gemini: {
    name: 'Google Gemini',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com',
    defaultModel: 'gemini-2.5-flash',
    candidateModels: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'],
    docUrl: 'https://aistudio.google.com/apikey',
    supportsImage: true,
    supportsPdf: true
  },
  deepseek: {
    name: 'DeepSeek (深度求索)',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    candidateModels: ['deepseek-chat', 'deepseek-reasoner'],
    docUrl: 'https://platform.deepseek.com/api_keys',
    supportsImage: false,
    supportsPdf: false
  },
  qwen: {
    name: '通义千问 (Qwen)',
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus',
    candidateModels: ['qwen-plus', 'qwen-max', 'qwen-vl-max', 'qwen-turbo'],
    docUrl: 'https://dashscope.console.aliyun.com/apiKey',
    supportsImage: true,
    supportsPdf: false
  },
  glm: {
    name: '智谱清言 (GLM)',
    defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4-flash',
    candidateModels: ['glm-4-flash', 'glm-4-plus', 'glm-4v-plus'],
    docUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
    supportsImage: true,
    supportsPdf: false
  },
  custom: {
    name: '自定义 / 本地 Ollama',
    defaultBaseUrl: 'http://localhost:11434/v1',
    defaultModel: 'qwen2.5:7b',
    candidateModels: ['qwen2.5:7b', 'deepseek-r1', 'llama3'],
    docUrl: '',
    supportsImage: true,
    supportsPdf: false
  }
};

const STORAGE_KEY = 'mathmind_ai_settings_v1';
const KEYS_STORAGE_PREFIX = 'mathmind_ai_key_';

export const loadAiSettings = (): AiSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const provider: AiProvider = parsed.provider || 'gemini';
      const meta = PROVIDER_CONFIGS[provider] || PROVIDER_CONFIGS.gemini;
      return {
        provider,
        apiKey: parsed.apiKey || localStorage.getItem(`${KEYS_STORAGE_PREFIX}${provider}`) || '',
        baseUrl: parsed.baseUrl || meta.defaultBaseUrl,
        model: parsed.model || meta.defaultModel
      };
    }
  } catch (e) {
    console.error('Failed to load AI settings from localStorage:', e);
  }

  // Defaults
  const defaultProvider: AiProvider = 'gemini';
  const meta = PROVIDER_CONFIGS[defaultProvider];
  return {
    provider: defaultProvider,
    apiKey: localStorage.getItem(`${KEYS_STORAGE_PREFIX}${defaultProvider}`) || '',
    baseUrl: meta.defaultBaseUrl,
    model: meta.defaultModel
  };
};

export const saveAiSettings = (settings: AiSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    if (settings.apiKey) {
      localStorage.setItem(`${KEYS_STORAGE_PREFIX}${settings.provider}`, settings.apiKey);
    }
  } catch (e) {
    console.error('Failed to save AI settings to localStorage:', e);
  }
};

export const getSavedKeyForProvider = (provider: AiProvider): string => {
  return localStorage.getItem(`${KEYS_STORAGE_PREFIX}${provider}`) || '';
};
