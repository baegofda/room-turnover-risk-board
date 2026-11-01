import type { EvaluationInput, FieldEvent, RoomResult } from '@/core';

export type TimelineSort = 'staff' | 'room';

export interface TimelineProps {
  input: EvaluationInput;
  rooms: RoomResult[];
  asOf: number;
  noticeAt: number;
  baseCount: number;
  onEvent: (events: FieldEvent[]) => void;
}

export interface TimelineRowProps {
  input: EvaluationInput;
  room: RoomResult;
  sort: TimelineSort;
  position: (ms: number) => string;
  span: (from: number, to: number) => string;
  hours: number[];
  asOf: number;
  noticeAt: number;
  isFirst: boolean;
  onEvent: (events: FieldEvent[]) => void;
}

export interface SortOption {
  value: TimelineSort;
  label: string;
}
