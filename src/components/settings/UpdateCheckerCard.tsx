import React, { useState } from 'react';
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  ExternalLink, 
  Loader2, 
  Monitor, 
  Smartphone,
  Tag
} from 'lucide-react';
import { APP_VERSION, GITHUB_RELEASES_URL } from '../../config/appInfo';
import { checkForAppUpdates, UpdateCheckResult } from '../../services/updateChecker';

interface UpdateCheckerCardProps {
  isDark: boolean;
}

type CheckStatus = 'idle' | 'checking' | 'success' | 'error';

export const UpdateCheckerCard: React.FC<UpdateCheckerCardProps> = ({ isDark }) => {
  const [status, setStatus] = useState<CheckStatus>('idle');
  const [result, setResult] = useState<UpdateCheckResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCheck = async () => {
    setStatus('checking');
    setErrorMessage(null);
    try {
      const data = await checkForAppUpdates();
      setResult(data);
      setStatus('success');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : '检查更新失败');
      setStatus('error');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-bold uppercase tracking-wider opacity-70">
          版本与更新
        </h3>
        <span className="text-[11px] font-mono opacity-60 flex items-center gap-1">
          <Tag className="w-3 h-3 text-blue-500" />
          当前版本：v{APP_VERSION}
        </span>
      </div>
      <p className="text-xs opacity-60 mb-3">
        检测云端 GitHub Release 新版本，获取 Windows 桌面端 (.exe) 与 Android 手机端 (.apk) 最新安装包。
      </p>

      <div
        className={`p-4 border rounded-xl space-y-4 ${
          isDark ? 'border-white/10 bg-[#121214]' : 'border-black/10 bg-white'
        }`}
      >
        {/* 顶部版本信息条与检查按钮 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
              <RefreshCw className={`w-4 h-4 ${status === 'checking' ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="text-xs font-bold flex items-center gap-2">
                <span>MathMind 工作台</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-blue-500/15 text-blue-500 font-bold">
                  v{APP_VERSION}
                </span>
              </div>
              <div className="text-[11px] opacity-60">
                有向拓扑逻辑图谱与公理推演系统
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={status === 'checking'}
              onClick={handleCheck}
              className={`px-3 py-1.5 text-xs font-medium border flex items-center space-x-1.5 rounded-lg transition-all active:scale-95 cursor-pointer ${
                status === 'checking'
                  ? 'opacity-60 cursor-not-allowed bg-black/5 dark:bg-white/5 border-transparent'
                  : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-600 shadow-sm'
              }`}
            >
              {status === 'checking' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>正在检测...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>检查更新</span>
                </>
              )}
            </button>

            <a
              href={GITHUB_RELEASES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-1.5 text-xs border rounded-lg transition-all opacity-70 hover:opacity-100 ${
                isDark ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5'
              }`}
              title="前往 GitHub Releases 页面"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* 状态结果反馈区 */}
        {status === 'success' && result && (
          <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-3 animate-fadeIn">
            {result.hasUpdate ? (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-xs font-bold">
                      发现新版本：v{result.latestVersion}
                    </span>
                  </div>
                  {result.publishedAt && (
                    <span className="text-[10px] opacity-70 font-mono">
                      {new Date(result.publishedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {result.releaseName && (
                  <p className="text-xs font-medium opacity-90 pl-6">
                    {result.releaseName}
                  </p>
                )}

                {/* 客户端安装包直达下载按键组 */}
                <div className="pt-2 flex flex-wrap gap-2 pl-6">
                  {result.exeAsset ? (
                    <a
                      href={result.exeAsset.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-sm transition-all"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span>下载 Windows 安装包 (.exe)</span>
                      {result.exeAsset.size > 0 && (
                        <span className="text-[10px] opacity-75 font-mono">
                          ({formatFileSize(result.exeAsset.size)})
                        </span>
                      )}
                    </a>
                  ) : (
                    <a
                      href={result.releaseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-sm transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>查看 Release 附件下载</span>
                    </a>
                  )}

                  {result.apkAsset && (
                    <a
                      href={result.apkAsset.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-sm transition-all"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>下载 Android 安装包 (.apk)</span>
                      {result.apkAsset.size > 0 && (
                        <span className="text-[10px] opacity-75 font-mono">
                          ({formatFileSize(result.apkAsset.size)})
                        </span>
                      )}
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-medium">
                  当前已是最新稳定版本 (v{APP_VERSION})，无需更新。
                </span>
              </div>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="pt-2 border-t border-black/5 dark:border-white/5 animate-fadeIn">
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-800 dark:text-red-300 space-y-1.5">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-xs font-bold">检查更新失败</span>
              </div>
              <p className="text-xs opacity-80 pl-6 leading-relaxed">
                {errorMessage}
              </p>
              <div className="pl-6 pt-1">
                <a
                  href={GITHUB_RELEASES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline inline-flex items-center gap-1"
                >
                  <span>前往网页端查看最新版本</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
