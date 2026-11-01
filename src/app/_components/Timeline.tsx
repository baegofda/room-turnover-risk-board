import { formatClock, toMs } from '@/core';

import { LEVEL_BAR_STYLES, LEVEL_LABELS, LEVEL_STYLES } from '@/app/_components/board.constants';
import { roomNotes, timelineRange } from '@/app/_components/board.utils';
import type { TimelineProps } from '@/app/_components/Timeline.types';

const Timeline = ({ input, rooms, asOf, noticeAt }: TimelineProps) => {
  const { start, end, hours } = timelineRange(rooms, asOf);
  const position = (ms: number) => `${((Math.min(Math.max(ms, start), end) - start) / (end - start)) * 100}%`;
  const span = (from: number, to: number) => `calc(${position(to)} - ${position(from)})`;
  const sortedRooms = [...rooms].sort((a, b) => a.roomNo.localeCompare(b.roomNo));

  return (
    <div className='flex flex-col gap-3'>
      <div className='overflow-x-auto rounded-lg border border-line bg-white p-4'>
        <div className='min-w-[640px]'>
          <div className='grid grid-cols-[120px_1fr_72px] items-end gap-3 pb-2 text-xs text-muted'>
            <span>객실</span>
            <div className='relative h-4'>
              {hours.map((hour) => (
                <span key={hour} className='absolute -translate-x-1/2 font-mono' style={{ left: position(hour) }}>
                  {formatClock(hour)}
                </span>
              ))}
            </div>
            <span className='text-right'>판정</span>
          </div>

          <ul className='flex flex-col'>
            {sortedRooms.map((room) => {
              const releasedAt = toMs(room.releasedAt);
              const startAt = toMs(room.cleaningStartAt);
              const readyAt = toMs(room.projectedReadyAt);
              const notes = roomNotes(input, room);

              return (
                <li
                  key={room.roomNo}
                  className='grid grid-cols-[120px_1fr_72px] items-center gap-3 border-t border-line py-2'
                >
                  <div className='flex flex-col leading-tight'>
                    <span className='font-mono font-bold'>{room.roomNo}호</span>
                    <span className='text-xs text-muted'>
                      퇴실 {formatClock(releasedAt)}
                      {notes.length > 0 && `, ${notes.join(', ')}`}
                    </span>
                  </div>

                  <div className='relative h-7'>
                    {hours.map((hour) => (
                      <i key={hour} className='absolute inset-y-0 w-px bg-line' style={{ left: position(hour) }} />
                    ))}
                    <i className='absolute inset-y-0 w-0.5 bg-accent' style={{ left: position(noticeAt) }} />
                    <i
                      className='absolute inset-y-0 border-l-2 border-dashed border-warn'
                      style={{ left: position(asOf) }}
                    />
                    {startAt > releasedAt && (
                      <i
                        className='absolute top-2.5 h-2 rounded-sm bg-line'
                        style={{ left: position(releasedAt), width: span(releasedAt, startAt) }}
                      />
                    )}
                    <i
                      className={`absolute top-1 h-5 rounded-sm ${LEVEL_BAR_STYLES[room.level]}`}
                      style={{ left: position(startAt), width: span(startAt, readyAt) }}
                      title={`${room.assignee ?? ''} ${formatClock(startAt)}~${formatClock(readyAt)}`}
                    />
                    {room.nextCheckIn && (
                      <i
                        className='absolute -inset-y-0.5 w-0.5 bg-ink'
                        style={{ left: position(toMs(room.nextCheckIn)) }}
                      />
                    )}
                  </div>

                  <span
                    className={`justify-self-end rounded-full px-2 py-0.5 text-xs font-bold ${LEVEL_STYLES[room.level]}`}
                  >
                    {LEVEL_LABELS[room.level]}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <ul className='flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted'>
        <li className='flex items-center gap-2'>
          <i className='h-2 w-5 rounded-sm bg-line' />
          퇴실 후 청소 대기
        </li>
        <li className='flex items-center gap-2'>
          <i className='h-3 w-5 rounded-sm bg-ok' />
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
          {formatClock(noticeAt)} 객실 안내 발송
        </li>
      </ul>
    </div>
  );
};

export default Timeline;
