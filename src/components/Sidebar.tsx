import React from 'react';
import {
  Activity,
  BarChart3,
  BellRing,
  BookOpen,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { LocaleId, RegionId, ScreenId } from '../types/market';

interface SidebarProps {
  activeScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  locale: LocaleId;
  region: RegionId;
  activeAlertsCount: number;
  csvSourceLabel: string;
}

const NAV_ITEMS: Array<{
  id: ScreenId;
  labelKo: string;
  labelEn: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'overview', labelKo: '시장 현황', labelEn: 'Overview', icon: Activity },
  { id: 'analytics', labelKo: 'SMP·REC 분석', labelEn: 'SMP & REC Analytics', icon: BarChart3 },
  { id: 'simulator', labelKo: '수익 시뮬레이터', labelEn: 'Revenue Simulator', icon: Calculator },
  { id: 'alerts', labelKo: '알림 및 정산', labelEn: 'Alerts & Ledger', icon: BellRing },
  { id: 'guide', labelKo: '전력시장 가이드', labelEn: 'Market Guide', icon: BookOpen },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeScreen,
  onSelectScreen,
  collapsed,
  onToggleCollapse,
  locale,
  region,
  activeAlertsCount,
  csvSourceLabel,
}) => {
  return (
    <>
      {/* Desktop Collapsible Telemetry Sidebar (>= 1280px) */}
      <aside
        aria-label="주 메뉴"
        className={`hidden xl:flex flex-col shrink-0 bg-[#FFFFFF] border-r border-[#E2E8F0] transition-[width] duration-200 ease-out ${
          collapsed ? 'w-[76px]' : 'w-[260px]'
        }`}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#E2E8F0]">
          <button
            type="button"
            onClick={() => onSelectScreen('overview')}
            className="flex items-center gap-2.5 text-left rounded-lg focus-visible:ring-2 focus-visible:ring-[#FF6B00] whitespace-nowrap shrink-0"
          >
            <span className="w-8 h-8 rounded-lg bg-[#FF6B00] text-white flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 stroke-[2.25]" />
            </span>
            {!collapsed && (
              <span className="text-[19px] font-bold tracking-tight text-[#0F172A]">
                GridPulse
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
            className="w-8 h-8 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] flex items-center justify-center transition-colors shrink-0"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            const label = locale === 'ko' ? item.labelKo : item.labelEn;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectScreen(item.id)}
                aria-current={isActive ? 'page' : undefined}
                title={collapsed ? label : undefined}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[#0F172A] text-[#FFFFFF]'
                    : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-[18px] h-[18px] shrink-0 ${
                      isActive ? 'text-[#FF6B00]' : 'text-[#64748B]'
                    }`}
                  />
                  {!collapsed && <span className="truncate">{label}</span>}
                </span>
                {!collapsed && item.id === 'alerts' && activeAlertsCount > 0 && (
                  <span
                    className={`font-mono text-[11px] tabular-nums ${
                      isActive ? 'text-[#FF6B00]' : 'text-[#64748B]'
                    }`}
                  >
                    {activeAlertsCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="p-4 mx-3 mb-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="text-[11px] font-mono font-semibold uppercase tracking-[0.05em] text-[#64748B]">
              {locale === 'ko' ? 'KPX 전력시장 기준' : 'KPX Settlement Window'}
            </div>
            <p className="mt-1.5 text-[13px] font-medium text-[#0F172A] leading-snug">
              {locale === 'ko'
                ? 'SMP 매시간 정산 · REC 현물 화·목 10:00–16:00'
                : 'SMP clears hourly · REC Spot Tue & Thu 10:00–16:00 KST'}
            </p>
            <div className="mt-2.5 pt-2.5 border-t border-[#E2E8F0] space-y-1.5 text-[12px] text-[#64748B]">
              <div className="flex items-center justify-between">
                <span>{locale === 'ko' ? '선택 권역' : 'Active Grid'}</span>
                <span className="font-mono font-medium text-[#0F172A]">
                  {region === 'mainland'
                    ? locale === 'ko'
                      ? '육지 (Mainland)'
                      : 'Mainland'
                    : locale === 'ko'
                    ? '제주 (Jeju)'
                    : 'Jeju'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="shrink-0">{locale === 'ko' ? '데이터' : 'Source'}</span>
                <span className="font-mono text-[11px] text-[#0F172A] truncate" title={csvSourceLabel}>
                  {csvSourceLabel}
                </span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Tablet & Mobile Horizontal Quick-Access Bar (< 1280px) */}
      <div className="xl:hidden bg-[#FFFFFF] border-b border-[#E2E8F0] px-4 md:px-6">
        <div className="h-12 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => onSelectScreen('overview')}
            className="flex items-center gap-2 pr-3 mr-1 border-r border-[#E2E8F0] whitespace-nowrap shrink-0"
          >
            <span className="w-6 h-6 rounded-md bg-[#FF6B00] text-white flex items-center justify-center">
              <Zap className="w-3.5 h-3.5" />
            </span>
            <span className="text-[15px] font-bold tracking-tight text-[#0F172A]">GridPulse</span>
          </button>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            const label = locale === 'ko' ? item.labelKo : item.labelEn;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectScreen(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#0F172A] text-[#FFFFFF]'
                    : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#FF6B00]' : ''}`} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
