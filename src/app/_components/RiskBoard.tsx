'use client';

import { useMemo, useState } from 'react';

import { applyEvent, evaluate, formatClock, toMs } from '@/core';
import type { FieldEvent, Level } from '@/core';

import { LAST_TIME, LEVEL_LABELS, LEVEL_STYLES, STAFF_LIMIT, TIME_STEPS } from '@/app/_components/board.constants';
import { isLateOnItsOwn, withStaffCount } from '@/app/_components/board.utils';
import FieldPanel from '@/app/_components/FieldPanel';
import RoomCard from '@/app/_components/RoomCard';
import type { RiskBoardProps } from '@/app/_components/RiskBoard.types';
import Timeline from '@/app/_components/Timeline';

const SUMMARY_ORDER: Level[] = ['risk', 'warn', 'ok', 'none'];

const RiskBoard = ({ input }: RiskBoardProps) => {
  const baseCount = input.housekeeping.staff.length;
  const [staffCount, setStaffCount] = useState(baseCount);
  const [fieldInput, setFieldInput] = useState(input);
  const simulatedInput = useMemo(() => withStaffCount(fieldInput, staffCount), [fieldInput, staffCount]);
  const lastTime = toMs(`${input.asOf.slice(0, 10)}T${LAST_TIME}:00+09:00`);

  const handleEvents = (events: FieldEvent[]) => {
    setFieldInput((current) => events.reduce(applyEvent, current));
  };

  const handleReset = () => {
    setFieldInput(input);
    setStaffCount(baseCount);
  };
  const outcome = useMemo(() => evaluate(simulatedInput), [simulatedInput]);

  if (!outcome.ok) {
    return (
      <section className='flex flex-col gap-2'>
        <h2 className='text-xl font-bold'>입력을 판정할 수 없어요</h2>
        <ul className='list-disc pl-5'>
          {outcome.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </section>
    );
  }

  const { result } = outcome;
  const asOf = toMs(result.asOf);
  const noticeAt = toMs(`${result.asOf.slice(0, 10)}T${input.policy.roomNoticeAt}:00+09:00`);
  const attention = result.rooms.filter((room) => room.level === 'risk' || room.level === 'warn');
  const lateOnItsOwn = result.rooms.filter(isLateOnItsOwn).length;
  const firstStaff = input.housekeeping.staff[0];

  return (
    <div className='grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start'>
      <div className='flex min-w-0 flex-col gap-10'>
        <section className='flex flex-col gap-4' aria-labelledby='timeline-title'>
          <div className='flex flex-col gap-2'>
            <h2 id='timeline-title' className='text-xl font-bold'>
              {formatClock(asOf)} 기준, 오늘 청소할 객실 {result.rooms.length}실
            </h2>
            <ul className='flex flex-wrap gap-2'>
              {SUMMARY_ORDER.map((level) => (
                <li key={level} className={`rounded-full border px-3 py-1 text-sm font-bold ${LEVEL_STYLES[level]}`}>
                  {LEVEL_LABELS[level]} {result.summary[level]}
                </li>
              ))}
            </ul>
          </div>

          <p className='rounded-lg bg-accent/10 px-4 py-3'>
            객실 하나씩 떼어 보면 위험은 <strong>{lateOnItsOwn}실</strong>이에요. 청소 순서까지 따라가 보면 위험{' '}
            <strong className='text-risk'>{result.summary.risk}실</strong>, 주의{' '}
            <strong className='text-warn'>{result.summary.warn}실</strong>입니다.
          </p>

          <Timeline input={simulatedInput} rooms={result.rooms} asOf={asOf} noticeAt={noticeAt} />

          <p className='text-sm text-muted'>
            {result.assignment === 'default' &&
              '배정표가 없어 다음 손님이 빨리 오는 객실부터 먼저 비는 인력에게 맡기는 기본 규칙으로 계산했어요. '}
            {staffCount > baseCount &&
              `늘린 인력은 ${firstStaff.id}와 같은 ${formatClock(toMs(firstStaff.availableFrom))}부터 일한다고 가정했습니다. `}
            순서를 매번 다시 짜기 때문에 인력을 늘려도 결과가 항상 나아지지는 않아요.
          </p>
        </section>

        <section className='flex flex-col gap-3' aria-labelledby='attention-title'>
          <h2 id='attention-title' className='text-xl font-bold'>
            지금 손봐야 할 객실 {attention.length}개
          </h2>
          {attention.length === 0 && <p className='text-muted'>체크인 전에 모든 객실이 여유 있게 준비돼요.</p>}
          {attention.map((room) => (
            <RoomCard key={room.roomNo} room={room} />
          ))}
        </section>
      </div>

      <aside
        className='flex flex-col gap-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto'
        aria-labelledby='simulator-title'
      >
        <div className='flex items-center justify-between'>
          <h2 id='simulator-title' className='text-xl font-bold'>
            시뮬레이터
          </h2>
          <button
            type='button'
            className='rounded-md px-2 py-1 text-sm text-muted underline hover:text-ink'
            onClick={handleReset}
          >
            처음 상태로
          </button>
        </div>

        <div className='flex flex-col gap-3 rounded-lg border border-line bg-white p-4'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='w-16 text-sm text-muted'>판정 시각</span>
            <strong className='font-mono text-xl' aria-live='polite'>
              {formatClock(asOf)}
            </strong>
            {TIME_STEPS.map((minutes) => (
              <button
                key={minutes}
                type='button'
                className='rounded-md border border-line px-2.5 py-1 text-sm font-semibold hover:bg-canvas disabled:opacity-30'
                disabled={asOf + minutes * 60_000 > lastTime}
                onClick={() => handleEvents([{ type: 'advance_time', minutes }])}
              >
                +{minutes < 60 ? `${minutes}분` : `${minutes / 60}시간`}
              </button>
            ))}
          </div>

          <div className='flex items-center gap-2'>
            <span className='w-16 text-sm text-muted' id='staff-label'>
              청소 인력
            </span>
            <div className='flex items-center gap-1 rounded-lg border border-line p-0.5' aria-labelledby='staff-label'>
              <button
                type='button'
                className='h-7 w-7 rounded-md font-bold hover:bg-canvas disabled:opacity-30'
                aria-label='청소 인력 한 명 줄이기'
                disabled={staffCount <= STAFF_LIMIT.MIN}
                onClick={() => setStaffCount((count) => count - 1)}
              >
                −
              </button>
              <output className='w-10 text-center font-mono font-bold' aria-live='polite'>
                {staffCount}명
              </output>
              <button
                type='button'
                className='h-7 w-7 rounded-md font-bold hover:bg-canvas disabled:opacity-30'
                aria-label='청소 인력 한 명 늘리기'
                disabled={staffCount >= STAFF_LIMIT.MAX}
                onClick={() => setStaffCount((count) => count + 1)}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <FieldPanel input={simulatedInput} rooms={result.rooms} onEvent={handleEvents} />
      </aside>
    </div>
  );
};

export default RiskBoard;
