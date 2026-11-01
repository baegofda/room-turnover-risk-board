import type { EvaluationInput, FieldEvent, RoomResult } from '@/core';

export interface FieldPanelProps {
  input: EvaluationInput;
  rooms: RoomResult[];
  onEvent: (events: FieldEvent[]) => void;
}
