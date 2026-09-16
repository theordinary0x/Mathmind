import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React component tree:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetData = () => {
    if (window.confirm('是否重置本地缓存数据并刷新页面？这将恢复初始演示体系。')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen flex items-center justify-center bg-[#121214] text-[#EDECE8] p-6 font-sans select-none">
          <div className="max-w-lg w-full bg-[#18181B] border border-[#3F3F46] p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h2 className="font-serif font-bold text-base">系统遇到运行时异常</h2>
            </div>

            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              检测到界面渲染错误，已安全拦截以防数据损坏。
            </p>

            {this.state.error && (
              <div className="p-3 bg-black/40 border border-[#27272A] font-mono text-[11px] text-red-300 break-all max-h-40 overflow-y-auto">
                {this.state.error.toString()}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end space-x-3 text-xs">
              <button
                onClick={this.handleResetData}
                className="px-3 py-1.5 border border-[#3F3F46] hover:bg-white/5 transition-colors text-[#A1A1AA] hover:text-white"
              >
                重置缓存并刷新
              </button>
              <button
                onClick={this.handleReload}
                className="flex items-center space-x-1 px-4 py-1.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>刷新重试</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
