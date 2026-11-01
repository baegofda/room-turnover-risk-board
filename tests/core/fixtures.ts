import type { EvaluationInput } from '@/core';

// 테스트 입력을 짧게 쓰기 위한 도우미예요. 날짜는 2026-11-01, 시각은 "HH:mm"으로 받아요.
export const at = (hm: string, day = '2026-11-01') => `${day}T${hm}:00+09:00`;

type StayArgs = {
  room: string;
  checkIn: string;
  checkOut: string;
  checkedOutAt?: string | null;
  guests?: number;
  id?: string;
};

export const stay = ({ room, checkIn, checkOut, checkedOutAt = null, guests = 2, id }: StayArgs) => ({
  id: id ?? `${room}-${checkIn}`,
  roomNo: room,
  checkIn,
  checkOut,
  checkedOutAt,
  guests,
});

// 어제 들어와 오늘 11:00에 나가고, 오늘 nextIn에 다음 손님이 들어오는 객실 하나
export const turnover = (
  room: string,
  nextIn: string | null,
  options: { out?: string; checkedOutAt?: string | null; nights?: number; guests?: number } = {},
) => {
  const out = options.out ?? at('11:00');
  const nights = options.nights ?? 1;
  const day = 31 - nights + 1;
  const prevIn = nights >= 1 ? `2026-10-${String(day).padStart(2, '0')}T16:00:00+09:00` : at('00:00');
  const stays = [
    stay({
      room,
      checkIn: prevIn,
      checkOut: out,
      checkedOutAt: options.checkedOutAt ?? null,
      guests: options.guests ?? 2,
    }),
  ];
  if (nextIn) stays.push(stay({ room, checkIn: nextIn, checkOut: at('11:00', '2026-11-03'), guests: 2 }));
  return stays;
};

export const baseInput = (overrides: Partial<EvaluationInput> = {}): EvaluationInput => ({
  asOf: at('10:30'),
  policy: {
    roomNoticeAt: '13:00',
    warnSlackMinutes: 30,
    imminentMinutes: 60,
    overdueMinutes: 15,
    roomTypes: {
      studio: { baseCleaningMinutes: 60 },
      long: { baseCleaningMinutes: 120 },
      short: { baseCleaningMinutes: 30 },
    },
  },
  rooms: [],
  stays: [],
  housekeeping: { staff: [{ id: 'hk-1', availableFrom: at('11:00') }], tasks: [] },
  ...overrides,
});
