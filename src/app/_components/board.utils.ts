import { formatClock, toMs } from '@/core';
import type { EvaluationInput, RoomResult } from '@/core';

import type {
  ConclusionParams,
  ConclusionTone,
  FieldStatusParams,
  NextAction,
  NextActionParams,
  RoomNotesParams,
  StaffCountParams,
  StaffGroupsParams,
  SummaryTextParams,
  TimelineRangeParams,
} from '@/app/_components/board.types';

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// 시뮬레이터에서 인력 수만 바꿔요. 늘린 인력은 첫 번째 인력과 같은 시각에 투입한다고 가정해요
export const withStaffCount = ({ input, count }: StaffCountParams): EvaluationInput => {
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
export const roomNotes = ({ input, room }: RoomNotesParams) => {
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
export const timelineRange = ({ rooms, asOf }: TimelineRangeParams) => {
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
export const fieldStatus = ({ input, roomNo }: FieldStatusParams) => {
  const asOf = toMs(input.asOf);
  const today = input.asOf.slice(0, 10);
  const stay = input.stays.find((item) => item.roomNo === roomNo && item.checkOut.slice(0, 10) === today);
  const task = input.housekeeping.tasks.find((item) => item.roomNo === roomNo);
  const isCheckedOut = Boolean(stay?.checkedOutAt);
  const isCheckoutOverdue = !isCheckedOut && Boolean(stay) && toMs(stay?.checkOut ?? '') <= asOf;
  const status = { isCheckoutOverdue, canCheckOut: !isCheckedOut, canStart: false, canFinish: false, step: 0 };

  if (task?.finishedAt) {
    return { ...status, canCheckOut: false, step: 3, label: `청소 완료 ${formatClock(toMs(task.finishedAt))}` };
  }
  if (task?.startedAt) {
    return {
      ...status,
      canCheckOut: false,
      canFinish: true,
      step: 2,
      label: `청소 중, ${formatClock(toMs(task.startedAt))} 시작`,
    };
  }
  if (isCheckedOut) {
    return {
      ...status,
      canStart: true,
      step: 1,
      label: `퇴실함 ${formatClock(toMs(stay?.checkedOutAt ?? ''))}, 청소 전`,
    };
  }
  if (isCheckoutOverdue) {
    return { ...status, label: `체크아웃 ${formatClock(toMs(stay?.checkOut ?? ''))} 지남, 퇴실 확인 안 됨` };
  }

  return { ...status, label: `체크아웃 ${formatClock(toMs(stay?.checkOut ?? ''))} 예정` };
};

// 인력별 보기에서 쓰는 묶음이에요. 인력 순서는 입력 그대로, 묶음 안은 청소 시작 순서예요
export const staffGroups = ({ input, rooms, baseCount }: StaffGroupsParams) => {
  const byStart = (a: RoomResult, b: RoomResult) => toMs(a.cleaningStartAt) - toMs(b.cleaningStartAt);
  const groups = input.housekeeping.staff.map((staff, index) => {
    const assigned = rooms.filter((room) => room.assignee === staff.id).sort(byStart);

    return {
      id: staff.id,
      from: toMs(staff.availableFrom),
      isAdded: index >= baseCount,
      rooms: assigned,
      end: assigned.length > 0 ? Math.max(...assigned.map((room) => toMs(room.projectedReadyAt))) : null,
    };
  });
  const unassigned = rooms.filter((room) => !input.housekeeping.staff.some(({ id }) => id === room.assignee));

  if (unassigned.length > 0) {
    groups.push({ id: '미배정', from: toMs(input.asOf), isAdded: false, rooms: unassigned.sort(byStart), end: null });
  }

  return groups;
};

// 결론 카드의 색과 헤드라인이에요. 위험이 있으면 위험, 주의만 있으면 주의로 보여 줘요
export const conclusionOf = ({ summary }: ConclusionParams) => {
  if (summary.risk > 0) {
    return { tone: 'risk' as ConclusionTone, headline: `체크인 전에 준비되지 않을 객실 ${summary.risk}실` };
  }
  if (summary.warn > 0) {
    return { tone: 'warn' as ConclusionTone, headline: `체크인 직전에야 준비되는 객실 ${summary.warn}실` };
  }

  return { tone: 'ok' as ConclusionTone, headline: '체크인 전에 모든 객실이 여유 있게 준비돼요.' };
};

export const summaryTextStyle = ({ level, count }: SummaryTextParams) => {
  if (count === 0) {
    return 'text-[#8794a0]';
  }

  return level === 'none' ? 'text-muted' : 'text-ink';
};

// 현장 기록 칸에는 지금 누를 수 있는 다음 행동 하나만 보여 줘요
export const nextAction = ({ status, room }: NextActionParams): NextAction | null => {
  if (status.canCheckOut) {
    return { label: '퇴실', event: { type: 'checked_out', roomNo: room.roomNo } };
  }
  if (status.canStart) {
    return { label: '청소 시작', event: { type: 'cleaning_started', roomNo: room.roomNo, staffId: room.assignee } };
  }
  if (status.canFinish) {
    return { label: '완료', event: { type: 'cleaning_finished', roomNo: room.roomNo } };
  }

  return null;
};
