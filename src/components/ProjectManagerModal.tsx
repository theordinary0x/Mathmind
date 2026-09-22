import React, { useState, useEffect } from 'react';
import { X, Plus, Folder, Trash2, ArrowRight } from 'lucide-react';
import { Project, AppTheme } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { useBackdropClose } from '../hooks/useBackdropClose';


interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (name: string, template: 'blank' | 'peano' | 'euclid') => void;
  onDeleteProject: (projectId: string) => void;
  theme: AppTheme;
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  theme,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [template, setTemplate] = useState<'blank' | 'peano' | 'euclid'>('blank');

  const { t } = useTranslation();
  const isDark = theme === 'dark';
  const backdropProps = useBackdropClose(onClose);

  // Handle ESC key to dismiss modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    onCreateProject(newProjectName.trim(), template);
    setNewProjectName('');
    setIsCreating(false);
    onClose();
  };

  return (

    <div
      {...backdropProps}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-100"
    >

      <div
        className={`border shadow-2xl w-full max-w-lg flex flex-col overflow-hidden backdrop-blur-md ${
          isDark
            ? 'bg-[#18181B] border-white/10 text-zinc-100'
            : 'bg-white border-black/10 text-stone-800'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-3.5 border-b flex items-center justify-between ${
            isDark ? 'bg-zinc-900/60 border-white/10' : 'bg-[#FAF8F5] border-black/10'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Folder className="w-4 h-4 text-blue-500" />
            <h3 className="font-serif font-bold text-sm tracking-tight">{t('projectModal.title')}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 opacity-60 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Create Project Trigger */}
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className={`w-full py-2.5 px-4 border border-dashed text-xs font-serif font-medium flex items-center justify-center space-x-2 transition-colors ${
                isDark
                  ? 'border-white/20 hover:border-blue-500 hover:bg-white/5 text-zinc-300'
                  : 'border-black/20 hover:border-stone-800 hover:bg-black/5 text-stone-700'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('projectModal.createProject')}</span>
            </button>
          ) : (
            <form
              onSubmit={handleCreate}
              className={`p-4 border space-y-3.5 ${
                isDark ? 'bg-zinc-900/40 border-white/10' : 'bg-[#FAF8F5] border-black/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-serif font-bold">{t('projectModal.createProject')}</span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs opacity-60 hover:opacity-100"
                >
                  取消
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold opacity-70 mb-1">项目名称</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  placeholder={t('projectModal.projectNamePlaceholder')}
                  className={`w-full text-xs font-serif p-2 border transition-colors focus:outline-none ${
                    isDark
                      ? 'bg-zinc-800/70 border-white/10 text-white focus:border-blue-500'
                      : 'bg-white border-black/10 text-stone-900 focus:border-stone-800'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold opacity-70 mb-1">模版</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTemplate('blank')}
                    className={`p-2 text-left border text-xs transition-colors ${
                      template === 'blank'
                        ? isDark
                          ? 'border-blue-500 bg-blue-500/10 text-blue-400 font-bold'
                          : 'border-stone-800 bg-stone-100 text-stone-900 font-bold'
                        : isDark
                          ? 'border-white/10 bg-zinc-800/40 opacity-70 hover:opacity-100'
                          : 'border-black/10 bg-white opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="font-serif">空白</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTemplate('peano')}
                    className={`p-2 text-left border text-xs transition-colors ${
                      template === 'peano'
                        ? isDark
                          ? 'border-blue-500 bg-blue-500/10 text-blue-400 font-bold'
                          : 'border-stone-800 bg-stone-100 text-stone-900 font-bold'
                        : isDark
                          ? 'border-white/10 bg-zinc-800/40 opacity-70 hover:opacity-100'
                          : 'border-black/10 bg-white opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="font-serif">皮亚诺算术</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTemplate('euclid')}
                    className={`p-2 text-left border text-xs transition-colors ${
                      template === 'euclid'
                        ? isDark
                          ? 'border-blue-500 bg-blue-500/10 text-blue-400 font-bold'
                          : 'border-stone-800 bg-stone-100 text-stone-900 font-bold'
                        : isDark
                          ? 'border-white/10 bg-zinc-800/40 opacity-70 hover:opacity-100'
                          : 'border-black/10 bg-white opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="font-serif">欧几里得几何</div>
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className={`px-4 py-1.5 text-xs font-medium transition-colors shadow-xs ${
                    isDark
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-stone-900 hover:bg-stone-800 text-white'
                  }`}
                >
                  创建
                </button>
              </div>
            </form>
          )}

          {/* Project List */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold opacity-60 uppercase tracking-wider font-mono">
              项目列表 ({projects.length})
            </div>

            {projects.map(proj => {
              const isActive = proj.id === activeProjectId;
              return (
                <div
                  key={proj.id}
                  className={`p-3 border transition-all flex items-center justify-between ${
                    isActive
                      ? isDark
                        ? 'border-blue-500/50 bg-blue-500/5'
                        : 'border-stone-800 bg-stone-100/70'
                      : isDark
                        ? 'border-white/10 bg-zinc-900/30 hover:border-white/20'
                        : 'border-black/10 bg-white hover:border-black/20'
                  }`}
                >
                  <div 
                    className="flex-1 min-w-0 cursor-pointer pr-4"
                    onClick={() => {
                      onSelectProject(proj.id);
                      onClose();
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <h4 className="font-serif font-bold text-xs truncate">
                        {proj.name}
                      </h4>
                      {isActive && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-600 text-white">
                          当前
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] opacity-60 mt-0.5 line-clamp-1 font-serif">
                      {proj.description || `共 ${proj.dataset?.nodes?.length || 0} 个命题`}
                    </p>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    {!isActive && (
                      <button
                        onClick={() => {
                          onSelectProject(proj.id);
                          onClose();
                        }}
                        className={`px-2.5 py-1 text-xs border flex items-center space-x-1 transition-colors ${
                          isDark
                            ? 'border-white/10 hover:bg-white/10 text-white'
                            : 'border-black/10 hover:bg-black/5 text-stone-900'
                        }`}
                      >
                        <span>切换</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}

                    {projects.length > 1 && (
                      <button
                        onClick={() => {
                          if (window.confirm(`确定要删除项目「${proj.name}」吗？`)) {
                            onDeleteProject(proj.id);
                          }
                        }}
                        className="p-1.5 opacity-60 hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
