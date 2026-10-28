import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  RotateCcw, 
  Trash2, 
  Check, 
  Circle, 
  MoveRight, 
  Edit3, 
  Type, 
  Camera, 
  Upload,
  Sparkles
} from 'lucide-react';
import { sound } from '../utils/audio';

interface CanvasMarkupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialImageUrl: string;
  equipmentCode: string;
  equipmentName: string;
  onSavePhoto: (dataUrl: string, caption: string) => void;
}

type DrawTool = 'freehand' | 'circle' | 'arrow' | 'text';

interface HistoryStep {
  imageData: ImageData;
}

export const CanvasMarkupModal: React.FC<CanvasMarkupModalProps> = ({
  isOpen,
  onClose,
  initialImageUrl,
  equipmentCode,
  equipmentName,
  onSavePhoto,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [currentTool, setCurrentTool] = useState<DrawTool>('circle');
  const [activeColor, setActiveColor] = useState<string>('#ef4444'); // Industrial red
  const [lineWidth, setLineWidth] = useState<number>(4);
  const [caption, setCaption] = useState<string>('現場發現設備局部瑕疵標記');
  const [activeImageUrl, setActiveImageUrl] = useState<string>(initialImageUrl);
  const [textTagInput, setTextTagInput] = useState<string>('異常滲漏');

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [history, setHistory] = useState<HistoryStep[]>([]);
  const [snapshotBeforeShape, setSnapshotBeforeShape] = useState<ImageData | null>(null);

  // Load and draw image onto canvas
  useEffect(() => {
    if (!isOpen) return;
    setActiveImageUrl(initialImageUrl);
  }, [isOpen, initialImageUrl]);

  useEffect(() => {
    if (!isOpen || !activeImageUrl) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = activeImageUrl;
    img.onload = () => {
      // Set canvas dimensions to match image aspect ratio while fitting container
      const containerWidth = containerRef.current?.clientWidth || 700;
      const targetWidth = Math.min(800, containerWidth - 32);
      const aspect = img.height / img.width;
      const targetHeight = Math.round(targetWidth * aspect);

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      ctx.clearRect(0, 0, targetWidth, targetHeight);
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Save initial state to history
      const initialSnapshot = ctx.getImageData(0, 0, targetWidth, targetHeight);
      setHistory([{ imageData: initialSnapshot }]);
    };
  }, [isOpen, activeImageUrl]);

  if (!isOpen) return null;

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    sound.tap();
    const pos = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPos(pos);

    // Save snapshot before live shape dragging
    const currentSnap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setSnapshotBeforeShape(currentSnap);

    if (currentTool === 'freehand') {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    } else if (currentTool === 'text') {
      // Draw text directly at tap location
      drawTextTag(ctx, pos.x, pos.y, textTagInput);
      saveStepToHistory();
      setIsDrawing(false);
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !startPos) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentPos = getCanvasCoords(e);

    if (currentTool === 'freehand') {
      ctx.lineTo(currentPos.x, currentPos.y);
      ctx.stroke();
    } else if (currentTool === 'circle' && snapshotBeforeShape) {
      // Restore previous frame then draw preview circle
      ctx.putImageData(snapshotBeforeShape, 0, 0);
      drawCircle(ctx, startPos.x, startPos.y, currentPos.x, currentPos.y);
    } else if (currentTool === 'arrow' && snapshotBeforeShape) {
      // Restore previous frame then draw preview arrow
      ctx.putImageData(snapshotBeforeShape, 0, 0);
      drawArrow(ctx, startPos.x, startPos.y, currentPos.x, currentPos.y);
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setStartPos(null);
    setSnapshotBeforeShape(null);
    saveStepToHistory();
  };

  const drawCircle = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) => {
    const rx = Math.abs(x2 - x1) / 2;
    const ry = Math.abs(y2 - y1) / 2;
    const cx = Math.min(x1, x2) + rx;
    const cy = Math.min(y1, y2) + ry;

    ctx.save();
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = lineWidth + 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.max(rx, 8), Math.max(ry, 8), 0, 0, 2 * Math.PI);
    ctx.stroke();

    // Subtle dashed outer ring for industrial markup aesthetic
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.restore();
  };

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ) => {
    const headLength = 16;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.strokeStyle = activeColor;
    ctx.fillStyle = activeColor;
    ctx.lineWidth = lineWidth + 1;
    ctx.lineCap = 'round';

    // Shaft
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const drawTextTag = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    text: string
  ) => {
    if (!text.trim()) return;
    ctx.save();
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const paddingX = 10;
    const paddingY = 6;
    const textMetrics = ctx.measureText(text);
    const boxWidth = textMetrics.width + paddingX * 2;
    const boxHeight = 28;

    // Draw dark rounded badge
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 2;

    ctx.beginPath();
    const radius = 6;
    ctx.roundRect(x, y - boxHeight / 2, boxWidth, boxHeight, radius);
    ctx.fill();
    ctx.stroke();

    // Pin dot
    ctx.fillStyle = activeColor;
    ctx.beginPath();
    ctx.arc(x - 4, y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw text
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + paddingX, y);
    ctx.restore();
  };

  const saveStepToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev, { imageData: currentData }]);
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    sound.tap();
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    const lastStep = newHistory[newHistory.length - 1];

    const canvas = canvasRef.current;
    if (!canvas || !lastStep) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.putImageData(lastStep.imageData, 0, 0);
  };

  const handleClear = () => {
    if (history.length <= 1) return;
    sound.tap();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const firstStep = history[0];
    if (firstStep) {
      ctx.putImageData(firstStep.imageData, 0, 0);
      setHistory([firstStep]);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        sound.scanBeep();
        setActiveImageUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAndConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    sound.success();
    const finalDataUrl = canvas.toDataURL('image/jpeg', 0.88);
    onSavePhoto(finalDataUrl, caption);
    onClose();
  };

  const colors = [
    { label: '警報紅', value: '#ef4444' },
    { label: '警戒黃', value: '#eab308' },
    { label: '指示藍', value: '#3b82f6' },
    { label: '正常綠', value: '#10b981' },
    { label: '白色', value: '#ffffff' },
  ];

  const quickTags = ['滲漏處', '磨損異音', '螺栓位移', '接頭高溫', '儀表指針偏差'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        ref={containerRef}
        className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden text-slate-100"
      >
        {/* Tablet Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">{equipmentCode}</span>
                <span className="text-slate-400 text-xs font-normal">·</span>
                <span className="text-slate-300 text-sm font-medium">{equipmentName}</span>
              </div>
              <p className="text-xs text-slate-400">現場照片手繪瑕疵標註 (支援平板觸控圈選 / 箭頭 / 標籤)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
              title="更換照片或使用相機拍照"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>拍照/更換圖片</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoUpload}
            />

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tablet Interactive Drawing Toolbar */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Tool Modes */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => { setCurrentTool('circle'); sound.tap(); }}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                currentTool === 'circle' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Circle className="w-4 h-4" />
              <span>瑕疵紅圈</span>
            </button>
            <button
              onClick={() => { setCurrentTool('arrow'); sound.tap(); }}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                currentTool === 'arrow' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <MoveRight className="w-4 h-4" />
              <span>箭頭指示</span>
            </button>
            <button
              onClick={() => { setCurrentTool('freehand'); sound.tap(); }}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                currentTool === 'freehand' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>自由塗鴉</span>
            </button>
            <button
              onClick={() => { setCurrentTool('text'); sound.tap(); }}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                currentTool === 'text' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Type className="w-4 h-4" />
              <span>瑕疵標籤</span>
            </button>
          </div>

          {/* Color & Stroke */}
          <div className="flex items-center gap-3">
            {/* Color Swatches */}
            <div className="flex items-center gap-1.5">
              {colors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => { setActiveColor(c.value); sound.tap(); }}
                  style={{ backgroundColor: c.value }}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    activeColor === c.value ? 'scale-115 border-white shadow-md' : 'border-slate-700 opacity-80'
                  }`}
                  title={c.label}
                />
              ))}
            </div>

            {/* Stroke Width */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[11px] mr-1">粗細:</span>
              {[3, 5, 8].map((w) => (
                <button
                  key={w}
                  onClick={() => { setLineWidth(w); sound.tap(); }}
                  className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
                    lineWidth === w ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {w}px
                </button>
              ))}
            </div>

            {/* Undo / Clear */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleUndo}
                disabled={history.length <= 1}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1 transition-colors"
                title="復原上一步"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>復原</span>
              </button>
              <button
                onClick={handleClear}
                disabled={history.length <= 1}
                className="px-2 py-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950/40 disabled:opacity-40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/50 transition-colors"
                title="清空所有標註"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Text Tag Quick Select when Text Tool is active */}
        {currentTool === 'text' && (
          <div className="px-5 py-2 bg-amber-500/10 border-b border-amber-500/20 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-amber-400 font-medium">標籤文字 (點擊下方或自訂後點擊圖片貼上):</span>
            {quickTags.map((tag) => (
              <button
                key={tag}
                onClick={() => { setTextTagInput(tag); sound.tap(); }}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  textTagInput === tag 
                    ? 'bg-amber-400 text-slate-950 font-bold' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {tag}
              </button>
            ))}
            <input
              type="text"
              value={textTagInput}
              onChange={(e) => setTextTagInput(e.target.value)}
              placeholder="自訂標籤..."
              className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-md text-xs text-white max-w-[140px] focus:outline-none focus:border-amber-400"
            />
          </div>
        )}

        {/* Drawing Viewport / Canvas Container */}
        <div className="relative flex-1 bg-slate-950 flex items-center justify-center p-3 overflow-auto min-h-[360px] max-h-[55vh]">
          <canvas
            ref={canvasRef}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            className="rounded-lg shadow-xl border border-slate-800 cursor-crosshair touch-none max-w-full"
            style={{ touchAction: 'none' }}
          />

          <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-[11px] text-slate-300 pointer-events-none">
            {currentTool === 'circle' && '請在圖片上按住並拖曳畫出紅圈'}
            {currentTool === 'arrow' && '請在圖片上拖曳拉出指示箭頭'}
            {currentTool === 'freehand' && '觸控或滑鼠可直接塗鴉標註'}
            {currentTool === 'text' && '點擊照片任意位置貼上瑕疵標籤'}
          </div>
        </div>

        {/* Footer with Caption & Confirmation */}
        <div className="px-5 py-3.5 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-auto flex-1 flex items-center gap-2">
            <span className="text-xs text-slate-400 whitespace-nowrap">照片說明:</span>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="輸入瑕疵說明 (例如：右側軸承箱疑似有輕微漏油跡象)..."
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSaveAndConfirm}
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>保存並附入巡檢單</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
