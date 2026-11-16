import React from 'react';
import { BellPlus, Download } from 'lucide-react';
import { LocaleId, ScreenId } from '../types/market';

interface HeaderBarProps {
  activeScreen: ScreenId;
  locale: LocaleId;
  onExportCsv: () => void;
  onOpenAlertModal: () => void;
}

const SCREEN_TITLES: Record<ScreenId, { ko: string; en: string }> = {
  overview: { ko: '실시간 시장 현황', en: 'Market Overview' },
  analytics: { ko: 'SMP·REC 상세 분석', en: 'SMP & REC Analytics' },
  simulator: { ko: '발전 수익 시뮬레이터', en: 'Revenue Simulator' },
  alerts: { ko: '가격 알림 및 정산 원장', en: 'Alerts & Settlement Ledger' },
  guide: { ko: '전력시장 입문 가이드', en: 'Electricity Market Guide' },
};

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activeScreen,
  locale,
  onExportCsv,
  onOpenAlertModal,
}) => {
  const screenTitle = SCREEN_TITLES[activeScreen][locale];

  return (
    <header className="h-16 bg-[#FFFFFF] border-b border-[#E2E8F0] px-4 md:px-8 flex items-center justify-between gap-8 shrink-0">
      <div className="flex items-center gap-2 min-w-0 text-[14px]">
        <span className="font-semibold text-[#64748B] whitespace-nowrap shrink-0">GridPulse</span>
        <span aria-hidden="true" className="text-[#CBD5E1]">
          /
        </span>
        <h1 className="font-semibold text-[#0F172A] truncate">{screenTitle}</h1>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onExportCsv}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-semibold bg-[#FFFFFF] text-[#0F172A] border border-[#CBD5E1] hover:bg-[#F8FAFC] transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
        >
          <Download className="w-4 h-4 text-[#64748B]" />
          <span className="hidden sm:inline">
            {locale === 'ko' ? 'CSV 내보내기' : 'Export CSV'}
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenAlertModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold bg-[#FF6B00] text-[#FFFFFF] hover:bg-[#F97316] active:bg-[#EA580C] transition-all duration-150 whitespace-nowrap shrink-0 min-h-[40px]"
        >
          <BellPlus className="w-4 h-4" />
          <span>{locale === 'ko' ? '가격 알림 설정' : 'New Price Alert'}</span>
        </button>
      </div>
    </header>
  );
};
