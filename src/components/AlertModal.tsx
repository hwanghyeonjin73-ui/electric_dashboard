import React, { useState } from 'react';
import { X } from 'lucide-react';
import { LocaleId, PriceAlertRule, RegionId } from '../types/market';

interface AlertModalProps {
  open: boolean;
  onClose: () => void;
  onCreateAlert: (rule: PriceAlertRule) => void;
  defaultRegion: RegionId;
  locale: LocaleId;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  open,
  onClose,
  onCreateAlert,
  defaultRegion,
  locale,
}) => {
  const [region, setRegion] = useState<RegionId>(defaultRegion);
  const [metric, setMetric] = useState<'SMP' | 'REC'>('SMP');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [threshold, setThreshold] = useState<string>('150');
  const [channel, setChannel] = useState<'앱 알림' | '이메일' | '카카오톡'>('앱 알림');
  const [note, setNote] = useState<string>('');

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = Number(threshold);
    if (!Number.isFinite(numeric) || numeric <= 0) return;
    onCreateAlert({
      id: `alt-${Date.now()}`,
      region,
      metric,
      condition,
      threshold: numeric,
      channel,
      enabled: true,
      note:
        note.trim() ||
        (metric === 'SMP' ? '사용자 지정 SMP 알림 기준' : '사용자 지정 REC 목표가'),
    });
    setNote('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-modal-title"
    >
      <div className="w-full max-w-md bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl shadow-[0_20px_25px_-5px_rgba(15,23,42,0.14)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <h2 id="alert-modal-title" className="text-[18px] font-semibold text-[#0F172A]">
            {locale === 'ko' ? '새 가격 알림 설정' : 'Create Price Alert'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="창 닫기"
            className="w-8 h-8 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[#64748B] mb-1">지표 구분</label>
              <select
                value={metric}
                onChange={(e) => {
                  const m = e.target.value as 'SMP' | 'REC';
                  setMetric(m);
                  setThreshold(m === 'SMP' ? '150' : '76000');
                }}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-[14px] text-[#0F172A]"
              >
                <option value="SMP">SMP (원/kWh)</option>
                <option value="REC">REC 현물 (원/REC)</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#64748B] mb-1">권역</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as RegionId)}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-[14px] text-[#0F172A]"
              >
                <option value="mainland">육지</option>
                <option value="jeju">제주</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[#64748B] mb-1">조건</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as 'above' | 'below')}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-[14px] text-[#0F172A]"
              >
                <option value="above">이상 도달 시</option>
                <option value="below">이하 하락 시</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#64748B] mb-1">목표 단가</label>
              <input
                type="number"
                step={metric === 'SMP' ? '0.1' : '100'}
                required
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-[14px] font-mono text-[#0F172A] focus:border-[#FF6B00] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#64748B] mb-1">수신 채널</label>
            <div className="grid grid-cols-3 gap-2">
              {(['앱 알림', '이메일', '카카오톡'] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChannel(ch)}
                  className={`py-2 rounded-lg text-[13px] font-semibold border transition-colors ${
                    channel === ch
                      ? 'bg-[#0F172A] text-[#FFFFFF] border-[#0F172A]'
                      : 'bg-[#FFFFFF] text-[#0F172A] border-[#E2E8F0]'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#64748B] mb-1">메모 (선택)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="예: 저녁 피크 방전 기준"
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#FF6B00] focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-[13px] font-semibold border border-[#CBD5E1] text-[#0F172A] hover:bg-[#F8FAFC]"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-[13px] font-semibold bg-[#FF6B00] text-[#FFFFFF] hover:bg-[#F97316]"
            >
              알림 저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
