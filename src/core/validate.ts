import { toMs } from '@/core/time';
import type { EvaluationInput, Stay } from '@/core/types';

// 스키마로 걸러지지 않는 받지 않는 입력을 찾아요 (docs/04-spec.md "받지 않는 입력")
export const findInputErrors = (input: EvaluationInput) => {
  const errors: string[] = [];
  const roomNos = new Set<string>();

  for (const room of input.rooms) {
    if (roomNos.has(room.no)) {
      errors.push(`객실 번호 ${room.no}가 두 번 나와요`);
    }
    if (!input.policy.roomTypes[room.type]) {
      errors.push(`${room.no}호의 객실 타입 ${room.type}이 지점 규칙에 없어요`);
    }
    roomNos.add(room.no);
  }

  if (input.housekeeping.staff.length === 0) {
    errors.push('청소 인력이 한 명도 없어요');
  }

  const staffIds = new Set(input.housekeeping.staff.map((staff) => staff.id));
  const staysByRoom = new Map<string, Stay[]>();

  for (const stay of input.stays) {
    if (!roomNos.has(stay.roomNo)) {
      errors.push(`숙박 ${stay.id}가 없는 객실 ${stay.roomNo}를 가리켜요`);
    }
    if (toMs(stay.checkOut) <= toMs(stay.checkIn)) {
      errors.push(`숙박 ${stay.id}의 체크아웃이 체크인보다 이르거나 같아요`);
    }
    staysByRoom.set(stay.roomNo, [...(staysByRoom.get(stay.roomNo) ?? []), stay]);
  }

  for (const [roomNo, stays] of staysByRoom) {
    const sorted = [...stays].sort((a, b) => toMs(a.checkIn) - toMs(b.checkIn));
    const hasOverlap = sorted.some((stay, index) => index > 0 && toMs(stay.checkIn) < toMs(sorted[index - 1].checkOut));

    if (hasOverlap) {
      errors.push(`${roomNo}호의 숙박 기간이 겹쳐요`);
    }
  }

  for (const task of input.housekeeping.tasks) {
    if (!roomNos.has(task.roomNo)) {
      errors.push(`작업이 없는 객실 ${task.roomNo}를 가리켜요`);
    }
    if (task.assignee && !staffIds.has(task.assignee)) {
      errors.push(`작업이 없는 청소 인력 ${task.assignee}를 가리켜요`);
    }
  }

  return errors;
};
