import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { AppTheme } from '../../types';
import { useAnimatedVisibility } from '../../hooks/useAnimatedVisibility';
import { loadAiSettings } from '../../services/ai/aiConfig';
import { recognizeHandwritingToLatex } from '../../services/ai/copilotService';
import {
  PdfNoteVectorIcon,
  StylusPenVectorIcon,
  PalmRejectVectorIcon,
  SparkleAiVectorIcon,
} from '../icons/CustomIcons';
import {
  X,
  Upload,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Highlighter,
  Eraser,
  Crop,
  Hand,
  Undo2,
  Trash2,
  Download,
  Send,
  PlusCircle,
  Loader2,
} from 'lucide-react';

// 配置本地离线打包的 PDF.js Worker（兼容 Web、Electron .exe 与 Android .apk）
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface InkPoint {
  x: number; // 归一化坐标 [0, 1]
  y: number;
  pressure: number;
}

interface InkStroke {
  tool: 'pen' | 'highlighter' | 'eraser';
  color: string;
  width: number;
  points: InkPoint[];
}

interface CropBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface PdfNoteWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
  theme: AppTheme;
  onSendCropToCopilot?: (file: File, promptText: string) => void;
  onCreateNodeFromLatex?: (latex: string) => void;
}

export const PdfNoteWorkspace: React.FC<PdfNoteWorkspaceProps> = ({
  isOpen,
  onClose,
  theme,
  onSendCropToCopilot,
  onCreateNodeFromLatex,
}) => {
  const isDark = theme === 'dark';
  const { shouldRender, isVisible } = useAnimatedVisibility(isOpen, 260);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const inkCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>('');
  const [pageNum, setPageNum] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.25);
  const [isRenderingPage, setIsRenderingPage] = useState<boolean>(false);

  const [mode, setMode] = useState<'pan' | 'pen' | 'highlighter' | 'eraser' | 'crop'>('pen');
  const [inkColor, setInkColor] = useState<string>('#2563EB');
  const [stylusOnly, setStylusOnly] = useState<boolean>(false);

  // 按页存储手写批注笔画
  const [pageStrokes, setPageStrokes] = useState<Record<number, InkStroke[]>>({});
  const activeStrokeRef = useRef<InkStroke | null>(null);
  const isDrawingRef = useRef<boolean>(false);

  // 框选提取区域
  const [cropBox, setCropBox] = useState<CropBox | null>(null);
  const isCroppingRef = useRef<boolean>(false);
  const [isExtractingLatex, setIsExtractingLatex] = useState<boolean>(false);

  // 加载本地 PDF 文件
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    await loadPdfFile(file);
  };

  const loadPdfFile = async (file: File) => {
    try {
      setIsRenderingPage(true);
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const doc = await loadingTask.promise;
      setPdfDoc(doc);
      setPdfFileName(file.name);
      setNumPages(doc.numPages);
      setPageNum(1);
      setPageStrokes({});
      setCropBox(null);
    } catch (err) {
      console.error('Failed to load PDF:', err);
      alert('无法解析该 PDF 文件，请确认文件未损坏或加密。');
    } finally {
      setIsRenderingPage(false);
    }
  };

  // 渲染当前页的手写批注层与框选层
  const redrawInkLayer = useCallback(() => {
    const inkCanvas = inkCanvasRef.current;
    if (!inkCanvas) return;
    const ctx = inkCanvas.getContext('2d');
    if (!ctx) return;

    const w = inkCanvas.width;
    const h = inkCanvas.height;
    ctx.clearRect(0, 0, w, h);

    const strokes = pageStrokes[pageNum] || [];
    const allStrokes = activeStrokeRef.current ? [...strokes, activeStrokeRef.current] : strokes;

    for (const s of allStrokes) {
      if (s.points.length === 0) continue;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (s.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = s.width * 7;
      } else if (s.tool === 'highlighter') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = s.color;
        ctx.globalAlpha = 0.32;
        ctx.lineWidth = s.width * 5;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = s.color;
        ctx.globalAlpha = 1;
        ctx.lineWidth = s.width;
      }

      ctx.beginPath();
      const first = s.points[0];
      ctx.moveTo(first.x * w, first.y * h);
      for (let i = 1; i < s.points.length; i++) {
        const pt = s.points[i];
        ctx.lineTo(pt.x * w, pt.y * h);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 绘制框选矩形
    if (cropBox) {
      const rx = Math.min(cropBox.startX, cropBox.endX) * w;
      const ry = Math.min(cropBox.startY, cropBox.endY) * h;
      const rw = Math.abs(cropBox.endX - cropBox.startX) * w;
      const rh = Math.abs(cropBox.endY - cropBox.startY) * h;

      ctx.save();
      ctx.strokeStyle = '#2563EB';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(rx, ry, rw, rh);
      ctx.fillStyle = 'rgba(37, 99, 235, 0.12)';
      ctx.fillRect(rx, ry, rw, rh);
      ctx.restore();
    }
  }, [pageStrokes, pageNum, cropBox]);

  // 渲染 PDF 页面到底层 Canvas
  useEffect(() => {
    if (!pdfDoc || !shouldRender) return;
    let cancelled = false;

    const renderPage = async () => {
      setIsRenderingPage(true);
      try {
        const page = await pdfDoc.getPage(pageNum);
        if (cancelled) return;

        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: scale * dpr });
        const cssViewport = page.getViewport({ scale });

        const pdfCanvas = pdfCanvasRef.current;
        const inkCanvas = inkCanvasRef.current;
        if (!pdfCanvas || !inkCanvas) return;

        pdfCanvas.width = Math.floor(viewport.width);
        pdfCanvas.height = Math.floor(viewport.height);
        pdfCanvas.style.width = `${Math.floor(cssViewport.width)}px`;
        pdfCanvas.style.height = `${Math.floor(cssViewport.height)}px`;

        inkCanvas.width = Math.floor(viewport.width);
        inkCanvas.height = Math.floor(viewport.height);
        inkCanvas.style.width = `${Math.floor(cssViewport.width)}px`;
        inkCanvas.style.height = `${Math.floor(cssViewport.height)}px`;

        const ctx = pdfCanvas.getContext('2d');
        if (!ctx) return;

        await page.render({
          canvasContext: ctx,
          canvas: pdfCanvas,
          viewport,
        }).promise;

        if (!cancelled) {
          redrawInkLayer();
        }
      } catch (err) {
        console.error('Error rendering PDF page:', err);
      } finally {
        if (!cancelled) setIsRenderingPage(false);
      }
    };

    renderPage();
    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageNum, scale, shouldRender, redrawInkLayer]);

  useEffect(() => {
    redrawInkLayer();
  }, [redrawInkLayer]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode === 'pan') return;
    if (stylusOnly && e.pointerType === 'touch') return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    const rect = e.currentTarget.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const pressure = e.pointerType === 'pen' ? (e.pressure || 0.5) : 0.5;

    if (mode === 'crop') {
      isCroppingRef.current = true;
      setCropBox({ startX: nx, startY: ny, endX: nx, endY: ny });
      return;
    }

    isDrawingRef.current = true;
    const dpr = window.devicePixelRatio || 1;
    activeStrokeRef.current = {
      tool: mode,
      color: inkColor,
      width: 2.6 * dpr * (0.6 + pressure * 0.8),
      points: [{ x: nx, y: ny, pressure }],
    };
    redrawInkLayer();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (stylusOnly && e.pointerType === 'touch') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    if (mode === 'crop' && isCroppingRef.current) {
      e.preventDefault();
      setCropBox(prev => (prev ? { ...prev, endX: nx, endY: ny } : null));
      return;
    }

    if (!isDrawingRef.current || !activeStrokeRef.current) return;
    e.preventDefault();
    const pressure = e.pointerType === 'pen' ? (e.pressure || 0.5) : 0.5;
    activeStrokeRef.current.points.push({ x: nx, y: ny, pressure });
    redrawInkLayer();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode === 'crop' && isCroppingRef.current) {
      e.preventDefault();
      isCroppingRef.current = false;
      return;
    }

    if (!isDrawingRef.current || !activeStrokeRef.current) return;
    e.preventDefault();
    isDrawingRef.current = false;
    const finished = activeStrokeRef.current;
    activeStrokeRef.current = null;
    setPageStrokes(prev => ({
      ...prev,
      [pageNum]: [...(prev[pageNum] || []), finished],
    }));
  };

  const handleUndoPageStroke = () => {
    setPageStrokes(prev => {
      const list = prev[pageNum] || [];
      if (list.length === 0) return prev;
      return { ...prev, [pageNum]: list.slice(0, -1) };
    });
  };

  const handleClearPageStrokes = () => {
    setPageStrokes(prev => ({ ...prev, [pageNum]: [] }));
    setCropBox(null);
  };

  // 将裁剪框（或整页）合成为带手写批注的 Canvas DataURL / Blob
  const captureRegionCanvas = (box?: CropBox | null): HTMLCanvasElement | null => {
    const pdfCanvas = pdfCanvasRef.current;
    const inkCanvas = inkCanvasRef.current;
    if (!pdfCanvas || !inkCanvas) return null;

    const w = pdfCanvas.width;
    const h = pdfCanvas.height;

    let sx = 0;
    let sy = 0;
    let sw = w;
    let sh = h;

    if (box) {
      sx = Math.floor(Math.min(box.startX, box.endX) * w);
      sy = Math.floor(Math.min(box.startY, box.endY) * h);
      sw = Math.max(20, Math.floor(Math.abs(box.endX - box.startX) * w));
      sh = Math.max(20, Math.floor(Math.abs(box.endY - box.startY) * h));
    }

    const out = document.createElement('canvas');
    out.width = sw;
    out.height = sh;
    const ctx = out.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(pdfCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
    // 临时去掉虚线框后再叠加墨迹
    const savedBox = cropBox;
    if (savedBox) {
      // 只绘制批注笔画，不把蓝色虚线框画进截图
      ctx.drawImage(inkCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
    } else {
      ctx.drawImage(inkCanvas, 0, 0);
    }
    return out;
  };

  const handleSendCropToAi = () => {
    if (!onSendCropToCopilot) return;
    const out = captureRegionCanvas(cropBox);
    if (!out) return;

    out.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], `pdf_note_p${pageNum}.png`, { type: 'image/png' });
      onSendCropToCopilot(
        file,
        `请提取并解析这份 PDF 讲义（第 ${pageNum} 页）选区中的数学定理、定义或推导过程，将其构建为规范的命题节点。`
      );
      setCropBox(null);
    }, 'image/png');
  };

  const handleExtractCropToNewNode = async () => {
    if (!onCreateNodeFromLatex) return;
    const out = captureRegionCanvas(cropBox);
    if (!out) return;

    const base64 = out.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
    setIsExtractingLatex(true);
    try {
      const settings = loadAiSettings();
      const latex = await recognizeHandwritingToLatex(base64, settings);
      setCropBox(null);
      onCreateNodeFromLatex(latex);
    } catch (err: any) {
      alert(err?.message || 'AI 识别讲义区域失败，请检查模型配置。');
    } finally {
      setIsExtractingLatex(false);
    }
  };

  const handleExportAnnotatedPage = () => {
    const out = captureRegionCanvas(null);
    if (!out) return;
    const link = document.createElement('a');
    link.download = `${pdfFileName.replace(/\.pdf$/i, '') || 'math_note'}_page_${pageNum}.png`;
    link.href = out.toDataURL('image/png');
    link.click();
  };

  if (!shouldRender) return null;

  const hasValidCrop =
    cropBox &&
    Math.abs(cropBox.endX - cropBox.startX) > 0.03 &&
    Math.abs(cropBox.endY - cropBox.startY) > 0.03;

  return (
    <aside
      style={{
        transform: isVisible ? 'translate3d(0, 0, 0)' : 'translate3d(-104%, 0, 0)',
        opacity: isVisible ? 1 : 0,
      }}
      className={`fixed left-0 top-0 sm:top-14 bottom-0 sm:bottom-6 z-40 w-full sm:w-[540px] md:w-[640px] max-w-full border-r sm:rounded-r-2xl shadow-2xl flex flex-col overflow-hidden select-none mm-drawer-transition modal-surface ${
        isDark ? 'border-[#2E2E33] text-[#EDECE8]' : 'border-[#D4CDC0] text-[#2C2B29]'
      }`}
    >
      {/* Top Header */}
      <div
        className={`h-12 px-3.5 border-b flex items-center justify-between shrink-0 gap-2 ${
          isDark ? 'bg-[#202024] border-[#2E2E33]' : 'bg-[#F2EFE9] border-[#D4CDC0]'
        }`}
      >
        <div className="flex items-center space-x-2 min-w-0">
          <div className="p-1.5 rounded-xl bg-blue-600/15 text-blue-500 border border-blue-500/30 shrink-0">
            <PdfNoteVectorIcon size={15} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-serif font-bold truncate">
              {pdfFileName || 'PDF 教材讲义分屏手写批注台'}
            </div>
            <div className="text-[10px] opacity-55 font-mono truncate">
              边读讲义 · 触控笔原位演算 · 框选定理入图
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium cursor-pointer transition-colors shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>打开 PDF</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => setStylusOnly(prev => !prev)}
            className={`p-1.5 rounded-xl border text-xs transition-colors cursor-pointer ${
              stylusOnly
                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400'
                : isDark
                ? 'bg-[#18181B] border-[#2E2E33] text-zinc-400'
                : 'bg-white border-[#D4CDC0] text-stone-600'
            }`}
            title={stylusOnly ? '防手掌误触已开启（仅响应触控笔）' : '点击开启仅触控笔防误触'}
          >
            <PalmRejectVectorIcon size={14} />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title="关闭 PDF 笔记工作台"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Annotation & Navigation Toolbar */}
      {pdfDoc && (
        <div
          className={`px-3 py-2 border-b flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0 ${
            isDark ? 'bg-[#18181B] border-[#2E2E33]' : 'bg-[#FAF8F5] border-[#D4CDC0]'
          }`}
        >
          {/* Mode Switcher */}
          <div
            className={`flex items-center p-0.5 rounded-xl border shrink-0 ${
              isDark ? 'bg-[#121214] border-[#2E2E33]' : 'bg-white border-[#D4CDC0]'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setMode('pan');
                setCropBox(null);
              }}
              className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs cursor-pointer ${
                mode === 'pan' ? 'bg-blue-600 text-white font-medium' : 'opacity-70 hover:opacity-100'
              }`}
              title="阅读滚动模式"
            >
              <Hand className="w-3.5 h-3.5" />
              <span>浏览</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('pen');
                setCropBox(null);
              }}
              className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs cursor-pointer ${
                mode === 'pen' ? 'bg-blue-600 text-white font-medium' : 'opacity-70 hover:opacity-100'
              }`}
              title="压感钢笔批注"
            >
              <StylusPenVectorIcon size={13} />
              <span>批注</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('highlighter');
                setCropBox(null);
              }}
              className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs cursor-pointer ${
                mode === 'highlighter' ? 'bg-amber-500 text-white font-medium' : 'opacity-70 hover:opacity-100'
              }`}
              title="荧光笔高亮"
            >
              <Highlighter className="w-3.5 h-3.5" />
              <span>高亮</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('eraser');
                setCropBox(null);
              }}
              className={`p-1 rounded-lg text-xs cursor-pointer ${
                mode === 'eraser' ? 'bg-rose-600 text-white' : 'opacity-70 hover:opacity-100'
              }`}
              title="橡皮擦"
            >
              <Eraser className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setMode('crop')}
              className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs cursor-pointer ${
                mode === 'crop' ? 'bg-emerald-600 text-white font-medium' : 'opacity-70 hover:opacity-100'
              }`}
              title="框选讲义定理或推导段落提取为图谱命题"
            >
              <Crop className="w-3.5 h-3.5" />
              <span>框选提取</span>
            </button>
          </div>

          {/* Colors & Undo */}
          <div className="flex items-center space-x-1.5 shrink-0">
            {['#2563EB', '#DC2626', '#059669', '#D97706'].map(hex => (
              <button
                key={hex}
                type="button"
                onClick={() => setInkColor(hex)}
                className={`w-5 h-5 rounded-full border transition-transform cursor-pointer badge-dot ${
                  inkColor === hex ? 'scale-125 ring-2 ring-blue-500/40 border-white' : 'opacity-75'
                }`}
                style={{ backgroundColor: hex }}
              />
            ))}

            <button
              type="button"
              onClick={handleUndoPageStroke}
              className="p-1.5 rounded-lg border border-inherit opacity-70 hover:opacity-100 cursor-pointer"
              title="撤销本页上一笔"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleClearPageStrokes}
              className="p-1.5 rounded-lg border border-inherit text-rose-500 opacity-75 hover:opacity-100 cursor-pointer"
              title="清空本页批注"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleExportAnnotatedPage}
              className="p-1.5 rounded-lg border border-inherit opacity-75 hover:opacity-100 cursor-pointer"
              title="导出当前带批注的讲义页图片"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Crop Action Bar */}
      {hasValidCrop && (
        <div
          className={`px-4 py-2 border-b flex items-center justify-between gap-2 shrink-0 mm-view-fade ${
            isDark ? 'bg-blue-950/40 border-blue-500/30' : 'bg-blue-50 border-blue-200'
          }`}
        >
          <span className="text-xs font-serif text-blue-500 font-medium">
            已框选讲义区域：
          </span>
          <div className="flex items-center space-x-2">
            {onCreateNodeFromLatex && (
              <button
                type="button"
                onClick={handleExtractCropToNewNode}
                disabled={isExtractingLatex}
                className="flex items-center space-x-1 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium cursor-pointer shadow-xs"
              >
                {isExtractingLatex ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <PlusCircle className="w-3.5 h-3.5" />
                )}
                <span>OCR 识别新建命题</span>
              </button>
            )}
            {onSendCropToCopilot && (
              <button
                type="button"
                onClick={handleSendCropToAi}
                className="flex items-center space-x-1 px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium cursor-pointer shadow-xs"
              >
                <SparkleAiVectorIcon size={13} />
                <Send className="w-3 h-3" />
                <span>交由 Copilot 解析入图</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* PDF Viewport Area */}
      <div
        className={`flex-1 overflow-auto p-3 sm:p-4 flex items-start justify-center ${
          isDark ? 'bg-[#121215]' : 'bg-[#EAE6DF]'
        }`}
      >
        {!pdfDoc ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`my-auto w-full max-w-md p-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
              isDark
                ? 'border-white/15 hover:border-blue-500/60 bg-white/[0.02]'
                : 'border-black/15 hover:border-blue-600/60 bg-white/60'
            }`}
          >
            <PdfNoteVectorIcon size={36} className="text-blue-500 mb-3 opacity-80" />
            <div className="text-sm font-serif font-bold mb-1">
              点击导入本地 PDF 数学教材、文献或课程讲义
            </div>
            <div className="text-xs opacity-60 leading-relaxed">
              支持平板触控笔原位手写演算批注，或直接框选定理段落一键提取为图谱命题节点
            </div>
          </div>
        ) : (
          <div className="relative shadow-2xl rounded-lg overflow-hidden bg-white">
            <canvas ref={pdfCanvasRef} className="block" />
            <canvas
              ref={inkCanvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={`absolute inset-0 ${
                mode === 'pan' ? 'pointer-events-none' : 'cursor-crosshair touch-none'
              }`}
            />
            {isRenderingPage && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Pagination & Zoom Footer */}
      {pdfDoc && (
        <div
          className={`h-11 px-4 border-t flex items-center justify-between text-xs shrink-0 ${
            isDark ? 'bg-[#202024] border-[#2E2E33]' : 'bg-[#F2EFE9] border-[#D4CDC0]'
          }`}
        >
          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={pageNum <= 1}
              onClick={() => setPageNum(p => Math.max(1, p - 1))}
              className="p-1 rounded-lg border border-inherit disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono">
              第 <strong>{pageNum}</strong> / {numPages} 页
            </span>
            <button
              type="button"
              disabled={pageNum >= numPages}
              onClick={() => setPageNum(p => Math.min(numPages, p + 1))}
              className="p-1 rounded-lg border border-inherit disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setScale(s => Math.max(0.75, +(s - 0.2).toFixed(2)))}
              className="p-1 rounded-lg border border-inherit cursor-pointer"
              title="缩小"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono w-12 text-center">{Math.round(scale * 100)}%</span>
            <button
              type="button"
              onClick={() => setScale(s => Math.min(2.25, +(s + 0.2).toFixed(2)))}
              className="p-1 rounded-lg border border-inherit cursor-pointer"
              title="放大"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

export default PdfNoteWorkspace;
