import React, { useState } from 'react';
import { Equipment, Zone, ZoneId } from '../types/inspection';
import { 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ChevronRight, 
  Sliders, 
  Camera, 
  FileText,
  Filter
} from 'lucide-react';
import { sound } from '../utils/audio';

interface EquipmentListProps {
  equipments: Equipment[];
  zones: Zone[];
  selectedZone: ZoneId | 'all';
  onSelectZone: (zoneId: ZoneId | 'all') => void;
  onOpenInspection: (equipment: Equipment) => void;
}

export const EquipmentList: React.FC<EquipmentListProps> = ({
  equipments,
  zones,
  selectedZone,
  onSelectZone,
  onOpenInspection,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'normal' | 'abnormal'>('all');

  const filteredEquipments = equipments.filter((eq) => {
    // Zone filter
    if (selectedZone !== 'all' && eq.zoneId !== selectedZone) return false;
    // Status filter
    if (statusFilter !== 'all' && eq.status !== statusFilter) return false;
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = eq.code.toLowerCase().includes(q);
      const matchName = eq.name.toLowerCase().includes(q);
      const matchLoc = eq.location.toLowerCase().includes(q);
      const matchModel = eq.model.toLowerCase().includes(q);
      return matchCode || matchName || matchLoc || matchModel;
    }
    return true;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* Top Filter & Search Bar */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋設備編號 / 名稱 / 位置..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => { setStatusFilter('all'); sound.tap(); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'all'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              全部 ({equipments.length})
            </button>
            <button
              onClick={() => { setStatusFilter('pending'); sound.tap(); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              待巡 ({equipments.filter((e) => e.status === 'pending').length})
            </button>
            <button
              onClick={() => { setStatusFilter('normal'); sound.tap(); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'normal'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              正常 ({equipments.filter((e) => e.status === 'normal').length})
            </button>
            <button
              onClick={() => { setStatusFilter('abnormal'); sound.tap(); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'abnormal'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              異常 ({equipments.filter((e) => e.status === 'abnormal').length})
            </button>
          </div>
        </div>
      </div>

      {/* Equipment Card Grid */}
      <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[640px] overflow-y-auto">
        {filteredEquipments.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 text-sm">
            查無符合篩選條件的巡檢設備
          </div>
        ) : (
          filteredEquipments.map((eq) => {
            const completedItemsCount = eq.items.filter((i) => i.status !== 'pending').length;
            const progressPct = Math.round((completedItemsCount / eq.items.length) * 100);

            return (
              <div
                key={eq.id}
                onClick={() => {
                  sound.tap();
                  onOpenInspection(eq);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer group active:scale-[0.99] ${
                  eq.status === 'abnormal'
                    ? 'bg-rose-950/15 border-rose-800/80 hover:border-rose-600'
                    : eq.status === 'normal'
                    ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-900/60 border-slate-800/70 hover:border-amber-500/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 font-mono font-bold text-xs flex items-center justify-center text-slate-300">
                      {eq.orderIndex}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-amber-400">{eq.code}</span>
                        <span className="text-slate-600 text-xs">·</span>
                        <span className="font-semibold text-sm text-white">{eq.name}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{eq.location}</div>
                    </div>
                  </div>

                  {/* Status Tag */}
                  <div>
                    {eq.status === 'normal' ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>正常完成</span>
                      </span>
                    ) : eq.status === 'abnormal' ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        <span>回報異常</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>待巡檢</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar and metadata */}
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">
                      檢測項：<strong className="text-white">{completedItemsCount}/{eq.items.length}</strong>
                    </span>
                    <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          eq.status === 'abnormal' ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {eq.defectReport && eq.defectReport.photos.length > 0 && (
                      <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                        <Camera className="w-3 h-3" />
                        <span>{eq.defectReport.photos.length} 照片</span>
                      </span>
                    )}

                    <div className="text-amber-400 text-xs font-semibold flex items-center group-hover:translate-x-0.5 transition-transform">
                      <span>巡檢輸入</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
