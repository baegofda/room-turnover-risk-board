import { judge } from '@/core/judge';
import { buildSchedule } from '@/core/schedule';
import { inputSchema } from '@/core/schema';
import { toMs } from '@/core/time';
import type { EvaluationOutcome, Level, RoomResult } from '@/core/types';
import { findInputErrors } from '@/core/validate';

export { estimateCleaningMinutes } from '@/core/estimate';
export { hm as formatClock, toMs } from '@/core/time';
export type {
  EvaluationInput,
  EvaluationOutcome,
  EvaluationResult,
  Level,
  ReasonCode,
  ResponseWindow,
  RoomResult,
} from '@/core/types';

// 여유가 적은 순서이고, 판정 없음은 맨 뒤예요
const compareResults = (a: RoomResult, b: RoomResult) => {
  const slackA = a.slackMinutes ?? Number.POSITIVE_INFINITY;
  const slackB = b.slackMinutes ?? Number.POSITIVE_INFINITY;

  if (slackA === slackB) {
    return a.roomNo.localeCompare(b.roomNo);
  }

  return slackA < slackB ? -1 : 1;
};

// 화면과 테스트가 부르는 진입점이에요. 같은 입력이면 언제 실행해도 같은 결과를 돌려줘요
export const evaluate = (raw: unknown): EvaluationOutcome => {
  const parsed = inputSchema.safeParse(raw);

  if (!parsed.success) {
    return { ok: false, errors: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`) };
  }

  const input = parsed.data;
  const errors = findInputErrors(input);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const asOf = toMs(input.asOf);
  const { assignment, turnovers } = buildSchedule(input);
  const rooms = turnovers.map((turnover) => judge({ turnover, policy: input.policy, asOf })).sort(compareResults);
  const summary: Record<Level, number> = { risk: 0, warn: 0, ok: 0, none: 0 };

  for (const room of rooms) {
    summary[room.level] += 1;
  }

  return { ok: true, result: { asOf: input.asOf, assignment, summary, rooms } };
};
