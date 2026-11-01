import { TZDate } from '@date-fns/tz';
import { format, formatISO, parseISO } from 'date-fns';

import type { LocalTimeParams, MinutesParams, RangeParams } from '@/core/types';

// 시각 변환은 이 파일 하나만 거쳐요. 계산은 epoch 밀리초 숫자로 해요 (docs/05-architecture.md)
const TIME = {
  ZONE: 'Asia/Seoul',
  MINUTE_MS: 60_000,
  DAY_MINUTES: 24 * 60,
};

export const toMs = (iso: string) => parseISO(iso).getTime();

export const toIso = (ms: number) => formatISO(new TZDate(ms, TIME.ZONE));

export const addMinutes = ({ ms, minutes }: MinutesParams) => ms + minutes * TIME.MINUTE_MS;

export const minutesBetween = ({ from, to }: RangeParams) => Math.floor((to - from) / TIME.MINUTE_MS);

export const dayKey = (ms: number) => format(new TZDate(ms, TIME.ZONE), 'yyyy-MM-dd');

export const hm = (ms: number) => format(new TZDate(ms, TIME.ZONE), 'HH:mm');

// 판정 날짜에 "13:00" 같은 지점 시각을 붙여요. 한국은 서머타임이 없어 +09:00으로 고정해요
export const atLocalTime = ({ dayMs, time }: LocalTimeParams) => toMs(`${dayKey(dayMs)}T${time}:00+09:00`);

export const nightsBetween = ({ from, to }: RangeParams) => Math.round(minutesBetween({ from, to }) / TIME.DAY_MINUTES);

export const durationLabel = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) {
    return `${rest}분`;
  }

  return rest === 0 ? `${hours}시간` : `${hours}시간 ${rest}분`;
};
