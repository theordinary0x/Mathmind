import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AppTheme } from '../../types';
import { useAnimatedVisibility } from '../../hooks/useAnimatedVisibility';
import { loadAiSettings } from '../../services/ai/aiConfig';
import { recognizeHandwritingToLatex } from '../../services/ai/copilotService';
import { MarkdownMathRenderer } from '../MarkdownMathRenderer';
import {
  StylusPenVectorIcon,
  PalmRejectVectorIcon,
  SparkleAiVectorIcon,
} from '../icons/CustomIcons';
import {
  X,
  Undo2,
  Redo2,
  Trash2,
  Eraser,
  Highlighter,
  Grid,
  AlignJustify,
  Square,
  Send,
  Check,
  Loader2,
  Copy,
  PlusCircle,
} from 'lucide-react';

interface Point {
  x: number;
  y: number;
  pressure: number;
}

interface Stroke {
  tool: 'pen' | 'highlighter' | 'eraser';
  color: string;
  baseWidth: number;
  points: Point[];
}

interface HandwritingModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: AppTheme;
  /** 当从命题编辑框唤起时，支持将识别出的 LaTeX 直接插入原输入框光标处 */
  onInsertLatex?: ((latex: string) => void) | null;
  /** 将手写草图 PNG 直接作为附件发送给 Copilot */
  onSendToCopilot?: (file: File, promptText: string) => void;
  /** 以识别出的公式/文本直接打开新建命题弹窗 */
  onCreateNodeFromLatex?: (latex: string) => void;
}

const PEN_COLORS = [
  { id: 'ink', label: '墨黑/粉笔白', darkHex: '#F4F4F5', lightHex: '#1C1917' },
  { id: 'blue', label: '定理蓝', darkHex: '#60A5FA', lightHex: '#2563EB' },
  { id: 'red', label: '重点红', darkHex: '#F87171', lightHex: '#DC2626' },
  { id: 'emerald', label: '推导绿', darkHex: '#34D399', lightHex: '#059669' },
  { id: 'amber', label: '批注金', darkHex: '#FBBF24', lightHex: '#D97706' },
];

export const HandwritingModal: React.FC<HandwritingModalProps> = ({
  isOpen,
  onClose,
  theme,
  onInsertLatex,
  onSendToCopilot,
  onCreateNodeFromLatex,
}) => {
  const isDark = theme === 'dark';
  const { shouldRender, isVisible } = useAnimatedVisibility(isOpen, 240);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [colorId, setColorId] = useState<string>('ink');
  const [strokeSize, setStrokeSize] = useState<number>(2.8);
  const [paperBg, setPaperBg] = useState<'grid' | 'ruled' | 'blank'>('grid');
  const [stylusOnly, setStylusOnly] = useState<boolean>(false);

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const isDrawingRef = useRef<boolean>(false);

  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);
  const [recognizedLatex, setRecognizedLatex] = useState<string>('');
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const activeColorObj = PEN_COLORS.find(c => c.id === colorId) || PEN_COLORS[0];
  const activeHex = isDark ? activeColorObj.darkHex : activeColorObj.lightHex;

  // 绘制背景网格与所有笔画
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 1. 底色填充
    ctx.fillStyle = isDark ? '#121215' : '#FAF8F5';
    ctx.fillRect(0, 0, width, height);

    // 2. 纸张底纹
    if (paperBg === 'grid') {
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(28,25,23,0.06)';
      ctx.lineWidth = 1;
      const step = 28;
      ctx.beginPath();
      for (let x = step; x < width; x += step) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = step; y < height; y += step) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    } else if (paperBg === 'ruled') {
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(28,25,23,0.08)';
      ctx.lineWidth = 1;
      const step = 36;
      ctx.beginPath();
      for (let y = step; y < height; y += step) {
        ctx.moveTo(20, y);
        ctx.lineTo(width - 20, y);
      }
      ctx.stroke();
    }

    // 3. 渲染全部笔画
    const allStrokes = currentStrokeRef.current
      ? [...strokes, currentStrokeRef.current]
      : strokes;

    for (const s of allStrokes) {
      if (s.points.length === 0) continue;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (s.tool === 'eraser') {
        ctx.strokeStyle = isDark ? '#121215' : '#FAF8F5';
        ctx.lineWidth = s.baseWidth * 6;
        ctx.globalAlpha = 1;
      } else if (s.tool === 'highlighter') {
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.baseWidth * 4.5;
        ctx.globalAlpha = 0.28;
      } else {
        ctx.strokeStyle = s.color;
        ctx.globalAlpha = 1;
      }

      if (s.points.length === 1) {
        const p = s.points[0];
        const r = (s.baseWidth * (0.6 + p.pressure * 0.8)) / 2;
        ctx.fillStyle = s.tool === 'eraser' ? (isDark ? '#121215' : '#FAF8F5') : s.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 分段压感平滑贝塞尔曲线
        for (let i = 1; i < s.points.length; i++) {
          const prev = s.points[i - 1];
          const curr = s.points[i];
          const midX = (prev.x + curr.x) / 2;
          const midY = (prev.y + curr.y) / 2;

          if (s.tool === 'pen') {
            const pFactor = 0.55 + ((prev.pressure + curr.pressure) / 2) * 0.9;
            ctx.lineWidth = s.baseWidth * pFactor;
          }

          ctx.beginPath();
          if (i === 1) {
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(midX, midY);
          } else {
            const prevPrev = s.points[i - 2];
            const prevMidX = (prevPrev.x + prev.x) / 2;
            const prevMidY = (prevPrev.y + prev.y) / 2;
            ctx.moveTo(prevMidX, prevMidY);
            ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
          }
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    ctx.restore();
  }, [strokes, isDark, paperBg]);

  // 初始化与响应式尺寸同步
  useEffect(() => {
    if (!shouldRender) return;
    const updateSize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      redrawCanvas();
    };

    const timer = setTimeout(updateSize, 30);
    window.addEventListener('resize', updateSize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateSize);
    };
  }, [shouldRender, redrawCanvas]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // PointerEvents 压感采集
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // 防手掌误触：开启“仅触控笔”时忽略手指触摸
    if (stylusOnly && e.pointerType === 'touch') return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pressure = e.pointerType === 'pen' ? (e.pressure || 0.5) : 0.5;

    isDrawingRef.current = true;
    currentStrokeRef.current = {
      tool,
      color: activeHex,
      baseWidth: strokeSize,
      points: [{ x, y, pressure }],
    };
    redrawCanvas();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;
    if (stylusOnly && e.pointerType === 'touch') return;

    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pressure = e.pointerType === 'pen' ? (e.pressure || 0.5) : 0.5;

    currentStrokeRef.current.points.push({ x, y, pressure });
    redrawCanvas();
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;
    e.preventDefault();
    isDrawingRef.current = false;
    const finished = currentStrokeRef.current;
    currentStrokeRef.current = null;
    setStrokes(prev => [...prev, finished]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    setStrokes(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setRedoStack(r => [...r, last]);
      return prev.slice(0, -1);
    });
  };

  const handleRedo = () => {
    setRedoStack(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setStrokes(s => [...s, last]);
      return prev.slice(0, -1);
    });
  };

  const handleClear = () => {
    if (strokes.length === 0) return;
    setStrokes([]);
    setRedoStack([]);
    setRecognizedLatex('');
    setOcrError(null);
  };

  // 将当前画布导出为 Base64 PNG（不带不含反差的水印）
  const exportCanvasBase64 = (): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const dataUrl = canvas.toDataURL('image/png');
    return dataUrl.replace(/^data:image\/png;base64,/, '');
  };

  const handleRecognizeLatex = async () => {
    if (strokes.length === 0) {
      setOcrError('请先在画板上书写数学公式或推导步骤。');
      return;
    }
    const base64 = exportCanvasBase64();
    if (!base64) return;

    setIsRecognizing(true);
    setOcrError(null);
    try {
      const settings = loadAiSettings();
      const latex = await recognizeHandwritingToLatex(base64, settings);
      setRecognizedLatex(latex);
    } catch (err: any) {
      setOcrError(err?.message || 'AI 识别失败，请检查设置中的视觉模型或 API Key。');
    } finally {
      setIsRecognizing(false);
    }
  };

  const handleSendSketchToCopilot = () => {
    const canvas = canvasRef.current;
    if (!canvas || strokes.length === 0 || !onSendToCopilot) return;

    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], `handwriting_${Date.now()}.png`, { type: 'image/png' });
      onSendToCopilot(
        file,
        '请识别并分析我手写的数学公式与推导过程，检查逻辑严密性或将其构建为命题节点。'
      );
      onClose();
    }, 'image/png');
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 select-none modal-backdrop-glass mm-backdrop-transition ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div
        className={`border w-full max-w-4xl h-[88vh] flex flex-col overflow-hidden rounded-2xl modal-surface mm-modal-transition ${
          isDark ? 'border-white/10 text-[#EDECE8]' : 'border-black/10 text-[#2C2B29]'
        }`}
        style={{
          transform: isVisible ? 'translate3d(0, 0, 0) scale(1)' : 'translate3d(0, 14px, 0) scale(0.95)',
          opacity: isVisible ? 1 : 0,
        }}
      >
        {/* Header */}
        <div
          className={`px-4 py-3 border-b flex items-center justify-between shrink-0 gap-2 ${
            isDark ? 'bg-[#202024] border-[#2E2E33]' : 'bg-[#F2EFE9] border-[#D4CDC0]'
          }`}
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="p-1.5 rounded-xl bg-blue-600/15 text-blue-500 border border-blue-500/30">
              <StylusPenVectorIcon size={16} />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-serif font-bold flex items-center space-x-2">
                <span>压感手写演算与公式识别画板</span>
                <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500">
                  Stylus & LaTeX OCR
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* 防手掌误触开关 */}
            <button
              type="button"
              onClick={() => setStylusOnly(prev => !prev)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-xs border transition-all cursor-pointer ${
                stylusOnly
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 font-medium'
                  : isDark
                  ? 'bg-[#18181B] border-[#2E2E33] text-zinc-400 hover:text-zinc-200'
                  : 'bg-white border-[#D4CDC0] text-stone-600 hover:text-stone-900'
              }`}
              title="开启后仅响应压感触控笔（Apple Pencil / 电磁笔），忽略手掌与手指触摸"
            >
              <PalmRejectVectorIcon size={14} />
              <span className="hidden sm:inline">{stylusOnly ? '防误触: 仅触控笔' : '手写+触控'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="关闭画板 (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Drawing Toolbar */}
        <div
          className={`px-3 py-2 border-b flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0 ${
            isDark ? 'bg-[#18181B] border-[#2E2E33]' : 'bg-[#FAF8F5] border-[#D4CDC0]'
          }`}
        >
          {/* Left: Tools & Colors */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Pen / Highlighter / Eraser */}
            <div
              className={`flex items-center p-0.5 rounded-xl border ${
                isDark ? 'bg-[#121214] border-[#2E2E33]' : 'bg-white border-[#D4CDC0]'
              }`}
            >
              <button
                type="button"
                onClick={() => setTool('pen')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                  tool === 'pen'
                    ? 'bg-blue-600 text-white font-medium'
                    : 'opacity-70 hover:opacity-100'
                }`}
                title="压感钢笔"
              >
                <StylusPenVectorIcon size={13} />
                <span>钢笔</span>
              </button>
              <button
                type="button"
                onClick={() => setTool('highlighter')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                  tool === 'highlighter'
                    ? 'bg-amber-500 text-white font-medium'
                    : 'opacity-70 hover:opacity-100'
                }`}
                title="荧光马克笔"
              >
                <Highlighter className="w-3.5 h-3.5" />
                <span>荧光</span>
              </button>
              <button
                type="button"
                onClick={() => setTool('eraser')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                  tool === 'eraser'
                    ? 'bg-rose-600 text-white font-medium'
                    : 'opacity-70 hover:opacity-100'
                }`}
                title="橡皮擦"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>橡皮</span>
              </button>
            </div>

            {/* Color Swatches */}
            <div className="flex items-center space-x-1.5 px-1">
              {PEN_COLORS.map(c => {
                const hex = isDark ? c.darkHex : c.lightHex;
                const isSelected = colorId === c.id && tool !== 'eraser';
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setColorId(c.id);
                      if (tool === 'eraser') setTool('pen');
                    }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer badge-dot ${
                      isSelected ? 'scale-125 ring-2 ring-blue-500/50 border-blue-500' : 'border-black/20 dark:border-white/20 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: hex }}
                    title={c.label}
                  />
                );
              })}
            </div>

            {/* Stroke Width */}
            <div
              className={`flex items-center space-x-1 px-2 py-1 rounded-xl border ${
                isDark ? 'bg-[#121214] border-[#2E2E33]' : 'bg-white border-[#D4CDC0]'
              }`}
            >
              {[1.8, 2.8, 4.5].map((w, idx) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setStrokeSize(w)}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                    strokeSize === w
                      ? isDark
                        ? 'bg-white/15 text-white'
                        : 'bg-black/10 text-black'
                      : 'opacity-50 hover:opacity-100'
                  }`}
                  title={idx === 0 ? '细笔触' : idx === 1 ? '标准笔触' : '粗笔触'}
                >
                  <span
                    className="rounded-full bg-current badge-dot"
                    style={{ width: `${w * 2 + 2}px`, height: `${w * 2 + 2}px` }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Paper Background & Undo/Redo/Clear */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <div
              className={`flex items-center p-0.5 rounded-xl border ${
                isDark ? 'bg-[#121214] border-[#2E2E33]' : 'bg-white border-[#D4CDC0]'
              }`}
            >
              <button
                type="button"
                onClick={() => setPaperBg('grid')}
                className={`p-1.5 rounded-lg cursor-pointer ${
                  paperBg === 'grid' ? 'bg-blue-500/20 text-blue-500' : 'opacity-60 hover:opacity-100'
                }`}
                title="方格演算纸"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPaperBg('ruled')}
                className={`p-1.5 rounded-lg cursor-pointer ${
                  paperBg === 'ruled' ? 'bg-blue-500/20 text-blue-500' : 'opacity-60 hover:opacity-100'
                }`}
                title="横线笔记纸"
              >
                <AlignJustify className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPaperBg('blank')}
                className={`p-1.5 rounded-lg cursor-pointer ${
                  paperBg === 'blank' ? 'bg-blue-500/20 text-blue-500' : 'opacity-60 hover:opacity-100'
                }`}
                title="纯白/纯黑草稿纸"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleUndo}
              disabled={strokes.length === 0}
              className="p-1.5 rounded-xl border border-inherit opacity-70 hover:opacity-100 disabled:opacity-30 cursor-pointer"
              title="撤销上一笔"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-1.5 rounded-xl border border-inherit opacity-70 hover:opacity-100 disabled:opacity-30 cursor-pointer"
              title="重做"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={strokes.length === 0}
              className="p-1.5 rounded-xl border border-inherit text-rose-500 opacity-80 hover:opacity-100 disabled:opacity-30 cursor-pointer"
              title="清空画板"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Split Area: Canvas + Optional Recognized LaTeX Drawer */}
        <div className="flex-1 min-h-0 flex flex-col sm:flex-row overflow-hidden">
          {/* Interactive Stylus Canvas */}
          <div
            ref={containerRef}
            className="flex-1 relative min-h-[260px] overflow-hidden cursor-crosshair touch-none"
          >
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUpOrCancel}
              onPointerCancel={handlePointerUpOrCancel}
              className="block w-full h-full touch-none"
            />
            {strokes.length === 0 && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-35 text-xs font-serif px-4 text-center">
                <StylusPenVectorIcon size={28} className="mb-2 opacity-60" />
                <span>使用触控笔、手写板或鼠标在此处书写数学公式与推导草稿</span>
                <span className="text-[11px] font-mono mt-1">
                  支持 Apple Pencil / 数位板压感笔锋 · 可一键识别为 LaTeX 或发送至 Copilot
                </span>
              </div>
            )}
          </div>

          {/* Right/Bottom Recognized LaTeX Preview Panel */}
          {(recognizedLatex || ocrError || isRecognizing) && (
            <div
              className={`w-full sm:w-80 border-t sm:border-t-0 sm:border-l p-4 flex flex-col space-y-3 overflow-y-auto shrink-0 mm-view-fade ${
                isDark ? 'bg-[#18181B] border-[#2E2E33]' : 'bg-[#F5F2EB] border-[#D4CDC0]'
              }`}
            >
              <div className="text-xs font-serif font-bold flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <SparkleAiVectorIcon size={14} className="text-amber-400" />
                  <span>LaTeX 识别结果</span>
                </span>
                {recognizedLatex && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(recognizedLatex);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1800);
                    }}
                    className="flex items-center space-x-1 text-[11px] text-blue-500 hover:underline cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? '已复制' : '复制源码'}</span>
                  </button>
                )}
              </div>

              {isRecognizing && (
                <div className="py-8 flex flex-col items-center justify-center space-y-2 text-xs text-blue-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>正在识别手写公式与数学符号...</span>
                </div>
              )}

              {ocrError && (
                <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs">
                  {ocrError}
                </div>
              )}

              {recognizedLatex && !isRecognizing && (
                <>
                  <textarea
                    value={recognizedLatex}
                    onChange={e => setRecognizedLatex(e.target.value)}
                    rows={4}
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono focus:outline-none resize-none ${
                      isDark
                        ? 'bg-[#121214] border-[#2E2E33] text-white'
                        : 'bg-white border-[#D4CDC0] text-stone-900'
                    }`}
                  />

                  <div
                    className={`p-3 rounded-xl border text-xs font-serif ${
                      isDark ? 'bg-[#121214] border-[#2E2E33]' : 'bg-white border-[#D4CDC0]'
                    }`}
                  >
                    <div className="text-[10px] font-mono opacity-50 mb-1">KaTeX 实时渲染预览:</div>
                    <MarkdownMathRenderer content={recognizedLatex} isDark={isDark} />
                  </div>

                  <div className="flex flex-col space-y-2 pt-1">
                    {onInsertLatex && (
                      <button
                        type="button"
                        onClick={() => {
                          onInsertLatex(recognizedLatex);
                          onClose();
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>插入到当前编辑输入框</span>
                      </button>
                    )}

                    {onCreateNodeFromLatex && (
                      <button
                        type="button"
                        onClick={() => {
                          onCreateNodeFromLatex(recognizedLatex);
                          onClose();
                        }}
                        className={`w-full py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-1.5 cursor-pointer transition-colors ${
                          isDark
                            ? 'border-blue-500/40 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                            : 'border-blue-600/40 bg-blue-50 text-blue-700 hover:bg-blue-100'
                        }`}
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>以此公式创建新命题</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className={`px-4 py-3 border-t flex flex-wrap items-center justify-between gap-2 shrink-0 ${
            isDark ? 'bg-[#202024] border-[#2E2E33]' : 'bg-[#F2EFE9] border-[#D4CDC0]'
          }`}
        >
          <span className="text-[11px] opacity-55 font-mono hidden sm:inline">
            支持数位板/触控笔压感输入 · 可直接转译 LaTeX 或发送手写原稿
          </span>

          <div className="flex items-center space-x-2 ml-auto">
            {onSendToCopilot && (
              <button
                type="button"
                onClick={handleSendSketchToCopilot}
                disabled={strokes.length === 0}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer disabled:opacity-40 ${
                  isDark
                    ? 'bg-[#18181B] border-[#3F3F46] hover:border-blue-500 text-zinc-200'
                    : 'bg-white border-[#D4CDC0] hover:border-blue-600 text-stone-800'
                }`}
              >
                <Send className="w-3.5 h-3.5 text-blue-500" />
                <span>发送手写稿至 Copilot</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleRecognizeLatex}
              disabled={strokes.length === 0 || isRecognizing}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs"
            >
              {isRecognizing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <SparkleAiVectorIcon size={14} />
              )}
              <span>AI 识别为 LaTeX</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HandwritingModal;
