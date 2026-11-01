import { estimateCleaningMinutes } from '@/core/estimate';
import { addMinutes, dayKey, toMs } from '@/core/time';
import type { EvaluationInput, Schedule, Task, Turnover } from '@/core/types';

const nextCheckInMs = (turnover: Turnover) =>
  turnover.nextStay ? toMs(turnover.nextStay.checkIn) : Number.POSITIVE_INFINITY;

// 다음 손님이 빨리 오는 객실, 먼저 빈 객실, 객실 번호 순서예요 (docs/04-spec.md 5절 3번)
const compareTurnovers = (a: Turnover, b: Turnover) =>
  nextCheckInMs(a) - nextCheckInMs(b) || a.releasedAt - b.releasedAt || a.room.no.localeCompare(b.room.no);

// 2절, 3절: 오늘 청소할 객실과 손님이 나가는 시각
const findTurnovers = (input: EvaluationInput, tasks: Map<string, Task>) => {
  const asOf = toMs(input.asOf);
  const today = dayKey(asOf);
  const turnovers: Turnover[] = [];

  for (const room of input.rooms) {
    const stays = input.stays
      .filter((stay) => stay.roomNo === room.no)
      .sort((a, b) => toMs(a.checkIn) - toMs(b.checkIn));
    const endingStay = stays.find((stay) => dayKey(toMs(stay.checkOut)) === today);

    if (!endingStay) {
      continue;
    }

    const nextStay = stays.find((stay) => toMs(stay.checkIn) >= toMs(endingStay.checkOut)) ?? null;
    const isCheckoutDelayed = !endingStay.checkedOutAt && toMs(endingStay.checkOut) <= asOf;
    let releasedAt = toMs(endingStay.checkOut);

    if (endingStay.checkedOutAt) {
      releasedAt = toMs(endingStay.checkedOutAt);
    }
    if (isCheckoutDelayed) {
      releasedAt = addMinutes({ ms: asOf, minutes: input.policy.overdueMinutes });
    }

    const assignee = tasks.get(room.no)?.assignee ?? null;

    turnovers.push({
      room,
      endingStay,
      nextStay,
      releasedAt,
      cleaningMinutes: estimateCleaningMinutes({
        room,
        stay: endingStay,
        policy: input.policy,
        staffId: assignee ?? undefined,
      }),
      isCheckoutDelayed,
      isCleaningOverrun: false,
      startAt: releasedAt,
      readyAt: releasedAt,
      assignee,
    });
  }

  return turnovers;
};

export const buildSchedule = (input: EvaluationInput): Schedule => {
  const asOf = toMs(input.asOf);
  const overdueMinutes = input.policy.overdueMinutes;
  const tasks = new Map(input.housekeeping.tasks.map((task) => [task.roomNo, task]));
  const turnovers = findTurnovers(input, tasks);

  // 손이 비는 시각이에요. 아직 시작하지 않은 청소는 판정 시각 이후에만 시작해요
  const freeAt = new Map(
    input.housekeeping.staff.map((staff) => [staff.id, Math.max(toMs(staff.availableFrom), asOf)]),
  );
  const pending: Turnover[] = [];

  // 5절: 이미 끝났거나 청소 중인 객실
  for (const turnover of turnovers) {
    const task = tasks.get(turnover.room.no);

    if (task?.finishedAt) {
      turnover.startAt = toMs(task.startedAt ?? task.finishedAt);
      turnover.readyAt = toMs(task.finishedAt);
      continue;
    }
    if (task?.startedAt) {
      const expectedAt = addMinutes({ ms: toMs(task.startedAt), minutes: turnover.cleaningMinutes });

      turnover.startAt = toMs(task.startedAt);
      turnover.isCleaningOverrun = expectedAt <= asOf;
      turnover.readyAt = turnover.isCleaningOverrun ? addMinutes({ ms: asOf, minutes: overdueMinutes }) : expectedAt;
      if (task.assignee) {
        freeAt.set(task.assignee, Math.max(freeAt.get(task.assignee) ?? asOf, turnover.readyAt));
      }
      continue;
    }
    pending.push(turnover);
  }

  const assign = (turnover: Turnover, staffId: string) => {
    turnover.startAt = Math.max(freeAt.get(staffId) ?? asOf, turnover.releasedAt, asOf);
    turnover.readyAt = addMinutes({ ms: turnover.startAt, minutes: turnover.cleaningMinutes });
    turnover.assignee = staffId;
    freeAt.set(staffId, turnover.readyAt);
  };

  // 배정표는 남은 모든 객실에 담당자와 순서가 있을 때만 따라요
  const hasFullSchedule = pending.every((turnover) => {
    const task = tasks.get(turnover.room.no);

    return Boolean(task?.assignee) && task?.order != null;
  });

  if (hasFullSchedule) {
    const orderOf = (turnover: Turnover) => tasks.get(turnover.room.no)?.order ?? 0;
    const ordered = [...pending].sort((a, b) => orderOf(a) - orderOf(b) || a.room.no.localeCompare(b.room.no));

    for (const turnover of ordered) {
      assign(turnover, tasks.get(turnover.room.no)?.assignee ?? '');
    }

    return { assignment: 'schedule', turnovers };
  }

  // 기본 규칙 (docs/04-spec.md 5절)
  const waiting = [...pending];

  while (waiting.length > 0) {
    const [staffId, freeMs] = [...freeAt.entries()].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))[0];
    let now = Math.max(freeMs, asOf);
    let releasable = waiting.filter((turnover) => turnover.releasedAt <= now);

    if (releasable.length === 0) {
      now = Math.min(...waiting.map((turnover) => turnover.releasedAt));
      releasable = waiting.filter((turnover) => turnover.releasedAt <= now);
    }

    const next = releasable.sort(compareTurnovers)[0];

    waiting.splice(waiting.indexOf(next), 1);
    assign(next, staffId);
  }

  return { assignment: 'default', turnovers };
};
