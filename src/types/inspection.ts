export type ZoneId = 'zone-a' | 'zone-b' | 'zone-c' | 'zone-d' | 'zone-e';

export interface Zone {
  id: ZoneId;
  code: string;
  name: string;
  description: string;
  color: string;
  equipmentCount: number;
}

export type ItemCategory = 
  | 'appearance' 
  | 'vibration' 
  | 'temperature' 
  | 'pressure' 
  | 'electrical' 
  | 'lubrication' 
  | 'safety';

export interface ToleranceRange {
  min: number;
  max: number;
  warningLow?: number;
  warningHigh?: number;
  unit: string;
  label: string;
}

export interface InspectionCheckItem {
  id: string;
  name: string;
  category: ItemCategory;
  type: 'binary' | 'numeric';
  tolerance?: ToleranceRange;
  standardValueDesc: string;
  status: 'normal' | 'abnormal' | 'pending' | 'skipped';
  currentValue?: number;
  notes?: string;
}

export interface DefectPhoto {
  id: string;
  url: string;
  annotatedUrl?: string;
  caption: string;
  timestamp: string;
}

export type DefectSeverity = 'minor' | 'moderate' | 'critical';

export interface DefectReport {
  hasAbnormal: boolean;
  severity: DefectSeverity;
  tags: string[];
  description: string;
  actionRequired: 'monitor' | 'work_order' | 'immediate_shutdown';
  assignedDepartment: string;
  photos: DefectPhoto[];
}

export interface Equipment {
  id: string;
  code: string;
  nfcTag: string;
  qrCode: string;
  name: string;
  zoneId: ZoneId;
  location: string;
  model: string;
  manufacturer: string;
  referenceImageUrl: string;
  mapCoords: { x: number; y: number }; // percentage on interactive SVG floor map
  orderIndex: number; // patrol sequence
  items: InspectionCheckItem[];
  status: 'pending' | 'normal' | 'abnormal' | 'maintenance';
  lastInspectedAt?: string;
  inspectorName?: string;
  voiceMemo?: string;
  defectReport?: DefectReport;
}

export interface PatrolSession {
  id: string;
  routeName: string;
  shift: '早班 (08:00 - 16:00)' | '中班 (16:00 - 24:00)' | '夜班 (00:00 - 08:00)';
  inspectorName: string;
  inspectorBadge: string;
  startedAt: string;
  completedAt?: string;
  status: 'in_progress' | 'completed';
  signatureUrl?: string;
  syncStatus: 'synced' | 'pending_offline';
  notes?: string;
}
