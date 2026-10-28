import React, { useState } from 'react';
import { Equipment, Zone, ZoneId } from '../types/inspection';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Navigation, 
  Layers, 
  Eye, 
  Maximize2 
} from 'lucide-react';
import { sound } from '../utils/audio';

interface FactoryMapProps {
  equipments: Equipment[];
  zones: Zone[];
  selectedZone: ZoneId | 'all';
  onSelectZone: (zoneId: ZoneId | 'all') => void;
  onOpenInspection: (equipment: Equipment) => void;
  activeEquipmentId?: string;
}

export const FactoryMap: React.FC<FactoryMapProps> = ({
  equipments,
  zones,
  selectedZone,
  onSelectZone,
  onOpenInspection,
  activeEquipmentId,
}) => {
  const [hoveredEquipment, setHoveredEquipment] = useState<Equipment | null>(null);
  const [showRouteLine, setShowRouteLine] = useState(true);

  // Filtered equipment nodes
  const visibleEquipments = selectedZone === 'all' 
    ? equipments 
    : equipments.filter((eq) => eq.zoneId === selectedZone);

  // Sorted by patrol sequence for route line
  const routePoints = [...equipments].sort((a, b) => a.orderIndex - b.orderIndex);

  // SVG route path string
  const routePathD = routePoints.reduce((acc, eq, idx) => {
    const x = eq.mapCoords.x * 8; // scaled to 800 width
    const y = eq.mapCoords.y * 5; // scaled to 500 height
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* Map Control Bar */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-white tracking-wide">廠區互動巡檢點位平面圖</span>
          <span className="text-xs text-slate-500 font-normal">·</span>
          <span className="text-xs text-slate-400">點擊點位直接調出巡檢表單</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Route toggle */}
          <button
            onClick={() => {
              setShowRouteLine(!showRouteLine);
              sound.tap();
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              showRouteLine
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>巡檢路徑引導</span>
          </button>

          {/* Zone filter buttons */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => { onSelectZone('all'); sound.tap(); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedZone === 'all'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              全廠
            </button>
            {zones.map((z) => (
              <button
                key={z.id}
                onClick={() => { onSelectZone(z.id); sound.tap(); }}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedZone === z.id
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {z.code}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive SVG Canvas */}
      <div className="relative w-full aspect-[16/10] bg-[#0b1329] overflow-hidden select-none">
        <svg
          viewBox="0 0 800 500"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Blueprint Grid Lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
            </pattern>
            <pattern id="majorGrid" width="160" height="160" patternUnits="userSpaceOnUse">
              <path d="M 160 0 L 0 0 0 160" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1.5" />
            </pattern>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <rect width="800" height="500" fill="#090f1d" />
          <rect width="800" height="500" fill="url(#grid)" />
          <rect width="800" height="500" fill="url(#majorGrid)" />

          {/* Plant Floor Layout Zones (Architectural Blocks) */}
          {/* Zone A: Water Pump Room (Top Left) */}
          <g opacity={selectedZone === 'all' || selectedZone === 'zone-a' ? 1 : 0.25} className="transition-opacity duration-300">
            <rect x="50" y="40" width="220" height="200" rx="12" fill="#0284c7" fillOpacity="0.08" stroke="#0284c7" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="4 2" />
            <text x="65" y="65" fill="#38bdf8" fontSize="13" fontWeight="bold">A棟 · 動力循環水泵房</text>
            <text x="65" y="82" fill="#64748b" fontSize="10">Chill Water & Cooling Tower Area</text>
          </g>

          {/* Zone B: Air Compressor & Gas (Top Center) */}
          <g opacity={selectedZone === 'all' || selectedZone === 'zone-b' ? 1 : 0.25} className="transition-opacity duration-300">
            <rect x="310" y="40" width="240" height="230" rx="12" fill="#d97706" fillOpacity="0.08" stroke="#d97706" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="4 2" />
            <text x="325" y="65" fill="#fbbf24" fontSize="13" fontWeight="bold">B棟 · 空壓動力與氣體站</text>
            <text x="325" y="82" fill="#64748b" fontSize="10">Screw Compressors & Dryers</text>
          </g>

          {/* Zone C: Substation & High Voltage (Top Right) */}
          <g opacity={selectedZone === 'all' || selectedZone === 'zone-c' ? 1 : 0.25} className="transition-opacity duration-300">
            <rect x="580" y="40" width="180" height="230" rx="12" fill="#dc2626" fillOpacity="0.08" stroke="#dc2626" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="4 2" />
            <text x="595" y="65" fill="#f87171" fontSize="13" fontWeight="bold">C棟 · 特高壓變電所</text>
            <text x="595" y="82" fill="#64748b" fontSize="10">22.8kV Substation & Switchgears</text>
          </g>

          {/* Zone D: Steam Boiler Plant (Bottom Left) */}
          <g opacity={selectedZone === 'all' || selectedZone === 'zone-d' ? 1 : 0.25} className="transition-opacity duration-300">
            <rect x="180" y="290" width="280" height="175" rx="12" fill="#9333ea" fillOpacity="0.08" stroke="#9333ea" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="4 2" />
            <text x="195" y="315" fill="#c084fc" fontSize="13" fontWeight="bold">D棟 · 蒸汽熱工與純水機房</text>
            <text x="195" y="332" fill="#64748b" fontSize="10">Steam Boilers & Water Softener</text>
          </g>

          {/* Zone E: Automated Assembly Line (Bottom Right) */}
          <g opacity={selectedZone === 'all' || selectedZone === 'zone-e' ? 1 : 0.25} className="transition-opacity duration-300">
            <rect x="500" y="290" width="260" height="175" rx="12" fill="#059669" fillOpacity="0.08" stroke="#059669" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="4 2" />
            <text x="515" y="315" fill="#34d399" fontSize="13" fontWeight="bold">E棟 · SMT產線與潔淨空調</text>
            <text x="515" y="332" fill="#64748b" fontSize="10">Precision Assembly & Cleanroom AHU</text>
          </g>

          {/* Main Corridor Safety Walkways (Yellow Striping) */}
          <path
            d="M 50 260 L 760 260 M 290 40 L 290 465 M 565 40 L 565 465"
            stroke="rgba(245, 158, 11, 0.2)"
            strokeWidth="10"
            strokeDasharray="14 10"
            fill="none"
          />

          {/* Patrol Route Guidance Path */}
          {showRouteLine && (
            <g>
              <path
                d={routePathD}
                fill="none"
                stroke="url(#routeGradient)"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                opacity="0.85"
              />
            </g>
          )}

          {/* Equipment Markers */}
          {visibleEquipments.map((eq) => {
            const cx = eq.mapCoords.x * 8;
            const cy = eq.mapCoords.y * 5;
            const isHovered = hoveredEquipment?.id === eq.id;
            const isActive = activeEquipmentId === eq.id;

            let badgeColor = '#f59e0b'; // Amber pending
            let glowColor = 'rgba(245, 158, 11, 0.4)';
            if (eq.status === 'normal') {
              badgeColor = '#10b981'; // Emerald
              glowColor = 'rgba(16, 185, 129, 0.4)';
            } else if (eq.status === 'abnormal') {
              badgeColor = '#ef4444'; // Red
              glowColor = 'rgba(239, 68, 68, 0.6)';
            }

            return (
              <g
                key={eq.id}
                transform={`translate(${cx}, ${cy})`}
                className="cursor-pointer transition-transform hover:scale-110 active:scale-95"
                onClick={() => {
                  sound.tap();
                  onOpenInspection(eq);
                }}
                onMouseEnter={() => setHoveredEquipment(eq)}
                onMouseLeave={() => setHoveredEquipment(null)}
              >
                {/* Active ripple ring */}
                {(isActive || eq.status === 'abnormal') && (
                  <circle
                    r="24"
                    fill="none"
                    stroke={badgeColor}
                    strokeWidth="2"
                    opacity="0.6"
                    className="animate-ping"
                  />
                )}

                {/* Outer shadow ring */}
                <circle
                  r={isActive ? 18 : 15}
                  fill="#0f172a"
                  stroke={badgeColor}
                  strokeWidth={isActive ? 3 : 2}
                  filter="url(#glow)"
                />

                {/* Inner status dot */}
                <circle
                  r={isActive ? 8 : 6}
                  fill={badgeColor}
                />

                {/* Order Index Badge */}
                <circle
                  cx="12"
                  cy="-12"
                  r="8"
                  fill="#1e293b"
                  stroke={badgeColor}
                  strokeWidth="1.5"
                />
                <text
                  x="12"
                  y="-9"
                  fill="#ffffff"
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {eq.orderIndex}
                </text>

                {/* Equipment Code Label */}
                <text
                  x="0"
                  y="26"
                  fill="#f8fafc"
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="pointer-events-none drop-shadow"
                >
                  {eq.code}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover / Tooltip Card */}
        {hoveredEquipment && (
          <div 
            className="absolute top-3 left-3 bg-slate-900/95 border border-slate-700/90 rounded-xl p-3 shadow-2xl backdrop-blur-md pointer-events-none max-w-xs z-10 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between gap-3 mb-1">
              <span className="font-mono font-bold text-amber-400 text-xs">
                #{hoveredEquipment.orderIndex} · {hoveredEquipment.code}
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                hoveredEquipment.status === 'normal'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : hoveredEquipment.status === 'abnormal'
                  ? 'bg-rose-500/20 text-rose-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}>
                {hoveredEquipment.status === 'normal' ? '已完成正常' : hoveredEquipment.status === 'abnormal' ? '回報異常' : '待巡檢'}
              </span>
            </div>
            <div className="font-semibold text-white text-xs mb-1">{hoveredEquipment.name}</div>
            <div className="text-[11px] text-slate-400 mb-2">{hoveredEquipment.location}</div>
            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800 flex items-center justify-between">
              <span>檢查項目：{hoveredEquipment.items.length} 項</span>
              <span className="text-amber-400 font-medium">點擊開啟巡檢</span>
            </div>
          </div>
        )}

        {/* Map Legend (Bottom bar) */}
        <div className="absolute bottom-2 right-2 bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-300">正常</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-300">異常</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-300">待巡</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-slate-400">
            <span className="font-mono text-white">{equipments.filter(e => e.status !== 'pending').length}</span>
            <span>/{equipments.length} 點已完成</span>
          </div>
        </div>
      </div>
    </div>
  );
};
