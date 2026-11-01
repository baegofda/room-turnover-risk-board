import { nightsBetween, toMs } from '@/core/time';
import type { EstimateParams } from '@/core/types';

const EXTRA_MINUTES = {
  STAY_3_NIGHTS: 10,
  STAY_7_NIGHTS: 20,
  GUESTS_3: 10,
};

// 지금은 가정값이에요. 실제 청소 기록이 쌓이면 이 함수만 바꿔요 (docs/04-spec.md 4절)
// staffId는 사람별 차이를 넣을 자리로만 두고 쓰지 않아요
export const estimateCleaningMinutes = ({ room, stay, policy }: EstimateParams) => {
  const base = policy.roomTypes[room.type].baseCleaningMinutes;
  const nights = nightsBetween({ from: toMs(stay.checkIn), to: toMs(stay.checkOut) });
  const stayExtra = nights >= 7 ? EXTRA_MINUTES.STAY_7_NIGHTS : nights >= 3 ? EXTRA_MINUTES.STAY_3_NIGHTS : 0;
  const guestExtra = stay.guests >= 3 ? EXTRA_MINUTES.GUESTS_3 : 0;

  return base + stayExtra + guestExtra;
};
