import { describe, expect, it } from 'vitest';
import { estimateCleaningMinutes, evaluate, type EvaluationInput, type RoomResult } from '@/core';
import { at, baseInput, stay, turnover } from '@tests/core/fixtures';

const run = (input: EvaluationInput) => {
  const out = evaluate(input);
  if (!out.ok) throw new Error(`입력이 거부됐어요: ${out.errors.join(', ')}`);
  return out.result;
};
const room = (rooms: RoomResult[], no: string) => {
  const found = rooms.find((r) => r.roomNo === no);
  if (!found) throw new Error(`${no}호가 결과에 없어요`);
  return found;
};
const codes = (r: RoomResult) => r.reasons.map((x) => x.code);

describe('받지 않는 입력', () => {
  const valid = () => baseInput({ rooms: [{ no: '101', type: 'studio' }], stays: turnover('101', at('16:00')) });

  it('정상 입력은 받는다', () => {
    expect(evaluate(valid()).ok).toBe(true);
  });

  it('+09:00 오프셋이 없는 시각을 거부한다', () => {
    const input = valid();
    input.asOf = '2026-11-01T10:30:00Z';
    expect(evaluate(input).ok).toBe(false);
  });

  it('청소 인력이 없으면 거부한다', () => {
    const input = valid();
    input.housekeeping.staff = [];
    expect(evaluate(input).ok).toBe(false);
  });

  it('같은 객실의 숙박 기간이 겹치면 거부한다', () => {
    const input = valid();
    input.stays.push(stay({ room: '101', checkIn: at('15:00'), checkOut: at('11:00', '2026-11-02') }));
    expect(evaluate(input).ok).toBe(false);
  });

  it('체크아웃이 체크인보다 이르거나 같으면 거부한다', () => {
    const input = valid();
    input.stays = [stay({ room: '101', checkIn: at('16:00'), checkOut: at('16:00') })];
    expect(evaluate(input).ok).toBe(false);
  });

  it('객실 번호가 중복되면 거부한다', () => {
    const input = valid();
    input.rooms.push({ no: '101', type: 'studio' });
    expect(evaluate(input).ok).toBe(false);
  });

  it('없는 객실이나 청소 인력을 가리키면 거부한다', () => {
    const unknownRoom = valid();
    unknownRoom.stays.push(stay({ room: '999', checkIn: at('16:00'), checkOut: at('11:00', '2026-11-02') }));
    expect(evaluate(unknownRoom).ok).toBe(false);

    const unknownStaff = valid();
    unknownStaff.housekeeping.tasks = [
      { roomNo: '101', assignee: 'nobody', order: 1, startedAt: null, finishedAt: null },
    ];
    expect(evaluate(unknownStaff).ok).toBe(false);
  });

  it('객실 타입이 지점 규칙에 없으면 거부한다', () => {
    const input = valid();
    input.rooms[0].type = 'suite';
    expect(evaluate(input).ok).toBe(false);
  });
});

describe('청소 시간 어림', () => {
  const policy = baseInput().policy;
  const roomOf = { no: '101', type: 'studio' };
  const stayOf = (nights: number, guests = 2) => {
    const [s] = turnover('101', null, { nights, guests });
    return s;
  };

  it('기본 청소 시간에서 시작한다', () => {
    expect(estimateCleaningMinutes({ room: roomOf, policy, stay: stayOf(1) })).toBe(60);
  });

  it('3박 이상이면 10분, 7박 이상이면 20분을 더한다', () => {
    expect(estimateCleaningMinutes({ room: roomOf, policy, stay: stayOf(2) })).toBe(60);
    expect(estimateCleaningMinutes({ room: roomOf, policy, stay: stayOf(3) })).toBe(70);
    expect(estimateCleaningMinutes({ room: roomOf, policy, stay: stayOf(6) })).toBe(70);
    expect(estimateCleaningMinutes({ room: roomOf, policy, stay: stayOf(7) })).toBe(80);
  });

  it('인원이 3명 이상이면 10분을 더한다', () => {
    expect(estimateCleaningMinutes({ room: roomOf, policy, stay: stayOf(1, 3) })).toBe(70);
    expect(estimateCleaningMinutes({ room: roomOf, policy, stay: stayOf(7, 4) })).toBe(90);
  });
});

describe('오늘 청소할 객실 고르기', () => {
  it('오늘 아무도 나가지 않는 연박 객실은 고르지 않는다', () => {
    const input = baseInput({
      rooms: [
        { no: '101', type: 'studio' },
        { no: '102', type: 'studio' },
      ],
      stays: [
        ...turnover('101', at('16:00')),
        stay({ room: '102', checkIn: at('16:00', '2026-10-30'), checkOut: at('11:00', '2026-11-03') }),
      ],
    });
    expect(run(input).rooms.map((r) => r.roomNo)).toEqual(['101']);
  });

  it('다음 손님이 없으면 판정 없음(none)으로 둔다', () => {
    const input = baseInput({ rooms: [{ no: '101', type: 'studio' }], stays: turnover('101', null) });
    const r = room(run(input).rooms, '101');
    expect(r.level).toBe('none');
    expect(r.nextCheckIn).toBeNull();
  });

  it('자정을 넘겨 들어오는 손님도 다음 숙박으로 본다', () => {
    const input = baseInput({
      rooms: [{ no: '101', type: 'studio' }],
      stays: turnover('101', at('01:00', '2026-11-02')),
    });
    const r = room(run(input).rooms, '101');
    expect(r.nextCheckIn).toBe(at('01:00', '2026-11-02'));
    expect(r.level).toBe('ok');
  });
});

describe('손님이 나가는 시각', () => {
  const one = (opts: Parameters<typeof turnover>[2], asOf = at('10:30')) =>
    room(
      run(baseInput({ asOf, rooms: [{ no: '101', type: 'studio' }], stays: turnover('101', at('16:00'), opts) })).rooms,
      '101',
    );

  it('이미 나갔으면 실제로 나간 시각부터 청소할 수 있다', () => {
    const r = one({ checkedOutAt: at('10:00') }, at('10:30'));
    // 청소 인력이 11:00부터 일하므로 11:00 + 60분
    expect(r.projectedReadyAt).toBe(at('12:00'));
  });

  it('체크아웃 시간이 지났는데 안 나갔으면 판정 시각 + 15분에 나간다고 본다', () => {
    const r = one({}, at('12:00'));
    expect(r.projectedReadyAt).toBe(at('13:15'));
    expect(codes(r)).not.toContain('projected_late');
    expect(r.reasons.length).toBe(0);
    const input = baseInput({
      asOf: at('12:00'),
      rooms: [{ no: '101', type: 'studio' }],
      stays: turnover('101', at('13:30')),
    });
    expect(codes(room(run(input).rooms, '101'))).toContain('checkout_delayed');
  });
});

describe('청소 순서 따라가기 (기본 규칙)', () => {
  it('다음 손님이 가장 빨리 오는 객실부터 맡긴다', () => {
    const input = baseInput({
      rooms: [
        { no: '101', type: 'studio' },
        { no: '102', type: 'studio' },
      ],
      stays: [...turnover('101', at('16:00')), ...turnover('102', at('12:30'))],
    });
    const result = run(input);
    expect(result.assignment).toBe('default');
    expect(room(result.rooms, '102').projectedReadyAt).toBe(at('12:00'));
    expect(room(result.rooms, '101').projectedReadyAt).toBe(at('13:00'));
  });

  it('앞 순번 때문에 기다리면 queue_wait 이유를 붙인다', () => {
    const input = baseInput({
      rooms: [
        { no: '101', type: 'studio' },
        { no: '102', type: 'studio' },
      ],
      stays: [...turnover('101', at('12:30')), ...turnover('102', at('12:20'))],
    });
    const r = room(run(input).rooms, '101');
    expect(r.level).toBe('risk');
    expect(codes(r)).toEqual(expect.arrayContaining(['projected_late', 'queue_wait']));
  });

  it('다음 손님 시각이 같으면 먼저 빈 객실, 그다음 객실 번호 순서로 고른다', () => {
    const input = baseInput({
      rooms: [
        { no: '103', type: 'studio' },
        { no: '101', type: 'studio' },
        { no: '102', type: 'studio' },
      ],
      stays: [
        ...turnover('103', at('16:00')),
        ...turnover('101', at('16:00'), { out: at('11:30') }),
        ...turnover('102', at('16:00')),
      ],
    });
    const result = run(input);
    expect(room(result.rooms, '102').projectedReadyAt).toBe(at('12:00'));
    expect(room(result.rooms, '103').projectedReadyAt).toBe(at('13:00'));
    expect(room(result.rooms, '101').projectedReadyAt).toBe(at('14:00'));
  });

  it('같은 시각에 손이 비는 사람이 여럿이면 인력 ID 순서로 고른다', () => {
    const input = baseInput({
      rooms: [{ no: '101', type: 'studio' }],
      stays: turnover('101', at('16:00')),
      housekeeping: {
        staff: [
          { id: 'hk-2', availableFrom: at('11:00') },
          { id: 'hk-1', availableFrom: at('11:00') },
        ],
        tasks: [],
      },
    });
    expect(room(run(input).rooms, '101').assignee).toBe('hk-1');
  });

  it('기본 규칙의 반례: 먼저 빈 객실을 잡아서 급한 객실이 늦어진다', () => {
    const input = baseInput({
      rooms: [
        { no: 'A', type: 'long' },
        { no: 'B', type: 'short' },
      ],
      stays: [...turnover('A', at('16:00')), ...turnover('B', at('12:00'), { out: at('11:10') })],
    });
    const result = run(input);
    expect(room(result.rooms, 'A').projectedReadyAt).toBe(at('13:00'));
    expect(room(result.rooms, 'B').projectedReadyAt).toBe(at('13:30'));
    expect(room(result.rooms, 'B').level).toBe('risk');
  });
});

describe('배정표', () => {
  const rooms = [
    { no: '101', type: 'studio' },
    { no: '102', type: 'studio' },
  ];
  const stays = [...turnover('101', at('16:00')), ...turnover('102', at('12:30'))];

  it('모든 객실에 담당자와 순서가 있으면 배정표를 따른다', () => {
    const input = baseInput({
      rooms,
      stays,
      housekeeping: {
        staff: [{ id: 'hk-1', availableFrom: at('11:00') }],
        tasks: [
          { roomNo: '101', assignee: 'hk-1', order: 1, startedAt: null, finishedAt: null },
          { roomNo: '102', assignee: 'hk-1', order: 2, startedAt: null, finishedAt: null },
        ],
      },
    });
    const result = run(input);
    expect(result.assignment).toBe('schedule');
    expect(room(result.rooms, '101').projectedReadyAt).toBe(at('12:00'));
    expect(room(result.rooms, '102').level).toBe('risk');
  });

  it('하나라도 빠져 있으면 기본 규칙으로 계산한다', () => {
    const input = baseInput({
      rooms,
      stays,
      housekeeping: {
        staff: [{ id: 'hk-1', availableFrom: at('11:00') }],
        tasks: [{ roomNo: '101', assignee: 'hk-1', order: 1, startedAt: null, finishedAt: null }],
      },
    });
    const result = run(input);
    expect(result.assignment).toBe('default');
    expect(room(result.rooms, '102').projectedReadyAt).toBe(at('12:00'));
  });
});

describe('이미 청소 중인 객실', () => {
  const withTask = (task: EvaluationInput['housekeeping']['tasks'][number], asOf: string) =>
    baseInput({
      asOf,
      rooms: [{ no: '101', type: 'studio' }],
      stays: turnover('101', at('16:00'), { checkedOutAt: at('10:00') }),
      housekeeping: { staff: [{ id: 'hk-1', availableFrom: at('10:00') }], tasks: [task] },
    });

  it('청소가 끝났으면 그 시각에 준비된 것이다', () => {
    const r = room(
      run(
        withTask(
          { roomNo: '101', assignee: 'hk-1', order: 1, startedAt: at('10:00'), finishedAt: at('10:40') },
          at('11:00'),
        ),
      ).rooms,
      '101',
    );
    expect(r.projectedReadyAt).toBe(at('10:40'));
  });

  it('청소 중이면 시작 시각 + 청소 시간에 끝난다', () => {
    const r = room(
      run(
        withTask({ roomNo: '101', assignee: 'hk-1', order: 1, startedAt: at('10:20'), finishedAt: null }, at('10:30')),
      ).rooms,
      '101',
    );
    expect(r.projectedReadyAt).toBe(at('11:20'));
  });

  it('예상 시간을 넘겼는데 안 끝났으면 판정 시각 + 15분으로 보고 이유를 붙인다', () => {
    const input = withTask(
      { roomNo: '101', assignee: 'hk-1', order: 1, startedAt: at('10:00'), finishedAt: null },
      at('11:30'),
    );
    input.stays = turnover('101', at('12:00'), { checkedOutAt: at('10:00') });
    const r = room(run(input).rooms, '101');
    expect(r.projectedReadyAt).toBe(at('11:45'));
    expect(codes(r)).toContain('cleaning_overrun');
  });
});

describe('등급 경계값', () => {
  const slackCase = (nextIn: string) =>
    room(run(baseInput({ rooms: [{ no: '101', type: 'studio' }], stays: turnover('101', nextIn) })).rooms, '101');
  // 11:00부터 60분 청소라 12:00에 준비가 끝나요

  it('여유가 정확히 0분이면 주의', () => {
    const r = slackCase(at('12:00'));
    expect(r.slackMinutes).toBe(0);
    expect(r.level).toBe('warn');
  });

  it('여유가 29분이면 주의, 30분이면 정상', () => {
    expect(slackCase(at('12:29')).level).toBe('warn');
    expect(slackCase(at('12:30')).level).toBe('ok');
  });

  it('여유가 음수면 위험', () => {
    const r = slackCase(at('11:59'));
    expect(r.level).toBe('risk');
    expect(codes(r)).toContain('projected_late');
  });

  it('나가는 시각과 들어오는 시각이 같으면 위험', () => {
    const r = slackCase(at('11:00'));
    expect(r.level).toBe('risk');
  });

  it('정확히 13:00에 준비가 끝나면 안내 전에 준비된 것으로 본다', () => {
    const input = baseInput({
      rooms: [{ no: '101', type: 'studio' }],
      stays: turnover('101', at('16:00'), { out: at('12:00') }),
      housekeeping: { staff: [{ id: 'hk-1', availableFrom: at('11:00') }], tasks: [] },
    });
    const r = room(run(input).rooms, '101');
    expect(r.projectedReadyAt).toBe(at('13:00'));
    expect(r.readyBeforeNotice).toBe(true);
  });
});

describe('대응 시점', () => {
  const windowAt = (asOf: string, nextIn: string) =>
    room(
      run(
        baseInput({
          asOf,
          rooms: [{ no: '101', type: 'studio' }],
          stays: turnover('101', nextIn, { checkedOutAt: at('10:00') }),
        }),
      ).rooms,
      '101',
    ).responseWindow;

  it('안내 시각 전이면 before_notice', () => {
    expect(windowAt(at('10:30'), at('16:00'))).toBe('before_notice');
  });

  it('판정 시각이 정확히 13:00이면 after_notice', () => {
    expect(windowAt(at('13:00'), at('16:00'))).toBe('after_notice');
  });

  it('체크인까지 60분 이하면 다른 조건보다 imminent가 먼저다', () => {
    expect(windowAt(at('12:00'), at('13:00'))).toBe('imminent');
    expect(windowAt(at('15:00'), at('16:00'))).toBe('imminent');
    expect(windowAt(at('14:59'), at('16:00'))).toBe('after_notice');
  });
});

describe('항상 지켜야 할 조건', () => {
  const busy = () =>
    baseInput({
      rooms: ['201', '202', '203', '204', '205', '206'].map((no) => ({ no, type: 'studio' })),
      stays: [
        ...turnover('201', at('16:00')),
        ...turnover('202', at('14:00'), { nights: 7 }),
        ...turnover('203', at('15:00'), { guests: 4 }),
        ...turnover('204', null),
        ...turnover('205', at('16:00'), { out: at('12:00') }),
        ...turnover('206', at('13:30')),
      ],
      housekeeping: {
        staff: [
          { id: 'hk-1', availableFrom: at('11:00') },
          { id: 'hk-2', availableFrom: at('11:00') },
        ],
        tasks: [],
      },
    });

  it('같은 입력이면 같은 결과가 나온다', () => {
    expect(run(busy())).toEqual(run(busy()));
  });

  it('오늘 청소할 객실이 결과에서 빠지지 않는다', () => {
    expect(
      run(busy())
        .rooms.map((r) => r.roomNo)
        .sort(),
    ).toEqual(['201', '202', '203', '204', '205', '206']);
  });

  it('한 사람의 작업 시간이 겹치지 않고, 청소는 손님이 나가고 손이 빈 뒤에 시작한다', () => {
    const result = run(busy());
    for (const id of ['hk-1', 'hk-2']) {
      const jobs = result.rooms
        .filter((r) => r.assignee === id)
        .sort((a, b) => a.cleaningStartAt.localeCompare(b.cleaningStartAt));
      for (let i = 1; i < jobs.length; i++) {
        expect(jobs[i].cleaningStartAt >= jobs[i - 1].projectedReadyAt).toBe(true);
      }
    }
    for (const r of result.rooms) {
      expect(r.cleaningStartAt >= r.releasedAt).toBe(true);
      expect(r.cleaningStartAt >= at('11:00')).toBe(true);
    }
  });

  it('결과는 여유가 적은 순서이고 판정 없음은 맨 뒤에 있다', () => {
    const rooms = run(busy()).rooms;
    expect(rooms[rooms.length - 1].level).toBe('none');
    const slacks = rooms.filter((r) => r.slackMinutes !== null).map((r) => r.slackMinutes as number);
    expect([...slacks].sort((a, b) => a - b)).toEqual(slacks);
  });
});

describe('문제 정의의 H1: 객실별로는 정상인데 순서를 따라가면 늦는다', () => {
  it('모든 객실이 5시간 안에 혼자 청소할 수 있어도, 한 사람이 차례로 하면 늦는 객실이 생긴다', () => {
    const nos = ['301', '302', '303', '304', '305', '306'];
    const input = baseInput({
      rooms: nos.map((no) => ({ no, type: 'studio' })),
      stays: nos.flatMap((no) => turnover(no, at('16:00'))),
    });
    const result = run(input);
    // 객실 하나만 보면 11:00 퇴실, 60분 청소, 16:00 체크인이라 모두 넉넉해요
    expect(result.rooms.some((r) => r.level === 'risk')).toBe(true);
    expect(result.summary.risk).toBeGreaterThan(0);
  });
});
