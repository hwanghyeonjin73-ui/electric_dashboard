import React, { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  INITIAL_SCENARIOS,
  REC_AUCTIONS,
  formatKrw,
  getHourlyPrice,
} from '../data/marketData';
import { HourlySmpPoint, LocaleId, RegionId, SavedScenario } from '../types/market';

interface SimulatorScreenProps {
  region: RegionId;
  onChangeRegion: (r: RegionId) => void;
  locale: LocaleId;
  hourlyData: HourlySmpPoint[];
}

const FACILITY_TYPES = [
  { id: '지붕형 태양광', labelKo: '지붕형 태양광', labelEn: 'Rooftop Solar', defaultWeight: 1.5, defaultHours: 3.6 },
  { id: '노지 태양광', labelKo: '노지 태양광', labelEn: 'Ground Solar', defaultWeight: 1.0, defaultHours: 3.7 },
  { id: '육상 풍력', labelKo: '육상 풍력', labelEn: 'Onshore Wind', defaultWeight: 1.0, defaultHours: 5.4 },
  { id: '태양광 + ESS', labelKo: '태양광 + ESS', labelEn: 'ESS + Solar', defaultWeight: 1.2, defaultHours: 3.8 },
] as const;

export const SimulatorScreen: React.FC<SimulatorScreenProps> = ({
  region,
  onChangeRegion,
  locale,
  hourlyData,
}) => {
  const [facilityType, setFacilityType] = useState<string>('지붕형 태양광');
  const [capacityKw, setCapacityKw] = useState<number>(250);
  const [recWeight, setRecWeight] = useState<number>(1.5);
  const [sunHours, setSunHours] = useState<number>(3.6);
  const [essEnabled, setEssEnabled] = useState<boolean>(false);
  const [scenarioName, setScenarioName] = useState<string>('');
  const [scenarios, setScenarios] = useState<SavedScenario[]>(INITIAL_SCENARIOS);

  const latestRecPrice = REC_AUCTIONS[0].closingPrice;

  const projection = useMemo(() => {
    const solarWeightSum = hourlyData.reduce((acc, p) => acc + p.solarIndex, 0) || 1;
    const weightedSmp =
      facilityType === '육상 풍력'
        ? hourlyData.reduce((acc, p) => acc + getHourlyPrice(p, region), 0) / (hourlyData.length || 1)
        : hourlyData.reduce(
            (acc, p) => acc + getHourlyPrice(p, region) * (p.solarIndex / solarWeightSum),
            0
          );

    const effectiveSmp = essEnabled ? weightedSmp * 1.14 : weightedSmp;
    const dailyKwh = capacityKw * sunHours;
    const annualKwh = dailyKwh * 365;
    const annualSmpKrw = annualKwh * effectiveSmp;
    const annualRecCount = (annualKwh / 1000) * recWeight;
    const annualRecKrw = annualRecCount * latestRecPrice;
    const annualTotalKrw = annualSmpKrw + annualRecKrw;

    return {
      effectiveSmp,
      annualKwh,
      annualSmpKrw,
      annualRecCount,
      annualRecKrw,
      annualTotalKrw,
      monthlyAvgKrw: annualTotalKrw / 12,
      smpSharePct: (annualSmpKrw / (annualTotalKrw || 1)) * 100,
    };
  }, [capacityKw, sunHours, recWeight, essEnabled, region, facilityType, latestRecPrice, hourlyData]);

  const handleSelectFacility = (typeId: string) => {
    setFacilityType(typeId);
    const meta = FACILITY_TYPES.find((f) => f.id === typeId);
    if (meta) {
      setRecWeight(meta.defaultWeight);
      setSunHours(meta.defaultHours);
      setEssEnabled(typeId === '태양광 + ESS');
    }
  };

  const handleSaveScenario = (e: React.FormEvent) => {
    e.preventDefault();
    const fallbackName = `${facilityType} ${capacityKw} kW`;
    const newEntry: SavedScenario = {
      id: `scn-${Date.now()}`,
      name: scenarioName.trim() || fallbackName,
      facilityType,
      region,
      capacityKw,
      recWeight,
      essEnabled,
      annualKwh: Math.round(projection.annualKwh),
      annualRevenueKrw: Math.round(projection.annualTotalKrw),
    };
    setScenarios((prev) => [newEntry, ...prev]);
    setScenarioName('');
  };

  const handleDeleteScenario = (id: string) => {
    setScenarios((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-bold tracking-tight text-[#0F172A]">
            {locale === 'ko' ? 'SMP + REC 발전 수익 시뮬레이터' : 'SMP + REC Revenue Simulator'}
          </h2>
          <p className="mt-1 text-[14px] text-[#64748B]">
            {locale === 'ko'
              ? '연결된 CSV 단가와 발전 설비 조건, REC 가중치, ESS 피크 방전을 반영해 연간 정산 수익을 계산합니다.'
              : 'Model annual settlement revenue using connected CSV SMP rates and REC weighting.'}
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)] space-y-5">
          <h3 className="text-[18px] font-semibold text-[#0F172A] pb-3 border-b border-[#F1F5F9]">
            {locale === 'ko' ? '발전소 설비 조건' : 'Plant Parameters'}
          </h3>

          <div>
            <span className="block text-[13px] font-medium text-[#0F172A] mb-2">
              {locale === 'ko' ? '발전원 유형' : 'Facility Type'}
            </span>
            <div className="grid grid-cols-2 gap-2">
              {FACILITY_TYPES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleSelectFacility(f.id)}
                  className={`py-2 px-3 rounded-lg text-[13px] font-semibold border text-left transition-colors ${
                    facilityType === f.id
                      ? 'bg-[#0F172A] text-[#FFFFFF] border-[#0F172A]'
                      : 'bg-[#FFFFFF] text-[#0F172A] border-[#E2E8F0] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {locale === 'ko' ? f.labelKo : f.labelEn}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[13px]">
              <label htmlFor="sim-capacity" className="font-medium text-[#0F172A]">
                {locale === 'ko' ? '설치 용량' : 'Installed Capacity'}
              </label>
              <span className="font-mono font-semibold text-[#FF6B00] tabular-nums">
                {formatKrw(capacityKw)} kW
              </span>
            </div>
            <input
              id="sim-capacity"
              type="range"
              min={10}
              max={3000}
              step={10}
              value={capacityKw}
              onChange={(e) => setCapacityKw(Number(e.target.value))}
              className="mt-2 w-full accent-[#FF6B00] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-[13px]">
              <label htmlFor="sim-hours" className="font-medium text-[#0F172A]">
                {locale === 'ko' ? '일평균 이용시간' : 'Avg Daily Hours'}
              </label>
              <span className="font-mono font-semibold text-[#0F172A] tabular-nums">
                {sunHours.toFixed(1)} 시간/일
              </span>
            </div>
            <input
              id="sim-hours"
              type="range"
              min={2.5}
              max={6.5}
              step={0.1}
              value={sunHours}
              onChange={(e) => setSunHours(Number(e.target.value))}
              className="mt-2 w-full accent-[#FF6B00] cursor-pointer"
            />
          </div>

          <div>
            <span className="block text-[13px] font-medium text-[#0F172A] mb-2">
              {locale === 'ko' ? 'REC 가중치' : 'REC Weighting Factor'}
            </span>
            <div className="grid grid-cols-4 gap-2">
              {[0.8, 1.0, 1.2, 1.5].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setRecWeight(w)}
                  className={`py-2 rounded-lg text-[13px] font-mono font-semibold border transition-colors ${
                    recWeight === w
                      ? 'bg-[#FF6B00] text-[#FFFFFF] border-[#FF6B00]'
                      : 'bg-[#FFFFFF] text-[#0F172A] border-[#E2E8F0] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {w.toFixed(1)}배
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between pt-2 border-t border-[#F1F5F9] cursor-pointer">
            <div>
              <div className="text-[13px] font-semibold text-[#0F172A]">
                {locale === 'ko' ? 'ESS 피크시간 방전 연계' : 'ESS Evening Peak Discharge'}
              </div>
              <div className="text-[12px] text-[#64748B]">
                {locale === 'ko'
                  ? '주간 발전량을 17시~20시 고단가 시간대로 이동 정산'
                  : 'Shift midday solar output to evening peak hours'}
              </div>
            </div>
            <input
              type="checkbox"
              checked={essEnabled}
              onChange={(e) => setEssEnabled(e.target.checked)}
              className="w-[18px] h-[18px] rounded-[4px] accent-[#FF6B00] cursor-pointer shrink-0"
            />
          </label>

          <form onSubmit={handleSaveScenario} className="pt-4 border-t border-[#F1F5F9] flex gap-2">
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder={locale === 'ko' ? '시나리오 이름 (선택)' : 'Scenario name (optional)'}
              className="flex-1 px-3 py-2 rounded-lg border border-[#E2E8F0] text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#FF6B00] focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold bg-[#0F172A] text-[#FFFFFF] hover:bg-[#1E293B] transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{locale === 'ko' ? '저장' : 'Save'}</span>
            </button>
          </form>
        </section>

        <section className="lg:col-span-7 space-y-6">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="flex flex-wrap items-baseline justify-between gap-4 pb-5 border-b border-[#F1F5F9]">
              <div>
                <div className="text-[12px] font-medium text-[#64748B]">
                  {locale === 'ko' ? '연간 예상 총 발전수익' : 'Projected Annual Revenue'}
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-mono text-[36px] leading-[44px] font-semibold tracking-[-0.03em] text-[#0F172A] tabular-nums">
                    {formatKrw(projection.annualTotalKrw)}
                  </span>
                  <span className="font-mono text-[14px] text-[#64748B]">원 / 년</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[12px] text-[#64748B]">
                  {locale === 'ko' ? '월평균 환산' : 'Monthly Avg'}
                </div>
                <div className="font-mono text-[20px] font-semibold text-[#FF6B00] tabular-nums">
                  {formatKrw(projection.monthlyAvgKrw)} 원
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex justify-between text-[12px] font-mono mb-2">
                <span className="text-[#0F172A]">
                  SMP ({projection.smpSharePct.toFixed(0)}%) · {formatKrw(projection.annualSmpKrw)} 원
                </span>
                <span className="text-[#FF6B00]">
                  REC ({(100 - projection.smpSharePct).toFixed(0)}%) · {formatKrw(projection.annualRecKrw)} 원
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-[#FF6B00]/20 overflow-hidden flex">
                <div className="h-full bg-[#0F172A]" style={{ width: `${projection.smpSharePct}%` }} />
                <div className="h-full bg-[#FF6B00]" style={{ width: `${100 - projection.smpSharePct}%` }} />
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-[#F1F5F9] grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-[12px] text-[#64748B]">
                  {locale === 'ko' ? '연간 예상 발전량' : 'Annual Generation'}
                </div>
                <div className="mt-1 font-mono text-[18px] font-semibold text-[#0F172A] tabular-nums">
                  {formatKrw(projection.annualKwh)} kWh
                </div>
              </div>
              <div>
                <div className="text-[12px] text-[#64748B]">
                  {locale === 'ko' ? '가중 평균 SMP 단가' : 'Weighted SMP'}
                </div>
                <div className="mt-1 font-mono text-[18px] font-semibold text-[#0F172A] tabular-nums">
                  {projection.effectiveSmp.toFixed(2)} 원/kWh
                </div>
              </div>
              <div>
                <div className="text-[12px] text-[#64748B]">
                  {locale === 'ko' ? '연간 REC 발급량' : 'Issued RECs / Year'}
                </div>
                <div className="mt-1 font-mono text-[18px] font-semibold text-[#0F172A] tabular-nums">
                  {projection.annualRecCount.toFixed(1)} REC
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <h3 className="text-[16px] font-semibold text-[#0F172A] pb-3 border-b border-[#F1F5F9]">
              {locale === 'ko' ? '저장된 수익 비교 시나리오' : 'Saved Comparison Scenarios'}
            </h3>

            {scenarios.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-[#64748B]">
                저장된 시나리오가 없습니다. 좌측에서 조건을 설정하고 저장해 보세요.
              </p>
            ) : (
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="border-b border-[#E2E8F0] text-[11px] font-mono text-[#64748B]">
                    <tr>
                      <th className="py-2.5 pr-3">시나리오</th>
                      <th className="py-2.5 px-3">권역</th>
                      <th className="py-2.5 px-3 text-right">용량</th>
                      <th className="py-2.5 px-3 text-right">연간 수익</th>
                      <th className="py-2.5 pl-3 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9] text-[13px]">
                    {scenarios.map((s) => (
                      <tr key={s.id} className="h-[40px] hover:bg-[#F8FAFC]">
                        <td className="py-2 pr-3 font-medium text-[#0F172A]">
                          {s.name}
                          <span className="ml-2 text-[11px] font-mono text-[#64748B]">
                            {s.recWeight.toFixed(1)}배{s.essEnabled ? ' · ESS' : ''}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[#64748B]">
                          {s.region === 'mainland' ? '육지' : '제주'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums text-[#0F172A]">
                          {formatKrw(s.capacityKw)} kW
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold tabular-nums text-[#0F172A]">
                          {formatKrw(s.annualRevenueKrw)} 원
                        </td>
                        <td className="py-2 pl-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteScenario(s.id)}
                            aria-label={`${s.name} 삭제`}
                            className="p-1.5 rounded-md text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEE2E2]/50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
