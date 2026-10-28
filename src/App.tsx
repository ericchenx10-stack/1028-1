import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  FACTORY_ZONES, 
  INITIAL_EQUIPMENTS, 
  INITIAL_PATROL_SESSION 
} from './data/factoryData';
import { Equipment, PatrolSession, ZoneId } from './types/inspection';
import { Header } from './components/Header';
import { FactoryMap } from './components/FactoryMap';
import { EquipmentList } from './components/EquipmentList';
import { InspectionModal } from './components/InspectionModal';
import { ScannerModal } from './components/ScannerModal';
import { SignatureModal } from './components/SignatureModal';
import { InspectionReportModal } from './components/InspectionReportModal';
import { TabletFrameWrapper } from './components/TabletFrameWrapper';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  QrCode, 
  PenTool, 
  RotateCcw, 
  Activity, 
  ChevronRight,
  ShieldCheck,
  Sparkles,
  ClipboardCheck,
  Radio
} from 'lucide-react';
import { sound } from './utils/audio';

const STORAGE_KEY_EQUIPMENTS = 'factory_patrol_equipments_v1';
const STORAGE_KEY_SESSION = 'factory_patrol_session_v1';

export default function App() {
  // Load initial equipments from localStorage or defaults
  const [equipments, setEquipments] = useState<Equipment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EQUIPMENTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_EQUIPMENTS;
  });

  // Load session from localStorage or defaults
  const [session, setSession] = useState<PatrolSession>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSION);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_PATROL_SESSION;
  });

  const [currentTab, setCurrentTab] = useState<'map' | 'list'>('map');
  const [selectedZone, setSelectedZone] = useState<ZoneId | 'all'>('all');
  const [isOffline, setIsOffline] = useState(false);

  // Modals
  const [inspectingEquipment, setInspectingEquipment] = useState<Equipment | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Save to localStorage whenever equipments change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EQUIPMENTS, JSON.stringify(equipments));
    } catch {
      // LocalStorage full or private mode
    }
  }, [equipments]);

  // Save session
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
    } catch {
      // LocalStorage
    }
  }, [session]);

  // Patrol statistics
  const totalEquipments = equipments.length;
  const completedEquipments = equipments.filter((e) => e.status !== 'pending');
  const completedCount = completedEquipments.length;
  const normalCount = equipments.filter((e) => e.status === 'normal').length;
  const abnormalCount = equipments.filter((e) => e.status === 'abnormal').length;
  const pendingCount = totalEquipments - completedCount;
  const progressPercent = totalEquipments > 0 ? Math.round((completedCount / totalEquipments) * 100) : 0;

  // Next pending equipment in route
  const nextPendingEquipment = equipments
    .filter((e) => e.status === 'pending')
    .sort((a, b) => a.orderIndex - b.orderIndex)[0];

  // Save updated equipment from inspection modal
  const handleSaveEquipment = (updatedEquipment: Equipment) => {
    setEquipments((prev) =>
      prev.map((eq) => (eq.id === updatedEquipment.id ? updatedEquipment : eq))
    );

    // If all completed now, fire celebratory confetti
    const remainingPending = equipments.filter(
      (e) => e.id !== updatedEquipment.id && e.status === 'pending'
    ).length;

    if (remainingPending === 0) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }
  };

  // Open inspection for specific equipment
  const handleOpenInspection = (eq: Equipment) => {
    sound.tap();
    setInspectingEquipment(eq);
  };

  // Navigate to next equipment inside modal
  const handleNavigateInsideModal = (equipmentId: string) => {
    const target = equipments.find((e) => e.id === equipmentId);
    if (target) {
      setInspectingEquipment(target);
    }
  };

  // Handle equipment selected by scanner
  const handleSelectFromScanner = (equipmentId: string) => {
    const target = equipments.find((e) => e.id === equipmentId);
    if (target) {
      setInspectingEquipment(target);
    }
  };

  // Electronic signature completed
  const handleSignComplete = (signatureDataUrl: string) => {
    sound.success();
    setSession((prev) => ({
      ...prev,
      signatureUrl: signatureDataUrl,
      completedAt: new Date().toLocaleString('zh-TW', { hour12: false }),
      status: 'completed',
    }));

    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
    } catch {
      // ignore
    }
  };

  // Reset sample patrol data
  const handleResetData = () => {
    sound.tap();
    if (window.confirm('確定要重置本次巡檢資料為初始待巡檢狀態嗎？')) {
      setEquipments(INITIAL_EQUIPMENTS);
      setSession(INITIAL_PATROL_SESSION);
      localStorage.removeItem(STORAGE_KEY_EQUIPMENTS);
      localStorage.removeItem(STORAGE_KEY_SESSION);
    }
  };

  return (
    <TabletFrameWrapper
      isOffline={isOffline}
      onToggleOffline={() => setIsOffline(!isOffline)}
    >
      <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
        {/* Top Bar adhering to Top Bar Contract */}
        <Header
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenScanner={() => setIsScannerOpen(true)}
          onOpenReport={() => setIsReportOpen(true)}
          onOpenSignature={() => setIsSignatureOpen(true)}
          completedCount={completedCount}
          totalCount={totalEquipments}
          isSigned={!!session.signatureUrl}
        />

        {/* Patrol Route Context & Key Metrics Strip */}
        <div className="border-b border-slate-800/80 bg-slate-900/60 px-4 sm:px-6 py-3">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Route & Inspector Info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    {session.routeName}
                  </h1>
                  <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-slate-800 text-slate-300 border border-slate-700">
                    {session.shift.split(' ')[0]}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                  <span>巡檢責任人：<strong className="text-slate-200">{session.inspectorName}</strong></span>
                  <span className="text-slate-600">·</span>
                  <span className="font-mono text-slate-400">{session.inspectorBadge}</span>
                </div>
              </div>
            </div>

            {/* Live Progress KPIs */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              {/* Progress percentage ring card */}
              <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 px-3.5 py-1.5 rounded-xl">
                <div>
                  <div className="text-[10px] text-slate-400">巡檢進度</div>
                  <div className="text-xs font-bold text-white font-mono">
                    {completedCount} <span className="text-slate-500">/</span> {totalEquipments} 點位
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-slate-800 flex items-center justify-center text-xs font-mono font-bold text-amber-400">
                  {progressPercent}%
                </div>
              </div>

              {/* Status tally counters */}
              <div className="flex items-center gap-2">
                <div className="bg-emerald-950/30 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl text-center min-w-[56px]">
                  <span className="text-[10px] text-emerald-400 block">正常</span>
                  <span className="text-xs font-bold text-white font-mono">{normalCount}</span>
                </div>
                <div className="bg-rose-950/30 border border-rose-500/20 px-2.5 py-1.5 rounded-xl text-center min-w-[56px]">
                  <span className="text-[10px] text-rose-400 block">異常</span>
                  <span className="text-xs font-bold text-rose-400 font-mono">{abnormalCount}</span>
                </div>
                <div className="bg-amber-950/30 border border-amber-500/20 px-2.5 py-1.5 rounded-xl text-center min-w-[56px]">
                  <span className="text-[10px] text-amber-400 block">待巡</span>
                  <span className="text-xs font-bold text-amber-300 font-mono">{pendingCount}</span>
                </div>
              </div>

              {/* Reset Data Button */}
              <button
                onClick={handleResetData}
                className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-colors"
                title="重新開始巡檢作業"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col gap-5 pb-24">
          {/* Next Pending Quick Action Banner (Tablet Ergonomics) */}
          {nextPendingEquipment && (
            <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-mono font-bold flex items-center justify-center text-sm shadow-md">
                  #{nextPendingEquipment.orderIndex}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                      下一預定巡檢點位
                    </span>
                    <span className="text-slate-500 text-xs">·</span>
                    <span className="text-xs font-mono font-bold text-white">{nextPendingEquipment.code}</span>
                  </div>
                  <div className="text-sm font-semibold text-white mt-0.5">
                    {nextPendingEquipment.name}
                  </div>
                  <div className="text-xs text-slate-400">{nextPendingEquipment.location}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setIsScannerOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <QrCode className="w-4 h-4 text-amber-400" />
                  <span>感應/掃描此設備</span>
                </button>
                <button
                  onClick={() => handleOpenInspection(nextPendingEquipment)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
                >
                  <span>立即開啟點檢</span>
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
          )}

          {/* View Mode Switching: Map or List */}
          {currentTab === 'map' ? (
            <FactoryMap
              equipments={equipments}
              zones={FACTORY_ZONES}
              selectedZone={selectedZone}
              onSelectZone={setSelectedZone}
              onOpenInspection={handleOpenInspection}
              activeEquipmentId={inspectingEquipment?.id}
            />
          ) : (
            <EquipmentList
              equipments={equipments}
              zones={FACTORY_ZONES}
              selectedZone={selectedZone}
              onSelectZone={setSelectedZone}
              onOpenInspection={handleOpenInspection}
            />
          )}
        </main>

        {/* Ergonomic Floating Tablet Bottom Action Bar (Thumb Zone) */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 py-2.5 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            {/* Left: Quick View Toggle */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => { setCurrentTab('map'); sound.tap(); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  currentTab === 'map'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                平面地圖
              </button>
              <button
                onClick={() => { setCurrentTab('list'); sound.tap(); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  currentTab === 'list'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                設備清單
              </button>
            </div>

            {/* Center: Fast Scanner Trigger Button (Large touch target) */}
            <button
              onClick={() => { setIsScannerOpen(true); sound.tap(); }}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 border border-slate-700 font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>點位標籤掃描 / NFC</span>
            </button>

            {/* Right: Electronic Signature or Summary Report */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setIsReportOpen(true); sound.tap(); }}
                className="hidden sm:flex px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold items-center gap-1.5 border border-slate-700 transition-colors"
              >
                <span>巡檢總報表</span>
              </button>

              <button
                onClick={() => { setIsSignatureOpen(true); sound.tap(); }}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
              >
                <PenTool className="w-4 h-4" />
                <span>電子簽章</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal: Equipment Inspection Form */}
        <InspectionModal
          isOpen={!!inspectingEquipment}
          onClose={() => setInspectingEquipment(null)}
          equipment={inspectingEquipment}
          allEquipments={equipments}
          onSaveEquipment={handleSaveEquipment}
          onNavigateToEquipment={handleNavigateInsideModal}
        />

        {/* Modal: QR Code / NFC Scanner Simulator */}
        <ScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          equipments={equipments}
          onSelectEquipment={handleSelectFromScanner}
        />

        {/* Modal: Electronic Signature Pad */}
        <SignatureModal
          isOpen={isSignatureOpen}
          onClose={() => setIsSignatureOpen(false)}
          inspectorName={session.inspectorName}
          inspectorBadge={session.inspectorBadge}
          shift={session.shift}
          totalEquipments={totalEquipments}
          completedCount={completedCount}
          abnormalCount={abnormalCount}
          onSignComplete={handleSignComplete}
        />

        {/* Modal: Inspection Audit Report & CSV Export */}
        <InspectionReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          session={session}
          equipments={equipments}
        />
      </div>
    </TabletFrameWrapper>
  );
}
