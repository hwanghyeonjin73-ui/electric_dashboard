import React, { useMemo, useState } from 'react';
import { BellPlus, CheckCircle2, Clock, Plus, Search, Trash2 } from 'lucide-react';
import { formatKrw } from '../data/marketData';
import { LocaleId, PriceAlertRule, SettlementEntry } from '../types/market';

interface AlertsLedgerScreenProps {
  alerts: PriceAlertRule[];
  onToggleAlert: (id: string) => void;
  onDeleteAlert: (id: string) => void;
  onOpenAlertModal: () => void;
  settlements: SettlementEntry[];
  onAddSettlement: (entry: SettlementEntry) => void;
  locale: LocaleId;
}

export const AlertsLedgerScreen: React.FC<AlertsLedgerScreenProps> = ({
  alerts,
  onToggleAlert,
  onDeleteAlert,
  onOpenAlertModal,
  settlements,
  onAddSettlement,
  locale,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | '정산 완료' | '정산 대기'>('all');
  const [query, setQuery] = useState('');
  const [testBanner, setTestBanner] = useState<string | null>(null);
  const [showAddSettlement, setShowAddSettlement] = useState(false);

  const [facilityName, setFacilityName] = useState('');
  const [entryType, setEntryType] = useState<'SMP 정산' | 'REC 현물'>('SMP 정산');
  const [volumeNum, setVolumeNum] = useState('1200');
  const [unitPrice, setUnitPrice] = useState('119.02');

  const filteredSettlements = useMemo(() => {
    return settlements.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        return (
          item.facilityName.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [settlements, statusFilter, query]);

  const totalSettledKrw = useMemo(
    () => settlements.reduce((sum, s) => sum + s.totalKrw, 0),
    [settlements]
  );

  const handleTestAlert = (rule: PriceAlertRule) => {
    const unit = rule.metric === 'SMP' ? '원/kWh' : '원/REC';
    setTestBanner(
      `${rule.channel} 알림 미리보기 발송: ${rule.region === 'mainland' ? '육지' : '제주'} ${
        rule.metric
      } ${formatKrw(rule.threshold)} ${unit} ${rule.condition === 'above' ? '이상 도달' : '이하 하락'} 조건 충족`
    );
  };

  const handleCreateSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    const vol = Math.max(1, Number(volumeNum) || 0);
    const price = Math.max(1, Number(unitPrice) || 0);
    const total = Math.round(vol * price);
    const newEntry: SettlementEntry = {
      id: `STL-2026-${String(Math.floor(1000 + Math.random() * 9000))}`,
      date: '2026-09-30',
      facilityName: facilityName.trim() || '신규 태양광 발전소 (100 kW)',
      region: 'mainland',
      type: entryType,
      volumeLabel: entryType === 'SMP 정산' ? `${formatKrw(vol)} kWh` : `${formatKrw(vol)} REC`,
      unitPrice: price,
      totalKrw: total,
      status: '정산 완료',
    };
    onAddSettlement(newEntry);
    setFacilityName('');
    setShowAddSettlement(false);
  };

  return (
    <div className="space-y-8">
      {/* Alert Rules Section */}
      <section className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#F1F5F9]">
          <div>
            <h2 className="text-[20px] font-semibold text-[#0F172A]">
              {locale === 'ko' ? 'SMP·REC 목표 단가 알림' : 'Price Threshold Alerts'}
            </h2>
            <p className="mt-1 text-[13px] text-[#64748B]">
              {locale === 'ko'
                ? '목표 SMP 상·하한 또는 REC 현물 가격 도달 시 즉시 알림을 받아보세요.'
                : 'Receive instant alerts when SMP or REC crosses your target threshold.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenAlertModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold bg-[#FF6B00] text-[#FFFFFF] hover:bg-[#F97316] transition-colors whitespace-nowrap"
          >
            <BellPlus className="w-4 h-4" />
            <span>{locale === 'ko' ? '알림 규칙 추가' : 'Add Alert Rule'}</span>
          </button>
        </div>

        {testBanner && (
          <div className="mt-4 px-4 py-3 rounded-lg bg-[#FFF7ED] border border-[#FFEDD5] text-[13px] text-[#9A3412] flex items-center justify-between gap-4">
            <span>{testBanner}</span>
            <button
              type="button"
              onClick={() => setTestBanner(null)}
              className="text-[12px] font-semibold underline shrink-0"
            >
              닫기
            </button>
          </div>
        )}

        {alerts.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-[14px] text-[#64748B]">등록된 가격 알림이 없습니다.</p>
            <button
              type="button"
              onClick={onOpenAlertModal}
              className="mt-3 px-4 py-2 rounded-lg text-[13px] font-semibold bg-[#0F172A] text-[#FFFFFF]"
            >
              첫 알림 만들기
            </button>
          </div>
        ) : (
          <div className="mt-2 divide-y divide-[#F1F5F9]">
            {alerts.map((rule) => (
              <div
                key={rule.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-[14px] font-semibold text-[#0F172A]">
                    <span>{rule.region === 'mainland' ? '육지' : '제주'}</span>
                    <span aria-hidden="true" className="text-[#CBD5E1]">·</span>
                    <span className="font-mono">{rule.metric}</span>
                    <span className="font-mono text-[#FF6B00] tabular-nums">
                      {formatKrw(rule.threshold)} {rule.metric === 'SMP' ? '원/kWh' : '원/REC'}
                    </span>
                    <span className="text-[#64748B] font-normal">
                      {rule.condition === 'above' ? '이상 도달 시' : '이하 하락 시'}
                    </span>
                  </div>
                  <div className="text-[12px] text-[#64748B] flex flex-wrap items-center gap-2">
                    <span>{rule.channel}</span>
                    <span aria-hidden="true">·</span>
                    <span>{rule.note}</span>
                    {rule.lastTriggered && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">최근 발송: {rule.lastTriggered}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleTestAlert(rule)}
                    className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] transition-colors whitespace-nowrap"
                  >
                    테스트
                  </button>

                  <label className="inline-flex items-center gap-2 cursor-pointer text-[12px] font-medium text-[#64748B]">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => onToggleAlert(rule.id)}
                      className="w-[18px] h-[18px] rounded-[4px] accent-[#FF6B00] cursor-pointer"
                    />
                    <span>{rule.enabled ? '활성' : '중지'}</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => onDeleteAlert(rule.id)}
                    aria-label="알림 규칙 삭제"
                    className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEE2E2]/50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Settlement Ledger Section */}
      <section className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#F1F5F9]">
          <div>
            <h2 className="text-[20px] font-semibold text-[#0F172A]">
              {locale === 'ko' ? '전력 정산 내역 원장' : 'Settlement Ledger'}
            </h2>
            <p className="mt-1 text-[13px] text-[#64748B] font-mono tabular-nums">
              누적 정산 금액: {formatKrw(totalSettledKrw)} 원 (총 {settlements.length}건)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="발전소·정산번호 검색..."
                className="pl-8 pr-3 py-1.5 w-48 rounded-lg border border-[#E2E8F0] text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#FF6B00] focus:outline-none"
              />
            </div>

            <div className="inline-flex items-center p-0.5 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0]">
              {(['all', '정산 완료', '정산 대기'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-md text-[12px] font-semibold transition-colors whitespace-nowrap ${
                    statusFilter === status
                      ? 'bg-[#FFFFFF] text-[#0F172A]'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {status === 'all' ? '전체' : status}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowAddSettlement((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-semibold bg-[#0F172A] text-[#FFFFFF] hover:bg-[#1E293B] transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>정산 추가</span>
            </button>
          </div>
        </div>

        {showAddSettlement && (
          <form
            onSubmit={handleCreateSettlement}
            className="mt-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
          >
            <div className="sm:col-span-2">
              <label className="block text-[12px] font-medium text-[#64748B] mb-1">발전소명</label>
              <input
                type="text"
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                placeholder="예: 영광 태양광 200 kW"
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#64748B] mb-1">정산 구분</label>
              <select
                value={entryType}
                onChange={(e) => setEntryType(e.target.value as 'SMP 정산' | 'REC 현물')}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] text-[13px]"
              >
                <option value="SMP 정산">SMP 정산</option>
                <option value="REC 현물">REC 현물</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#64748B] mb-1">
                {entryType === 'SMP 정산' ? '발전량 (kWh)' : '수량 (REC)'}
              </label>
              <input
                type="number"
                value={volumeNum}
                onChange={(e) => setVolumeNum(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] text-[13px] font-mono"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-[12px] font-medium text-[#64748B] mb-1">단가 (원)</label>
                <input
                  type="number"
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] text-[13px] font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-[#FF6B00] text-[#FFFFFF] hover:bg-[#F97316] self-end"
              >
                등록
              </button>
            </div>
          </form>
        )}

        {filteredSettlements.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[14px] font-medium text-[#0F172A]">검색 조건에 맞는 정산 내역이 없습니다.</p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setStatusFilter('all');
              }}
              className="mt-3 px-4 py-2 rounded-lg text-[13px] font-semibold bg-[#F1F5F9] text-[#0F172A]"
            >
              필터 초기화
            </button>
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="border-b border-[#E2E8F0] text-[11px] font-mono text-[#64748B]">
                <tr>
                  <th className="py-2.5 pr-3">정산번호</th>
                  <th className="py-2.5 px-3">일자</th>
                  <th className="py-2.5 px-3">발전소</th>
                  <th className="py-2.5 px-3">구분</th>
                  <th className="py-2.5 px-3 text-right">거래량</th>
                  <th className="py-2.5 px-3 text-right">단가 (원)</th>
                  <th className="py-2.5 px-3 text-right">정산 금액 (원)</th>
                  <th className="py-2.5 pl-3 text-right">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-[13px]">
                {filteredSettlements.map((row) => (
                  <tr key={row.id} className="h-[42px] hover:bg-[#F8FAFC]">
                    <td className="py-2 pr-3 font-mono text-[12px] text-[#64748B] whitespace-nowrap">
                      {row.id}
                    </td>
                    <td className="py-2 px-3 font-mono text-[#0F172A] whitespace-nowrap">{row.date}</td>
                    <td className="py-2 px-3 font-medium text-[#0F172A]">{row.facilityName}</td>
                    <td className="py-2 px-3 text-[#64748B] whitespace-nowrap">{row.type}</td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-[#0F172A] whitespace-nowrap">
                      {row.volumeLabel}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-[#64748B] whitespace-nowrap">
                      {row.unitPrice.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold tabular-nums text-[#0F172A] whitespace-nowrap">
                      {formatKrw(row.totalKrw)}
                    </td>
                    <td className="py-2 pl-3 text-right whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[12px] font-medium ${
                          row.status === '정산 완료' ? 'text-[#059669]' : 'text-[#C2410C]'
                        }`}
                      >
                        {row.status === '정산 완료' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        <span>{row.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
