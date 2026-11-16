export type RegionId = 'mainland' | 'jeju';

export type TimeframeId = '24h' | '7d' | '30d' | '12m';

export type ScreenId = 'overview' | 'analytics' | 'simulator' | 'alerts' | 'guide';

export type LocaleId = 'ko' | 'en';

export type LoadBand = 'peak' | 'mid' | 'off-peak';

export interface DailyHourlyCsvRow {
  date: string; // e.g. "2026-11-12"
  hours: number[]; // length 24 (1시 ~ 24시), 단위: 원/kWh
  avg: number;
  max: number;
  min: number;
}

export interface MonthlySmpCsvRow {
  period: string; // e.g. "2026/09"
  mainland: number; // 육지 원/kWh
  jeju: number; // 제주 원/kWh
  integrated: number; // 통합 원/kWh
  blmp: number; // BLMP 원/kWh
}

export interface HourlySmpPoint {
  hour: number; // 0 to 23 (1시 ~ 24시)
  label: string; // "1시" .. "24시"
  smpMainland: number; // 원/kWh
  smpJeju: number; // 원/kWh
  yesterdayMainland: number;
  yesterdayJeju: number;
  demandGw: number;
  band: LoadBand;
  solarIndex: number; // 0..1 normalized solar curve
}

export interface MultiDayPoint {
  dateLabel: string;
  fullDate: string;
  avgSmpMainland: number;
  maxSmpMainland: number;
  minSmpMainland: number;
  avgSmpJeju: number;
  maxSmpJeju: number;
  minSmpJeju: number;
  demandGw: number;
}

export interface RecAuctionSession {
  date: string;
  dayOfWeek: '화' | '목';
  closingPrice: number; // 원/REC
  changePct: number;
  volumeRec: number;
  highPrice: number;
  lowPrice: number;
}

export interface HeatmapRow {
  day: string;
  dayKo: string;
  hours: number[]; // 24 hourly SMP values
}

export interface PriceAlertRule {
  id: string;
  region: RegionId;
  metric: 'SMP' | 'REC';
  condition: 'above' | 'below';
  threshold: number;
  channel: '앱 알림' | '이메일' | '카카오톡';
  enabled: boolean;
  lastTriggered?: string;
  note: string;
}

export interface SettlementEntry {
  id: string;
  date: string;
  facilityName: string;
  region: RegionId;
  type: 'SMP 정산' | 'REC 현물';
  volumeLabel: string;
  unitPrice: number;
  totalKrw: number;
  status: '정산 완료' | '정산 대기';
}

export interface MeritGenerator {
  id: string;
  name: string;
  nameKo: string;
  fuel: string;
  capacityGw: number;
  marginalCost: number; // 원/kWh
  color: string;
}

export interface SavedScenario {
  id: string;
  name: string;
  facilityType: string;
  region: RegionId;
  capacityKw: number;
  recWeight: number;
  essEnabled: boolean;
  annualKwh: number;
  annualRevenueKrw: number;
}
