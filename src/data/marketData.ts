import {
  DailyHourlyCsvRow,
  HeatmapRow,
  HourlySmpPoint,
  LoadBand,
  MeritGenerator,
  MultiDayPoint,
  PriceAlertRule,
  RecAuctionSession,
  RegionId,
  SavedScenario,
  SettlementEntry,
} from '../types/market';

export const DEFAULT_HOURLY_SHAPE = [
  0.88, 0.83, 0.79, 0.77, 0.78, 0.85,
  0.95, 1.04, 1.12, 1.16, 1.13, 1.07,
  1.00, 1.03, 1.08, 1.16, 1.22, 1.26,
  1.23, 1.17, 1.11, 1.04, 0.97, 0.91,
];

export const DEFAULT_DEMAND_GW = [
  56.4, 53.2, 51.0, 49.8, 50.5, 54.1,
  60.8, 67.5, 74.2, 78.6, 79.4, 77.9,
  74.1, 76.2, 78.8, 80.5, 82.4, 84.1,
  83.0, 79.8, 75.6, 71.2, 65.8, 60.1,
];

export const DEFAULT_SOLAR_INDEX = [
  0, 0, 0, 0, 0, 0.02,
  0.08, 0.22, 0.45, 0.72, 0.89, 0.98,
  1.0, 0.94, 0.79, 0.56, 0.31, 0.11,
  0.01, 0, 0, 0, 0, 0,
];

export function getBandForHour(hourIndex: number): LoadBand {
  if (hourIndex >= 0 && hourIndex <= 5) return 'off-peak';
  if (hourIndex === 23) return 'off-peak';
  if ((hourIndex >= 9 && hourIndex <= 10) || (hourIndex >= 15 && hourIndex <= 19)) {
    return 'peak';
  }
  return 'mid';
}

/**
 * Builds 24-hour SMP points either from an uploaded daily hourly CSV row
 * or calibrated smoothly around the active KPX monthly CSV averages.
 */
export function buildHourlySmpSeries(
  mainlandBase: number,
  jejuBase: number,
  dailyRow?: DailyHourlyCsvRow,
  prevDailyRow?: DailyHourlyCsvRow
): HourlySmpPoint[] {
  return Array.from({ length: 24 }, (_, idx) => {
    const hourNum = idx + 1;
    const smpMainland = dailyRow
      ? Number((dailyRow.hours[idx] ?? mainlandBase).toFixed(2))
      : Number((mainlandBase * DEFAULT_HOURLY_SHAPE[idx]).toFixed(2));

    // When daily CSV is Mainland-only, derive Jeju reference spread (+14.8원 average or month ratio)
    const jejuRatio = mainlandBase > 0 ? Math.max(1.0, jejuBase / mainlandBase) : 1.15;
    const smpJeju = dailyRow
      ? Number((smpMainland * (jejuRatio > 1.02 ? jejuRatio : 1.14)).toFixed(2))
      : Number((jejuBase * DEFAULT_HOURLY_SHAPE[idx] * 1.04).toFixed(2));

    const yesterdayMainland = prevDailyRow
      ? Number((prevDailyRow.hours[idx] ?? smpMainland * 0.97).toFixed(2))
      : Number((smpMainland * (0.95 + Math.sin(idx * 0.4) * 0.02)).toFixed(2));

    const yesterdayJeju = Number((smpJeju * (0.95 + Math.cos(idx * 0.35) * 0.02)).toFixed(2));

    return {
      hour: idx,
      label: `${hourNum}시`,
      smpMainland,
      smpJeju,
      yesterdayMainland,
      yesterdayJeju,
      demandGw: DEFAULT_DEMAND_GW[idx],
      band: getBandForHour(idx),
      solarIndex: DEFAULT_SOLAR_INDEX[idx],
    };
  });
}

export const HOURLY_SMP_24H: HourlySmpPoint[] = buildHourlySmpSeries(119.02, 118.97);

export const MULTI_DAY_30D: MultiDayPoint[] = Array.from({ length: 30 }, (_, idx) => {
  const dayOffset = 29 - idx;
  const date = new Date(2026, 8, 30); // 2026-09-30 matching latest CSV month 2026/09
  date.setDate(date.getDate() - dayOffset);
  const dateLabel = `${date.getMonth() + 1}/${String(date.getDate()).padStart(2, '0')}`;
  const fullDate = `2026-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const wave = Math.sin(idx * 0.45) * 5.2 + Math.cos(idx * 0.22) * 3.1;
  const weekendDip = isWeekend ? -7.8 : 0;
  const avgMain = Number((119.02 + wave + weekendDip).toFixed(2));
  const avgJeju = Number((118.97 + wave * 1.1 + weekendDip * 0.7).toFixed(2));
  return {
    dateLabel,
    fullDate,
    avgSmpMainland: avgMain,
    maxSmpMainland: Number((avgMain + 21.4).toFixed(2)),
    minSmpMainland: Number((avgMain - 24.6).toFixed(2)),
    avgSmpJeju: avgJeju,
    maxSmpJeju: Number((avgJeju + 24.5).toFixed(2)),
    minSmpJeju: Number((avgJeju - 25.0).toFixed(2)),
    demandGw: Number((isWeekend ? 64.2 + wave * 0.3 : 73.8 + wave * 0.4).toFixed(1)),
  };
});

export const REC_AUCTIONS: RecAuctionSession[] = [
  { date: '2026-09-29', dayOfWeek: '화', closingPrice: 74200, changePct: -1.4, volumeRec: 48210, highPrice: 75100, lowPrice: 73500 },
  { date: '2026-09-24', dayOfWeek: '목', closingPrice: 75250, changePct: 0.9, volumeRec: 51890, highPrice: 75900, lowPrice: 74100 },
  { date: '2026-09-22', dayOfWeek: '화', closingPrice: 74580, changePct: -0.6, volumeRec: 44620, highPrice: 75200, lowPrice: 73800 },
  { date: '2026-09-17', dayOfWeek: '목', closingPrice: 75030, changePct: 1.8, volumeRec: 59400, highPrice: 75500, lowPrice: 73600 },
  { date: '2026-09-15', dayOfWeek: '화', closingPrice: 73700, changePct: -1.1, volumeRec: 42310, highPrice: 74400, lowPrice: 72900 },
  { date: '2026-09-10', dayOfWeek: '목', closingPrice: 74520, changePct: 0.4, volumeRec: 49850, highPrice: 75000, lowPrice: 73700 },
];

export function buildWeeklyHeatmap(hourlyBase: HourlySmpPoint[], region: RegionId): HeatmapRow[] {
  const days = [
    { day: 'Mon', dayKo: '월', mult: 0.98 },
    { day: 'Tue', dayKo: '화', mult: 1.01 },
    { day: 'Wed', dayKo: '수', mult: 1.02 },
    { day: 'Thu', dayKo: '목', mult: 1.00 },
    { day: 'Fri', dayKo: '금', mult: 0.99 },
    { day: 'Sat', dayKo: '토', mult: 0.90 },
    { day: 'Sun', dayKo: '일', mult: 0.86 },
  ];
  return days.map((d) => ({
    day: d.day,
    dayKo: d.dayKo,
    hours: hourlyBase.map((p) =>
      Number(((region === 'mainland' ? p.smpMainland : p.smpJeju) * d.mult).toFixed(1))
    ),
  }));
}

export const INITIAL_ALERTS: PriceAlertRule[] = [
  {
    id: 'alt-1',
    region: 'mainland',
    metric: 'SMP',
    condition: 'above',
    threshold: 145,
    channel: '앱 알림',
    enabled: true,
    lastTriggered: '금일 18시',
    note: '상업용 ESS 피크 방전 개시 기준 단가',
  },
  {
    id: 'alt-2',
    region: 'mainland',
    metric: 'SMP',
    condition: 'below',
    threshold: 95,
    channel: '이메일',
    enabled: true,
    lastTriggered: '금일 04시',
    note: '심야 경부하 충전 권장 단가',
  },
  {
    id: 'alt-3',
    region: 'jeju',
    metric: 'SMP',
    condition: 'above',
    threshold: 155,
    channel: '카카오톡',
    enabled: true,
    lastTriggered: '금일 17시',
    note: '제주 저녁 최대부하 급등 알림',
  },
  {
    id: 'alt-4',
    region: 'mainland',
    metric: 'REC',
    condition: 'above',
    threshold: 75000,
    channel: '이메일',
    enabled: false,
    lastTriggered: '09/24 14:20',
    note: '보유 REC 현물 매도 목표가',
  },
];

export const INITIAL_SETTLEMENTS: SettlementEntry[] = [
  {
    id: 'STL-2026-0930',
    date: '2026-09-30',
    facilityName: '나주 태양광 1호기 (450 kW)',
    region: 'mainland',
    type: 'SMP 정산',
    volumeLabel: '1,680 kWh',
    unitPrice: 119.02,
    totalKrw: 199954,
    status: '정산 대기',
  },
  {
    id: 'STL-2026-0929',
    date: '2026-09-29',
    facilityName: '나주 태양광 1호기 (450 kW)',
    region: 'mainland',
    type: 'REC 현물',
    volumeLabel: '24 REC',
    unitPrice: 74200,
    totalKrw: 1780800,
    status: '정산 완료',
  },
  {
    id: 'STL-2026-0924',
    date: '2026-09-24',
    facilityName: '서귀포 풍력 2호기 (800 kW)',
    region: 'jeju',
    type: 'SMP 정산',
    volumeLabel: '4,120 kWh',
    unitPrice: 118.97,
    totalKrw: 490156,
    status: '정산 완료',
  },
  {
    id: 'STL-2026-0922',
    date: '2026-09-22',
    facilityName: '김천 물류센터 지붕형 (120 kW)',
    region: 'mainland',
    type: 'REC 현물',
    volumeLabel: '8 REC',
    unitPrice: 74580,
    totalKrw: 596640,
    status: '정산 완료',
  },
  {
    id: 'STL-2026-0917',
    date: '2026-09-17',
    facilityName: '서귀포 풍력 2호기 (800 kW)',
    region: 'jeju',
    type: 'REC 현물',
    volumeLabel: '18 REC',
    unitPrice: 75030,
    totalKrw: 1350540,
    status: '정산 완료',
  },
  {
    id: 'STL-2026-0915',
    date: '2026-09-15',
    facilityName: '김천 물류센터 지붕형 (120 kW)',
    region: 'mainland',
    type: 'SMP 정산',
    volumeLabel: '11,450 kWh',
    unitPrice: 119.02,
    totalKrw: 1362779,
    status: '정산 완료',
  },
];

export const MERIT_ORDER_STACK: MeritGenerator[] = [
  { id: 'nuclear', name: 'Nuclear Baseload', nameKo: '원자력 기저발전', fuel: '우라늄', capacityGw: 24.5, marginalCost: 11.4, color: '#0F172A' },
  { id: 'renew', name: 'Solar & Wind Must-Run', nameKo: '태양광·풍력', fuel: '신재생', capacityGw: 14.0, marginalCost: 0.0, color: '#10B981' },
  { id: 'coal-base', name: 'High-Efficiency Coal', nameKo: '유연탄 기저발전', fuel: '유연탄', capacityGw: 21.5, marginalCost: 82.6, color: '#475569' },
  { id: 'lng-ccgt', name: 'LNG Combined Cycle', nameKo: 'LNG 복합화력', fuel: '천연가스', capacityGw: 22.0, marginalCost: 119.0, color: '#FF6B00' },
  { id: 'lng-peak', name: 'LNG Peak Turbine', nameKo: 'LNG 첨두발전', fuel: '천연가스', capacityGw: 8.5, marginalCost: 158.5, color: '#F97316' },
  { id: 'oil', name: 'Heavy Oil Peaker', nameKo: '중유 비상발전', fuel: '중유', capacityGw: 4.5, marginalCost: 208.0, color: '#EF4444' },
];

export const INITIAL_SCENARIOS: SavedScenario[] = [
  {
    id: 'scn-1',
    name: '상업용 지붕 100 kW',
    facilityType: '지붕형 태양광',
    region: 'mainland',
    capacityKw: 100,
    recWeight: 1.5,
    essEnabled: false,
    annualKwh: 131400,
    annualRevenueKrw: 30268000,
  },
  {
    id: 'scn-2',
    name: '노지 일반부지 500 kW',
    facilityType: '노지 태양광',
    region: 'mainland',
    capacityKw: 500,
    recWeight: 1.0,
    essEnabled: false,
    annualKwh: 657000,
    annualRevenueKrw: 126945000,
  },
  {
    id: 'scn-3',
    name: '제주 태양광 + ESS 300 kW',
    facilityType: '태양광 + ESS',
    region: 'jeju',
    capacityKw: 300,
    recWeight: 1.2,
    essEnabled: true,
    annualKwh: 416100,
    annualRevenueKrw: 94210000,
  },
];

export function formatKrw(value: number): string {
  return new Intl.NumberFormat('ko-KR', {
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

export function formatSmp(value: number): string {
  return value.toFixed(2);
}

export function getHourlyPrice(point: HourlySmpPoint, region: RegionId): number {
  return region === 'mainland' ? point.smpMainland : point.smpJeju;
}

export function getYesterdayPrice(point: HourlySmpPoint, region: RegionId): number {
  return region === 'mainland' ? point.yesterdayMainland : point.yesterdayJeju;
}

/**
 * Exports either the current 24h schedule in the exact KPX format:
 * 날짜,1시,2시,3시,...,24시
 */
export function exportHourlyCsv(
  hourlyPoints: HourlySmpPoint[],
  dateLabel: string,
  region: RegionId
) {
  const hourHeaders = Array.from({ length: 24 }, (_, i) => `${i + 1}시`);
  const header = ['날짜', ...hourHeaders].join(',');
  const values = hourlyPoints.map((p) => getHourlyPrice(p, region).toFixed(2));
  const row = [dateLabel, ...values].join(',');
  const csv = '\uFEFF' + [header, row].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `kpx-smp-${region}-${dateLabel.replace(/\//g, '-')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
