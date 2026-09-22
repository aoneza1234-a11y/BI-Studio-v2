import React, { useState, useRef, useEffect } from 'react';
import { WidgetConfig, AlignmentGuideline, DashboardTheme, FilterState } from '../types';
import { KpiWidget } from './charts/KpiWidget';
import { BarChartWidget } from './charts/BarChartWidget';
import { LineChartWidget } from './charts/LineChartWidget';
import { PieChartWidget } from './charts/PieChartWidget';
import { TableWidget } from './charts/TableWidget';
import { TextWidget } from './charts/TextWidget';
import { HorizontalBarWidget } from './charts/HorizontalBarWidget';
import { ComboChartWidget } from './charts/ComboChartWidget';
import { RadarChartWidget } from './charts/RadarChartWidget';
import { RadialGaugeWidget } from './charts/RadialGaugeWidget';
import { ScatterChartWidget } from './charts/ScatterChartWidget';
import {
  Settings,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  TrendingUp,
  PieChart as PieIcon,
  Table as TableIcon,
  Hash,
  GripVertical,
  Minus,
  Plus,
  FileText,
  Compass,
  Activity,
  CircleDot,
  Layers,
  BarChart3,
  Maximize2,
  Tag,
  Magnet,
  Filter,
  Sliders,
} from 'lucide-react';

interface WidgetCardProps {
  config: WidgetConfig;
  records: Record<string, any>[];
  headers: string[];
  index: number;
  totalWidgets: number;
  allWidgets?: WidgetConfig[];
  isPreviewMode?: boolean;
  isActive?: boolean;
  onSelect?: (id: string) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
  onReorder?: (sourceIndex: number, targetIndex: number) => void;
  onEdit: (config: WidgetConfig) => void;
  onDuplicate: (config: WidgetConfig) => void;
  onDelete: (id: string) => void;
  onChangeWidth: (id: string, width: WidgetConfig['width']) => void;
  onChangeColSpan?: (id: string, span: number) => void;
  onUpdateWidget?: (updated: WidgetConfig) => void;
  layoutMode?: 'grid' | 'freeform';
  onFreeDrag?: (id: string, posX: number, posY: number) => void;
  onFreeResize?: (id: string, posWidth: number, posHeight: number) => void;
  onBringToFront?: (id: string) => void;
  onGuideLinesChange?: (guidelines: AlignmentGuideline[] | null) => void;
  dashboardTheme?: DashboardTheme;
  primaryColor?: string;
  cardRadius?: string;
  cardShadow?: string;
  onCrossFilter?: (column?: string, value?: string) => void;
  activeFilters?: FilterState;
}

export const WidgetCard: React.FC<WidgetCardProps> = ({
  config,
  records,
  headers,
  index,
  totalWidgets,
  allWidgets = [],
  isPreviewMode = false,
  isActive = false,
  onSelect,
  onMove,
  onReorder,
  onEdit,
  onDuplicate,
  onDelete,
  onChangeWidth,
  onChangeColSpan,
  onUpdateWidget,
  layoutMode = 'grid',
  onFreeDrag,
  onFreeResize,
  onBringToFront,
  onGuideLinesChange,
  dashboardTheme = 'light',
  primaryColor,
  cardRadius = 'standard',
  cardShadow = 'soft',
  onCrossFilter,
  activeFilters,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Freeform dragging state
  const [isFreeDragging, setIsFreeDragging] = useState(false);
  const [freeDragPos, setFreeDragPos] = useState<{ x: number; y: number } | null>(null);
  const [isSnapped, setIsSnapped] = useState(false);
  const [showInlinePrefixSuffix, setShowInlinePrefixSuffix] = useState(false);

  // Drag-to-resize state
  const [isResizing, setIsResizing] = useState(false);
  const [resizePreview, setResizePreview] = useState<{
    colSpan: number;
    height: number;
    width?: number;
    posX?: number;
    posY?: number;
  } | null>(null);

  // Flexible 12-column span calculation
  const colSpan =
    resizePreview?.colSpan ??
    (config.colSpan || (config.width === 'full' ? 12 : config.width === 'half' ? 6 : 4));

  const colSpanClasses: Record<number, string> = {
    1: 'col-span-12 sm:col-span-6 lg:col-span-1',
    2: 'col-span-12 sm:col-span-6 lg:col-span-2',
    3: 'col-span-12 sm:col-span-6 lg:col-span-3',
    4: 'col-span-12 sm:col-span-6 lg:col-span-4',
    5: 'col-span-12 sm:col-span-6 lg:col-span-5',
    6: 'col-span-12 sm:col-span-12 lg:col-span-6',
    7: 'col-span-12 sm:col-span-12 lg:col-span-7',
    8: 'col-span-12 sm:col-span-12 lg:col-span-8',
    9: 'col-span-12 sm:col-span-12 lg:col-span-9',
    10: 'col-span-12 sm:col-span-12 lg:col-span-10',
    11: 'col-span-12 sm:col-span-12 lg:col-span-11',
    12: 'col-span-12',
  };

  const heightPreset = config.heightPreset || 'normal';
  const heightClasses: Record<string, string> = {
    compact: 'min-h-[160px]',
    normal: 'min-h-[240px]',
    tall: 'min-h-[360px]',
    'extra-tall': 'min-h-[480px]',
  };

  const typeIcons: Record<string, React.ReactNode> = {
    kpi: <Hash className="w-3.5 h-3.5 text-blue-500" />,
    bar: <BarChart2 className="w-3.5 h-3.5 text-emerald-500" />,
    horizontal_bar: <BarChart3 className="w-3.5 h-3.5 text-cyan-500" />,
    line: <TrendingUp className="w-3.5 h-3.5 text-teal-500" />,
    area: <Layers className="w-3.5 h-3.5 text-indigo-500" />,
    pie: <PieIcon className="w-3.5 h-3.5 text-violet-500" />,
    combo: <Activity className="w-3.5 h-3.5 text-amber-500" />,
    radar: <Compass className="w-3.5 h-3.5 text-purple-500" />,
    radial_bar: <CircleDot className="w-3.5 h-3.5 text-pink-500" />,
    scatter: <CircleDot className="w-3.5 h-3.5 text-sky-500" />,
    table: <TableIcon className="w-3.5 h-3.5 text-slate-500" />,
    text: <FileText className="w-3.5 h-3.5 text-amber-600" />,
  };

  // Drag-and-drop handling for card reordering
  const handleDragStart = (e: React.DragEvent) => {
    if (isResizing) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const sourceIndexStr = e.dataTransfer.getData('text/plain');
    if (sourceIndexStr !== '') {
      const sourceIndex = parseInt(sourceIndexStr, 10);
      if (!isNaN(sourceIndex) && sourceIndex !== index && onReorder) {
        onReorder(sourceIndex, index);
      }
    }
  };

  // Freeform dragging on header or handle with Smooth RAF and Smart Snapping (X & Y Comparison)
  const handleFreeDragStart = (e: React.MouseEvent) => {
    if (layoutMode !== 'freeform' || isPreviewMode || isResizing) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('select')) {
      return;
    }

    e.preventDefault();
    if (onBringToFront) onBringToFront(config.id);

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const initialPosX = config.posX ?? (index % 3) * 390;
    const initialPosY = config.posY ?? Math.floor(index / 3) * 370;
    const cardEl = cardRef.current;
    const parentEl = cardEl?.parentElement;

    // Strict Canvas Bounds: Never let widget escape outside the dedicated dashboard stage!
    const canvasBoundW = parentEl ? parentEl.clientWidth : 1800;
    const canvasBoundH = parentEl ? Math.max(parentEl.scrollHeight, 2200) : 2600;

    const myWidth = config.posWidth ?? cardEl?.offsetWidth ?? 380;
    const myHeight = config.posHeight ?? cardEl?.offsetHeight ?? 340;
    const otherWidgets = allWidgets.filter((w) => w.id !== config.id);
    const SNAP_THRESHOLD = 8; // gentle magnetic snap distance

    if (cardEl) {
      cardEl.style.willChange = 'left, top';
      cardEl.style.transition = 'none';
    }
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';

    setIsFreeDragging(true);

    let currentX = initialPosX;
    let currentY = initialPosY;
    let lastGuideKey = '';
    let rafId: number | null = null;

    const onMouseMove = (moveEvt: MouseEvent) => {
      const dx = moveEvt.clientX - startMouseX;
      const dy = moveEvt.clientY - startMouseY;

      // Base candidate position clamped inside canvas boundary
      let rawX = Math.max(0, Math.min(canvasBoundW - myWidth, initialPosX + dx));
      let rawY = Math.max(0, Math.min(canvasBoundH - myHeight, initialPosY + dy));
      let didSnap = false;
      const detectedGuides: AlignmentGuideline[] = [];

      // Smart X-axis Alignment (Left, Center, Right, Adjacent)
      for (const other of otherWidgets) {
        const ox = other.posX ?? 0;
        const ow = other.posWidth ?? 380;
        const oCenterX = ox + ow / 2;
        const myCenterX = rawX + myWidth / 2;

        // 1. Left edges aligned
        if (Math.abs(rawX - ox) <= SNAP_THRESHOLD) {
          rawX = ox;
          didSnap = true;
          detectedGuides.push({
            type: 'x',
            position: ox,
            label: `ตรงขอบซ้าย (${other.title})`,
          });
          break;
        }
        // 2. Vertical Centers aligned
        else if (Math.abs(myCenterX - oCenterX) <= SNAP_THRESHOLD) {
          rawX = oCenterX - myWidth / 2;
          didSnap = true;
          detectedGuides.push({
            type: 'x',
            position: oCenterX,
            label: `ตรงกึ่งกลางแนวตั้ง (${other.title})`,
          });
          break;
        }
        // 3. Right edges aligned
        else if (Math.abs(rawX + myWidth - (ox + ow)) <= SNAP_THRESHOLD) {
          rawX = ox + ow - myWidth;
          didSnap = true;
          detectedGuides.push({
            type: 'x',
            position: ox + ow,
            label: `ตรงขอบขวา (${other.title})`,
          });
          break;
        }
        // 4. Adjacent right (side by side)
        else if (Math.abs(rawX - (ox + ow)) <= SNAP_THRESHOLD) {
          rawX = ox + ow;
          didSnap = true;
          detectedGuides.push({
            type: 'x',
            position: ox + ow,
            label: `ชิดขอบขวา (${other.title})`,
          });
          break;
        }
        // 5. Adjacent left
        else if (Math.abs(rawX + myWidth - ox) <= SNAP_THRESHOLD) {
          rawX = ox - myWidth;
          didSnap = true;
          detectedGuides.push({
            type: 'x',
            position: ox,
            label: `ชิดขอบซ้าย (${other.title})`,
          });
          break;
        }
      }

      // Smart Y-axis Alignment (Top, Middle, Bottom, Adjacent Stacked)
      for (const other of otherWidgets) {
        const oy = other.posY ?? 0;
        const oh = other.posHeight ?? other.customHeight ?? 340;
        const oCenterY = oy + oh / 2;
        const myCenterY = rawY + myHeight / 2;

        // 1. Top edges aligned
        if (Math.abs(rawY - oy) <= SNAP_THRESHOLD) {
          rawY = oy;
          didSnap = true;
          detectedGuides.push({
            type: 'y',
            position: oy,
            label: `ตรงขอบบน (${other.title})`,
          });
          break;
        }
        // 2. Horizontal Centers aligned
        else if (Math.abs(myCenterY - oCenterY) <= SNAP_THRESHOLD) {
          rawY = oCenterY - myHeight / 2;
          didSnap = true;
          detectedGuides.push({
            type: 'y',
            position: oCenterY,
            label: `ตรงกึ่งกลางแนวนอน (${other.title})`,
          });
          break;
        }
        // 3. Bottom edges aligned
        else if (Math.abs(rawY + myHeight - (oy + oh)) <= SNAP_THRESHOLD) {
          rawY = oy + oh - myHeight;
          didSnap = true;
          detectedGuides.push({
            type: 'y',
            position: oy + oh,
            label: `ตรงขอบล่าง (${other.title})`,
          });
          break;
        }
        // 4. Stacked below
        else if (Math.abs(rawY - (oy + oh)) <= SNAP_THRESHOLD) {
          rawY = oy + oh;
          didSnap = true;
          detectedGuides.push({
            type: 'y',
            position: oy + oh,
            label: `ต่อใต้ (${other.title})`,
          });
          break;
        }
        // 5. Stacked above
        else if (Math.abs(rawY + myHeight - oy) <= SNAP_THRESHOLD) {
          rawY = oy - myHeight;
          didSnap = true;
          detectedGuides.push({
            type: 'y',
            position: oy - myHeight,
            label: `ต่อบน (${other.title})`,
          });
          break;
        }
      }

      currentX = Math.max(0, Math.min(canvasBoundW - myWidth, rawX));
      currentY = Math.max(0, Math.min(canvasBoundH - myHeight, rawY));

      // Check if guidelines changed to avoid re-rendering App component needlessly
      const currentGuideKey = detectedGuides.map((g) => `${g.type}-${Math.round(g.position)}`).join('|');
      if (currentGuideKey !== lastGuideKey) {
        lastGuideKey = currentGuideKey;
        if (onGuideLinesChange) {
          onGuideLinesChange(detectedGuides.length > 0 ? detectedGuides : null);
        }
      }

      // Butter-smooth hardware-accelerated direct DOM positioning in RAF
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setIsSnapped(didSnap);
        if (cardEl) {
          cardEl.style.left = `${currentX}px`;
          cardEl.style.top = `${currentY}px`;
        }
      });
    };

    const onMouseUp = () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      if (cardEl) {
        cardEl.style.willChange = 'auto';
        cardEl.style.transition = '';
      }

      setIsFreeDragging(false);
      setIsSnapped(false);
      setFreeDragPos(null);

      // Clear alignment guide lines
      if (onGuideLinesChange) {
        onGuideLinesChange(null);
      }

      if (onFreeDrag) {
        onFreeDrag(config.id, currentX, currentY);
      } else if (onUpdateWidget) {
        onUpdateWidget({ ...config, posX: currentX, posY: currentY });
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseup', onMouseUp);
  };

  // Change width span by -1 / +1 column
  const handleAdjustSpan = (delta: number) => {
    const newSpan = Math.min(12, Math.max(2, colSpan + delta));
    if (onChangeColSpan) {
      onChangeColSpan(config.id, newSpan);
    } else {
      const newWidth = newSpan >= 10 ? 'full' : newSpan >= 6 ? 'half' : 'third';
      onChangeWidth(config.id, newWidth);
    }
  };

  // Change width directly to preset
  const handleSetSpan = (span: number) => {
    if (onChangeColSpan) {
      onChangeColSpan(config.id, span);
    } else {
      const newWidth = span >= 10 ? 'full' : span >= 6 ? 'half' : 'third';
      onChangeWidth(config.id, newWidth);
    }
  };

  // Multi-directional Interactive Resizing (4 Corners + Edges)
  const handleResizeStart = (
    e: React.MouseEvent,
    direction: 'se' | 'sw' | 'ne' | 'nw' | 's' | 'e'
  ) => {
    e.stopPropagation();
    e.preventDefault();

    if (!cardRef.current) return;
    const cardEl = cardRef.current;

    // Handle Freeform Resizing (Pixel-based width & height + positioning for top/left corners)
    if (layoutMode === 'freeform') {
      const startX = e.clientX;
      const startY = e.clientY;
      const initialWidth = config.posWidth ?? cardEl.offsetWidth ?? 380;
      const initialHeight = config.posHeight ?? cardEl.offsetHeight ?? (config.customHeight || 340);
      const initialX = config.posX ?? (index % 3) * 390;
      const initialY = config.posY ?? Math.floor(index / 3) * 370;

      setIsResizing(true);
      setResizePreview({
        colSpan: 0,
        width: initialWidth,
        height: initialHeight,
        posX: initialX,
        posY: initialY,
      });

      let latestW = initialWidth;
      let latestH = initialHeight;
      let latestX = initialX;
      let latestY = initialY;

      const onMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;

        let newW = initialWidth;
        let newH = initialHeight;
        let newX = initialX;
        let newY = initialY;

        // Apply delta based on direction
        if (direction === 'se') {
          newW = initialWidth + deltaX;
          newH = initialHeight + deltaY;
        } else if (direction === 'sw') {
          newW = initialWidth - deltaX;
          newH = initialHeight + deltaY;
          newX = initialX + deltaX;
        } else if (direction === 'ne') {
          newW = initialWidth + deltaX;
          newH = initialHeight - deltaY;
          newY = initialY + deltaY;
        } else if (direction === 'nw') {
          newW = initialWidth - deltaX;
          newH = initialHeight - deltaY;
          newX = initialX + deltaX;
          newY = initialY + deltaY;
        } else if (direction === 's') {
          newH = initialHeight + deltaY;
        } else if (direction === 'e') {
          newW = initialWidth + deltaX;
        }

        // Snap to 10px grid during resize
        newW = Math.round(newW / 10) * 10;
        newH = Math.round(newH / 10) * 10;

        // Clamp dimensions
        latestW = Math.max(220, Math.min(1800, newW));
        latestH = Math.max(160, Math.min(1400, newH));
        latestX = Math.max(0, newX);
        latestY = Math.max(0, newY);

        setResizePreview({
          colSpan: 0,
          width: latestW,
          height: latestH,
          posX: latestX,
          posY: latestY,
        });
      };

      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        setIsResizing(false);
        setResizePreview(null);

        if (onFreeResize) {
          onFreeResize(config.id, latestW, latestH);
        }
        if (onFreeDrag && (latestX !== initialX || latestY !== initialY)) {
          onFreeDrag(config.id, latestX, latestY);
        }
        if (onUpdateWidget) {
          onUpdateWidget({
            ...config,
            posX: latestX,
            posY: latestY,
            posWidth: latestW,
            posHeight: latestH,
            customHeight: latestH,
          });
        }
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      return;
    }

    // Grid 12-Column Resizing
    const parentContainer = cardEl.parentElement;
    const parentWidth = parentContainer ? parentContainer.clientWidth : 1200;
    const colUnitWidth = parentWidth / 12;

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = cardEl.offsetWidth;
    const startHeight = cardEl.offsetHeight;
    const initialSpan = colSpan;

    setIsResizing(true);
    setResizePreview({ colSpan: initialSpan, height: startHeight });

    let latestSpan = initialSpan;
    let latestHeight = startHeight;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      // Calculate new span (min 2, max 12)
      const targetWidth = startWidth + deltaX;
      const calculatedSpan = Math.round(targetWidth / colUnitWidth);
      const clampedSpan = Math.max(2, Math.min(12, calculatedSpan));

      // Calculate new height (min 200, max 850)
      const clampedHeight = Math.max(200, Math.min(850, Math.round(startHeight + deltaY)));

      latestSpan = clampedSpan;
      latestHeight = clampedHeight;

      setResizePreview({ colSpan: clampedSpan, height: clampedHeight });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      setIsResizing(false);
      setResizePreview(null);

      // Commit changes
      if (onChangeColSpan && latestSpan !== initialSpan) {
        onChangeColSpan(config.id, latestSpan);
      }

      // If customHeight changed or onUpdateWidget available
      if (onUpdateWidget) {
        const heightCategory =
          latestHeight < 280
            ? 'compact'
            : latestHeight < 400
            ? 'normal'
            : latestHeight < 520
            ? 'tall'
            : 'extra-tall';

        onUpdateWidget({
          ...config,
          colSpan: latestSpan,
          width: latestSpan >= 10 ? 'full' : latestSpan >= 6 ? 'half' : 'third',
          customHeight: latestHeight,
          heightPreset: heightCategory,
        });
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Freeform vs Grid coordinate calculations
  const isFreeform = layoutMode === 'freeform';
  const effectivePosX = resizePreview?.posX ?? freeDragPos?.x ?? config.posX ?? (index % 3) * 390;
  const effectivePosY = resizePreview?.posY ?? freeDragPos?.y ?? config.posY ?? Math.floor(index / 3) * 370;
  const effectiveWidth = resizePreview?.width ?? config.posWidth ?? 380;
  const effectiveHeight =
    resizePreview?.height ??
    (isFreeform
      ? config.posHeight ?? config.customHeight ?? 340
      : config.customHeight
      ? config.customHeight
      : undefined);

  // Custom typography and card styles
  const customCardStyle: React.CSSProperties = {
    fontFamily: config.fontFamily || undefined,
    backgroundColor: config.backgroundColor || undefined,
    borderColor: config.borderColor || undefined,
    borderWidth: config.borderWidth !== undefined ? `${config.borderWidth}px` : undefined,
    height: effectiveHeight ? `${effectiveHeight}px` : undefined,
    ...(isFreeform
      ? {
          position: 'absolute',
          left: `${effectivePosX}px`,
          top: `${effectivePosY}px`,
          width: `${effectiveWidth}px`,
          zIndex: isFreeDragging ? 35 : isActive ? 20 : config.zIndex ?? 10,
          boxShadow: isFreeDragging
            ? '0 20px 30px -10px rgba(0,0,0,0.25)'
            : isActive
            ? '0 10px 25px -5px rgba(59, 130, 246, 0.25)'
            : undefined,
        }
      : {}),
  };

  const titleStyle: React.CSSProperties = {
    fontSize: config.titleFontSize ? `${config.titleFontSize}px` : undefined,
    color: config.textColor || undefined,
    fontWeight: config.isBold ? 700 : undefined,
    fontStyle: config.isItalic ? 'italic' : undefined,
    textDecoration: config.isUnderline ? 'underline' : undefined,
    textAlign: config.textAlign || 'left',
  };

  const cardThemeClass =
    dashboardTheme === 'dark'
      ? 'bg-slate-900 border-slate-800 text-slate-100'
      : dashboardTheme === 'midnight'
      ? 'bg-[#0f172a] border-blue-900/60 text-blue-50'
      : dashboardTheme === 'ocean'
      ? 'bg-[#0a192f] border-cyan-900/60 text-cyan-50'
      : dashboardTheme === 'forest' || dashboardTheme === 'emerald'
      ? 'bg-[#06241e] border-emerald-900/60 text-emerald-50'
      : dashboardTheme === 'violet'
      ? 'bg-[#1e1035] border-purple-900/60 text-purple-50'
      : dashboardTheme === 'sunset' || dashboardTheme === 'amber'
      ? 'bg-[#26180d] border-amber-900/60 text-amber-50'
      : 'bg-white border-slate-200/80 text-slate-800';

  const cardRadiusClass =
    cardRadius === 'rounded'
      ? 'rounded-3xl'
      : cardRadius === 'square'
      ? 'rounded-lg'
      : cardRadius === 'extra'
      ? 'rounded-[28px]'
      : 'rounded-2xl';

  const cardShadowClass =
    cardShadow === 'medium'
      ? 'shadow-md hover:shadow-lg'
      : cardShadow === 'floating'
      ? 'shadow-xl hover:shadow-2xl'
      : cardShadow === 'none'
      ? 'shadow-none'
      : 'shadow-xs hover:shadow-md';

  const headerThemeClass =
    dashboardTheme !== 'light'
      ? 'border-white/10 bg-white/5'
      : 'border-slate-100 bg-slate-50/70';

  return (
    <div
      ref={cardRef}
      id={`widget-${config.id}`}
      draggable={!isFreeform && !isPreviewMode && !isResizing}
      onDragStart={!isFreeform ? handleDragStart : undefined}
      onDragOver={!isFreeform ? handleDragOver : undefined}
      onDragLeave={!isFreeform ? handleDragLeave : undefined}
      onDrop={!isFreeform ? handleDrop : undefined}
      onClick={() => {
        if (onSelect) onSelect(config.id);
        if (isFreeform && onBringToFront) onBringToFront(config.id);
      }}
      style={customCardStyle}
      className={`${!isFreeform ? colSpanClasses[colSpan] || 'col-span-12' : ''} ${
        !config.customHeight && !resizePreview && !isFreeform ? heightClasses[heightPreset] : ''
      } ${cardRadiusClass} border ${
        isActive
          ? 'ring-2 ring-blue-500 border-blue-400 shadow-md'
          : cardThemeClass
      } ${
        isDragOver ? 'border-dashed border-blue-500 bg-blue-50/20 scale-[1.01]' : ''
      } ${
        isResizing ? 'select-none ring-2 ring-amber-500' : ''
      } ${
        isFreeDragging ? 'select-none ring-2 ring-blue-600 scale-[1.01] cursor-grabbing' : ''
      } ${
        !isPreviewMode ? `${cardShadowClass} group cursor-pointer` : cardShadow === 'none' ? 'shadow-none' : 'shadow-2xs'
      } ${isFreeDragging || isResizing ? 'transition-none' : 'transition-all duration-150'} flex flex-col justify-between overflow-hidden relative`}
    >
      {/* Live Resize Tooltip Badge */}
      {isResizing && resizePreview && (
        <div className="absolute inset-x-0 top-2 z-50 flex justify-center pointer-events-none">
          <div className="bg-slate-900/90 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg border border-amber-400/50 flex items-center gap-2 animate-pulse">
            <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {isFreeform
                ? `กว้าง ${resizePreview.width}px • สูง ${resizePreview.height}px (อิสระ)`
                : `กว้าง ${resizePreview.colSpan}/12 คอลัมน์ • สูง ${resizePreview.height}px`}
            </span>
          </div>
        </div>
      )}

      {/* Widget Header - Supports Freeform Drag */}
      <div
        onMouseDown={isFreeform ? handleFreeDragStart : undefined}
        className={`px-3.5 py-2.5 border-b ${headerThemeClass} flex items-center justify-between gap-2 backdrop-blur-xs ${
          isFreeform && !isPreviewMode ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {!isPreviewMode && (
            <span
              onMouseDown={isFreeform ? handleFreeDragStart : undefined}
              title={
                isFreeform
                  ? 'คลิกค้างแล้วลากเพื่อวางตำแหน่งใดก็ได้บนหน้าจอ (ทับซ้อนหรือชิดกันได้อิสระ)'
                  : 'กดค้างแล้วลากเพื่อสลับลำดับการ์ด (Drag to reorder)'
              }
              className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-700 transition-colors p-0.5"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </span>
          )}
          <span className="p-1 bg-white rounded-md border border-slate-200/70 shadow-2xs shrink-0">
            {typeIcons[config.type] || <BarChart2 className="w-3.5 h-3.5" />}
          </span>
          <div className="min-w-0 flex-1">
            <h3
              className="text-sm font-semibold text-slate-800 truncate"
              style={titleStyle}
              title={config.title}
            >
              {config.title}
            </h3>
            {config.showDescription && config.description && (
              <p className="text-[10px] text-slate-400 truncate">{config.description}</p>
            )}
          </div>
        </div>

        {/* Sleek Minimal Header Controls - Settings centralized in BI Panel & Toolbar */}
        {!isPreviewMode && (
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Multi-Condition Filter Indicator Badge */}
            {config.filterRules && config.filterRules.length > 0 && (
              <span
                className="px-2 py-0.5 text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-md font-bold flex items-center gap-1 shadow-2xs"
                title={`มี ${config.filterRules.length} เงื่อนไขตัวกรองเฉพาะกราฟนี้`}
              >
                <Filter className="w-2.5 h-2.5 text-indigo-600" />
                <span>{config.filterRules.length} เงื่อนไข</span>
              </span>
            )}

            {/* Custom Prefix/Suffix Badge */}
            {(config.prefix || config.suffix) && (
              <span
                className="px-1.5 py-0.5 text-[9px] bg-slate-100 text-slate-600 rounded font-mono font-semibold"
                title={`คำนำหน้า: "${config.prefix || ''}" | ต่อท้าย: "${config.suffix || ''}"`}
              >
                {config.prefix || ''}..{config.suffix || ''}
              </span>
            )}

            {/* Selection state or Click to inspect in BI */}
            {isActive ? (
              <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full shadow-2xs flex items-center gap-1 animate-fade-in">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span>เลือกใน BI</span>
              </span>
            ) : (
              <button
                type="button"
                title="คลิกเพื่อเลือกและปรับแต่งการตั้งค่าในเครื่องมือ BI"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelect) onSelect(config.id);
                  onEdit(config);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Duplicate button */}
            <button
              type="button"
              title="คัดลอกการ์ดนี้"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(config);
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            {/* Integrated Delete button inside the card frame */}
            <button
              type="button"
              title="ลบวิดเจ็ตการ์ดนี้"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(config.id);
              }}
              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Widget Content Body */}
      <div className="p-3.5 flex-1 flex flex-col justify-center overflow-hidden">
        {config.type === 'kpi' && <KpiWidget config={config} records={records} />}
        {(config.type === 'bar' || config.type === 'column' || config.type === 'waterfall') && (
          <BarChartWidget
            config={config}
            records={records}
            onCrossFilter={onCrossFilter}
            activeFilters={activeFilters}
          />
        )}
        {(config.type === 'horizontal_bar' || config.type === 'funnel' || config.type === 'progress') && (
          <HorizontalBarWidget
            config={config}
            records={records}
            onCrossFilter={onCrossFilter}
            activeFilters={activeFilters}
          />
        )}
        {(config.type === 'line' || config.type === 'area' || config.type === 'timeline') && (
          <LineChartWidget
            config={config}
            records={records}
            onCrossFilter={onCrossFilter}
            activeFilters={activeFilters}
          />
        )}
        {(config.type === 'pie' || config.type === 'donut') && (
          <PieChartWidget
            config={config}
            records={records}
            onCrossFilter={onCrossFilter}
            activeFilters={activeFilters}
          />
        )}
        {config.type === 'combo' && (
          <ComboChartWidget
            config={config}
            records={records}
            onCrossFilter={onCrossFilter}
            activeFilters={activeFilters}
          />
        )}
        {config.type === 'radar' && <RadarChartWidget config={config} records={records} />}
        {(config.type === 'radial_bar' || config.type === 'gauge') && (
          <RadialGaugeWidget config={config} records={records} />
        )}
        {config.type === 'scatter' && (
          <ScatterChartWidget config={config} records={records} />
        )}
        {(config.type === 'table' || config.type === 'pivot' || config.type === 'list' || config.type === 'calendar' || config.type === 'heatmap' || config.type === 'treemap') && (
          <TableWidget config={config} records={records} headers={headers} />
        )}
        {(config.type === 'text' || config.type === 'rich_text' || config.type === 'floating_text' || config.type === 'ai_summary') && (
          <TextWidget config={config} />
        )}
        {(config.type === 'map' || config.type === 'image' || config.type === 'iframe' || config.type === 'embed') && (
          <div className="flex flex-col items-center justify-center p-6 text-center h-full bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl mb-2">
              <Layers className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-slate-800">{config.title || 'วิชวลพิเศษ'}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              รองรับการแสดงผลเชิงลึก ({config.type}) ข้อมูล {records.length.toLocaleString('th-TH')} แถว
            </div>
          </div>
        )}
      </div>

      {/* Interactive Multi-directional Resize Handles (4 มุม และขอบ) */}
      {!isPreviewMode && (
        <>
          {/* Bottom-Right Corner (SE) */}
          <div
            title="ลากมุมล่างขวาเพื่อปรับขนาด (Drag bottom-right corner to resize)"
            onMouseDown={(e) => handleResizeStart(e, 'se')}
            className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-end justify-end p-1 z-30 opacity-40 hover:opacity-100 transition-opacity group-hover:opacity-80"
          >
            <div className="w-2.5 h-2.5 border-r-2 border-b-2 border-slate-400 hover:border-blue-600 rounded-br-xs" />
          </div>

          {/* Bottom-Left Corner (SW) */}
          <div
            title="ลากมุมล่างซ้ายเพื่อปรับขนาด"
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
            className="absolute bottom-0 left-0 w-5 h-5 cursor-sw-resize flex items-end justify-start p-1 z-30 opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-opacity"
          >
            <div className="w-2 h-2 border-l-2 border-b-2 border-slate-400 hover:border-blue-600 rounded-bl-xs" />
          </div>

          {/* Top-Right Corner (NE) - Freeform only */}
          {isFreeform && (
            <div
              title="ลากมุมบนขวาเพื่อปรับขนาด"
              onMouseDown={(e) => handleResizeStart(e, 'ne')}
              className="absolute top-0 right-0 w-5 h-5 cursor-ne-resize flex items-start justify-end p-1 z-30 opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-opacity"
            >
              <div className="w-2 h-2 border-r-2 border-t-2 border-slate-400 hover:border-blue-600 rounded-tr-xs" />
            </div>
          )}

          {/* Top-Left Corner (NW) - Freeform only */}
          {isFreeform && (
            <div
              title="ลากมุมบนซ้ายเพื่อปรับขนาด"
              onMouseDown={(e) => handleResizeStart(e, 'nw')}
              className="absolute top-0 left-0 w-5 h-5 cursor-nw-resize flex items-start justify-start p-1 z-30 opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-opacity"
            >
              <div className="w-2 h-2 border-l-2 border-t-2 border-slate-400 hover:border-blue-600 rounded-tl-xs" />
            </div>
          )}

          {/* Right Edge (E) */}
          <div
            title="ลากขอบขวาเพื่อปรับความกว้าง"
            onMouseDown={(e) => handleResizeStart(e, 'e')}
            className="absolute top-8 bottom-6 right-0 w-2 cursor-ew-resize z-20 hover:bg-blue-400/30 transition-colors"
          />

          {/* Bottom Edge (S) */}
          <div
            title="ลากขอบล่างเพื่อปรับความสูง"
            onMouseDown={(e) => handleResizeStart(e, 's')}
            className="absolute bottom-0 left-6 right-6 h-2 cursor-ns-resize z-20 hover:bg-blue-400/30 transition-colors"
          />
        </>
      )}
    </div>
  );
};
