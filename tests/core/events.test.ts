import { describe, expect, it } from 'vitest';
import { applyEvent, evaluate, type EvaluationInput } from '@/core';
import { at, baseInput, turnover } from '@tests/core/fixtures';

const oneRoom = (overrides: Partial<EvaluationInput> = {}) =>
  baseInput({ rooms: [{ no: '101', type: 'studio' }], stays: turnover('101', at('16:00')), ...overrides });

const roomOf = (input: EvaluationInput) => {
  const outcome = evaluate(input);

  if (!outcome.ok) {
    throw new Error(outcome.errors.join(', '));
  }

  return outcome.result.rooms[0];
};

describe('현장 이벤트 반영', () => {
  it('시각을 넘기면 판정 시각만 바뀌고 원래 입력은 그대로예요', () => {
    const input = oneRoom();
    const next = applyEvent({ input, event: { type: 'advance_time', minutes: 15 } });

    expect(next.asOf).toBe(at('10:45'));
    expect(input.asOf).toBe(at('10:30'));
  });

  it('퇴실을 누르면 그 시각에 객실이 비어요', () => {
    const late = oneRoom({ asOf: at('11:20') });

    // 퇴실 전에는 지금부터 15분 뒤에 빈다고 보수적으로 잡아요
    expect(roomOf(late).releasedAt).toBe(at('11:35'));

    const next = applyEvent({ input: late, event: { type: 'checked_out', roomNo: '101' } });

    expect(roomOf(next).releasedAt).toBe(at('11:20'));
  });

  it('청소를 시작하고 예상 시간을 넘기도록 완료가 없으면 지연으로 봐요', () => {
    const started = applyEvent({
      input: oneRoom({ asOf: at('11:00') }),
      event: { type: 'cleaning_started', roomNo: '101', staffId: 'hk-1' },
    });

    expect(roomOf(started).cleaningStartAt).toBe(at('11:00'));
    expect(roomOf(started).projectedReadyAt).toBe(at('12:00'));

    const overrun = applyEvent({ input: started, event: { type: 'advance_time', minutes: 75 } });

    // 12:15에도 끝나지 않았으니 지금부터 15분 뒤로 미뤄요
    expect(roomOf(overrun).projectedReadyAt).toBe(at('12:30'));
  });

  it('완료를 누르면 그 시각이 준비 완료 시각이 돼요', () => {
    const started = applyEvent({
      input: oneRoom({ asOf: at('11:00') }),
      event: { type: 'cleaning_started', roomNo: '101', staffId: 'hk-1' },
    });
    const finished = applyEvent({
      input: applyEvent({ input: started, event: { type: 'advance_time', minutes: 45 } }),
      event: { type: 'cleaning_finished', roomNo: '101' },
    });

    expect(roomOf(finished).cleaningStartAt).toBe(at('11:00'));
    expect(roomOf(finished).projectedReadyAt).toBe(at('11:45'));
    expect(roomOf(finished).level).toBe('ok');
  });
});
