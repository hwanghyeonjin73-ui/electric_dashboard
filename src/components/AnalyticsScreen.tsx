import React, { useMemo, useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import {
  REC_AUCTIONS,
  buildWeeklyHeatmap,
  formatKrw,
} from '../data/marketData';
import {
  HourlySmpPoint,
  LocaleId,
  MonthlySmpCsvRow,
  RegionId,
} from '../types/market';

interface AnalyticsScreenProps {
  region: RegionId;
  onChangeRegion: (r: RegionId) => void;
  locale: LocaleId;
  hourlyData: HourlySmpPoint[];
  monthlyCsvRows: MonthlySmpCsvRow[];
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({
  region,
  onChangeRegion,
  locale,
  hourlyData,
  monthlyCsvRows,
}) => {
  const [hoveredCell, setHoveredCell] = useState<{
    day: string;
    hour: number;
    value: number;
  } | null>(null);
  const [monthlyRange, setMonthlyRange] = useState<12 | 24 | 60>(24);

  const spreadStats = useMemo(() => {
    const spreads = hourlyData.map((p) => p.smpJeju - p.smpMainland);
    const avgSpread = spreads.reduce((a, b) => a + b, 0) / (spreads.length || 1);
    const maxSpread = Math.max(...spreads);
    return { avgSpread, maxSpread };
  }, [hourlyData]);

  const recentMonthsAsc = useMemo(() => {
    return [...monthlyCsvRows].slice(0, monthlyRange).reverse();
  }, [monthlyCsvRows, monthlyRange]);

  const { chartMin, chartMax } = useMemo(() => {
    const vals = recentMonthsAsc.flatMap((m) => [m.mainland, m.jeju]);
    if (vals.length === 0) return { chartMin: 60, chartMax: 220 };
    const min = Math.max(0, Math.floor((Math.min(...vals) - 10) / 10) * 10);
    const max = Math.ceil((Math.max(...vals) + 10) / 10) * 10;
    return { chartMin: min, chartMax: max };
  }, [recentMonthsAsc]);

  const heatmapData = useMemo(
    () => buildWeeklyHeatmap(hourlyData, region),
    [hourlyData, region]
  );

  const { minHeat, maxHeat } = useMemo(() => {
    const all = heatmapData.flatMap((r) => r.hours);
    return { minHeat: Math.min(...all), maxHeat: Math.max(...all) };
  }, [heatmapData]);

  const getCellStyle = (val: number) => {
    const ratio = (val - minHeat) / (maxHeat - minHeat || 1);
    if (ratio < 0.25) return { backgroundColor: '#ECFDF5', color: '#065F46' };
    if (ratio < 0.5) return { backgroundColor: '#F1F5F9', color: '#334155' };
    if (ratio < 0.72) return { backgroundColor: '#FFEDD5', color: '#9A3412' };
    if (ratio < 0.88) return { backgroundColor: '#FB923C', color: '#FFFFFF' };
    return { backgroundColor: '#FF6B00', color: '#FFFFFF' };
  };

  const maxRec = Math.max(...REC_AUCTIONS.map((r) => r.closingPrice));
  const minRec = Math.min(...REC_AUCTIONS.map((r) => r.closingPrice)) - 2000;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-bold tracking-tight text-[#0F172A]">
            {locale === 'ko' ? 'SMP 권역 격차 및 REC 현물 분석' : 'SMP Spread & REC Spot Analytics'}
          </h2>
          <p className="mt-1 text-[14px] text-[#64748B]">
            {locale === 'ko'
              ? '첨부된 KPX CSV 월별 추이와 육지·제주 계통 격차, 주간 24시간 히트맵을 확인합니다.'
              : 'Inspect KPX CSV monthly history, Mainland vs. Jeju spread, and 24×7 hourly seasonality.'}
          </p>
        </div>

        <div className="inline-flex items-center p-1 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0]">
          <button
            type="button"
            onClick={() => onChangeRegion('mainland')}
            className={`px-3.5 py-1.5 rounded-md text-[13px] font-semibold transition-colors ${
              region === 'mainland' ? 'bg-[#FFFFFF] text-[#0F172A]' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {locale === 'ko' ? '육지' : 'Mainland'}
          </button>
          <button
            type="button"
            onClick={() => onChangeRegion('jeju')}
            className={`px-3.5 py-1.5 rounded-md text-[13px] font-semibold transition-colors ${
              region === 'jeju' ? 'bg-[#FFFFFF] text-[#0F172A]' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {locale === 'ko' ? '제주' : 'Jeju'}
          </button>
        </div>
      </div>

      {/* Dual Comparison Grid: Real KPX CSV Monthly Mainland vs Jeju + REC Spot Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#F1F5F9]">
            <div>
              <h3 className="text-[18px] font-semibold text-[#0F172A]">
                {locale === 'ko'
                  ? '육지 vs 제주 월별 SMP 비교 (KPX CSV 실데이터)'
                  : 'Mainland vs. Jeju Monthly SMP (KPX CSV)'}
              </h3>
              <p className="mt-0.5 text-[13px] text-[#64748B]">
                {locale === 'ko'
                  ? `시간대별 평균 격차 ${spreadStats.avgSpread >= 0 ? '+' : ''}${spreadStats.avgSpread.toFixed(1)} 원/kWh`
                  : `Hourly spread ${spreadStats.avgSpread.toFixed(1)} KRW/kWh`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="inline-flex items-center p-0.5 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0]">
                {([12, 24, 60] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMonthlyRange(m)}
                    className={`px-2.5 py-1 rounded-md text-[12px] font-mono font-semibold transition-colors ${
                      monthlyRange === m
                        ? 'bg-[#FFFFFF] text-[#0F172A]'
                        : 'text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    {m}개월
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-5 text-[12px] font-mono">
            <span className="inline-flex items-center gap-1.5 text-[#0F172A]">
              <span className="w-3 h-0.5 bg-[#0F172A] inline-block" />
              {locale === 'ko' ? '육지 SMP' : 'Mainland'}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#FF6B00]">
              <span className="w-3 h-0.5 bg-[#FF6B00] inline-block" />
              {locale === 'ko' ? '제주 SMP' : 'Jeju'}
            </span>
          </div>

          <div className="mt-3">
            {recentMonthsAsc.length > 1 ? (
              <svg viewBox="0 0 640 230" className="w-full h-[220px]" role="img" aria-label="육지 제주 월별 SMP 비교">
                {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
                  const val = Math.round(chartMin + (chartMax - chartMin) * r);
                  const y = 200 - r * 175;
                  return (
                    <g key={i}>
                      <line x1={44} y1={y} x2={624} y2={y} stroke="#F1F5F9" strokeWidth="1" />
                      <text x={36} y={y + 4} textAnchor="end" className="fill-[#64748B] text-[10px] font-mono">
                        {val}
                      </text>
                    </g>
                  );
                })}

                <path
                  d={recentMonthsAsc
                    .map((m, i) => {
                      const x = 44 + (i / (recentMonthsAsc.length - 1)) * 580;
                      const y = 200 - ((m.mainland - chartMin) / (chartMax - chartMin || 1)) * 175;
                      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#0F172A"
                  strokeWidth="2.2"
                />

                <path
                  d={recentMonthsAsc
                    .map((m, i) => {
                      const x = 44 + (i / (recentMonthsAsc.length - 1)) * 580;
                      const y = 200 - ((m.jeju - chartMin) / (chartMax - chartMin || 1)) * 175;
                      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#FF6B00"
                  strokeWidth="2.5"
                />

                {[0, Math.floor(recentMonthsAsc.length / 2), recentMonthsAsc.length - 1].map((idx) => {
                  const item = recentMonthsAsc[idx];
                  if (!item) return null;
                  const x = 44 + (idx / (recentMonthsAsc.length - 1)) * 580;
                  return (
                    <text key={item.period} x={x} y={220} textAnchor="middle" className="fill-[#64748B] text-[10px] font-mono">
                      {item.period}
                    </text>
                  );
                })}
              </svg>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-[13px] text-[#64748B]">
                월별 데이터를 불러오는 중입니다...
              </div>
            )}
          </div>
        </section>

        {/* REC Spot Auction History */}
        <section className="lg:col-span-5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="pb-4 border-b border-[#F1F5F9]">
            <h3 className="text-[18px] font-semibold text-[#0F172A]">
              {locale === 'ko' ? 'REC 현물시장 최근 거래' : 'REC Spot Market Sessions'}
            </h3>
            <p className="mt-0.5 text-[13px] text-[#64748B]">
              {locale === 'ko'
                ? '매주 화·목요일 개장 종가 및 거래량 (원/REC)'
                : 'KPX bi-weekly auctions (Tue & Thu)'}
            </p>
          </div>

          <div className="mt-4 space-y-2.5">
            {REC_AUCTIONS.map((session) => {
              const barPct = ((session.closingPrice - minRec) / (maxRec - minRec || 1)) * 100;
              return (
                <div key={session.date} className="py-2 border-b border-[#F1F5F9] last:border-none">
                  <div className="flex items-center justify-between text-[13px]">
                    <div className="flex items-center gap-2 font-mono text-[#0F172A]">
                      <span>{session.date}</span>
                      <span className="text-[#64748B]">({session.dayOfWeek})</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono tabular-nums">
                      <span className="font-semibold text-[#0F172A]">
                        {formatKrw(session.closingPrice)} 원
                      </span>
                      <span
                        className={`inline-flex items-center gap-0.5 text-[12px] font-semibold ${
                          session.changePct >= 0 ? 'text-[#DC2626]' : 'text-[#059669]'
                        }`}
                      >
                        {session.changePct >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {session.changePct >= 0 ? `+${session.changePct}%` : `${session.changePct}%`}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full bg-[#F1F5F9] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#FF6B00]"
                        style={{ width: `${Math.max(15, barPct)}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-mono text-[#64748B] tabular-nums w-24 text-right">
                      {formatKrw(session.volumeRec)} REC
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* 24x7 Hourly Heatmap Matrix */}
      <section className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F1F5F9]">
          <div>
            <h3 className="text-[18px] font-semibold text-[#0F172A]">
              {locale === 'ko' ? '주간 24시간 SMP 가격 히트맵 (1시~24시)' : 'Weekly 24×7 SMP Price Heatmap'}
            </h3>
            <p className="mt-0.5 text-[13px] text-[#64748B]">
              {locale === 'ko'
                ? '초록색은 저가 경부하 구간, 주황색은 고가 최대부하 구간을 나타냅니다. (단위: 원/kWh)'
                : 'Emerald indicates off-peak valleys; amber-orange highlights peak discharge rates.'}
            </p>
          </div>

          <div className="text-[13px] font-mono text-[#0F172A] tabular-nums">
            {hoveredCell ? (
              <span>
                {hoveredCell.day}요일 {hoveredCell.hour + 1}시 ·{' '}
                <strong className="text-[#FF6B00]">{hoveredCell.value.toFixed(1)} 원/kWh</strong>
              </span>
            ) : (
              <span className="text-[#64748B]">
                {locale === 'ko' ? '셀에 마우스를 올려 단가 확인' : 'Hover any hour cell to inspect'}
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[54px_repeat(24,minmax(0,1fr))] gap-1 mb-1.5">
              <div />
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="text-center text-[10px] font-mono text-[#64748B] tabular-nums">
                  {h + 1}시
                </div>
              ))}
            </div>

            <div className="space-y-1">
              {heatmapData.map((row) => (
                <div
                  key={row.day}
                  className="grid grid-cols-[54px_repeat(24,minmax(0,1fr))] gap-1 items-center"
                >
                  <div className="text-[12px] font-semibold text-[#0F172A]">
                    {locale === 'ko' ? `${row.dayKo}요일` : row.day}
                  </div>
                  {row.hours.map((val, hIdx) => {
                    const style = getCellStyle(val);
                    return (
                      <button
                        key={hIdx}
                        type="button"
                        onMouseEnter={() =>
                          setHoveredCell({
                            day: locale === 'ko' ? row.dayKo : row.day,
                            hour: hIdx,
                            value: val,
                          })
                        }
                        onFocus={() =>
                          setHoveredCell({
                            day: locale === 'ko' ? row.dayKo : row.day,
                            hour: hIdx,
                            value: val,
                          })
                        }
                        style={style}
                        className="h-8 rounded-[4px] font-mono text-[10px] font-medium tabular-nums flex items-center justify-center transition-transform hover:scale-105"
                        title={`${row.dayKo}요일 ${hIdx + 1}시 — ${val} 원/kWh`}
                      >
                        {Math.round(val)}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* KPX Attached CSV Monthly Data Table */}
      {monthlyCsvRows.length > 0 && (
        <section className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="pb-4 border-b border-[#F1F5F9]">
            <h3 className="text-[18px] font-semibold text-[#0F172A]">
              {locale === 'ko' ? 'KPX 월별 SMP 원자료 표 (최근 12개월)' : 'KPX Monthly SMP Table (Latest 12 Months)'}
            </h3>
            <p className="mt-0.5 text-[12px] text-[#64748B]">
              첨부된 CSV 파일(`HOME________________SMP_90d0ffe3.csv`)에서 불러온 실제 한국전력거래소 월평균 기록입니다.
            </p>
          </div>

          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="border-b border-[#E2E8F0] text-[11px] font-mono text-[#64748B]">
                <tr>
                  <th className="py-2.5 pr-3">기간</th>
                  <th className="py-2.5 px-3 text-right">육지 (원/kWh)</th>
                  <th className="py-2.5 px-3 text-right">제주 (원/kWh)</th>
                  <th className="py-2.5 px-3 text-right">통합 (원/kWh)</th>
                  <th className="py-2.5 pl-3 text-right">제주–육지 격차</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-[13px] font-mono tabular-nums">
                {monthlyCsvRows.slice(0, 12).map((row) => {
                  const diff = row.jeju - row.mainland;
                  return (
                    <tr key={row.period} className="h-[38px] hover:bg-[#F8FAFC]">
                      <td className="py-2 pr-3 font-semibold text-[#0F172A]">{row.period}</td>
                      <td className="py-2 px-3 text-right text-[#0F172A]">{row.mainland.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-[#FF6B00] font-medium">{row.jeju.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-[#64748B]">{row.integrated.toFixed(2)}</td>
                      <td
                        className={`py-2 pl-3 text-right ${
                          diff >= 0 ? 'text-[#DC2626]' : 'text-[#059669]'
                        }`}
                      >
                        {diff >= 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
