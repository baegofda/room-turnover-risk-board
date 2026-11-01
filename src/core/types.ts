import type { z } from 'zod';

import type { inputSchema, policySchema, roomSchema, staffSchema, staySchema, taskSchema } from '@/core/schema';

export type Policy = z.infer<typeof policySchema>;
export type Room = z.infer<typeof roomSchema>;
export type Stay = z.infer<typeof staySchema>;
export type Staff = z.infer<typeof staffSchema>;
export type Task = z.infer<typeof taskSchema>;
export type EvaluationInput = z.infer<typeof inputSchema>;

export type Level = 'risk' | 'warn' | 'ok' | 'none';
export type ResponseWindow = 'imminent' | 'after_notice' | 'before_notice';
export type Assignment = 'schedule' | 'default';
export type ReasonCode =
  'projected_late' | 'tight_slack' | 'queue_wait' | 'checkout_delayed' | 'cleaning_overrun' | 'long_cleaning';

export interface Reason {
  code: ReasonCode;
  message: string;
}

export interface RoomResult {
  roomNo: string;
  level: Level;
  responseWindow: ResponseWindow | null;
  nextCheckIn: string | null;
  releasedAt: string;
  cleaningStartAt: string;
  projectedReadyAt: string;
  slackMinutes: number | null;
  readyBeforeNotice: boolean;
  assignee: string | null;
  reasons: Reason[];
}

export interface EvaluationResult {
  asOf: string;
  assignment: Assignment;
  summary: Record<Level, number>;
  rooms: RoomResult[];
}

export type EvaluationOutcome = { ok: true; result: EvaluationResult } | { ok: false; errors: string[] };

// 오늘 청소할 객실 하나의 계산 상태예요
export interface Turnover {
  room: Room;
  endingStay: Stay;
  nextStay: Stay | null;
  releasedAt: number;
  cleaningMinutes: number;
  isCheckoutDelayed: boolean;
  isCleaningOverrun: boolean;
  startAt: number;
  readyAt: number;
  assignee: string | null;
}

export interface Schedule {
  assignment: Assignment;
  turnovers: Turnover[];
}

export interface EstimateParams {
  room: Room;
  stay: Stay;
  policy: Policy;
  staffId?: string;
}

export interface JudgeParams {
  turnover: Turnover;
  policy: Policy;
  asOf: number;
}

export interface MinutesParams {
  ms: number;
  minutes: number;
}

export interface RangeParams {
  from: number;
  to: number;
}

export interface LocalTimeParams {
  dayMs: number;
  time: string;
}

// 현장에서 들어오는 입력이에요. 모든 이벤트는 판정 시각(asOf)에 일어난 것으로 기록해요
export type FieldEvent =
  | { type: 'advance_time'; minutes: number }
  | { type: 'checked_out'; roomNo: string }
  | { type: 'cleaning_started'; roomNo: string; staffId: string | null }
  | { type: 'cleaning_finished'; roomNo: string };
