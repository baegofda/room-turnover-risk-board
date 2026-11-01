'use client';

import { useState } from 'react';

import { formatClock } from '@/core';
import type { FieldEvent } from '@/core';

import { fieldStatus, staffGroups, timelineRange } from '@/app/_components/board.utils';
import type { SortOption, TimelineProps, TimelineSort } from '@/app/_components/Timeline.types';
import TimelineRow from '@/app/_components/TimelineRow';

const SORT_OPTIONS: SortOption[] = [
  { value: 'staff', label: '인력별' },
  { value: 'room', label: '객실 번호순' },
];

const Timeline = ({ input, rooms, asOf, noticeAt, baseCount, onEvent }: TimelineProps) => {
  const [sort, setSort] = useState<TimelineSort>('staff');
  const { start, end, hours } = timelineRange({ rooms, asOf });
  const position = (ms: number) => `${((Math.min(Math.max(ms, start), end) - start) / (end - start)) * 100}%`;
  const span = (from: number, to: number) => `calc(${position(to)} - ${position(from)})`;
  const overdueCheckouts: FieldEvent[] = rooms
    .filter((room) => fieldStatus({ input, roomNo: room.roomNo }).isCheckoutOverdue)
    .map((room) => ({ type: 'checked_out', roomNo: room.roomNo }));
  const groups =
    sort === 'staff'
      ? staffGroups({ input, rooms, baseCount })
      : [
          {
            id: null,
            from: 0,
            isAdded: false,
            end: null,
            rooms: [...rooms].sort((a, b) => a.roomNo.localeCompare(b.roomNo)),
          },
        ];
  const rowProps = { input, sort, position, span, hours, asOf, noticeAt, onEvent };

  return (
    <section
      className='overflow-hidden rounded-2xl border border-[#dfe5ea] bg-white shadow-[0_1px_2px_rgba(21,32,42,.04),0_16px_40px_-24px_rgba(21,32,42,.2)]'
      aria-labelledby='timeline-title'
    >
      <div className='flex flex-wrap items-center gap-4 border-b border-[#e6ecf0] px-5 py-4'>
        <h2 id='timeline-title' className='text-[17px] font-bold tracking-[-0.015em]'>
          청소 순서와 현장 기록
        </h2>
        <div className='flex gap-0.5 rounded-lg bg-[#eef2f5] p-[3px]' role='group' aria-label='정렬'>
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type='button'
              aria-pressed={sort === option.value}
              className={`rounded-md px-3 py-[5px] text-[13px] font-semibold ${sort === option.value ? 'bg-white text-ink shadow-[0_1px_2px_rgba(21,32,42,.12)]' : 'text-muted'}`}
              onClick={() => setSort(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button
          type='button'
          className='ml-auto rounded-lg border border-[#c5d0d8] bg-white px-3 py-1.5 text-[13px] font-semibold hover:bg-canvas disabled:border-dashed disabled:border-line disabled:bg-[#f5f7f9] disabled:text-[#a3afb8]'
          disabled={overdueCheckouts.length === 0}
          onClick={() => onEvent(overdueCheckouts)}
        >
          체크아웃 지난 객실 모두 퇴실 기록 ({overdueCheckouts.length})
        </button>
      </div>

      <div className='overflow-x-auto'>
        <div className='min-w-[960px]'>
          <div className='grid grid-cols-[110px_minmax(0,1fr)_236px_84px] items-center gap-4 border-b border-[#e6ecf0] bg-[#f8fafb] px-5 pt-3 pb-2.5 text-xs font-medium text-muted'>
            <span>객실</span>
            <div className='relative h-9'>
              {hours.map((hour, index) => (
                <span
                  key={hour}
                  className={`absolute bottom-0 font-mono text-[11.5px] ${index === hours.length - 1 ? 'translate-x-[calc(-100%+2px)]' : '-translate-x-1/2'}`}
                  style={{ left: position(hour) }}
                >
                  {formatClock(hour)}
                </span>
              ))}
              <span
                className='absolute top-0 z-[3] -translate-x-1/2 rounded-full border border-[rgba(168,112,26,.35)] bg-warn-soft px-[7px] py-px text-[11px] font-bold whitespace-nowrap text-warn'
                style={{ left: position(asOf) }}
              >
                판정 <span className='font-mono'>{formatClock(asOf)}</span>
              </span>
              <span
                className='absolute top-0 z-[3] -translate-x-1/2 rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-white'
                style={{ left: position(noticeAt) }}
              >
                객실 안내 <span className='font-mono'>{formatClock(noticeAt)}</span>
              </span>
            </div>
            <span className='-mt-3 -mb-2.5 flex items-center gap-1.5 self-stretch border-l border-dashed border-[#c9d4dc] bg-[#eef3f7] pl-[18px]'>
              현장 기록
              <span className='rounded bg-accent/10 px-1.5 py-px text-[10.5px] font-bold text-accent'>시뮬레이션</span>
            </span>
            <span className='text-right'>판정</span>
          </div>

          {groups.map((group) => (
            <div key={group.id ?? 'all'}>
              {group.id && (
                <div className='relative z-[2] mt-1.5 flex flex-wrap items-center gap-2 border-t border-b border-t-[#e6ecf0] border-b-[#eef2f5] bg-[#f8fafb] px-5 py-2 text-[13px] text-muted'>
                  <span className='rounded-[5px] bg-ink px-2 py-0.5 font-mono text-xs font-bold text-white'>
                    {group.id}
                  </span>
                  <span>
                    <span className='font-mono'>{formatClock(group.from)}</span>부터 {group.rooms.length}실
                  </span>
                  {group.end !== null && (
                    <span>
                      마지막 청소 <strong className='font-mono font-semibold text-ink'>{formatClock(group.end)}</strong>{' '}
                      종료
                    </span>
                  )}
                  {group.isAdded && (
                    <span className='rounded-full bg-accent/10 px-2 py-0.5 text-[11.5px] font-semibold text-accent'>
                      시뮬레이터로 늘린 인력
                    </span>
                  )}
                </div>
              )}
              <ul>
                {group.rooms.map((room, index) => (
                  <TimelineRow key={room.roomNo} room={room} isFirst={index === 0} {...rowProps} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Timeline;
