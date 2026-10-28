import React, { useState } from 'react';
import { Tablet, Smartphone, Maximize2, Minimize2, RotateCw, Wifi, WifiOff, BatteryCharging } from 'lucide-react';
import { sound } from '../utils/audio';

interface TabletFrameWrapperProps {
  children: React.ReactNode;
  isOffline: boolean;
  onToggleOffline: () => void;
}

export const TabletFrameWrapper: React.FC<TabletFrameWrapperProps> = ({
  children,
  isOffline,
  onToggleOffline,
}) => {
  const [isSimulatedFrame, setIsSimulatedFrame] = useState(false);
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');

  const toggleFrame = () => {
    sound.tap();
    setIsSimulatedFrame(!isSimulatedFrame);
  };

  const toggleOrientation = () => {
    sound.tap();
    setOrientation(orientation === 'landscape' ? 'portrait' : 'landscape');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Tablet Environment Simulator Bar (Subtle top utility bar for testing) */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs z-30 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Tablet className="w-4 h-4" />
            <span>平板巡檢工作台</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-slate-400 text-[11px]">
            <span>·</span>
            <span>支援 iPad / 三星 / 工業三防強固型平板</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Offline simulator toggle */}
          <button
            onClick={() => {
              onToggleOffline();
              sound.tap();
            }}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition-colors ${
              isOffline
                ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
            }`}
            title="點擊模擬工廠地下室或無訊號區離線儲存"
          >
            {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            <span>{isOffline ? '離線模式 (本機快取)' : '在線連線 (已同步)'}</span>
          </button>

          {/* Tablet Frame toggle */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={toggleFrame}
              className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                isSimulatedFrame ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
              <span>{isSimulatedFrame ? '平板外框開' : '平板外框'}</span>
            </button>

            {isSimulatedFrame && (
              <button
                onClick={toggleOrientation}
                className="px-2 py-1 rounded text-[11px] text-slate-300 hover:text-white flex items-center gap-1 bg-slate-800 transition-colors"
                title="切換橫向/直向"
              >
                <RotateCw className="w-3 h-3" />
                <span>{orientation === 'landscape' ? '橫向' : '直向'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isSimulatedFrame ? (
        <div className="flex-1 bg-slate-950 flex items-center justify-center p-4 sm:p-8 overflow-auto">
          {/* Simulated Rugged Industrial Tablet Bezel */}
          <div
            className={`relative rounded-[36px] p-4 sm:p-6 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border-4 border-slate-700 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] transition-all duration-300 ${
              orientation === 'landscape'
                ? 'w-full max-w-[1140px] aspect-[16/10] min-h-[680px]'
                : 'w-full max-w-[760px] aspect-[10/16] min-h-[880px]'
            } flex flex-col`}
          >
            {/* Tablet Camera Eye & Sensor */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-700 shadow-inner" />
            </div>

            {/* Tablet Inner Screen Glass */}
            <div className="relative flex-1 bg-slate-950 rounded-[24px] overflow-hidden border border-slate-800 flex flex-col shadow-inner">
              {children}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      )}
    </div>
  );
};
