import type { EvaluationInput, FieldEvent, Level, RoomResult } from '@/core';

export interface StaffCountParams {
  input: EvaluationInput;
  count: number;
}

export interface RoomNotesParams {
  input: EvaluationInput;
  room: RoomResult;
}

export interface TimelineRangeParams {
  rooms: RoomResult[];
  asOf: number;
}

export interface FieldStatusParams {
  input: EvaluationInput;
  roomNo: string;
}

export interface StaffGroupsParams {
  input: EvaluationInput;
  rooms: RoomResult[];
  baseCount: number;
}

export type ConclusionTone = 'ok' | 'warn' | 'risk';

export interface ConclusionParams {
  summary: Record<Level, number>;
}

export interface SummaryTextParams {
  level: Level;
  count: number;
}

export interface NextActionParams {
  status: { canCheckOut: boolean; canStart: boolean; canFinish: boolean };
  room: RoomResult;
}

export interface NextAction {
  label: string;
  event: FieldEvent;
}
