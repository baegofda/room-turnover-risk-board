import { z } from 'zod';

// 입력 시각은 +09:00 오프셋이 붙은 ISO 8601만 받아요 (docs/04-spec.md "시간 계산")
const kstDateTime = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?\+09:00$/, '시각에는 +09:00 오프셋이 있어야 해요');

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:mm 형식이어야 해요');
const minutes = z.number().int().nonnegative();

export const policySchema = z.object({
  roomNoticeAt: hhmm,
  warnSlackMinutes: minutes,
  imminentMinutes: minutes,
  overdueMinutes: minutes,
  roomTypes: z.record(z.string(), z.object({ baseCleaningMinutes: z.number().int().positive() })),
});

export const roomSchema = z.object({ no: z.string().min(1), type: z.string().min(1) });

export const staySchema = z.object({
  id: z.string().min(1),
  roomNo: z.string().min(1),
  checkIn: kstDateTime,
  checkOut: kstDateTime,
  checkedOutAt: kstDateTime.nullable().optional(),
  guests: z.number().int().positive(),
});

export const staffSchema = z.object({ id: z.string().min(1), availableFrom: kstDateTime });

export const taskSchema = z.object({
  roomNo: z.string().min(1),
  assignee: z.string().min(1).nullable().optional(),
  order: z.number().int().nullable().optional(),
  startedAt: kstDateTime.nullable().optional(),
  finishedAt: kstDateTime.nullable().optional(),
});

export const inputSchema = z.object({
  asOf: kstDateTime,
  policy: policySchema,
  rooms: z.array(roomSchema),
  stays: z.array(staySchema),
  housekeeping: z.object({
    staff: z.array(staffSchema),
    tasks: z.array(taskSchema),
  }),
});
