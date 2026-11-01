import type { Level, ResponseWindow } from '@/core';

export const LEVEL_LABELS: Record<Level, string> = {
  risk: '위험',
  warn: '주의',
  ok: '정상',
  none: '판정 없음',
};

export const LEVEL_STYLES: Record<Level, string> = {
  risk: 'bg-risk-soft text-risk border-risk',
  warn: 'bg-warn-soft text-warn border-warn',
  ok: 'bg-ok-soft text-ok border-ok',
  none: 'bg-none-soft text-none border-none',
};

export const RESPONSE_WINDOW_LABELS: Record<ResponseWindow, { title: string; action: string }> = {
  before_notice: { title: '객실 안내 전', action: '손님 모르게 객실을 바꾸거나 청소 인력을 옮길 수 있어요' },
  after_notice: { title: '객실 안내 후', action: '손님에게 연락해 객실 변경을 안내해야 해요' },
  imminent: { title: '체크인 임박', action: '대체 객실을 잡거나 현장에서 바로 대응해야 해요' },
};

export const LEVEL_BAR_STYLES: Record<Level, string> = {
  risk: 'bg-risk',
  warn: 'bg-warn',
  ok: 'bg-ok',
  none: 'bg-none',
};

export const STAFF_LIMIT = { MIN: 1, MAX: 6 };
