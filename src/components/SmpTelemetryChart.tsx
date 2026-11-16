import React, { useMemo, useRef, useState } from 'react';
import {
  DailyHourlyCsvRow,
  HourlySmpPoint,
  LocaleId,
  MonthlySmpCsvRow,
  MultiDayPoint,
  RegionId,
  TimeframeId,
} from '../types/market';
import { getHourlyPrice, getYesterdayPrice } from '../data/marketData';

interface ChartDatum {
  label: string;
  subLabel: string;
  primary: number;
  secondary?: number;
  secondaryLabel?: string;
  demandGw?: number;
}

interface SmpTelemetryChartProps {
  hourlyData: HourlySmpPoint[];
  multiDayData: MultiDayPoint[];
  monthlyCsvRows: MonthlySmpCsvRow[];
  dailyCsvRows: DailyHourlyCsvRow[];
  region: RegionId;
  timeframe: TimeframeId;
  showComparison: boolean;
  locale: LocaleId;
}

export const SmpTelemetryChart: React.FC<SmpTelemetryChartProps> = ({
  hourlyData,
  multiDayData,
  monthlyCsvRows,
  dailyCsvRows,
  region,
  timeframe,
  showComparison,
  locale,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const series: ChartDatum[] = useMemo(() => {
    if (timeframe === '24h') {
      return hourlyData.map((p) => ({
        label: p.label,
        subLabel:
          p.band === 'peak'
            ? locale === 'ko'
              ? '최대부하 시간대'
              : 'Peak Window'
            : p.band === 'off-peak'
            ? locale === 'ko'
              ? '경부하 시간대'
              : 'Off-Peak Valley'
            : locale === 'ko'
            ? '중간부하 시간대'
            : 'Mid-Load',
        primary: getHourlyPrice(p, region),
        secondary: getYesterdayPrice(p, region),
        secondaryLabel: locale === 'ko' ? '전일 동일시' : 'Yesterday',
        demandGw: p.demandGw,
      }));
    }

    if (timeframe === '12m' && monthlyCsvRows.length > 0) {
      // Chronological ascending slice of the most recent 24 months from the attached KPX CSV
      const recent = [...monthlyCsvRows].slice(0, 24).reverse();
      return recent.map((m) => ({
        label: m.period,
        subLabel: locale === 'ko' ? 'KPX 월별 평균' : 'KPX Monthly Avg',
        primary: region === 'mainland' ? m.mainland : m.jeju,
        secondary: region === 'mainland' ? m.jeju : m.mainland,
        secondaryLabel:
          region === 'mainland'
            ? locale === 'ko'
              ? '제주 평균'
              : 'Jeju Avg'
            : locale === 'ko'
            ? '육지 평균'
            : 'Mainland Avg',
      }));
    }

    // If user uploaded a daily hourly CSV with multiple dates, use those real daily averages in 7d/30d
    if (dailyCsvRows.length >= 2) {
      const sliceCount = timeframe === '7d' ? 7 : 30;
      const sliced = [...dailyCsvRows].slice(0, sliceCount).reverse();
      return sliced.map((d) => ({
        label: d.date.slice(5),
        subLabel: d.date,
        primary: d.avg,
        secondary: d.min,
        secondaryLabel: locale === 'ko' ? '일 최저' : 'Daily Low',
      }));
    }

    const sliceCount = timeframe === '7d' ? 7 : 30;
    const sliced = multiDayData.slice(-sliceCount);
    return sliced.map((d) => ({
      label: d.dateLabel,
      subLabel: d.fullDate,
      primary: region === 'mainland' ? d.avgSmpMainland : d.avgSmpJeju,
      secondary: region === 'mainland' ? d.minSmpMainland : d.minSmpJeju,
      secondaryLabel: locale === 'ko' ? '일 최저' : 'Daily Low',
      demandGw: d.demandGw,
    }));
  }, [hourlyData, multiDayData, monthlyCsvRows, dailyCsvRows, region, timeframe, locale]);

  const width = 920;
  const height = 310;
  const padLeft = 54;
  const padRight = 18;
  const padTop = 24;
  const padBottom = 38;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const { minVal, maxVal, yTicks } = useMemo(() => {
    const allVals = series.flatMap((d) =>
      showComparison && d.secondary !== undefined ? [d.primary, d.secondary] : [d.primary]
    );
    const rawMin = allVals.length ? Math.min(...allVals) : 80;
    const rawMax = allVals.length ? Math.max(...allVals) : 160;
    const minRounded = Math.max(0, Math.floor((rawMin - 8) / 10) * 10);
    const maxRounded = Math.ceil((rawMax + 8) / 10) * 10;
    const step = (maxRounded - minRounded) / 4 || 10;
    const ticks = [0, 1, 2, 3, 4].map((i) => Math.round(minRounded + step * i));
    return { minVal: minRounded, maxVal: maxRounded, yTicks: ticks };
  }, [series, showComparison]);

  const getX = (idx: number) => {
    if (series.length <= 1) return padLeft + innerW / 2;
    return padLeft + (idx / (series.length - 1)) * innerW;
  };

  const getY = (val: number) => {
    const ratio = (val - minVal) / (maxVal - minVal || 1);
    return padTop + innerH - ratio * innerH;
  };

  const primaryPath = useMemo(() => {
    return series
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(2)} ${getY(d.primary).toFixed(2)}`)
      .join(' ');
  }, [series, minVal, maxVal]);

  const areaPath = useMemo(() => {
    if (series.length === 0) return '';
    const baseLineY = padTop + innerH;
    return `${primaryPath} L ${getX(series.length - 1).toFixed(2)} ${baseLineY} L ${getX(0).toFixed(2)} ${baseLineY} Z`;
  }, [primaryPath, series.length, innerH]);

  const secondaryPath = useMemo(() => {
    if (!showComparison) return '';
    return series
      .map((d, i) =>
        d.secondary !== undefined
          ? `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(2)} ${getY(d.secondary).toFixed(2)}`
          : ''
      )
      .join(' ');
  }, [series, showComparison, minVal, maxVal]);

  const safeActiveIdx =
    hoverIndex !== null
      ? Math.min(hoverIndex, Math.max(0, series.length - 1))
      : timeframe === '24h'
      ? Math.min(13, Math.max(0, series.length - 1))
      : Math.max(0, series.length - 1);

  const activeDatum = series[safeActiveIdx];
  const activeX = getX(safeActiveIdx);
  const activeY = activeDatum ? getY(activeDatum.primary) : padTop;

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (series.length <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    const clamped = Math.max(padLeft, Math.min(width - padRight, relX));
    const idx = Math.round(((clamped - padLeft) / innerW) * (series.length - 1));
    setHoverIndex(Math.max(0, Math.min(series.length - 1, idx)));
  };

  const xLabelIndices = useMemo(() => {
    if (series.length <= 8) return series.map((_, i) => i);
    const step = Math.max(1, Math.floor((series.length - 1) / 6));
    const indices: number[] = [];
    for (let i = 0; i < series.length; i += step) indices.push(i);
    if (indices[indices.length - 1] !== series.length - 1) {
      indices.push(series.length - 1);
    }
    return indices;
  }, [series]);

  // Highlight evening peak window (16시 - 20시 -> idx 15..19) on 24h view
  const peakStartX = timeframe === '24h' && series.length === 24 ? getX(15) : null;
  const peakEndX = timeframe === '24h' && series.length === 24 ? getX(19) : null;

  if (!activeDatum) return null;

  return (
    <div ref={containerRef} className="relative w-full select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-[270px] sm:h-[310px] overflow-visible touch-pan-y"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
        role="img"
        aria-label="SMP 단가 추이 차트"
      >
        <defs>
          <linearGradient id="gridpulseSmpGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#FF6B00" stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {peakStartX !== null && peakEndX !== null && (
          <g>
            <rect
              x={peakStartX}
              y={padTop}
              width={peakEndX - peakStartX}
              height={innerH}
              fill="#FFF7ED"
              opacity={0.75}
            />
            <text
              x={(peakStartX + peakEndX) / 2}
              y={padTop + 14}
              textAnchor="middle"
              className="fill-[#C2410C] text-[10px] font-mono font-semibold"
            >
              {locale === 'ko' ? '최대부하 16시–20시' : 'PEAK 16:00–20:00'}
            </text>
          </g>
        )}

        {/* Horizontal gridlines only (#F1F5F9), zero vertical gridlines */}
        {yTicks.map((tick) => {
          const y = getY(tick);
          return (
            <g key={tick}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="#F1F5F9"
                strokeWidth="1.25"
              />
              <text
                x={padLeft - 10}
                y={y + 4}
                textAnchor="end"
                className="fill-[#64748B] text-[11px] font-mono tabular-nums"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {series.length > 1 && <path d={areaPath} fill="url(#gridpulseSmpGradient)" />}

        {showComparison && secondaryPath && series.length > 1 && (
          <path
            d={secondaryPath}
            fill="none"
            stroke="#64748B"
            strokeWidth="1.75"
            strokeDasharray="4 4"
            opacity={0.75}
          />
        )}

        {series.length > 1 && (
          <path
            d={primaryPath}
            fill="none"
            stroke="#FF6B00"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {xLabelIndices.map((idx) => {
          const item = series[idx];
          if (!item) return null;
          return (
            <text
              key={`${item.label}-${idx}`}
              x={getX(idx)}
              y={height - 10}
              textAnchor="middle"
              className="fill-[#64748B] text-[11px] font-mono tabular-nums"
            >
              {item.label}
            </text>
          );
        })}

        <line
          x1={activeX}
          y1={padTop}
          x2={activeX}
          y2={padTop + innerH}
          stroke="#0F172A"
          strokeWidth="1"
          strokeDasharray="3 3"
          opacity={0.45}
        />
        <circle cx={activeX} cy={activeY} r={8} fill="#FF6B00" fillOpacity={0.18} />
        <circle cx={activeX} cy={activeY} r={4.5} fill="#FF6B00" stroke="#FFFFFF" strokeWidth="2" />
      </svg>

      {/* Dark Navy Crosshair Overlay Tooltip (#0F172A with #FFFFFF mono rows) */}
      <div
        className="pointer-events-none absolute top-2 z-10 rounded-lg bg-[#0F172A] text-[#FFFFFF] px-3.5 py-2.5 shadow-[0_12px_24px_-4px_rgba(15,23,42,0.22)] transition-transform duration-100"
        style={{
          left:
            safeActiveIdx > series.length * 0.65
              ? 'auto'
              : `calc(${(activeX / width) * 100}% + 10px)`,
          right:
            safeActiveIdx > series.length * 0.65
              ? `calc(${((width - activeX) / width) * 100}% + 10px)`
              : 'auto',
        }}
      >
        <div className="flex items-center justify-between gap-5 text-[11px] font-mono text-[#94A3B8] border-b border-white/15 pb-1 mb-1.5">
          <span>{activeDatum.label}</span>
          <span>{activeDatum.subLabel}</span>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-1 text-[12px] font-mono tabular-nums">
          <span className="text-[#CBD5E1]">
            {timeframe === '24h'
              ? locale === 'ko'
                ? '시간별 SMP'
                : 'SMP Rate'
              : locale === 'ko'
              ? '평균 SMP'
              : 'Avg SMP'}
          </span>
          <span className="text-right font-semibold text-[#FF6B00]">
            {activeDatum.primary.toFixed(2)} 원
          </span>
          {activeDatum.demandGw !== undefined && (
            <>
              <span className="text-[#CBD5E1]">
                {locale === 'ko' ? '전력 수요' : 'Grid Demand'}
              </span>
              <span className="text-right font-medium text-[#FFFFFF]">
                {activeDatum.demandGw.toFixed(1)} GW
              </span>
            </>
          )}
          {showComparison && activeDatum.secondary !== undefined && (
            <>
              <span className="text-[#CBD5E1]">{activeDatum.secondaryLabel}</span>
              <span className="text-right text-[#E2E8F0]">
                {activeDatum.secondary.toFixed(2)} 원
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
