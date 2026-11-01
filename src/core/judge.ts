import { atLocalTime, durationLabel, hm, minutesBetween, toIso, toMs } from '@/core/time';
import type { JudgeParams, Level, Policy, Reason, ResponseWindow, RoomResult, Turnover } from '@/core/types';

// 6절: 여유 시간으로 등급을 정해요
const toLevel = (slackMinutes: number, policy: Policy): Level => {
  if (slackMinutes < 0) {
    return 'risk';
  }
  if (slackMinutes < policy.warnSlackMinutes) {
    return 'warn';
  }

  return 'ok';
};

// 7절: 위에서부터 먼저 맞는 하나만 골라요
const toResponseWindow = ({ turnover, policy, asOf }: JudgeParams): ResponseWindow => {
  const nextIn = toMs(turnover.nextStay?.checkIn ?? '');

  if (minutesBetween({ from: asOf, to: nextIn }) <= policy.imminentMinutes) {
    return 'imminent';
  }
  if (asOf >= atLocalTime({ dayMs: asOf, time: policy.roomNoticeAt })) {
    return 'after_notice';
  }

  return 'before_notice';
};

const buildReasons = (turnover: Turnover, policy: Policy, slackMinutes: number) => {
  const reasons: Reason[] = [];
  const nextIn = toMs(turnover.nextStay?.checkIn ?? '');
  const waitMinutes = minutesBetween({ from: turnover.releasedAt, to: turnover.startAt });

  if (slackMinutes < 0) {
    reasons.push({
      code: 'projected_late',
      message: `체크인 ${hm(nextIn)}까지 청소가 끝나지 않아요. 예상 완료는 ${hm(turnover.readyAt)}입니다`,
    });
  }
  if (slackMinutes >= 0) {
    reasons.push({
      code: 'tight_slack',
      message: `체크인 ${hm(nextIn)} 전에 끝나지만 여유가 ${durationLabel(slackMinutes)}뿐이에요`,
    });
  }
  if (waitMinutes > 0) {
    reasons.push({
      code: 'queue_wait',
      message: `손님이 나간 뒤 청소를 시작하기까지 ${durationLabel(waitMinutes)}을 기다려요`,
    });
  }
  if (turnover.isCheckoutDelayed) {
    reasons.push({
      code: 'checkout_delayed',
      message: `체크아웃 ${hm(toMs(turnover.endingStay.checkOut))}이 지났는데 아직 퇴실하지 않았어요`,
    });
  }
  if (turnover.isCleaningOverrun) {
    reasons.push({
      code: 'cleaning_overrun',
      message: `예상 청소 시간 ${durationLabel(turnover.cleaningMinutes)}이 지났는데 아직 끝나지 않았어요`,
    });
  }
  if (turnover.cleaningMinutes > policy.roomTypes[turnover.room.type].baseCleaningMinutes) {
    reasons.push({
      code: 'long_cleaning',
      message: `오래 묵었거나 인원이 많아 청소 시간을 ${durationLabel(turnover.cleaningMinutes)}으로 잡았어요`,
    });
  }

  return reasons;
};

export const judge = ({ turnover, policy, asOf }: JudgeParams): RoomResult => {
  const noticeAt = atLocalTime({ dayMs: asOf, time: policy.roomNoticeAt });
  const base = {
    roomNo: turnover.room.no,
    releasedAt: toIso(turnover.releasedAt),
    cleaningStartAt: toIso(turnover.startAt),
    projectedReadyAt: toIso(turnover.readyAt),
    readyBeforeNotice: turnover.readyAt <= noticeAt,
    assignee: turnover.assignee,
  };

  if (!turnover.nextStay) {
    return { ...base, level: 'none', responseWindow: null, nextCheckIn: null, slackMinutes: null, reasons: [] };
  }

  const slackMinutes = minutesBetween({ from: turnover.readyAt, to: toMs(turnover.nextStay.checkIn) });
  const level = toLevel(slackMinutes, policy);

  return {
    ...base,
    level,
    responseWindow: toResponseWindow({ turnover, policy, asOf }),
    nextCheckIn: turnover.nextStay.checkIn,
    slackMinutes,
    reasons: level === 'ok' ? [] : buildReasons(turnover, policy, slackMinutes),
  };
};
