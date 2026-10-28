import React, { useRef, useState, useEffect } from 'react';
import { X, Check, RotateCcw, PenTool, ShieldCheck, UserCheck } from 'lucide-react';
import { sound } from '../utils/audio';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspectorName: string;
  inspectorBadge: string;
  shift: string;
  totalEquipments: number;
  completedCount: number;
  abnormalCount: number;
  onSignComplete: (signatureDataUrl: string) => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  inspectorName,
  inspectorBadge,
  shift,
  totalEquipments,
  completedCount,
  abnormalCount,
  onSignComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setHasDrawn(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Guide watermark baseline
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(30, canvas.height - 45);
    ctx.lineTo(canvas.width - 30, canvas.height - 45);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [isOpen]);

  if (!isOpen) return null;

  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
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

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    sound.tap();
    setIsDrawing(true);
    setHasDrawn(true);
    const pos = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = '#0f172a'; // Deep slate ink
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getCoords(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDraw = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    sound.tap();
    setHasDrawn(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Guide watermark baseline
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(30, canvas.height - 45);
    ctx.lineTo(canvas.width - 30, canvas.height - 45);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const handleConfirm = () => {
    if (!hasDrawn) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    sound.success();
    const dataUrl = canvas.toDataURL('image/png');
    onSignComplete(dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">巡檢員現場電子簽章</h3>
              <p className="text-xs text-slate-400">確認巡檢項目無誤並完成電子留存</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patrol Session Summary Stats */}
        <div className="px-5 py-3.5 bg-slate-950/50 border-b border-slate-800 grid grid-cols-3 gap-3 text-center">
          <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block">巡檢班別</span>
            <span className="text-xs font-semibold text-slate-200 truncate">{shift.split(' ')[0]}</span>
          </div>
          <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block">完成點位</span>
            <span className="text-xs font-bold text-emerald-400">{completedCount} / {totalEquipments}</span>
          </div>
          <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block">異常回報</span>
            <span className={`text-xs font-bold ${abnormalCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
              {abnormalCount} 處
            </span>
          </div>
        </div>

        {/* Inspector Info Badge */}
        <div className="px-5 py-2.5 bg-slate-900 flex items-center justify-between text-xs text-slate-300 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span>簽署人：<strong className="text-white">{inspectorName}</strong></span>
          </div>
          <div className="font-mono text-slate-400">工號：{inspectorBadge}</div>
        </div>

        {/* Signature Pad Area */}
        <div className="p-5 flex flex-col items-center bg-slate-950">
          <div className="relative w-full border-2 border-dashed border-slate-700 rounded-xl overflow-hidden bg-white shadow-inner">
            <canvas
              ref={canvasRef}
              width={460}
              height={180}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
              className="w-full h-[180px] touch-none cursor-crosshair"
              style={{ touchAction: 'none' }}
            />
            {!hasDrawn && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-sm font-medium">
                請在此空白處使用手指或觸控筆正楷簽署
              </div>
            )}
          </div>

          <div className="w-full flex items-center justify-between mt-3 text-xs">
            <span className="text-slate-500">本簽名將受時間戳記驗證並固化於稽核紀錄</span>
            <button
              onClick={clearCanvas}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重新簽名</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-5 py-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            返回修改
          </button>
          <button
            onClick={handleConfirm}
            disabled={!hasDrawn}
            className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
          >
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            <span>確認簽署並歸檔</span>
          </button>
        </div>
      </div>
    </div>
  );
};
