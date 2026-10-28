import React from 'react';
import { ShieldCheck, QrCode, PenTool, FileText } from 'lucide-react';
import { sound } from '../utils/audio';

interface HeaderProps {
  currentTab: 'map' | 'list';
  onSelectTab: (tab: 'map' | 'list') => void;
  onOpenScanner: () => void;
  onOpenReport: () => void;
  onOpenSignature: () => void;
  completedCount: number;
  totalCount: number;
  isSigned: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenScanner,
  onOpenReport,
  onOpenSignature,
  completedCount,
  totalCount,
  isSigned,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40 select-none">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); onSelectTab('map'); sound.tap(); }}
          className="text-lg font-bold tracking-tight text-white hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
        >
          FactoryPatrol
        </a>
        <span className="hidden sm:inline-block font-mono text-xs text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
          現場平板巡檢
        </span>
      </div>

      {/* Zone 2: 4 clean single-line text navigation links */}
      <nav className="flex items-center gap-6 text-xs sm:text-sm font-medium text-slate-300">
        <button
          onClick={() => { onSelectTab('map'); sound.tap(); }}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            currentTab === 'map' ? 'border-amber-400 text-white font-bold' : 'border-transparent text-slate-400'
          }`}
        >
          廠區平面圖
        </button>

        <button
          onClick={() => { onSelectTab('list'); sound.tap(); }}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            currentTab === 'list' ? 'border-amber-400 text-white font-bold' : 'border-transparent text-slate-400'
          }`}
        >
          設備卡片清冊
        </button>

        <button
          onClick={() => { onOpenScanner(); sound.tap(); }}
          className="hover:text-white text-slate-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <QrCode className="w-3.5 h-3.5 text-amber-400" />
          <span>標籤掃描</span>
        </button>

        <button
          onClick={() => { onOpenReport(); sound.tap(); }}
          className="hover:text-white text-slate-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          <span>巡檢總報表</span>
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => { onOpenSignature(); sound.tap(); }}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 active:scale-95 whitespace-nowrap shrink-0 ${
            isSigned
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
          }`}
        >
          <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
          <span>{isSigned ? '已完成電子核簽' : `簽章結案 (${completedCount}/${totalCount})`}</span>
        </button>
      </div>
    </header>
  );
};
