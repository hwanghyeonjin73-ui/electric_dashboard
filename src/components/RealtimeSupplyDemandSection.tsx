import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { LocaleId, RegionId } from '../types/market';

interface ApiItemRaw {
  [key: string]: string | number | undefined;
}

interface NormalizedSupplyDemandItem {
  date: string;
  hour: string;
  hourOrder: number;
  area: string;
  smp: number | null;
  systemDemandMw: number | null; // slfd (전국 예측수요)
  mainlandDemandMw: number | null; // mlfd (육지 예측수요)
  jejuDemandMw: number | null; // jlfd (제주 예측수요)
  regionDemandMw: number | null; // active area demand
  raw: ApiItemRaw;
}

interface ApiSuccessPayload {
  ok: true;
  endpoint: string;
  requestedDate: string;
  requestedAt: string;
  totalCount: number;
  items: ApiItemRaw[];
}

interface ApiErrorPayload {
  ok: false;
  errorCode: string;
  message: string;
  detail?: string;
  endpoint?: string;
}

interface RealtimeSupplyDemandSectionProps {
  region: RegionId;
  locale: LocaleId;
}

function getTodayKstInputDate(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(kst.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseNumeric(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(String(val).replace(/,/g, '').trim());
  return Number.isFinite(num) ? num : null;
}

function formatCompactDate(rawDate: string): string {
  const clean = rawDate.replace(/\D/g, '');
  if (clean.length === 8) {
    return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
  }
  return rawDate;
}

function normalizeItem(raw: ApiItemRaw): NormalizedSupplyDemandItem {
  const rawDate = String(
    raw.date ?? raw.tradeDay ?? raw.baseDate ?? raw.TRD_DY ?? '-'
  );
  const date = formatCompactDate(rawDate);

  const hourRaw = raw.hour ?? raw.tradeHour ?? raw.time ?? raw.TRD_HR ?? '-';
  const hourNum = parseNumeric(hourRaw);
  const hour = hourNum !== null ? `${hourNum}시` : String(hourRaw);

  const area = String(
    raw.areaName ?? raw.areaNm ?? raw.areaCd ?? raw.AREA_NM ?? '육지'
  );

  const smp = parseNumeric(raw.smp ?? raw.SMP ?? raw.landSmp ?? raw.jejuSmp);
  const systemDemandMw = parseNumeric(
    raw.slfd ?? raw.totForecastLoad ?? raw.forecastDemand ?? raw.demand
  );
  const mainlandDemandMw = parseNumeric(
    raw.mlfd ?? raw.mlndForecastLoad ?? raw.landForecastDemand
  );
  const jejuDemandMw = parseNumeric(
    raw.jlfd ?? raw.jejuForecastLoad ?? raw.jejuForecastDemand
  );

  const regionDemandMw = area.includes('제주')
    ? jejuDemandMw ?? systemDemandMw
    : mainlandDemandMw ?? systemDemandMw;

  return {
    date,
    hour,
    hourOrder: hourNum ?? 0,
    area,
    smp,
    systemDemandMw,
    mainlandDemandMw,
    jejuDemandMw,
    regionDemandMw,
    raw,
  };
}

export const RealtimeSupplyDemandSection: React.FC<RealtimeSupplyDemandSectionProps> = ({
  region,
  locale,
}) => {
  const [queryDate, setQueryDate] = useState<string>(getTodayKstInputDate);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorState, setErrorState] = useState<ApiErrorPayload | null>(null);
  const [items, setItems] = useState<NormalizedSupplyDemandItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchSupplyDemand = useCallback(async (targetDate: string) => {
    setLoading(true);
    setErrorState(null);

    try {
      const compactDate = targetDate.replace(/-/g, '');
      const res = await fetch(
        `/api/smp-forecast-demand?date=${encodeURIComponent(compactDate)}&numOfRows=48`
      );
      const data = (await res.json()) as ApiSuccessPayload | ApiErrorPayload;

      if (!res.ok || !data.ok) {
        const errPayload = !data.ok
          ? data
          : {
              ok: false as const,
              errorCode: `HTTP_${res.status}`,
              message: '실시간 전력 수급 API 요청에 실패했습니다.',
              detail: res.statusText,
            };
        setErrorState(errPayload);
        setItems([]);
        return;
      }

      const normalized = (data.items ?? [])
        .map(normalizeItem)
        .sort((a, b) => a.hourOrder - b.hourOrder);
      setItems(normalized);
      setLastUpdated(
        new Date(data.requestedAt).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    } catch (err) {
      setErrorState({
        ok: false,
        errorCode: 'NETWORK_ERROR',
        message: '서버 프록시(/api/smp-forecast-demand) 요청 중 오류가 발생했습니다.',
        detail: err instanceof Error ? err.message : String(err),
        endpoint: 'https://apis.data.go.kr/B552115/SmpWithForecastDemand',
      });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSupplyDemand(queryDate);
  }, [fetchSupplyDemand, queryDate]);

  const regionFilteredItems = useMemo(() => {
    const hasRegionLabels = items.some(
      (i) => i.area.includes('육지') || i.area.includes('제주')
    );
    if (!hasRegionLabels) return items;
    const keyword = region === 'mainland' ? '육지' : '제주';
    const matched = items.filter((i) => i.area.includes(keyword));
    return matched.length > 0 ? matched : items;
  }, [items, region]);

  const summary = useMemo(() => {
    const validRegionDemands = regionFilteredItems
      .map((i) => i.regionDemandMw)
      .filter((v): v is number => v !== null);
    const validSystemDemands = regionFilteredItems
      .map((i) => i.systemDemandMw)
      .filter((v): v is number => v !== null);
    const validSmps = regionFilteredItems
      .map((i) => i.smp)
      .filter((v): v is number => v !== null);

    // Pick KST current hour if present, otherwise latest hour in array
    const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const currentKstHour = nowKst.getUTCHours() + 1;
    const currentHourItem =
      regionFilteredItems.find((i) => i.hourOrder === currentKstHour) ??
      regionFilteredItems[regionFilteredItems.length - 1];

    const maxRegionDemand = validRegionDemands.length ? Math.max(...validRegionDemands) : null;
    const avgRegionDemand = validRegionDemands.length
      ? validRegionDemands.reduce((a, b) => a + b, 0) / validRegionDemands.length
      : null;
    const maxSystemDemand = validSystemDemands.length ? Math.max(...validSystemDemands) : null;
    const avgSmp = validSmps.length
      ? validSmps.reduce((a, b) => a + b, 0) / validSmps.length
      : null;

    return {
      currentHourItem,
      maxRegionDemand,
      avgRegionDemand,
      maxSystemDemand,
      avgSmp,
    };
  }, [regionFilteredItems]);

  return (
    <section
      aria-label="실시간 전력 수급"
      className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F1F5F9]">
        <div>
          <h2 className="text-[18px] font-semibold text-[#0F172A]">
            {locale === 'ko' ? '실시간 전력 수급' : 'Real-Time Power Supply & Demand'}
          </h2>
          <p className="mt-1 text-[12px] text-[#64748B] font-mono">
            한국전력거래소 OpenAPI (SmpWithForecastDemand)
            {lastUpdated ? ` · 최근 조회 ${lastUpdated}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <label className="inline-flex items-center gap-2 text-[12px] font-medium text-[#64748B]">
            <span>{locale === 'ko' ? '조회 일자' : 'Date'}</span>
            <input
              type="date"
              value={queryDate}
              onChange={(e) => setQueryDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] font-mono text-[12px] text-[#0F172A] focus:border-[#FF6B00] focus:outline-none"
            />
          </label>

          <button
            type="button"
            onClick={() => void fetchSupplyDemand(queryDate)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-semibold bg-[#0F172A] text-[#FFFFFF] hover:bg-[#1E293B] disabled:opacity-60 transition-colors whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{locale === 'ko' ? 'API 다시 조회' : 'Refresh API'}</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="mt-5 space-y-3">
          <div className="h-16 w-full rounded-lg bg-[#F1F5F9] animate-pulse" />
          <div className="h-36 w-full rounded-lg bg-[#F1F5F9] animate-pulse" />
        </div>
      )}

      {!loading && errorState && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-5 text-[#991B1B]"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[14px] font-bold text-[#991B1B]">
                  실시간 전력 수급 API 연동 오류
                </span>
                <span className="font-mono text-[12px] font-semibold text-[#DC2626]">
                  [{errorState.errorCode}]
                </span>
              </div>

              <p className="text-[13px] font-medium text-[#7F1D1D]">
                {errorState.message}
              </p>

              {errorState.detail && (
                <pre className="mt-2 p-3 rounded-lg bg-[#FFFFFF] border border-[#FECACA] text-[12px] font-mono text-[#0F172A] whitespace-pre-wrap break-all overflow-x-auto">
                  {errorState.detail}
                </pre>
              )}

              <div className="pt-1 flex flex-wrap items-center justify-between gap-3 text-[12px] text-[#7F1D1D]">
                <span className="font-mono truncate">
                  요청 주소: {errorState.endpoint || 'https://apis.data.go.kr/B552115/SmpWithForecastDemand'}
                </span>
                <button
                  type="button"
                  onClick={() => void fetchSupplyDemand(queryDate)}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-[#DC2626] text-[#FFFFFF] hover:bg-[#B91C1C] transition-colors shrink-0"
                >
                  다시 시도
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && !errorState && regionFilteredItems.length === 0 && (
        <div className="mt-5 py-10 text-center border-t border-[#F1F5F9]">
          <p className="text-[14px] font-medium text-[#0F172A]">
            선택한 날짜({queryDate})에 대한 실시간 전력 수급 응답 데이터가 없습니다.
          </p>
          <p className="mt-1 text-[13px] text-[#64748B]">
            공공데이터포털 API 기준 제공 일자를 선택하여 다시 조회해 보세요.
          </p>
        </div>
      )}

      {!loading && !errorState && regionFilteredItems.length > 0 && (
        <div className="mt-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-5 border-b border-[#F1F5F9]">
            <div>
              <div className="text-[12px] text-[#64748B]">
                현재 시간대 {region === 'mainland' ? '육지' : '제주'} 예측수요
              </div>
              <div className="mt-1 font-mono text-[24px] font-semibold text-[#0F172A] tabular-nums">
                {summary.currentHourItem?.regionDemandMw !== null &&
                summary.currentHourItem?.regionDemandMw !== undefined
                  ? `${summary.currentHourItem.regionDemandMw.toLocaleString()} MW`
                  : '-'}
              </div>
              <div className="mt-0.5 text-[12px] font-mono text-[#64748B]">
                {summary.currentHourItem?.date} · {summary.currentHourItem?.hour} · 전국{' '}
                {summary.currentHourItem?.systemDemandMw !== null &&
                summary.currentHourItem?.systemDemandMw !== undefined
                  ? `${summary.currentHourItem.systemDemandMw.toLocaleString()} MW`
                  : '-'}
              </div>
            </div>

            <div>
              <div className="text-[12px] text-[#64748B]">
                일중 최대 {region === 'mainland' ? '육지' : '제주'} 예측수요
              </div>
              <div className="mt-1 font-mono text-[24px] font-semibold text-[#FF6B00] tabular-nums">
                {summary.maxRegionDemand !== null
                  ? `${summary.maxRegionDemand.toLocaleString()} MW`
                  : '-'}
              </div>
              <div className="mt-0.5 text-[12px] font-mono text-[#64748B]">
                일 평균{' '}
                {summary.avgRegionDemand !== null
                  ? `${Math.round(summary.avgRegionDemand).toLocaleString()} MW`
                  : '-'}{' '}
                · 전국 최대{' '}
                {summary.maxSystemDemand !== null
                  ? `${summary.maxSystemDemand.toLocaleString()} MW`
                  : '-'}
              </div>
            </div>

            <div>
              <div className="text-[12px] text-[#64748B]">실시간 API 평균 SMP</div>
              <div className="mt-1 font-mono text-[24px] font-semibold text-[#0F172A] tabular-nums">
                {summary.avgSmp !== null ? `${summary.avgSmp.toFixed(2)} 원/kWh` : '-'}
              </div>
              <div className="mt-0.5 text-[12px] font-mono text-[#64748B]">
                {summary.currentHourItem?.area ?? (region === 'mainland' ? '육지' : '제주')} 기준{' '}
                {regionFilteredItems.length}시간 수신
              </div>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#FFFFFF] border-b border-[#E2E8F0] text-[11px] font-mono text-[#64748B]">
                <tr>
                  <th className="py-2.5 pr-3">거래일</th>
                  <th className="py-2.5 px-3">시간</th>
                  <th className="py-2.5 px-3">권역</th>
                  <th className="py-2.5 px-3 text-right">
                    {region === 'mainland' ? '육지 예측수요 (MW)' : '제주 예측수요 (MW)'}
                  </th>
                  <th className="py-2.5 px-3 text-right">전국 예측수요 (MW)</th>
                  <th className="py-2.5 pl-3 text-right">SMP (원/kWh)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-[13px] font-mono tabular-nums">
                {regionFilteredItems.map((row, idx) => (
                  <tr
                    key={`${row.date}-${row.hour}-${row.area}-${idx}`}
                    className="h-[38px] hover:bg-[#F8FAFC]"
                  >
                    <td className="py-2 pr-3 text-[#64748B] whitespace-nowrap">{row.date}</td>
                    <td className="py-2 px-3 font-medium text-[#0F172A] whitespace-nowrap">
                      {row.hour}
                    </td>
                    <td className="py-2 px-3 text-[#0F172A] whitespace-nowrap">{row.area}</td>
                    <td className="py-2 px-3 text-right font-medium text-[#0F172A] whitespace-nowrap">
                      {row.regionDemandMw !== null ? row.regionDemandMw.toLocaleString() : '-'}
                    </td>
                    <td className="py-2 px-3 text-right text-[#64748B] whitespace-nowrap">
                      {row.systemDemandMw !== null ? row.systemDemandMw.toLocaleString() : '-'}
                    </td>
                    <td className="py-2 pl-3 text-right font-semibold text-[#FF6B00] whitespace-nowrap">
                      {row.smp !== null ? row.smp.toFixed(2) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};
