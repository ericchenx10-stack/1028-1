import React, { useState, useEffect, useRef } from 'react';
import { X, QrCode, Radio, Camera, CheckCircle2, AlertCircle } from 'lucide-react';
import { Equipment } from '../types/inspection';
import { sound } from '../utils/audio';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipments: Equipment[];
  onSelectEquipment: (equipmentId: string) => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  equipments,
  onSelectEquipment,
}) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'nfc'>('scan');
  const [simulatedFeedback, setSimulatedFeedback] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setSimulatedFeedback(null);
    }
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setIsCameraActive(true);
    } catch {
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  if (!isOpen) return null;

  const handleEquipmentScan = (eq: Equipment) => {
    sound.scanBeep();
    setSimulatedFeedback(`已識別：${eq.code} ${eq.name}`);
    setTimeout(() => {
      onSelectEquipment(eq.id);
      onClose();
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">設備標籤感應 / 掃描辨識</h3>
              <p className="text-xs text-slate-400">支援 QR Code 光學鏡頭掃描與 NFC/RFID 晶片觸碰</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center border-b border-slate-800 px-5 pt-2 bg-slate-950/40">
          <button
            onClick={() => { setActiveTab('scan'); sound.tap(); }}
            className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'scan'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>光學 QR Code 掃描器</span>
          </button>
          <button
            onClick={() => { setActiveTab('nfc'); sound.tap(); }}
            className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'nfc'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>NFC / 點位標籤感應</span>
          </button>
        </div>

        {/* Scanner Viewport */}
        <div className="p-5 flex flex-col items-center bg-slate-950">
          {activeTab === 'scan' ? (
            <div className="relative w-full max-w-sm aspect-video sm:aspect-square max-h-[220px] rounded-xl overflow-hidden bg-slate-900 border border-slate-700 flex items-center justify-center">
              {isCameraActive ? (
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
              ) : (
                <div className="text-center p-4">
                  <Camera className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-60" />
                  <p className="text-xs text-slate-400">鏡頭待命中 (可使用實體相機或點擊下方標籤模擬)</p>
                  <button
                    onClick={startCamera}
                    className="mt-2.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition-colors"
                  >
                    開啟相機掃描
                  </button>
                </div>
              )}

              {/* Scanning crosshairs & laser */}
              <div className="absolute inset-4 border-2 border-dashed border-amber-500/60 rounded-lg pointer-events-none flex flex-col items-center justify-center">
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse shadow-lg shadow-amber-500/50" />
              </div>

              {simulatedFeedback && (
                <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center text-emerald-300 p-4 animate-in fade-in">
                  <CheckCircle2 className="w-10 h-10 mb-2 text-emerald-400" />
                  <span className="text-sm font-bold text-white">{simulatedFeedback}</span>
                  <span className="text-xs text-emerald-400 mt-1">即將開啟巡檢表單...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full max-w-sm p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 animate-pulse">
                <Radio className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">將平板頂端貼近設備 NFC 巡檢標籤</h4>
              <p className="text-xs text-slate-400 mb-2">距離 3 公分內即可自動感應觸發紀錄</p>
              {simulatedFeedback && (
                <div className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                  {simulatedFeedback}
                </div>
              )}
            </div>
          )}

          {/* Quick Equipment Tag Presets for Fast Tablet Testing */}
          <div className="w-full mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">現場模擬掃描點位 (點擊即可立即讀取):</span>
              <span className="text-[11px] text-amber-400">共 {equipments.length} 個點位</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[180px] overflow-y-auto pr-1">
              {equipments.map((eq) => {
                const isCompleted = eq.status === 'normal' || eq.status === 'abnormal';
                return (
                  <button
                    key={eq.id}
                    onClick={() => handleEquipmentScan(eq)}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-800 hover:border-amber-500/50 text-left transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-amber-400 group-hover:text-amber-300">
                        {eq.code}
                      </span>
                      {isCompleted && (
                        <span className="text-[10px] text-emerald-400 font-medium">已巡</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-300 truncate mt-0.5">{eq.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{eq.location}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>支援 ISO/IEC 14443A NFC 及 QR 條碼協議</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
