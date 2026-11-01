import { formatClock, toMs } from '@/core';

import { LEVEL_BAR_STYLES, LEVEL_LABELS, LEVEL_STYLES } from '@/app/_components/board.constants';
import { fieldStatus, roomNotes } from '@/app/_components/board.utils';
import type { TimelineRowProps } from '@/app/_components/Timeline.types';

const STEP_LABELS = ['퇴실', '청소 시작', '완료'];

const TimelineRow = ({
  input,
  room,
  sort,
  position,
  span,
  hours,
  asOf,
  noticeAt,
  isFirst,
  onEvent,
}: TimelineRowProps) => {
  const releasedAt = toMs(room.releasedAt);
  const startAt = toMs(room.cleaningStartAt);
  const readyAt = toMs(room.projectedReadyAt);
  const notes = roomNotes(input, room);
  const status = fieldStatus(input, room.roomNo);
  const action = status.canCheckOut
    ? { label: '퇴실', event: { type: 'checked_out' as const, roomNo: room.roomNo } }
    : status.canStart
      ? {
          label: '청소 시작',
          event: { type: 'cleaning_started' as const, roomNo: room.roomNo, staffId: room.assignee },
        }
      : status.canFinish
        ? { label: '완료', event: { type: 'cleaning_finished' as const, roomNo: room.roomNo } }
        : null;
  const meta = `퇴실 ${formatClock(releasedAt)}${notes.length > 0 ? `, ${notes.join(', ')}` : ''}`;

  return (
    <li
      className={`grid grid-cols-[110px_minmax(0,1fr)_236px_84px] items-center gap-4 px-5 py-2.5 ${isFirst ? '' : 'border-t border-[#eef2f5]'}`}
    >
      <div className='flex flex-col leading-tight'>
        <span className='text-[15px] font-bold'>
          <span className='font-mono tracking-[-0.02em]'>{room.roomNo}</span>호
        </span>
        <span className='text-xs text-muted'>{sort === 'room' ? `${room.assignee ?? '미배정'}, ${meta}` : meta}</span>
      </div>

      <div className='relative h-8'>
        <i
          className='absolute inset-y-0 left-0 bg-[repeating-linear-gradient(135deg,rgba(168,112,26,.06)_0_6px,transparent_6px_12px)]'
          style={{ width: position(asOf) }}
        />
        {hours.map((hour) => (
          <i key={hour} className='absolute inset-y-0 w-px bg-[#edf1f4]' style={{ left: position(hour) }} />
        ))}
        <i className='absolute -inset-y-2.5 w-0.5 bg-accent' style={{ left: position(noticeAt) }} />
        <i className='absolute -inset-y-2.5 border-l-2 border-dashed border-warn' style={{ left: position(asOf) }} />
        {startAt > releasedAt && (
          <i
            className='absolute top-[13px] h-1.5 rounded-l-[3px] bg-[#dfe6eb]'
            style={{ left: position(releasedAt), width: span(releasedAt, startAt) }}
          />
        )}
        <i
          className='absolute top-3 h-2 w-2 -translate-x-1/2 rounded-full border-2 border-[#9fadb8] bg-white'
          style={{ left: position(releasedAt) }}
        />
        <span
          className={`absolute top-1 h-6 overflow-hidden rounded-md pl-2 font-mono text-[11px] leading-6 font-semibold whitespace-nowrap text-white shadow-[inset_0_-2px_0_rgba(0,0,0,.1)] ${LEVEL_BAR_STYLES[room.level]}`}
          style={{ left: position(startAt), width: span(startAt, readyAt) }}
          title={`${room.assignee ?? ''} ${formatClock(startAt)}~${formatClock(readyAt)}`}
        >
          {formatClock(startAt)}–{formatClock(readyAt)}
        </span>
        {room.nextCheckIn && (
          <span className='absolute -inset-y-[3px] w-0.5' style={{ left: position(toMs(room.nextCheckIn)) }}>
            <i className='absolute inset-0 rounded-[1px] bg-ink' />
            <i className='absolute -top-[5px] -left-[3px] h-2 w-2 rounded-full bg-ink' />
          </span>
        )}
      </div>

      <div className='-my-2.5 flex items-center gap-2.5 self-stretch border-l border-dashed border-[#c9d4dc] bg-[#f5f8fa] py-2.5 pl-[18px]'>
        <div className='flex min-w-0 flex-1 flex-col gap-1'>
          <div className='flex gap-[3px]' aria-label={`기록 ${status.step}/3 단계`}>
            {STEP_LABELS.map((label, index) => (
              <i
                key={label}
                className={`h-1 w-4 rounded-sm ${index < status.step ? 'bg-ok' : 'bg-[#dfe6eb]'}`}
                title={label}
              />
            ))}
          </div>
          <span
            className={`truncate text-xs ${status.isCheckoutOverdue ? 'font-semibold text-risk' : 'text-[#3d4b56]'}`}
          >
            {status.label}
          </span>
        </div>
        {action && (
          <button
            type='button'
            className='shrink-0 rounded-[7px] border border-[#c5d0d8] bg-white px-[11px] py-[5px] text-[12.5px] font-semibold shadow-[0_1px_0_rgba(21,32,42,.05)] hover:bg-canvas'
            onClick={() => onEvent([action.event])}
          >
            {action.label}
          </button>
        )}
      </div>

      <span
        className={`flex items-center gap-1.5 justify-self-end rounded-full py-[3px] pr-2.5 pl-2 text-xs font-bold ${LEVEL_STYLES[room.level]}`}
      >
        <i className={`h-1.5 w-1.5 rounded-full ${LEVEL_BAR_STYLES[room.level]}`} />
        {LEVEL_LABELS[room.level]}
      </span>
    </li>
  );
};

export default TimelineRow;
