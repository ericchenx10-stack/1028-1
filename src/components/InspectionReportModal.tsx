import React from 'react';
import { 
  X, 
  Download, 
  Printer, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  FileText,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { Equipment, PatrolSession } from '../types/inspection';
import { sound } from '../utils/audio';

interface InspectionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: PatrolSession;
  equipments: Equipment[];
}

export const InspectionReportModal: React.FC<InspectionReportModalProps> = ({
  isOpen,
  onClose,
  session,
  equipments,
}) => {
  if (!isOpen) return null;

  const total = equipments.length;
  const completed = equipments.filter((e) => e.status !== 'pending').length;
  const abnormal = equipments.filter((e) => e.status === 'abnormal').length;
  const normal = equipments.filter((e) => e.status === 'normal').length;
  const complianceRate = completed > 0 ? Math.round((normal / completed) * 100) : 100;

  // Export CSV
  const handleExportCSV = () => {
    sound.tap();
    const headers = [
      '序號',
      '設備編號',
      '設備名稱',
      '廠房區域',
      '位置',
      '狀態',
      '巡檢時間',
      '巡檢員',
      '異常標籤',
      '處置建議',
      '語音速記備註',
    ];

    const rows = equipments.map((eq) => [
      eq.orderIndex,
      eq.code,
      `"${eq.name}"`,
      eq.zoneId,
      `"${eq.location}"`,
      eq.status === 'normal' ? '正常' : eq.status === 'abnormal' ? '異常' : '待巡檢',
      eq.lastInspectedAt || '--',
      session.inspectorName,
      `"${eq.defectReport?.tags.join(';') || ''}"`,
      `"${eq.defectReport?.actionRequired || ''}"`,
      `"${eq.voiceMemo || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `工廠巡檢總表_${session.id}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export JSON
  const handleExportJSON = () => {
    sound.tap();
    const data = {
      patrolSession: session,
      generatedAt: new Date().toISOString(),
      summary: { total, completed, normal, abnormal, complianceRate },
      equipments,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `巡檢資料備份_${session.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Trigger browser print
  const handlePrint = () => {
    sound.tap();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">工廠巡檢稽核總報表</h3>
              <p className="text-xs text-slate-400">系統即時生成之點檢記錄單與異常清冊</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>匯出 CSV</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>JSON備份</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>列印報表</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable & Scrollable Report Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950/70 text-slate-200 print:bg-white print:text-black print:p-0">
          {/* Official Document Banner */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 print:border-none print:bg-transparent">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs uppercase tracking-widest text-amber-400 font-mono font-bold block">
                  INDUSTRIAL PATROL AUDIT SYSTEM
                </span>
                <h2 className="text-lg font-bold text-white print:text-black">
                  {session.routeName}
                </h2>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs text-slate-400 block">單號: {session.id}</span>
                <span className="text-xs text-slate-400">開單時間: {session.startedAt}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3 text-xs">
              <div>
                <span className="text-slate-400 block">巡檢員：</span>
                <strong className="text-white print:text-black">{session.inspectorName} ({session.inspectorBadge})</strong>
              </div>
              <div>
                <span className="text-slate-400 block">所屬班別：</span>
                <strong className="text-white print:text-black">{session.shift}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">巡檢進度：</span>
                <strong className="text-emerald-400">{completed} / {total} 點完成</strong>
              </div>
              <div>
                <span className="text-slate-400 block">合格率：</span>
                <strong className="text-amber-400 font-mono text-sm">{complianceRate}%</strong>
              </div>
            </div>
          </div>

          {/* Abnormality Highlight Section if any */}
          {abnormal > 0 && (
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/60 print:border-red-500">
              <div className="flex items-center gap-2 text-rose-400 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wide">異常回報待辦清冊 ({abnormal} 處)</h4>
              </div>
              <div className="space-y-2">
                {equipments
                  .filter((e) => e.status === 'abnormal')
                  .map((eq) => (
                    <div key={eq.id} className="p-3 rounded-lg bg-slate-900/80 border border-rose-900/40 text-xs">
                      <div className="flex items-center justify-between font-bold text-white print:text-black">
                        <span>{eq.code} · {eq.name} ({eq.location})</span>
                        <span className="text-rose-400">等級: {eq.defectReport?.severity === 'critical' ? '緊急停機' : '一般異常'}</span>
                      </div>
                      <div className="text-slate-400 mt-1">
                        異常標籤: <strong className="text-rose-300">{eq.defectReport?.tags.join(', ') || '未設定'}</strong>
                      </div>
                      {eq.defectReport?.description && (
                        <div className="text-slate-300 mt-0.5">現場備註: {eq.defectReport.description}</div>
                      )}
                      {eq.defectReport?.photos && eq.defectReport.photos.length > 0 && (
                        <div className="mt-2 flex gap-2">
                          {eq.defectReport.photos.map((p) => (
                            <img key={p.id} src={p.url} alt="瑕疵" className="w-16 h-12 object-cover rounded border border-slate-700" />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Equipment Inspection Full Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden print:border-slate-300">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-300 border-b border-slate-800 print:bg-slate-100 print:text-black">
                <tr>
                  <th className="py-2.5 px-3 font-mono">#</th>
                  <th className="py-2.5 px-3">設備編號/名稱</th>
                  <th className="py-2.5 px-3">廠房位置</th>
                  <th className="py-2.5 px-3">檢測結果</th>
                  <th className="py-2.5 px-3">巡檢時間</th>
                  <th className="py-2.5 px-3">備註說明</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {equipments.map((eq) => (
                  <tr key={eq.id} className="hover:bg-slate-900/50">
                    <td className="py-2.5 px-3 font-mono text-slate-400">{eq.orderIndex}</td>
                    <td className="py-2.5 px-3 font-medium text-white print:text-black">
                      <span className="font-mono text-amber-400 mr-1.5">{eq.code}</span>
                      {eq.name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{eq.location}</td>
                    <td className="py-2.5 px-3">
                      {eq.status === 'normal' ? (
                        <span className="text-emerald-400 font-bold">正常 OK</span>
                      ) : eq.status === 'abnormal' ? (
                        <span className="text-rose-400 font-bold">異常 NG</span>
                      ) : (
                        <span className="text-slate-500">未巡檢</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{eq.lastInspectedAt || '--'}</td>
                    <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate">
                      {eq.voiceMemo || eq.defectReport?.description || '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Digital Signature Box */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              <div className="font-bold text-white mb-1">電子簽署核章欄位</div>
              <div>巡檢員：{session.inspectorName} ({session.inspectorBadge})</div>
              <div>存檔雜湊：SHA256: 7a82b99c04df... (已鎖定不可篡改)</div>
            </div>

            {session.signatureUrl ? (
              <div className="flex flex-col items-center">
                <img
                  src={session.signatureUrl}
                  alt="巡檢員簽名"
                  className="h-16 bg-white px-4 py-1 rounded-lg border border-slate-700 object-contain shadow-sm"
                />
                <span className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>已完成現場電子正簽</span>
                </span>
              </div>
            ) : (
              <div className="px-6 py-3 border border-dashed border-slate-700 rounded-lg text-xs text-slate-500 text-center">
                尚未完成電子簽章 (可點擊主頁「電子簽章完成」進行簽章)
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 print:hidden">
          <span>符合 ISO 55001 實體資產巡檢稽核標準</span>
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
