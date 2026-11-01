import { formatClock, toMs } from '@/core';
import type { EvaluationInput, RoomResult } from '@/core';

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// 시뮬레이터에서 인력 수만 바꿔요. 늘린 인력은 첫 번째 인력과 같은 시각에 투입한다고 가정해요
export const withStaffCount = (input: EvaluationInput, count: number): EvaluationInput => {
  const base = input.housekeeping.staff;
  const staff = Array.from({ length: count }, (_, index) => base[index] ?? { ...base[0], id: `hk-${index + 1}` });
  const staffIds = new Set(staff.map(({ id }) => id));
  const tasks = input.housekeeping.tasks.map((task) =>
    task.assignee && !staffIds.has(task.assignee) ? { ...task, assignee: undefined, order: undefined } : task,
  );

  return { ...input, housekeeping: { staff, tasks } };
};

// 객실 하나만 떼어 보면 퇴실부터 체크인까지 청소할 시간이 충분한지 봐요. 화면의 대비 문장에 써요
export const isLateOnItsOwn = (room: RoomResult) => {
  if (!room.nextCheckIn) {
    return false;
  }

  const cleaningMs = toMs(room.projectedReadyAt) - toMs(room.cleaningStartAt);

  return toMs(room.nextCheckIn) - toMs(room.releasedAt) < cleaningMs;
};

// 객실 이름 옆에 붙일 짧은 메모예요. 퇴실 시각, 3박 이상, 3명 이상만 적어요
export const roomNotes = (input: EvaluationInput, room: RoomResult) => {
  const releasedAt = toMs(room.releasedAt);
  const endingStay = input.stays.find(
    (stay) => stay.roomNo === room.roomNo && Math.abs(toMs(stay.checkOut) - releasedAt) < DAY_MS,
  );

  if (!endingStay) {
    return [];
  }

  const nights = Math.round((toMs(endingStay.checkOut) - toMs(endingStay.checkIn)) / DAY_MS);
  const notes: string[] = [];

  if (nights >= 3) {
    notes.push(`${nights}박`);
  }

  if (endingStay.guests >= 3) {
    notes.push(`${endingStay.guests}명`);
  }

  return notes;
};

// 간트 가로축 범위예요. 모든 막대와 체크인 표시가 들어가도록 정시 단위로 넓혀요
export const timelineRange = (rooms: RoomResult[], asOf: number) => {
  const points = rooms.flatMap((room) => [
    asOf,
    toMs(room.releasedAt),
    toMs(room.projectedReadyAt),
    ...(room.nextCheckIn ? [toMs(room.nextCheckIn)] : []),
  ]);
  const start = Math.floor(Math.min(...points) / HOUR_MS) * HOUR_MS;
  const end = Math.ceil(Math.max(...points) / HOUR_MS) * HOUR_MS;
  const hours = Array.from({ length: (end - start) / HOUR_MS + 1 }, (_, index) => start + index * HOUR_MS);

  return { start, end, hours };
};

// 현장 기록 목록의 상태 문구와 누를 수 있는 버튼이에요
export const fieldStatus = (input: EvaluationInput, roomNo: string) => {
  const asOf = toMs(input.asOf);
  const today = input.asOf.slice(0, 10);
  const stay = input.stays.find((item) => item.roomNo === roomNo && item.checkOut.slice(0, 10) === today);
  const task = input.housekeeping.tasks.find((item) => item.roomNo === roomNo);
  const isCheckedOut = Boolean(stay?.checkedOutAt);
  const isCheckoutOverdue = !isCheckedOut && Boolean(stay) && toMs(stay?.checkOut ?? '') <= asOf;
  const status = { isCheckoutOverdue, canCheckOut: !isCheckedOut, canStart: false, canFinish: false };

  if (task?.finishedAt) {
    return { ...status, canCheckOut: false, label: `청소 완료 ${formatClock(toMs(task.finishedAt))}` };
  }
  if (task?.startedAt) {
    return {
      ...status,
      canCheckOut: false,
      canFinish: true,
      label: `청소 중, ${formatClock(toMs(task.startedAt))} 시작`,
    };
  }
  if (isCheckedOut) {
    return { ...status, canStart: true, label: `퇴실함 ${formatClock(toMs(stay?.checkedOutAt ?? ''))}, 청소 전` };
  }
  if (isCheckoutOverdue) {
    return { ...status, label: `체크아웃 ${formatClock(toMs(stay?.checkOut ?? ''))} 지남, 퇴실 확인 안 됨` };
  }

  return { ...status, label: `체크아웃 ${formatClock(toMs(stay?.checkOut ?? ''))} 예정` };
};
