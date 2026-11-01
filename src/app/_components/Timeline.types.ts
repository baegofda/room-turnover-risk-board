import type { EvaluationInput, RoomResult } from '@/core';

export interface TimelineProps {
  input: EvaluationInput;
  rooms: RoomResult[];
  noticeAt: number;
}
