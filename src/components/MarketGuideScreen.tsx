import React, { useMemo, useState } from 'react';
import { MERIT_ORDER_STACK } from '../data/marketData';
import { LocaleId } from '../types/market';

interface MarketGuideScreenProps {
  locale: LocaleId;
}

export const MarketGuideScreen: React.FC<MarketGuideScreenProps> = ({ locale }) => {
  const [demandGw, setDemandGw] = useState<number>(74);

  const meritState = useMemo(() => {
    let cumulative = 0;
    const blocks = MERIT_ORDER_STACK.map((gen) => {
      const start = cumulative;
      cumulative += gen.capacityGw;
      return { ...gen, startGw: start, endGw: cumulative };
    });

    const clearingBlock =
      blocks.find((b) => demandGw <= b.endGw) ?? blocks[blocks.length - 1];

    return { blocks, totalCapacity: cumulative, clearingBlock };
  }, [demandGw]);

  const maxCost = 230;
  const chartW = 680;
  const chartH = 240;
  const padL = 48;
  const padR = 20;
  const padT = 20;
  const padB = 36;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  const xForGw = (gw: number) => padL + (gw / meritState.totalCapacity) * innerW;
  const yForCost = (cost: number) => padT + innerH - (cost / maxCost) * innerH;

  const faqItems = [
    {
      titleKo: 'SMP(계통한계가격)는 어떻게 결정되나요?',
      bodyKo:
        '전력거래소(KPX)는 매시간 발전단가가 낮은 발전기(원자력·신재생·석탄)부터 차례로 가동합니다. 해당 시간의 전력수요를 맞추기 위해 마지막으로 투입된 발전기(주로 LNG 복합화력)의 연료비 단가가 전체 시장의 SMP(원/kWh)로 결정됩니다.',
    },
    {
      titleKo: 'REC(신재생에너지 공급인증서) 수익은 어떻게 발생하나요?',
      bodyKo:
        '신재생 발전량 1,000kWh(1MWh)마다 설비 가중치(예: 건물 지붕 태양광 1.5배)를 곱해 REC가 발급됩니다. 발전사업자는 전력 판매 대금(SMP)에 더해 매주 화·목 열리는 현물시장 또는 장기계약을 통해 REC를 판매하여 추가 수익을 얻습니다.',
    },
    {
      titleKo: '육지와 제주의 SMP는 왜 차이가 나나요?',
      bodyKo:
        '제주는 육지와 해저 케이블(HVDC)로 연결된 독립 소규모 전력계통입니다. 기저발전 비중이 낮고 피크 시간대 현지 LNG·중유 발전기 가동 비율에 따라 육지와 다른 별도의 계통한계가격(제주 SMP)이 산정됩니다.',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-[24px] font-bold tracking-tight text-[#0F172A]">
          {locale === 'ko' ? '전력시장 SMP·REC 입문 가이드' : 'How Electricity Pricing Works'}
        </h2>
        <p className="mt-1 text-[14px] text-[#64748B]">
          발전사업자와 에너지 시장 입문자를 위한 계통한계가격 결정 원리 시뮬레이션입니다.
        </p>
      </div>

      <section className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#F1F5F9]">
          <div>
            <h3 className="text-[18px] font-semibold text-[#0F172A]">
              발전기 투입순서(Merit Order) 체험
            </h3>
            <p className="mt-1 text-[13px] text-[#64748B]">
              국가 전력수요 슬라이더를 움직여 어느 발전기가 현재 시간대의 SMP를 결정하는지 확인해 보세요.
            </p>
          </div>

          <div className="flex items-center gap-6 shrink-0">
            <div>
              <div className="text-[11px] font-mono text-[#64748B]">한계 발전원</div>
              <div className="text-[15px] font-semibold text-[#0F172A]">
                {meritState.clearingBlock.nameKo}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-mono text-[#64748B]">결정 SMP</div>
              <div className="font-mono text-[24px] font-semibold text-[#FF6B00] tabular-nums">
                {meritState.clearingBlock.marginalCost.toFixed(1)} 원/kWh
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-[240px]" role="img" aria-label="발전기 투입순서 차트">
              {[0, 50, 100, 150, 200].map((tick) => {
                const y = yForCost(tick);
                return (
                  <g key={tick}>
                    <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="#F1F5F9" strokeWidth="1" />
                    <text x={padL - 8} y={y + 4} textAnchor="end" className="fill-[#64748B] text-[10px] font-mono">
                      {tick}
                    </text>
                  </g>
                );
              })}

              {meritState.blocks.map((block) => {
                const x = xForGw(block.startGw);
                const w = xForGw(block.endGw) - x;
                const y = yForCost(block.marginalCost);
                const h = yForCost(0) - y;
                const isActive = block.id === meritState.clearingBlock.id;
                return (
                  <rect
                    key={block.id}
                    x={x}
                    y={Math.min(y, yForCost(0) - 4)}
                    width={Math.max(2, w - 2)}
                    height={Math.max(4, h)}
                    fill={block.color}
                    opacity={isActive ? 1 : 0.78}
                    rx={3}
                  />
                );
              })}

              <line
                x1={xForGw(demandGw)}
                y1={padT}
                x2={xForGw(demandGw)}
                y2={padT + innerH}
                stroke="#0F172A"
                strokeWidth="2"
                strokeDasharray="4 3"
              />
              <circle
                cx={xForGw(demandGw)}
                cy={yForCost(meritState.clearingBlock.marginalCost)}
                r={5.5}
                fill="#FF6B00"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              <text
                x={xForGw(demandGw)}
                y={chartH - 10}
                textAnchor="middle"
                className="fill-[#0F172A] text-[11px] font-mono font-semibold"
              >
                {demandGw} GW
              </text>
            </svg>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div>
              <div className="flex items-center justify-between text-[13px]">
                <label htmlFor="merit-demand" className="font-semibold text-[#0F172A]">
                  가상 전력 수요 (GW)
                </label>
                <span className="font-mono font-semibold text-[#FF6B00] tabular-nums">
                  {demandGw} GW
                </span>
              </div>
              <input
                id="merit-demand"
                type="range"
                min={20}
                max={94}
                step={1}
                value={demandGw}
                onChange={(e) => setDemandGw(Number(e.target.value))}
                className="mt-2 w-full accent-[#FF6B00] cursor-pointer"
              />
              <div className="mt-1 flex justify-between text-[11px] font-mono text-[#94A3B8]">
                <span>20 GW (심야)</span>
                <span>60 GW</span>
                <span>94 GW (피크)</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#F1F5F9] space-y-2 text-[12px]">
              {meritState.blocks.map((b) => (
                <div key={b.id} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[#0F172A]">
                    <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: b.color }} />
                    <span>{b.nameKo}</span>
                  </span>
                  <span className="font-mono text-[#64748B] tabular-nums">
                    {b.marginalCost.toFixed(1)} 원
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {faqItems.map((item, idx) => (
          <article
            key={idx}
            className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
          >
            <div className="text-[11px] font-mono text-[#FF6B00] font-semibold">
              0{idx + 1}.
            </div>
            <h3 className="mt-2 text-[17px] font-semibold text-[#0F172A] leading-snug">
              {item.titleKo}
            </h3>
            <p className="mt-3 text-[14px] text-[#64748B] leading-relaxed">
              {item.bodyKo}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
};
