import { formatClock, toMs } from '@/core';

import { LEVEL_LABELS, LEVEL_STYLES, RESPONSE_WINDOW_LABELS } from '@/app/_components/board.constants';
import type { RoomCardProps } from '@/app/_components/RoomCard.types';

const RoomCard = ({ room }: RoomCardProps) => {
  const response = room.responseWindow ? RESPONSE_WINDOW_LABELS[room.responseWindow] : null;
  const isAttention = room.level === 'risk' || room.level === 'warn';

  return (
    <article
      className={`flex flex-col gap-3 rounded-lg border-l-4 bg-white p-4 ${LEVEL_STYLES[room.level].split(' ')[2]}`}
    >
      <header className='flex flex-wrap items-center gap-3'>
        <h3 className='font-mono text-lg font-bold'>{room.roomNo}호</h3>
        <span className={`rounded-full px-2.5 py-0.5 text-sm font-bold ${LEVEL_STYLES[room.level]}`}>
          {LEVEL_LABELS[room.level]}
        </span>
        {room.assignee && <span className='text-sm text-muted'>담당 {room.assignee}</span>}
      </header>

      <dl className='grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4'>
        <div className='flex flex-col'>
          <dt className='text-muted'>예상 준비</dt>
          <dd className='font-mono font-semibold'>{formatClock(toMs(room.projectedReadyAt))}</dd>
        </div>
        <div className='flex flex-col'>
          <dt className='text-muted'>다음 체크인</dt>
          <dd className='font-mono font-semibold'>{room.nextCheckIn ? formatClock(toMs(room.nextCheckIn)) : '없음'}</dd>
        </div>
        <div className='flex flex-col'>
          <dt className='text-muted'>여유</dt>
          <dd className='font-mono font-semibold'>{room.slackMinutes === null ? '-' : `${room.slackMinutes}분`}</dd>
        </div>
        <div className='flex flex-col'>
          <dt className='text-muted'>청소 시작</dt>
          <dd className='font-mono font-semibold'>{formatClock(toMs(room.cleaningStartAt))}</dd>
        </div>
      </dl>

      {isAttention && (
        <div className='flex flex-col gap-2 rounded-md bg-canvas p-3 text-sm'>
          <ul className='flex list-disc flex-col gap-1 pl-5'>
            {room.reasons.map((reason) => (
              <li key={reason.code}>{reason.message}</li>
            ))}
          </ul>
          {response && (
            <p>
              <strong className='text-accent'>{response.title}</strong> {response.action}
            </p>
          )}
        </div>
      )}
    </article>
  );
};

export default RoomCard;
