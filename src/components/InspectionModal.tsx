import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  AlertTriangle, 
  Camera, 
  Mic, 
  MicOff, 
  ChevronLeft, 
  ChevronRight, 
  Sliders, 
  ShieldAlert, 
  Plus, 
  Minus, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Info,
  Wrench,
  Trash2,
  Sparkles
} from 'lucide-react';
import { Equipment, InspectionCheckItem, DefectPhoto, DefectSeverity } from '../types/inspection';
import { CanvasMarkupModal } from './CanvasMarkupModal';
import { DEFECT_TAG_PRESETS, CANNED_VOICE_NOTES } from '../data/factoryData';
import { sound } from '../utils/audio';

interface InspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment | null;
  allEquipments: Equipment[];
  onSaveEquipment: (updatedEquipment: Equipment) => void;
  onNavigateToEquipment: (equipmentId: string) => void;
}

export const InspectionModal: React.FC<InspectionModalProps> = ({
  isOpen,
  onClose,
  equipment,
  allEquipments,
  onSaveEquipment,
  onNavigateToEquipment,
}) => {
  const [items, setItems] = useState<InspectionCheckItem[]>([]);
  const [voiceMemo, setVoiceMemo] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  // Defect state
  const [hasAbnormal, setHasAbnormal] = useState(false);
  const [defectSeverity, setDefectSeverity] = useState<DefectSeverity>('moderate');
  const [defectTags, setDefectTags] = useState<string[]>([]);
  const [defectDescription, setDefectDescription] = useState<string>('');
  const [actionRequired, setActionRequired] = useState<'monitor' | 'work_order' | 'immediate_shutdown'>('work_order');
  const [assignedDept, setAssignedDept] = useState<string>('工務維修部');
  const [defectPhotos, setDefectPhotos] = useState<DefectPhoto[]>([]);

  // Canvas markup sub-modal
  const [isMarkupModalOpen, setIsMarkupModalOpen] = useState(false);
  const [markupBasePhoto, setMarkupBasePhoto] = useState<string>('');

  // Active numeric item being edited with virtual pad
  const [activeNumericPadItem, setActiveNumericPadItem] = useState<string | null>(null);

  // Check speech recognition support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
      setSpeechSupported(!!SpeechRecognition);
    }
  }, []);

  // Initialize modal state when equipment changes
  useEffect(() => {
    if (!equipment) return;
    setItems(JSON.parse(JSON.stringify(equipment.items)));
    setVoiceMemo(equipment.voiceMemo || '');

    if (equipment.defectReport) {
      setHasAbnormal(equipment.defectReport.hasAbnormal);
      setDefectSeverity(equipment.defectReport.severity);
      setDefectTags(equipment.defectReport.tags || []);
      setDefectDescription(equipment.defectReport.description || '');
      setActionRequired(equipment.defectReport.actionRequired || 'work_order');
      setAssignedDept(equipment.defectReport.assignedDepartment || '工務維修部');
      setDefectPhotos(equipment.defectReport.photos || []);
    } else {
      setHasAbnormal(equipment.status === 'abnormal');
      setDefectSeverity('moderate');
      setDefectTags([]);
      setDefectDescription('');
      setActionRequired('work_order');
      setAssignedDept('工務維修部');
      setDefectPhotos([]);
    }
  }, [equipment]);

  if (!isOpen || !equipment) return null;

  // Determine current equipment index in route
  const currentIndex = allEquipments.findIndex((e) => e.id === equipment.id);
  const prevEquipment = currentIndex > 0 ? allEquipments[currentIndex - 1] : null;
  const nextEquipment = currentIndex < allEquipments.length - 1 ? allEquipments[currentIndex + 1] : null;

  // Batch mark all items as normal
  const handleMarkAllNormal = () => {
    sound.tap();
    const updated = items.map((item) => {
      let defaultVal = item.currentValue;
      if (item.type === 'numeric' && item.tolerance && defaultVal === undefined) {
        // assign safe middle range
        defaultVal = Number(((item.tolerance.min + item.tolerance.max) / 2).toFixed(1));
      }
      return {
        ...item,
        status: 'normal' as const,
        currentValue: defaultVal,
      };
    });
    setItems(updated);
    setHasAbnormal(false);
  };

  // Toggle item status
  const handleSetItemStatus = (itemId: string, status: 'normal' | 'abnormal') => {
    sound.tap();
    const updated = items.map((item) => {
      if (item.id === itemId) {
        return { ...item, status };
      }
      return item;
    });
    setItems(updated);

    // If any item is abnormal, activate defect section
    const anyAbnormal = updated.some((it) => it.status === 'abnormal');
    if (anyAbnormal) {
      setHasAbnormal(true);
      sound.alertTone();
    }
  };

  // Update numeric value
  const handleNumericChange = (itemId: string, val: number) => {
    const updated = items.map((item) => {
      if (item.id === itemId) {
        let isItemAbnormal = false;
        if (item.tolerance) {
          if (val < item.tolerance.min || val > item.tolerance.max) {
            isItemAbnormal = true;
          }
        }
        return {
          ...item,
          currentValue: val,
          status: isItemAbnormal ? ('abnormal' as const) : ('normal' as const),
        };
      }
      return item;
    });
    setItems(updated);

    const anyAbnormal = updated.some((it) => it.status === 'abnormal');
    if (anyAbnormal) {
      setHasAbnormal(true);
      sound.alertTone();
    }
  };

  // Stepper increment/decrement
  const handleStep = (itemId: string, delta: number) => {
    sound.tap();
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    const base = item.currentValue ?? (item.tolerance ? (item.tolerance.min + item.tolerance.max) / 2 : 0);
    const stepSize = item.tolerance && item.tolerance.max - item.tolerance.min > 20 ? 1 : 0.1;
    const newVal = Number((base + delta * stepSize).toFixed(2));
    handleNumericChange(itemId, newVal);
  };

  // Voice memo speech dictation
  const toggleSpeechRecognition = () => {
    sound.tap();
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: new () => unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new (SpeechRecognition as any)();
      recognition.lang = 'zh-TW';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setVoiceMemo((prev) => (prev ? `${prev}，${transcript}` : transcript));
          sound.success();
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Add canned note
  const handleAddCannedNote = (note: string) => {
    sound.tap();
    setVoiceMemo((prev) => (prev ? `${prev} ${note}` : note));
  };

  // Toggle defect tag
  const handleToggleDefectTag = (tag: string) => {
    sound.tap();
    setDefectTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Save photo from canvas markup modal
  const handleSaveAnnotatedPhoto = (dataUrl: string, photoCaption: string) => {
    const newPhoto: DefectPhoto = {
      id: `photo-${Date.now()}`,
      url: dataUrl,
      annotatedUrl: dataUrl,
      caption: photoCaption,
      timestamp: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
    };
    setDefectPhotos((prev) => [...prev, newPhoto]);
  };

  // Save full equipment inspection record
  const handleSaveRecord = (autoAdvance = false) => {
    sound.success();
    const isAnyAbnormal = hasAbnormal || items.some((it) => it.status === 'abnormal');
    const overallStatus = isAnyAbnormal ? 'abnormal' : 'normal';

    const updatedEquipment: Equipment = {
      ...equipment,
      items,
      status: overallStatus,
      lastInspectedAt: new Date().toLocaleString('zh-TW', { hour12: false }),
      voiceMemo,
      defectReport: isAnyAbnormal
        ? {
            hasAbnormal: true,
            severity: defectSeverity,
            tags: defectTags,
            description: defectDescription || '現場巡檢發現異常，已於平板建立標記',
            actionRequired,
            assignedDepartment: assignedDept,
            photos: defectPhotos,
          }
        : undefined,
    };

    onSaveEquipment(updatedEquipment);

    if (autoAdvance && nextEquipment) {
      onNavigateToEquipment(nextEquipment.id);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[96vh] overflow-hidden text-slate-100">
        {/* Tablet Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-mono font-bold text-amber-400 text-sm">
              #{equipment.orderIndex}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-lg text-white">{equipment.code}</span>
                <span className="text-slate-500 text-xs font-normal">·</span>
                <span className="text-slate-200 font-semibold text-sm">{equipment.name}</span>
                <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {equipment.model}
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>位置: {equipment.location}</span>
                <span className="text-slate-600">·</span>
                <span className="font-mono text-slate-500">QR: {equipment.qrCode}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllNormal}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95 shadow-sm"
              title="一鍵全選正常並填入標準值"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>全項目標記正常</span>
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Scrollable Tablet Inspection Form */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-950/60">
          {/* Equipment Photo & Reference Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-48 h-28 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
              <img
                src={equipment.referenceImageUrl}
                alt={equipment.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 left-1 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] text-slate-300">
                標準基準圖樣
              </div>
            </div>

            <div className="flex-1 text-xs text-slate-300 space-y-1 w-full">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">製造廠商：<strong className="text-white">{equipment.manufacturer}</strong></span>
                <span className="font-mono text-slate-400">NFC: {equipment.nfcTag}</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                巡檢標準規範：請於設備運轉穩定狀態下記錄。振動與軸承溫度異常將自動標記警報並提示開立維修派工單。
              </p>
              <div className="pt-1 flex items-center gap-2">
                <button
                  onClick={() => {
                    setMarkupBasePhoto(equipment.referenceImageUrl);
                    setIsMarkupModalOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>現場拍照 / 照片瑕疵塗鴉標註</span>
                </button>
                {defectPhotos.length > 0 && (
                  <span className="text-xs text-emerald-400 font-medium">
                    (已附加 {defectPhotos.length} 張標註相片)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section: Inspection Check Items List */}
          <div>
            <div className="flex items-center justify-between mb-2.5 px-1">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white tracking-wide">
                  點檢測試項目明細 ({items.filter((i) => i.status !== 'pending').length}/{items.length} 已填)
                </h4>
              </div>
              <span className="text-xs text-slate-400">點擊按鈕快速評判狀態</span>
            </div>

            <div className="space-y-3">
              {items.map((item) => {
                const isNumeric = item.type === 'numeric';
                const hasTolerance = !!item.tolerance;
                let valStatus: 'normal' | 'warning' | 'abnormal' = 'normal';

                if (isNumeric && hasTolerance && item.currentValue !== undefined) {
                  const val = item.currentValue;
                  const tol = item.tolerance!;
                  if (val < tol.min || val > tol.max) {
                    valStatus = 'abnormal';
                  } else if (
                    (tol.warningHigh && val >= tol.warningHigh) ||
                    (tol.warningLow && val <= tol.warningLow)
                  ) {
                    valStatus = 'warning';
                  }
                }

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      item.status === 'abnormal'
                        ? 'bg-rose-950/20 border-rose-800/80 shadow-rose-950/30'
                        : item.status === 'normal'
                        ? 'bg-slate-900 border-slate-800'
                        : 'bg-slate-900/60 border-slate-800/60'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      {/* Left: Item Name & Standard Spec */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            item.category === 'vibration'
                              ? 'bg-blue-500/15 text-blue-300'
                              : item.category === 'temperature'
                              ? 'bg-orange-500/15 text-orange-300'
                              : item.category === 'pressure'
                              ? 'bg-purple-500/15 text-purple-300'
                              : item.category === 'electrical'
                              ? 'bg-amber-500/15 text-amber-300'
                              : 'bg-slate-700 text-slate-300'
                          }`}>
                            {item.category === 'vibration' && '震動分析'}
                            {item.category === 'temperature' && '紅外測溫'}
                            {item.category === 'pressure' && '壓力表計'}
                            {item.category === 'electrical' && '電氣電壓'}
                            {item.category === 'lubrication' && '潤滑油品'}
                            {item.category === 'appearance' && '外觀密封'}
                            {item.category === 'safety' && '工安防護'}
                          </span>
                          <span className="font-semibold text-sm text-slate-100">{item.name}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-slate-500" />
                          <span>{item.standardValueDesc}</span>
                        </div>
                      </div>

                      {/* Right: Controls & Tablet Touch Stepper */}
                      <div className="flex flex-wrap items-center gap-3">
                        {/* If Numeric Item */}
                        {isNumeric && item.tolerance && (
                          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                            {/* Value input display */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-400">{item.tolerance.label}:</span>
                              <input
                                type="number"
                                step="any"
                                value={item.currentValue ?? ''}
                                placeholder="--"
                                onChange={(e) => {
                                  const v = parseFloat(e.target.value);
                                  if (!isNaN(v)) handleNumericChange(item.id, v);
                                }}
                                className={`w-20 px-2 py-1 rounded font-mono font-bold text-sm text-center border focus:outline-none ${
                                  valStatus === 'abnormal'
                                    ? 'bg-rose-950 text-rose-300 border-rose-600'
                                    : valStatus === 'warning'
                                    ? 'bg-amber-950 text-amber-300 border-amber-600'
                                    : 'bg-slate-900 text-emerald-400 border-slate-700'
                                }`}
                              />
                              <span className="text-xs font-mono text-slate-400">{item.tolerance.unit}</span>
                            </div>

                            {/* Touch Stepper for tablet ergonomics */}
                            <div className="flex items-center gap-1 ml-1">
                              <button
                                onClick={() => handleStep(item.id, -1)}
                                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 flex items-center justify-center transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleStep(item.id, 1)}
                                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 flex items-center justify-center transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* State Toggle Buttons (Large touch hitboxes >= 44px) */}
                        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                          <button
                            onClick={() => handleSetItemStatus(item.id, 'normal')}
                            className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95 ${
                              item.status === 'normal'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-900'
                            }`}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>正常 OK</span>
                          </button>

                          <button
                            onClick={() => handleSetItemStatus(item.id, 'abnormal')}
                            className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95 ${
                              item.status === 'abnormal'
                                ? 'bg-rose-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-rose-400 hover:bg-slate-900'
                            }`}
                          >
                            <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                            <span>異常 NG</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Voice Dictation & Quick Field Notes */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white tracking-wide">現場語音速記與文字備註</h4>
              </div>
              {speechSupported && (
                <button
                  onClick={toggleSpeechRecognition}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{isListening ? '聆聽錄音中...' : '語音輸入'}</span>
                </button>
              )}
            </div>

            <textarea
              value={voiceMemo}
              onChange={(e) => setVoiceMemo(e.target.value)}
              placeholder="輸入或口述設備現場狀況備註 (例如：運轉聲音平順，冷卻水管接頭有微量殘水，已完成現場擦拭)..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />

            {/* Quick canned text chips */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400">快速速記詞：</span>
              {CANNED_VOICE_NOTES.slice(0, 3).map((note, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAddCannedNote(note)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors truncate max-w-[240px]"
                >
                  + {note.slice(0, 14)}...
                </button>
              ))}
            </div>
          </div>

          {/* Section: Abnormality Defect Handling (Shows if Abnormal is flagged) */}
          {(hasAbnormal || items.some((i) => i.status === 'abnormal')) && (
            <div className="bg-rose-950/20 border border-rose-800/80 rounded-xl p-4 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-rose-900/50 pb-2">
                <div className="flex items-center gap-2 text-rose-400">
                  <ShieldAlert className="w-5 h-5" />
                  <h4 className="text-sm font-bold text-white">設備異常通報與維修聯動</h4>
                </div>
                <div className="flex items-center gap-1.5">
                  {(['minor', 'moderate', 'critical'] as DefectSeverity[]).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => { setDefectSeverity(lvl); sound.tap(); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                        defectSeverity === lvl
                          ? lvl === 'critical'
                            ? 'bg-rose-600 text-white'
                            : lvl === 'moderate'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-blue-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {lvl === 'minor' && '輕微異常'}
                      {lvl === 'moderate' && '一般異常'}
                      {lvl === 'critical' && '緊急停機'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Defect Quick Tags */}
              <div>
                <span className="text-xs text-slate-300 block mb-1.5">異常現象標籤 (可多選)：</span>
                <div className="flex flex-wrap gap-1.5">
                  {DEFECT_TAG_PRESETS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleToggleDefectTag(tag)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        defectTags.includes(tag)
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-rose-500/50'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Defect Action & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-slate-300 block mb-1">處置建議：</span>
                  <select
                    value={actionRequired}
                    onChange={(e) => setActionRequired(e.target.value as unknown as typeof actionRequired)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                  >
                    <option value="monitor">現場自主排除 / 納入持續追蹤</option>
                    <option value="work_order">開立工務維修派工單 (CMMS聯動)</option>
                    <option value="immediate_shutdown">建議立即停機掛牌檢修 (LOTO)</option>
                  </select>
                </div>
                <div>
                  <span className="text-xs text-slate-300 block mb-1">指派責任單位：</span>
                  <select
                    value={assignedDept}
                    onChange={(e) => setAssignedDept(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                  >
                    <option value="工務維修部">工務維修部 (廠務公用)</option>
                    <option value="電氣儀控組">電氣儀控組</option>
                    <option value="機械動力組">機械動力組</option>
                    <option value="製程工程部">製程工程部</option>
                  </select>
                </div>
              </div>

              {/* Attached Defect Photos Showcase */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-300 font-medium">瑕疵標註相片紀錄 ({defectPhotos.length})：</span>
                  <button
                    onClick={() => {
                      setMarkupBasePhoto(equipment.referenceImageUrl);
                      setIsMarkupModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>新增標註照片</span>
                  </button>
                </div>

                {defectPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {defectPhotos.map((photo) => (
                      <div key={photo.id} className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-900 group">
                        <img src={photo.url} alt={photo.caption} className="w-full h-24 object-cover" />
                        <div className="p-1.5 bg-slate-950 text-[10px] text-slate-300 truncate">
                          {photo.caption || '現場瑕疵標記'}
                        </div>
                        <button
                          onClick={() => setDefectPhotos((prev) => prev.filter((p) => p.id !== photo.id))}
                          className="absolute top-1 right-1 w-6 h-6 rounded-md bg-rose-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg border border-dashed border-rose-900/60 bg-slate-950/40 text-center text-xs text-slate-400">
                    尚無附帶標記照片，可點擊「新增標註照片」以相機或參考圖標註瑕疵紅圈。
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tablet Modal Sticky Footer */}
        <div className="px-5 py-3.5 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Previous / Next Equipment fast navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => prevEquipment && onNavigateToEquipment(prevEquipment.id)}
              disabled={!prevEquipment}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>上一台 ({prevEquipment?.code ?? '無'})</span>
            </button>
            <button
              onClick={() => nextEquipment && onNavigateToEquipment(nextEquipment.id)}
              disabled={!nextEquipment}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>下一台 ({nextEquipment?.code ?? '終點'})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Save Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleSaveRecord(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              僅保存本台
            </button>
            <button
              onClick={() => handleSaveRecord(true)}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/25 transition-all"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>儲存並前進下一台</span>
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Defect Markup Sub-modal */}
      <CanvasMarkupModal
        isOpen={isMarkupModalOpen}
        onClose={() => setIsMarkupModalOpen(false)}
        initialImageUrl={markupBasePhoto || equipment.referenceImageUrl}
        equipmentCode={equipment.code}
        equipmentName={equipment.name}
        onSavePhoto={handleSaveAnnotatedPhoto}
      />
    </div>
  );
};
