import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertModal } from './components/AlertModal';
import { AlertsLedgerScreen } from './components/AlertsLedgerScreen';
import { AnalyticsScreen } from './components/AnalyticsScreen';
import { HeaderBar } from './components/HeaderBar';
import { MarketGuideScreen } from './components/MarketGuideScreen';
import { OverviewScreen } from './components/OverviewScreen';
import { Sidebar } from './components/Sidebar';
import { SimulatorScreen } from './components/SimulatorScreen';
import {
  INITIAL_ALERTS,
  INITIAL_SETTLEMENTS,
  buildHourlySmpSeries,
  exportHourlyCsv,
} from './data/marketData';
import {
  DailyHourlyCsvRow,
  LocaleId,
  MonthlySmpCsvRow,
  PriceAlertRule,
  RegionId,
  ScreenId,
  SettlementEntry,
  TimeframeId,
} from './types/market';
import { decodeCsvBuffer, parseKpxCsvText } from './utils/csvParser';

const ATTACHED_CSV_URL = '/assets/aistudio/HOME________________SMP_90d0ffe3.csv';
const ATTACHED_CSV_NAME = 'HOME________________SMP_90d0ffe3.csv';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [region, setRegion] = useState<RegionId>('mainland');
  const [timeframe, setTimeframe] = useState<TimeframeId>('24h');
  const [locale, setLocale] = useState<LocaleId>('ko');

  const [csvFileName, setCsvFileName] = useState<string>(ATTACHED_CSV_NAME);
  const [csvKind, setCsvKind] = useState<'monthly-kpx' | 'daily-hourly'>('monthly-kpx');
  const [monthlyCsvRows, setMonthlyCsvRows] = useState<MonthlySmpCsvRow[]>([]);
  const [selectedMonthPeriod, setSelectedMonthPeriod] = useState<string>('2026/09');
  const [dailyCsvRows, setDailyCsvRows] = useState<DailyHourlyCsvRow[]>([]);
  const [selectedDailyDate, setSelectedDailyDate] = useState<string>('');

  const [alerts, setAlerts] = useState<PriceAlertRule[]>(INITIAL_ALERTS);
  const [settlements, setSettlements] = useState<SettlementEntry[]>(INITIAL_SETTLEMENTS);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  const loadAttachedCsv = useCallback(async () => {
    try {
      const res = await fetch(ATTACHED_CSV_URL);
      if (!res.ok) throw new Error('첨부된 CSV를 불러올 수 없습니다.');
      const buffer = await res.arrayBuffer();
      const text = decodeCsvBuffer(buffer);
      const parsed = parseKpxCsvText(text, ATTACHED_CSV_NAME);
      if (parsed.kind === 'monthly-kpx' && parsed.monthlyRows.length > 0) {
        setCsvKind('monthly-kpx');
        setCsvFileName(ATTACHED_CSV_NAME);
        setMonthlyCsvRows(parsed.monthlyRows);
        setSelectedMonthPeriod(parsed.monthlyRows[0].period);
        setDailyCsvRows([]);
        setSelectedDailyDate('');
      } else if (parsed.kind === 'daily-hourly' && parsed.dailyRows.length > 0) {
        setCsvKind('daily-hourly');
        setCsvFileName(ATTACHED_CSV_NAME);
        setDailyCsvRows(parsed.dailyRows);
        setSelectedDailyDate(parsed.dailyRows[0].date);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    void loadAttachedCsv();
  }, [loadAttachedCsv]);

  const handleUploadCsvFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const text = decodeCsvBuffer(buffer);
      const parsed = parseKpxCsvText(text, file.name);

      if (parsed.kind === 'daily-hourly') {
        setCsvKind('daily-hourly');
        setCsvFileName(file.name);
        setDailyCsvRows(parsed.dailyRows);
        setSelectedDailyDate(parsed.dailyRows[0].date);
        setTimeframe('24h');
        showToast(
          `${file.name} 연결 완료 · 일별 시간별(1시~24시) ${parsed.dailyRows.length}일 데이터`
        );
      } else {
        setCsvKind('monthly-kpx');
        setCsvFileName(file.name);
        setMonthlyCsvRows(parsed.monthlyRows);
        setSelectedMonthPeriod(parsed.monthlyRows[0].period);
        setDailyCsvRows([]);
        setSelectedDailyDate('');
        showToast(
          `${file.name} 연결 완료 · KPX 월별 ${parsed.monthlyRows.length}개월 데이터`
        );
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'CSV 파일을 읽는 중 오류가 발생했습니다.'
      );
    }
  };

  const hourlyData = useMemo(() => {
    if (csvKind === 'daily-hourly' && dailyCsvRows.length > 0) {
      const idx = dailyCsvRows.findIndex((r) => r.date === selectedDailyDate);
      const activeRow = idx >= 0 ? dailyCsvRows[idx] : dailyCsvRows[0];
      const prevRow = idx >= 0 && idx + 1 < dailyCsvRows.length ? dailyCsvRows[idx + 1] : undefined;
      const latestMonth = monthlyCsvRows[0];
      return buildHourlySmpSeries(
        latestMonth?.mainland ?? activeRow.avg,
        latestMonth?.jeju ?? activeRow.avg * 1.14,
        activeRow,
        prevRow
      );
    }

    const activeMonth =
      monthlyCsvRows.find((r) => r.period === selectedMonthPeriod) ?? monthlyCsvRows[0];
    return buildHourlySmpSeries(
      activeMonth?.mainland ?? 119.02,
      activeMonth?.jeju ?? 118.97
    );
  }, [csvKind, dailyCsvRows, selectedDailyDate, monthlyCsvRows, selectedMonthPeriod]);

  const activeDateLabel =
    csvKind === 'daily-hourly' && selectedDailyDate
      ? selectedDailyDate
      : selectedMonthPeriod || '2026-09';

  const handleExportCsv = () => {
    exportHourlyCsv(hourlyData, activeDateLabel, region);
    showToast(
      `${region === 'mainland' ? '육지' : '제주'} 시간별 SMP(1시~24시) CSV 파일을 다운로드했습니다.`
    );
  };

  const handleCreateAlert = (rule: PriceAlertRule) => {
    setAlerts((prev) => [rule, ...prev]);
    showToast(`${rule.metric} 가격 알림이 저장되었습니다.`);
    setActiveScreen('alerts');
  };

  const handleToggleAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddSettlement = (entry: SettlementEntry) => {
    setSettlements((prev) => [entry, ...prev]);
    showToast(`정산 내역(${entry.id})이 등록되었습니다.`);
  };

  const csvSourceLabel =
    csvKind === 'daily-hourly'
      ? `일별 CSV (${dailyCsvRows.length}일)`
      : `KPX CSV (${monthlyCsvRows.length}개월)`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col xl:flex-row">
      <Sidebar
        activeScreen={activeScreen}
        onSelectScreen={setActiveScreen}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        locale={locale}
        region={region}
        activeAlertsCount={alerts.filter((a) => a.enabled).length}
        csvSourceLabel={csvSourceLabel}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <HeaderBar
          activeScreen={activeScreen}
          locale={locale}
          onExportCsv={handleExportCsv}
          onOpenAlertModal={() => setAlertModalOpen(true)}
        />

        <main className="flex-1 p-4 md:p-8 max-w-[1440px] w-full mx-auto">
          {activeScreen === 'overview' && (
            <OverviewScreen
              region={region}
              onChangeRegion={setRegion}
              timeframe={timeframe}
              onChangeTimeframe={setTimeframe}
              locale={locale}
              onChangeLocale={setLocale}
              onNavigate={setActiveScreen}
              hourlyData={hourlyData}
              monthlyCsvRows={monthlyCsvRows}
              dailyCsvRows={dailyCsvRows}
              selectedMonthPeriod={selectedMonthPeriod}
              onSelectMonthPeriod={setSelectedMonthPeriod}
              selectedDailyDate={selectedDailyDate}
              onSelectDailyDate={setSelectedDailyDate}
              csvFileName={csvFileName}
              csvKind={csvKind}
              onUploadCsvFile={handleUploadCsvFile}
              onResetToAttachedCsv={() => {
                void loadAttachedCsv();
                showToast('기본 첨부 KPX CSV 데이터로 복원했습니다.');
              }}
            />
          )}

          {activeScreen === 'analytics' && (
            <AnalyticsScreen
              region={region}
              onChangeRegion={setRegion}
              locale={locale}
              hourlyData={hourlyData}
              monthlyCsvRows={monthlyCsvRows}
            />
          )}

          {activeScreen === 'simulator' && (
            <SimulatorScreen
              region={region}
              onChangeRegion={setRegion}
              locale={locale}
              hourlyData={hourlyData}
            />
          )}

          {activeScreen === 'alerts' && (
            <AlertsLedgerScreen
              alerts={alerts}
              onToggleAlert={handleToggleAlert}
              onDeleteAlert={handleDeleteAlert}
              onOpenAlertModal={() => setAlertModalOpen(true)}
              settlements={settlements}
              onAddSettlement={handleAddSettlement}
              locale={locale}
            />
          )}

          {activeScreen === 'guide' && <MarketGuideScreen locale={locale} />}
        </main>
      </div>

      <AlertModal
        open={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        onCreateAlert={handleCreateAlert}
        defaultRegion={region}
        locale={locale}
      />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 rounded-lg bg-[#0F172A] text-[#FFFFFF] px-4 py-3 text-[13px] font-medium shadow-[0_12px_24px_-4px_rgba(15,23,42,0.28)]"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
