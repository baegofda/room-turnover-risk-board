import { addMinutes, dayKey, toIso, toMs } from '@/core/time';
import type { EvaluationInput, FieldEvent, Task } from '@/core/types';

const updateTask = (input: EvaluationInput, roomNo: string, patch: Partial<Task>): EvaluationInput => {
  const tasks = input.housekeeping.tasks;
  const exists = tasks.some((task) => task.roomNo === roomNo);
  const nextTasks = exists
    ? tasks.map((task) => (task.roomNo === roomNo ? { ...task, ...patch } : task))
    : [...tasks, { roomNo, ...patch }];

  return { ...input, housekeeping: { ...input.housekeeping, tasks: nextTasks } };
};

// 이벤트 하나를 반영한 새 입력을 돌려줘요. 원래 입력은 바꾸지 않아요
export const applyEvent = (input: EvaluationInput, event: FieldEvent): EvaluationInput => {
  const asOf = toMs(input.asOf);

  switch (event.type) {
    case 'advance_time':
      return { ...input, asOf: toIso(addMinutes({ ms: asOf, minutes: event.minutes })) };

    case 'checked_out': {
      const today = dayKey(asOf);
      const stays = input.stays.map((stay) =>
        stay.roomNo === event.roomNo && dayKey(toMs(stay.checkOut)) === today && !stay.checkedOutAt
          ? { ...stay, checkedOutAt: input.asOf }
          : stay,
      );

      return { ...input, stays };
    }

    case 'cleaning_started':
      return updateTask(input, event.roomNo, { assignee: event.staffId, startedAt: input.asOf, finishedAt: null });

    case 'cleaning_finished': {
      const task = input.housekeeping.tasks.find(({ roomNo }) => roomNo === event.roomNo);

      return updateTask(input, event.roomNo, { startedAt: task?.startedAt ?? input.asOf, finishedAt: input.asOf });
    }
  }
};
