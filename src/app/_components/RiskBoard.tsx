'use client';

import { useMemo, useState } from 'react';

import { applyEvent, evaluate, formatClock, toMs } from '@/core';
import type { FieldEvent, Level } from '@/core';

import { LAST_TIME, LEVEL_BAR_STYLES, LEVEL_LABELS, STAFF_LIMIT, TIME_STEPS } from '@/app/_components/board.constants';
import { conclusionOf, isLateOnItsOwn, summaryTextStyle, withStaffCount } from '@/app/_components/board.utils';
import RoomCard from '@/app/_components/RoomCard';
import type { RiskBoardProps } from '@/app/_components/RiskBoard.types';
import Timeline from '@/app/_components/Timeline';

const SUMMARY_ORDER: Level[] = ['risk', 'warn', 'ok', 'none'];

const CONCLUSION_STYLES = {
  ok: { icon: '✓', circle: 'bg-ok-soft text-ok' },
  warn: { icon: '!', circle: 'bg-warn-soft text-warn' },
  risk: { icon: '!', circle: 'bg-risk-soft text-risk' },
};

const RiskBoard = ({ input }: RiskBoardProps) => {
  const baseCount = input.housekeeping.staff.length;
  const [staffCount, setStaffCount] = useState(baseCount);
  const [fieldInput, setFieldInput] = useState(input);
  const simulatedInput = useMemo(
    () => withStaffCount({ input: fieldInput, count: staffCount }),
    [fieldInput, staffCount],
  );
  const outcome = useMemo(() => evaluate(simulatedInput), [simulatedInput]);
  const lastTime = toMs(`${input.asOf.slice(0, 10)}T${LAST_TIME}:00+09:00`);

  const handleEvents = (events: FieldEvent[]) => {
    setFieldInput((current) => events.reduce((state, event) => applyEvent({ input: state, event }), current));
  };

  const handleReset = () => {
    setFieldInput(input);
    setStaffCount(baseCount);
  };

  if (!outcome.ok) {
    return (
      <main className='mx-auto flex max-w-4xl flex-col gap-2 px-4 py-12'>
        <h1 className='text-xl font-bold'>입력을 판정할 수 없어요</h1>
        <ul className='list-disc pl-5'>
          {outcome.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </main>
    );
  }

  const { result } = outcome;
  const asOf = toMs(result.asOf);
  const noticeAt = toMs(`${result.asOf.slice(0, 10)}T${input.policy.roomNoticeAt}:00+09:00`);
  const attention = result.rooms.filter((room) => room.level === 'risk' || room.level === 'warn');
  const lateOnItsOwn = result.rooms.filter(isLateOnItsOwn).length;
  const firstStaff = input.housekeeping.staff[0];
  const { tone, headline } = conclusionOf({ summary: result.summary });

  return (
    <>
      <header className='sticky top-0 z-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-[#dfe5ea] bg-white px-4 py-3.5 lg:px-12'>
        <div className='flex flex-wrap items-center gap-3'>
          <h1 className='text-lg font-bold tracking-[-0.02em]'>당일 운영 리스크 보드</h1>
          <span className='rounded-full bg-accent/[.08] px-[9px] py-[3px] text-xs font-semibold text-accent'>
            예시 데이터로 계산한 결과예요
          </span>
        </div>
        <div className='flex flex-wrap items-center gap-5 lg:ml-auto'>
          <div className='flex items-center gap-2.5'>
            <span className='text-xs text-muted'>판정 시각</span>
            <strong className='font-mono text-[22px] font-semibold tracking-[-0.04em]' aria-live='polite'>
              {formatClock(asOf)}
            </strong>
            <div className='flex overflow-hidden rounded-lg border border-line'>
              {TIME_STEPS.map((minutes, index) => (
                <button
                  key={minutes}
                  type='button'
                  className={`px-[11px] py-1.5 text-[13px] font-semibold hover:bg-canvas disabled:opacity-30 ${index > 0 ? 'border-l border-line' : ''}`}
                  disabled={asOf + minutes * 60_000 > lastTime}
                  onClick={() => handleEvents([{ type: 'advance_time', minutes }])}
                >
                  +{minutes < 60 ? `${minutes}분` : `${minutes / 60}시간`}
                </button>
              ))}
            </div>
          </div>
          <i className='h-7 w-px bg-[#e1e7ec]' />
          <div className='flex items-center gap-2.5'>
            <span className='text-xs text-muted' id='staff-label'>
              청소 인력
            </span>
            <div
              className='flex items-center gap-0.5 rounded-lg border border-line p-0.5'
              aria-labelledby='staff-label'
            >
              <button
                type='button'
                className='h-7 w-7 rounded-md font-bold hover:bg-canvas disabled:opacity-30'
                aria-label='청소 인력 한 명 줄이기'
                disabled={staffCount <= STAFF_LIMIT.MIN}
                onClick={() => setStaffCount((count) => count - 1)}
              >
                −
              </button>
              <output className='w-9 text-center text-sm font-bold' aria-live='polite'>
                <span className='font-mono'>{staffCount}</span>명
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
          <i className='h-7 w-px bg-[#e1e7ec]' />
          <button
            type='button'
            className='rounded px-1.5 py-1 text-[13px] text-muted underline underline-offset-[3px] hover:bg-[#eef2f5] hover:text-ink'
            onClick={handleReset}
          >
            처음 상태로
          </button>
        </div>
      </header>

      <main className='flex flex-col gap-7 px-4 pt-9 pb-16 lg:px-12'>
        <div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]'>
          <section className='flex flex-col gap-3.5 rounded-2xl border border-[#dfe5ea] bg-white px-7 py-[26px]'>
            <div className='flex gap-3.5'>
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold ${CONCLUSION_STYLES[tone].circle}`}
              >
                {CONCLUSION_STYLES[tone].icon}
              </span>
              <div className='flex flex-col gap-0.5'>
                <p className='text-[13px] text-muted'>
                  <span className='font-mono'>{formatClock(asOf)}</span> 기준, 지금 손봐야 할 객실 {attention.length}개
                </p>
                <h2 className='text-[26px] leading-[1.3] font-bold tracking-[-0.025em]'>{headline}</h2>
              </div>
            </div>
            <p className='pl-[54px] text-[15px] leading-[1.6] text-[#3d4b56]'>
              객실 하나씩 떼어 보면 위험은 <strong>{lateOnItsOwn}실</strong>이에요. 청소 순서까지 따라가 보면 위험{' '}
              <strong className='text-risk'>{result.summary.risk}실</strong>, 주의{' '}
              <strong className='text-warn'>{result.summary.warn}실</strong>입니다.
            </p>
          </section>

          <section className='flex flex-col justify-center gap-3.5 rounded-2xl border border-[#dfe5ea] bg-white px-6 py-[22px]'>
            <div className='flex items-baseline justify-between'>
              <h2 className='text-[13px] font-normal text-muted'>오늘 청소할 객실</h2>
              <span className='text-sm font-bold'>
                <span className='font-mono text-[22px]'>{result.rooms.length}</span>실
              </span>
            </div>
            <div className='flex h-2.5 gap-0.5 overflow-hidden rounded-[5px]'>
              {SUMMARY_ORDER.filter((level) => result.summary[level] > 0).map((level) => (
                <i
                  key={level}
                  className={level === 'none' ? 'bg-[#9aa6b0]' : LEVEL_BAR_STYLES[level]}
                  style={{ flex: result.summary[level] }}
                />
              ))}
            </div>
            <ul className='grid grid-cols-4 text-[13px]'>
              {SUMMARY_ORDER.map((level) => (
                <li
                  key={level}
                  className={`flex items-center gap-1.5 ${summaryTextStyle({ level, count: result.summary[level] })}`}
                >
                  <i
                    className={`h-[7px] w-[7px] rounded-full ${level === 'none' ? 'bg-[#9aa6b0]' : LEVEL_BAR_STYLES[level]}`}
                  />
                  {LEVEL_LABELS[level]}
                  <span className='font-mono font-bold'>{result.summary[level]}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {attention.length > 0 && (
          <section className='flex flex-col gap-3' aria-labelledby='attention-title'>
            <h2 id='attention-title' className='sr-only'>
              지금 손봐야 할 객실
            </h2>
            {attention.map((room) => (
              <RoomCard key={room.roomNo} room={room} />
            ))}
          </section>
        )}

        <Timeline
          input={simulatedInput}
          rooms={result.rooms}
          asOf={asOf}
          noticeAt={noticeAt}
          baseCount={baseCount}
          onEvent={handleEvents}
        />

        <ul className='flex flex-wrap gap-x-[22px] gap-y-2 text-[13px] text-muted'>
          <li className='flex items-center gap-2'>
            <i className='h-1.5 w-[22px] rounded-[3px] bg-[#dfe6eb]' />
            퇴실 후 청소 대기
          </li>
          <li className='flex items-center gap-2'>
            <i className='h-3 w-[22px] rounded bg-ok' />
            청소 (색은 판정 등급)
          </li>
          <li className='flex items-center gap-2'>
            <i className='h-4 w-0.5 bg-ink' />
            다음 체크인
          </li>
          <li className='flex items-center gap-2'>
            <i className='h-4 border-l-2 border-dashed border-warn' />
            판정 시각
          </li>
          <li className='flex items-center gap-2'>
            <i className='h-4 w-0.5 bg-accent' />
            {input.policy.roomNoticeAt} 객실 안내 발송
          </li>
          <li className='flex items-center gap-2'>
            <span className='flex gap-0.5'>
              <i className='h-1 w-2 rounded-sm bg-ok' />
              <i className='h-1 w-2 rounded-sm bg-[#dfe6eb]' />
              <i className='h-1 w-2 rounded-sm bg-[#dfe6eb]' />
            </span>
            퇴실, 청소 시작, 완료 기록
          </li>
        </ul>

        <div className='grid gap-7 border-t border-[#dfe5ea] pt-6 md:grid-cols-3'>
          <section className='flex flex-col gap-1.5'>
            <h3 className='text-[13px] font-bold'>이 보드가 하는 일</h3>
            <p className='text-[13px] leading-[1.65] text-pretty text-muted'>
              청소 인력의 작업 순서를 따라가며 객실마다 준비가 끝나는 시각을 계산하고, 체크인 전에 준비되지 않을 객실을
              먼저 보여 줘요. {input.policy.roomNoticeAt} 객실 안내 전에 알아야 손님에게 다시 연락하지 않고 대응할 수
              있습니다.
            </p>
          </section>
          <section className='flex flex-col gap-1.5'>
            <h3 className='text-[13px] font-bold'>청소 순서 계산</h3>
            <p className='text-[13px] leading-[1.65] text-pretty text-muted'>
              {result.assignment === 'default' &&
                '배정표가 없어 다음 손님이 빨리 오는 객실부터 먼저 비는 인력에게 맡기는 기본 규칙으로 계산했어요. '}
              {staffCount > baseCount &&
                `늘린 인력은 ${firstStaff.id}와 같은 ${formatClock(toMs(firstStaff.availableFrom))}부터 일한다고 가정했습니다. `}
              순서를 매번 다시 짜기 때문에 인력을 늘려도 결과가 항상 나아지지는 않아요.
            </p>
          </section>
          <section className='flex flex-col gap-1.5'>
            <h3 className='text-[13px] font-bold'>현장 기록</h3>
            <p className='text-[13px] leading-[1.65] text-pretty text-muted'>
              퇴실은 손님 앱, 도어락, PMS에서 들어오는 기록이고, 청소 시작과 완료는 하우스키퍼가 남기는 기록이에요.
              누르면 지금 판정 시각에 일어난 일로 기록하고 판정을 다시 계산합니다. 체크아웃 시각이 지났는데 퇴실 기록이
              없거나 청소가 예상 시간을 넘기면 지금부터 {input.policy.overdueMinutes}분 뒤로 잡아요.
            </p>
          </section>
        </div>
      </main>
    </>
  );
};

export default RiskBoard;
