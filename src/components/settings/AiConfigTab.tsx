import React, { useState } from 'react';
import { Sparkles, Check, Eye, EyeOff } from 'lucide-react';
import { AiProvider, AiSettings } from '../../types/ai';
import { PROVIDER_CONFIGS } from '../../services/ai/aiConfig';
import { useTranslation } from '../../i18n/LanguageContext';

interface AiConfigTabProps {
  aiSettings: AiSettings;
  onProviderChange: (provider: AiProvider) => void;
  onUpdateAiSettings: (partial: Partial<AiSettings>) => void;
  aiSavedNotice: boolean;
  isDark: boolean;
}

export const AiConfigTab: React.FC<AiConfigTabProps> = ({
  aiSettings,
  onProviderChange,
  onUpdateAiSettings,
  aiSavedNotice,
  isDark
}) => {
  const { t } = useTranslation();
  const [showAiKey, setShowAiKey] = useState<boolean>(false);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-1 opacity-70 flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{t('settings.tabAi')}</span>
          </h3>
          <p className="text-xs opacity-60">
            {t('settings.apiKeyDesc')}
          </p>
        </div>
        {aiSavedNotice && (
          <span className="text-xs text-emerald-500 font-medium animate-in fade-in flex items-center space-x-1">
            <Check className="w-3.5 h-3.5" />
            <span>已保存</span>
          </span>
        )}
      </div>

      {/* Provider Selector Cards */}
      <div className="space-y-2">
        <label className="text-xs font-bold opacity-80">{t('settings.aiProviderTitle')}</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {(Object.keys(PROVIDER_CONFIGS) as AiProvider[]).map(pKey => {
            const meta = PROVIDER_CONFIGS[pKey];
            const isSelected = aiSettings.provider === pKey;
            return (
              <button
                key={pKey}
                type="button"
                onClick={() => onProviderChange(pKey)}
                className={`p-3 border text-left transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500/10 shadow-xs'
                    : isDark
                    ? 'border-white/10 hover:border-white/20 bg-zinc-900/40'
                    : 'border-black/10 hover:border-black/20 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs">{meta.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-500" />}
                </div>
                <div className="flex items-center space-x-2 mt-1.5 text-[10px] opacity-60 font-mono">
                  <span>{meta.supportsPdf ? 'PDF / 图片 / 文本' : meta.supportsImage ? '图片 / 文本' : '纯文本'}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Provider Detailed Form */}
      <div
        className={`p-4 border space-y-4 ${
          isDark ? 'border-white/10 bg-zinc-900/30' : 'border-black/10 bg-white'
        }`}
      >
        {/* Model Name & Quick Choices */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold opacity-80">{t('settings.aiModelTitle')}</label>
            <div className="flex items-center space-x-1 text-[10px]">
              <span className="opacity-50">推荐:</span>
              {PROVIDER_CONFIGS[aiSettings.provider].candidateModels.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onUpdateAiSettings({ model: m })}
                  className={`px-1.5 py-0.5 font-mono transition-colors ${
                    aiSettings.model === m
                      ? 'bg-blue-600 text-white'
                      : isDark ? 'bg-white/10 text-zinc-300 hover:bg-white/20' : 'bg-black/5 text-stone-700 hover:bg-black/10'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <input
            type="text"
            value={aiSettings.model}
            onChange={e => onUpdateAiSettings({ model: e.target.value })}
            className={`w-full p-2.5 border text-xs font-mono outline-hidden ${
              isDark ? 'bg-[#18181B] border-white/15 text-white' : 'bg-[#FAF8F5] border-black/15 text-stone-900'
            }`}
            placeholder="模型代号"
          />
        </div>

        {/* API Key */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold opacity-80">{t('settings.apiKeyTitle')}</label>
            {PROVIDER_CONFIGS[aiSettings.provider].docUrl && (
              <a
                href={PROVIDER_CONFIGS[aiSettings.provider].docUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-500 hover:underline"
              >
                前往官方获取密钥 &rarr;
              </a>
            )}
          </div>
          <div className="relative">
            <input
              type={showAiKey ? 'text' : 'password'}
              value={aiSettings.apiKey}
              onChange={e => onUpdateAiSettings({ apiKey: e.target.value })}
              placeholder={`请输入 ${PROVIDER_CONFIGS[aiSettings.provider].name} 的 API Key`}
              className={`w-full p-2.5 pr-10 border text-xs font-mono outline-hidden ${
                isDark ? 'bg-[#18181B] border-white/15 text-white' : 'bg-[#FAF8F5] border-black/15 text-stone-900'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowAiKey(!showAiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
              title={showAiKey ? '隐藏密钥' : '显示密钥'}
            >
              {showAiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Base URL (for proxies, custom endpoints, Ollama) */}
        <div>
          <label className="block text-xs font-bold opacity-80 mb-1.5">接口请求基地址 (Base URL)</label>
          <input
            type="text"
            value={aiSettings.baseUrl}
            onChange={e => onUpdateAiSettings({ baseUrl: e.target.value })}
            className={`w-full p-2.5 border text-xs font-mono outline-hidden ${
              isDark ? 'bg-[#18181B] border-white/15 text-white' : 'bg-[#FAF8F5] border-black/15 text-stone-900'
            }`}
            placeholder={PROVIDER_CONFIGS[aiSettings.provider].defaultBaseUrl}
          />
          <p className="mt-1 text-[11px] opacity-50">
            支持自建反向代理、OneAPI、或本地 Ollama 地址（如 http://localhost:11434/v1）
          </p>
        </div>
      </div>

      <div className={`p-3 border text-xs leading-relaxed opacity-75 ${
        isDark ? 'bg-white/5 border-white/10' : 'bg-stone-50 border-black/10'
      }`}>
        <p className="font-bold mb-1">关于多模态与 PDF 支持提示：</p>
        <ul className="list-disc list-inside space-y-0.5 text-[11px]">
          <li><strong>Google Gemini</strong>：原生支持输入整份 PDF 与高精度数学公式识别（推荐 <code>gemini-3.8-flash</code> / <code>gemini-3.7-flash</code>）。</li>
          <li><strong>DeepSeek</strong>：支持文字与截图输入，最新 <code>deepseek-flash</code> 原生具备视觉多模态能力；<code>deepseek-chat</code> / <code>deepseek-reasoner</code> 擅长深度数理逻辑推理。</li>
          <li><strong>通义千问 / 智谱 GLM</strong>：支持截图与文字输入，推荐最新 <code>qwen3.8-flash</code> 与 <code>glm-5.3-flash</code>。</li>
        </ul>
      </div>
    </div>
  );
};
