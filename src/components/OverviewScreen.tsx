import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  FileSpreadsheet,
  HelpCircle,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  Upload,
} from 'lucide-react';
import {
  MULTI_DAY_30D,
  REC_AUCTIONS,
  formatKrw,
  formatSmp,
  getHourlyPrice,
  getYesterdayPrice,
} from '../data/marketData';
import {
  DailyHourlyCsvRow,
  HourlySmpPoint,
  LoadBand,
  LocaleId,
  MonthlySmpCsvRow,
  RegionId,
  ScreenId,
  TimeframeId,
} from '../types/market';
import { SmpTelemetryChart } from './SmpTelemetryChart';
import { RealtimeSupplyDemandSection } from './RealtimeSupplyDemandSection';

interface OverviewScreenProps {
  region: RegionId;
  onChangeRegion: (r: RegionId) => void;
  timeframe: TimeframeId;
  onChangeTimeframe: (t: TimeframeId) => void;
  locale: LocaleId;
  onChangeLocale: (l: LocaleId) => void;
  onNavigate: (s: ScreenId) => void;
  hourlyData: HourlySmpPoint[];
  monthlyCsvRows: MonthlySmpCsvRow[];
  dailyCsvRows: DailyHourlyCsvRow[];
  selectedMonthPeriod: string;
  onSelectMonthPeriod: (p: string) => void;
  selectedDailyDate: string;
  onSelectDailyDate: (d: string) => void;
  csvFileName: string;
  csvKind: 'monthly-kpx' | 'daily-hourly';
  onUploadCsvFile: (file: File) => void;
  onResetToAttachedCsv: () => void;
}

export const OverviewScreen: React.FC<OverviewScreenProps> = ({
  region,
  onChangeRegion,
  timeframe,
  onChangeTimeframe,
  locale,
  onChangeLocale,
  onNavigate,
  hourlyData,
  monthlyCsvRows,
  dailyCsvRows,
  selectedMonthPeriod,
  onSelectMonthPeriod,
  selectedDailyDate,
  onSelectDailyDate,
  csvFileName,
  csvKind,
  onUploadCsvFile,
  onResetToAttachedCsv,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showComparison, setShowComparison] = useState(true);
  const [bandFilter, setBandFilter] = useState<'all' | LoadBand>('all');
  const [hourQuery, setHourQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);

  const [quickCapacityKw, setQuickCapacityKw] = useState(100);
  const [quickRecWeight, setQuickRecWeight] = useState<1.0 | 1.2 | 1.5>(1.2);

  const currentHourIndex = 13; // 14시 기준
  const currentPoint = hourlyData[currentHourIndex] ?? hourlyData[0];
  const currentSmp = getHourlyPrice(currentPoint, region);
  const yesterdaySmp = getYesterdayPrice(currentPoint, region);
  const smpDeltaPct = yesterdaySmp > 0 ? ((currentSmp - yesterdaySmp) / yesterdaySmp) * 100 : 0;

  const latestRec = REC_AUCTIONS[0];
  const activeMonthRow = useMemo(
    () => monthlyCsvRows.find((r) => r.period === selectedMonthPeriod) ?? monthlyCsvRows[0],
    [monthlyCsvRows, selectedMonthPeriod]
  );

  const prevMonthRow = useMemo(() => {
    const idx = monthlyCsvRows.findIndex((r) => r.period === selectedMonthPeriod);
    return idx >= 0 && idx + 1 < monthlyCsvRows.length ? monthlyCsvRows[idx + 1] : undefined;
  }, [monthlyCsvRows, selectedMonthPeriod]);

  const dailyStats = useMemo(() => {
    const prices = hourlyData.map((p) => getHourlyPrice(p, region));
    const avg = prices.reduce((acc, v) => acc + v, 0) / (prices.length || 1);
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    const peakPoint = hourlyData.find((p) => getHourlyPrice(p, region) === max) ?? hourlyData[17];
    const yesterdayAvg =
      hourlyData.reduce((acc, p) => acc + getYesterdayPrice(p, region), 0) / (hourlyData.length || 1);
    const avgDeltaPct = yesterdayAvg > 0 ? ((avg - yesterdayAvg) / yesterdayAvg) * 100 : 0;
    return { avg, max, min, peakPoint, avgDeltaPct };
  }, [hourlyData, region]);

  const filteredHours = useMemo(() => {
    return hourlyData.filter((p) => {
      if (bandFilter !== 'all' && p.band !== bandFilter) return false;
      if (hourQuery.trim()) {
        const q = hourQuery.trim().toLowerCase();
        return p.label.toLowerCase().includes(q) || p.band.toLowerCase().includes(q);
      }
      return true;
    });
  }, [hourlyData, bandFilter, hourQuery]);

  const quickMonthlyEstimate = useMemo(() => {
    const monthlyKwh = quickCapacityKw * 3.6 * 30;
    const smpRev = monthlyKwh * dailyStats.avg;
    const recCount = (monthlyKwh / 1000) * quickRecWeight;
    const recRev = recCount * latestRec.closingPrice;
    return {
      monthlyKwh,
      smpRev,
      recRev,
      totalRev: smpRev + recRev,
    };
  }, [quickCapacityKw, quickRecWeight, dailyStats.avg, latestRec.closingPrice]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.setTimeout(() => setIsRefreshing(false), 350);
  };

  const monthMomDelta = useMemo(() => {
    if (!activeMonthRow || !prevMonthRow) return smpDeltaPct;
    const cur = region === 'mainland' ? activeMonthRow.mainland : activeMonthRow.jeju;
    const prev = region === 'mainland' ? prevMonthRow.mainland : prevMonthRow.jeju;
    return prev > 0 ? ((cur - prev) / prev) * 100 : 0;
  }, [activeMonthRow, prevMonthRow, region, smpDeltaPct]);

  const kpiCards = [
    {
      id: 'current-smp',
      label:
        csvKind === 'daily-hourly'
          ? locale === 'ko'
            ? `선택일 14시 SMP (${selectedDailyDate})`
            : `14:00 SMP (${selectedDailyDate})`
          : locale === 'ko'
          ? `${activeMonthRow ? activeMonthRow.period : '2026/09'} 기준 14시 SMP`
          : `14:00 SMP (${activeMonthRow?.period ?? '2026/09'})`,
      value: formatSmp(currentSmp),
      unit: locale === 'ko' ? '원/kWh' : 'KRW/kWh',
      delta: `${smpDeltaPct >= 0 ? '+' : ''}${smpDeltaPct.toFixed(1)}%`,
      isUp: smpDeltaPct >= 0,
      subtext:
        locale === 'ko'
          ? `일중 범위 ${formatSmp(dailyStats.min)} – ${formatSmp(dailyStats.max)}`
          : `Range ${formatSmp(dailyStats.min)} – ${formatSmp(dailyStats.max)}`,
      tooltip:
        locale === 'ko'
          ? '계통한계가격(SMP): 해당 시간대 전력거래소(KPX)에서 거래되는 1kWh당 전력 도매가격입니다.'
          : 'System Marginal Price: wholesale electricity clearing price per kWh for this hour.',
    },
    {
      id: 'csv-avg-smp',
      label:
        csvKind === 'daily-hourly'
          ? locale === 'ko'
            ? '선택일 평균 SMP (CSV)'
            : 'Selected Day Avg SMP'
          : locale === 'ko'
          ? `KPX 월평균 SMP (${activeMonthRow?.period ?? '2026/09'})`
          : `KPX Monthly Avg (${activeMonthRow?.period ?? '2026/09'})`,
      value:
        csvKind === 'daily-hourly'
          ? formatSmp(dailyStats.avg)
          : activeMonthRow
          ? formatSmp(region === 'mainland' ? activeMonthRow.mainland : activeMonthRow.jeju)
          : formatSmp(dailyStats.avg),
      unit: locale === 'ko' ? '원/kWh' : 'KRW/kWh',
      delta: `${(csvKind === 'daily-hourly' ? dailyStats.avgDeltaPct : monthMomDelta) >= 0 ? '+' : ''}${(
        csvKind === 'daily-hourly' ? dailyStats.avgDeltaPct : monthMomDelta
      ).toFixed(1)}%`,
      isUp: (csvKind === 'daily-hourly' ? dailyStats.avgDeltaPct : monthMomDelta) >= 0,
      subtext:
        csvKind === 'daily-hourly'
          ? locale === 'ko'
            ? `일중 변동폭 ${(dailyStats.max - dailyStats.min).toFixed(1)} 원/kWh`
            : `Spread ${(dailyStats.max - dailyStats.min).toFixed(1)} KRW/kWh`
          : locale === 'ko'
          ? `전월(${prevMonthRow?.period ?? '-'}) 대비`
          : `vs prev month (${prevMonthRow?.period ?? '-'})`,
      tooltip:
        locale === 'ko'
          ? '첨부된 한국전력거래소(KPX) CSV 파일에서 직접 산출된 평균 SMP 단가입니다.'
          : 'Average SMP directly parsed from the connected KPX CSV dataset.',
    },
    {
      id: 'spot-rec',
      label: locale === 'ko' ? 'REC 현물 종가' : 'Spot REC Price',
      value: formatKrw(latestRec.closingPrice),
      unit: locale === 'ko' ? '원/REC' : 'KRW/REC',
      delta: `${latestRec.changePct >= 0 ? '+' : ''}${latestRec.changePct.toFixed(1)}%`,
      isUp: latestRec.changePct >= 0,
      subtext:
        locale === 'ko'
          ? `${latestRec.dayOfWeek}요일 장 · 거래량 ${formatKrw(latestRec.volumeRec)} REC`
          : `${latestRec.dayOfWeek} session · ${formatKrw(latestRec.volumeRec)} REC`,
      tooltip:
        locale === 'ko'
          ? '신재생에너지 공급인증서(REC): 신재생 발전량 1MWh(1,000kWh)에 가중치를 곱해 발급·거래되는 증서입니다.'
          : '1 REC equals 1 MWh (1,000 kWh) of verified renewable generation multiplied by weighting.',
    },
    {
      id: 'peak-hour',
      label: locale === 'ko' ? '금일 최고 피크 단가' : 'Peak Demand Rate',
      value: formatSmp(dailyStats.max),
      unit: locale === 'ko' ? '원/kWh' : 'KRW/kWh',
      delta: dailyStats.peakPoint?.label ?? '18시',
      isUp: true,
      isTimeNote: true,
      subtext:
        locale === 'ko'
          ? `최대 수요 ${dailyStats.peakPoint?.demandGw.toFixed(1) ?? '84.1'} GW`
          : `Peak load ${dailyStats.peakPoint?.demandGw.toFixed(1) ?? '84.1'} GW`,
      tooltip:
        locale === 'ko'
          ? '24시간 중 전력 수요가 가장 높아 최고 SMP가 형성된 시간대와 단가입니다.'
          : 'Highest clearing rate in the 24-hour schedule, driven by peak commercial/evening demand.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Connected CSV Data Banner / Selector */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl px-5 py-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 text-[13px] min-w-0">
          <FileSpreadsheet className="w-4 h-4 text-[#FF6B00] shrink-0" />
          <span className="font-semibold text-[#0F172A]">
            {locale === 'ko' ? '연결된 KPX CSV:' : 'Connected CSV:'}
          </span>
          <span className="font-mono text-[12px] text-[#0F172A] truncate max-w-[260px]" title={csvFileName}>
            {csvFileName}
          </span>
          <span aria-hidden="true" className="text-[#CBD5E1]">·</span>
          <span className="text-[12px] text-[#64748B] font-mono">
            {csvKind === 'daily-hourly'
              ? locale === 'ko'
                ? `일별 시간별(1시~24시) ${dailyCsvRows.length}일`
                : `Daily Hourly ${dailyCsvRows.length} days`
              : locale === 'ko'
              ? `월별 실데이터 ${monthlyCsvRows.length}개월 (2001/04–2026/09)`
              : `Monthly KPX ${monthlyCsvRows.length} months`}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {csvKind === 'daily-hourly' && dailyCsvRows.length > 0 && (
            <label className="inline-flex items-center gap-2 text-[12px] font-medium text-[#64748B]">
              <span>{locale === 'ko' ? '날짜 선택' : 'Date'}</span>
              <select
                value={selectedDailyDate}
                onChange={(e) => onSelectDailyDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] font-mono text-[12px] text-[#0F172A] focus:border-[#FF6B00] focus:outline-none"
              >
                {dailyCsvRows.map((r) => (
                  <option key={r.date} value={r.date}>
                    {r.date} (평균 {r.avg.toFixed(1)}원)
                  </option>
                ))}
              </select>
            </label>
          )}

          {csvKind === 'monthly-kpx' && monthlyCsvRows.length > 0 && (
            <label className="inline-flex items-center gap-2 text-[12px] font-medium text-[#64748B]">
              <span>{locale === 'ko' ? '기준 월' : 'Month'}</span>
              <select
                value={selectedMonthPeriod}
                onChange={(e) => onSelectMonthPeriod(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] font-mono text-[12px] text-[#0F172A] focus:border-[#FF6B00] focus:outline-none"
              >
                {monthlyCsvRows.slice(0, 48).map((r) => (
                  <option key={r.period} value={r.period}>
                    {r.period} (육지 {r.mainland.toFixed(2)}원)
                  </option>
                ))}
              </select>
            </label>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUploadCsvFile(f);
              e.target.value = '';
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0] transition-colors whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5 text-[#FF6B00]" />
            <span>{locale === 'ko' ? '시간별 CSV 연결 (날짜·1~24시)' : 'Load Hourly CSV'}</span>
          </button>

          {csvKind === 'daily-hourly' && (
            <button
              type="button"
              onClick={onResetToAttachedCsv}
              className="px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors whitespace-nowrap"
            >
              {locale === 'ko' ? '기본 CSV 복원' : 'Reset'}
            </button>
          )}
        </div>
      </div>

      {/* Workspace Control Strip (Region, Timeframe, Language, Refresh) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Region Switcher */}
          <div
            role="group"
            aria-label="전력시장 권역"
            className="inline-flex items-center p-1 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0]"
          >
            <button
              type="button"
              onClick={() => onChangeRegion('mainland')}
              className={`px-3.5 py-1.5 rounded-md text-[13px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                region === 'mainland'
                  ? 'bg-[#FFFFFF] text-[#0F172A] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              {locale === 'ko' ? '육지 (Mainland)' : 'Mainland'}
            </button>
            <button
              type="button"
              onClick={() => onChangeRegion('jeju')}
              className={`px-3.5 py-1.5 rounded-md text-[13px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                region === 'jeju'
                  ? 'bg-[#FFFFFF] text-[#0F172A] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              {locale === 'ko' ? '제주 (Jeju)' : 'Jeju'}
            </button>
          </div>

          {/* Timeframe Switcher */}
          <div
            role="group"
            aria-label="조회 기간"
            className="inline-flex items-center p-1 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0]"
          >
            {(
              [
                { id: '24h', ko: '시간별 (1~24시)', en: '24h' },
                { id: '7d', ko: '7일', en: '7 Days' },
                { id: '30d', ko: '30일', en: '30 Days' },
                { id: '12m', ko: '월별 추이 (24개월)', en: '24M Monthly' },
              ] as const
            ).map((tf) => (
              <button
                key={tf.id}
                type="button"
                onClick={() => onChangeTimeframe(tf.id)}
                className={`px-3 py-1.5 rounded-md text-[13px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  timeframe === tf.id
                    ? 'bg-[#FFFFFF] text-[#0F172A] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                {locale === 'ko' ? tf.ko : tf.en}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[12px] text-[#64748B] hidden sm:flex items-center gap-2 font-mono">
            <span>KPX 한국전력거래소</span>
            <span aria-hidden="true">·</span>
            <span>단위: 원/kWh</span>
          </div>

          <button
            type="button"
            onClick={() => onChangeLocale(locale === 'ko' ? 'en' : 'ko')}
            className="px-3 py-1.5 rounded-lg text-[12px] font-mono font-semibold bg-[#FFFFFF] border border-[#CBD5E1] text-[#0F172A] hover:bg-[#F8FAFC] transition-colors whitespace-nowrap shrink-0"
          >
            {locale === 'ko' ? '한국어 / EN' : 'EN / 한국어'}
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            aria-label="데이터 새로고침"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#FF6B00]' : ''}`} />
            <span>{locale === 'ko' ? '새로고침' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {/* 4-Column KPI Strip */}
      <section aria-label="핵심 전력시장 지표" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {kpiCards.map((card) => (
          <div
            key={card.id}
            className="relative bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-medium text-[#64748B] tracking-tight">
                {card.label}
              </span>
              <button
                type="button"
                onClick={() => setOpenTooltip(openTooltip === card.id ? null : card.id)}
                aria-label={`${card.label} 설명 보기`}
                className="text-[#94A3B8] hover:text-[#0F172A] transition-colors rounded"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>

            {openTooltip === card.id && (
              <div className="mt-2 p-2.5 rounded-lg bg-[#0F172A] text-[#FFFFFF] text-[12px] leading-relaxed">
                {card.tooltip}
              </div>
            )}

            <div className="mt-3 flex items-baseline gap-2 flex-wrap">
              <span className="font-mono text-[32px] leading-[38px] font-semibold tracking-[-0.03em] text-[#0F172A] tabular-nums">
                {card.value}
              </span>
              <span className="text-[12px] font-mono text-[#64748B]">{card.unit}</span>
            </div>

            <div className="mt-3 pt-3 border-t border-[#F1F5F9] flex items-center justify-between gap-2 text-[12px]">
              <span className="text-[#64748B] truncate">{card.subtext}</span>
              {card.isTimeNote ? (
                <span className="font-mono font-semibold text-[#C2410C] whitespace-nowrap shrink-0">
                  {card.delta}
                </span>
              ) : (
                <span
                  className={`inline-flex items-center gap-1 font-mono font-semibold whitespace-nowrap shrink-0 ${
                    card.isUp ? 'text-[#DC2626]' : 'text-[#059669]'
                  }`}
                >
                  {card.isUp ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  <span>{card.delta}</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Primary Focal Anchor: Interactive Multi-Hour SMP Telemetry Curve */}
      <section className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#F1F5F9]">
          <div>
            <h2 className="text-[20px] font-semibold text-[#0F172A] tracking-tight">
              {timeframe === '24h'
                ? locale === 'ko'
                  ? '시간별 SMP 가격 추이 (1시 ~ 24시)'
                  : 'Hourly SMP Price Curve (1h – 24h)'
                : timeframe === '12m'
                ? locale === 'ko'
                  ? 'KPX 월별 SMP 추이 (최근 24개월 실데이터)'
                  : 'KPX 24-Month SMP Trend (CSV)'
                : timeframe === '7d'
                ? locale === 'ko'
                  ? '최근 7일 일평균 SMP 추이'
                  : '7-Day Daily Average SMP'
                : locale === 'ko'
                ? '최근 30일 일평균 SMP 추이'
                : '30-Day Daily Average SMP'}
            </h2>
            <p className="mt-1 text-[13px] text-[#64748B]">
              {locale === 'ko'
                ? '차트 위로 마우스를 이동하여 시간대별 SMP 단가(원/kWh), 전력수요(GW), 피크·경부하 격차를 확인하세요.'
                : 'Hover across the curve to inspect SMP rates (KRW/kWh), demand GW, and peak/valley spreads.'}
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <label className="inline-flex items-center gap-2 text-[13px] font-medium text-[#0F172A] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showComparison}
                onChange={(e) => setShowComparison(e.target.checked)}
                className="w-[18px] h-[18px] rounded-[4px] accent-[#FF6B00] border-[#CBD5E1] cursor-pointer"
              />
              <span className="whitespace-nowrap">
                {timeframe === '24h'
                  ? locale === 'ko'
                    ? '전일 비교선'
                    : 'Compare Yesterday'
                  : timeframe === '12m'
                  ? locale === 'ko'
                    ? '타 권역 비교선'
                    : 'Compare Region'
                  : locale === 'ko'
                  ? '일 최저선 표시'
                  : 'Show Daily Low'}
              </span>
            </label>
          </div>
        </div>

        <div className="mt-5">
          {isRefreshing ? (
            <div className="h-[310px] w-full rounded-lg bg-[#F1F5F9] animate-pulse" />
          ) : (
            <SmpTelemetryChart
              hourlyData={hourlyData}
              multiDayData={MULTI_DAY_30D}
              monthlyCsvRows={monthlyCsvRows}
              dailyCsvRows={dailyCsvRows}
              region={region}
              timeframe={timeframe}
              showComparison={showComparison}
              locale={locale}
            />
          )}
        </div>
      </section>

      {/* Secondary 12-Col Analytics Row: Hourly Settlement Schedule (7) + Quick Estimator (5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-7 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F1F5F9]">
            <div>
              <h2 className="text-[18px] font-semibold text-[#0F172A]">
                {locale === 'ko' ? '시간대별 SMP 정산 단가표 (1시~24시)' : 'Hourly Settlement Schedule'}
              </h2>
              <p className="mt-0.5 text-[12px] text-[#64748B]">
                {locale === 'ko'
                  ? `${filteredHours.length}개 시간대 · ${region === 'mainland' ? '육지' : '제주'} 계통 · 단위: 원/kWh`
                  : `${filteredHours.length} hourly blocks · ${region === 'mainland' ? 'Mainland' : 'Jeju'} Grid`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={hourQuery}
                  onChange={(e) => setHourQuery(e.target.value)}
                  placeholder={locale === 'ko' ? '시간 검색 (예: 18시)' : 'Filter hour (e.g. 18)'}
                  className="pl-8 pr-3 py-1.5 w-40 rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#FF6B00] focus:outline-none"
                />
              </div>

              <div className="inline-flex items-center p-0.5 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0]">
                {(
                  [
                    { id: 'all', ko: '전체', en: 'All' },
                    { id: 'peak', ko: '피크', en: 'Peak' },
                    { id: 'off-peak', ko: '경부하', en: 'Off-Peak' },
                  ] as const
                ).map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBandFilter(b.id)}
                    className={`px-2.5 py-1 rounded-md text-[12px] font-semibold transition-colors whitespace-nowrap ${
                      bandFilter === b.id
                        ? 'bg-[#FFFFFF] text-[#0F172A]'
                        : 'text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    {locale === 'ko' ? b.ko : b.en}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredHours.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[14px] font-medium text-[#0F172A]">
                {locale === 'ko' ? '조건에 맞는 시간대가 없습니다.' : 'No matching hourly blocks found.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setBandFilter('all');
                  setHourQuery('');
                }}
                className="mt-3 px-4 py-2 rounded-lg text-[13px] font-semibold bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0] transition-colors"
              >
                {locale === 'ko' ? '필터 초기화' : 'Reset Filters'}
              </button>
            </div>
          ) : (
            <div className="mt-2 overflow-x-auto max-h-[380px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#FFFFFF] border-b border-[#E2E8F0] text-[11px] font-mono uppercase tracking-[0.04em] text-[#64748B]">
                  <tr>
                    <th className="py-2.5 pr-3 font-semibold">{locale === 'ko' ? '시간' : 'Hour'}</th>
                    <th className="py-2.5 px-3 font-semibold">{locale === 'ko' ? '부하 구분' : 'Load Band'}</th>
                    <th className="py-2.5 px-3 font-semibold text-right">{locale === 'ko' ? '수요' : 'Demand'}</th>
                    <th className="py-2.5 px-3 font-semibold text-right">{locale === 'ko' ? 'SMP 단가' : 'SMP'}</th>
                    <th className="py-2.5 pl-3 font-semibold text-right">{locale === 'ko' ? '전일 대비' : 'vs Prev'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] text-[13px]">
                  {filteredHours.map((row) => {
                    const price = getHourlyPrice(row, region);
                    const prev = getYesterdayPrice(row, region);
                    const diff = price - prev;
                    const isPeak = row.band === 'peak';
                    const isValley = row.band === 'off-peak';
                    return (
                      <tr
                        key={row.hour}
                        className={`h-[38px] hover:bg-[#F8FAFC] transition-colors ${
                          row.hour === currentHourIndex ? 'bg-[#FFF7ED]/70' : ''
                        }`}
                      >
                        <td className="py-2 pr-3 font-mono font-medium text-[#0F172A] tabular-nums whitespace-nowrap">
                          {row.label}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span
                            className={`text-[12px] font-medium ${
                              isPeak
                                ? 'text-[#C2410C]'
                                : isValley
                                ? 'text-[#059669]'
                                : 'text-[#64748B]'
                            }`}
                          >
                            {isPeak
                              ? locale === 'ko'
                                ? '최대부하'
                                : 'Peak'
                              : isValley
                              ? locale === 'ko'
                                ? '경부하'
                                : 'Off-Peak'
                              : locale === 'ko'
                              ? '중간부하'
                              : 'Mid-Load'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-[#64748B] tabular-nums">
                          {row.demandGw.toFixed(1)} GW
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-[#0F172A] tabular-nums">
                          {price.toFixed(2)} 원
                        </td>
                        <td
                          className={`py-2 pl-3 text-right font-mono font-medium tabular-nums whitespace-nowrap ${
                            diff >= 0 ? 'text-[#DC2626]' : 'text-[#059669]'
                          }`}
                        >
                          {diff >= 0 ? `▲ +${diff.toFixed(1)}` : `▼ ${diff.toFixed(1)}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 5 Columns: Quick Generator Revenue Estimator */}
        <section className="lg:col-span-5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="pb-4 border-b border-[#F1F5F9]">
            <h2 className="text-[18px] font-semibold text-[#0F172A]">
              {locale === 'ko' ? '간편 태양광 수익 계산기' : 'Quick Solar Revenue Estimator'}
            </h2>
            <p className="mt-1 text-[13px] text-[#64748B]">
              {locale === 'ko'
                ? '연결된 CSV 평균 SMP와 최근 REC 종가 기준으로 월 예상 수익을 계산합니다.'
                : 'Estimate monthly SMP + REC earnings using connected CSV clearing rates.'}
            </p>
          </div>

          <div className="mt-5 space-y-5">
            <div>
              <div className="flex items-center justify-between text-[13px]">
                <label htmlFor="quick-capacity" className="font-medium text-[#0F172A]">
                  {locale === 'ko' ? '설치 용량' : 'Installed Capacity'}
                </label>
                <span className="font-mono font-semibold text-[#FF6B00] tabular-nums">
                  {quickCapacityKw} kW
                </span>
              </div>
              <input
                id="quick-capacity"
                type="range"
                min={10}
                max={1000}
                step={10}
                value={quickCapacityKw}
                onChange={(e) => setQuickCapacityKw(Number(e.target.value))}
                className="mt-2 w-full accent-[#FF6B00] cursor-pointer"
              />
              <div className="mt-1 flex justify-between text-[11px] font-mono text-[#94A3B8]">
                <span>10 kW</span>
                <span>500 kW</span>
                <span>1,000 kW</span>
              </div>
            </div>

            <div>
              <span className="block text-[13px] font-medium text-[#0F172A] mb-2">
                {locale === 'ko' ? 'REC 가중치' : 'REC Weighting Factor'}
              </span>
              <div className="grid grid-cols-3 gap-2">
                {([1.0, 1.2, 1.5] as const).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setQuickRecWeight(w)}
                    className={`py-2 px-3 rounded-lg text-[13px] font-mono font-semibold border transition-colors ${
                      quickRecWeight === w
                        ? 'bg-[#0F172A] text-[#FFFFFF] border-[#0F172A]'
                        : 'bg-[#FFFFFF] text-[#0F172A] border-[#E2E8F0] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {w.toFixed(1)}배
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#F1F5F9] space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] font-medium text-[#64748B]">
                  {locale === 'ko' ? '월 예상 총수익' : 'Est. Monthly Total'}
                </span>
                <div className="text-right">
                  <span className="font-mono text-[26px] font-semibold text-[#0F172A] tabular-nums">
                    {formatKrw(quickMonthlyEstimate.totalRev)}
                  </span>
                  <span className="ml-1.5 text-[12px] font-mono text-[#64748B]">원</span>
                </div>
              </div>

              <div className="space-y-2 text-[13px]">
                <div className="flex items-center justify-between text-[#64748B]">
                  <span>{locale === 'ko' ? 'SMP 전력 판매 수익' : 'SMP Settlement'}</span>
                  <span className="font-mono font-medium text-[#0F172A] tabular-nums">
                    {formatKrw(quickMonthlyEstimate.smpRev)} 원
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#64748B]">
                  <span>{locale === 'ko' ? 'REC 인증서 판매 수익' : 'REC Sales'}</span>
                  <span className="font-mono font-medium text-[#0F172A] tabular-nums">
                    {formatKrw(quickMonthlyEstimate.recRev)} 원
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#64748B]">
                  <span>{locale === 'ko' ? '월 예상 발전량' : 'Est. Monthly Output'}</span>
                  <span className="font-mono font-medium text-[#0F172A] tabular-nums">
                    {formatKrw(quickMonthlyEstimate.monthlyKwh)} kWh
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('simulator')}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-[14px] font-semibold bg-[#FF6B00] text-[#FFFFFF] hover:bg-[#F97316] transition-colors"
            >
              <span>{locale === 'ko' ? '상세 수익 시뮬레이터 열기' : 'Open Full Simulator'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>

      {/* Real-Time Power Supply & Demand API Section */}
      <RealtimeSupplyDemandSection region={region} locale={locale} />
    </div>
  );
};
