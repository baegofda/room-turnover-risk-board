import { formatClock, toMs } from '@/core';
import type { FieldEvent } from '@/core';

import { fieldStatus } from '@/app/_components/board.utils';
import type { FieldPanelProps } from '@/app/_components/FieldPanel.types';

const BUTTON_STYLE =
  'rounded-md border border-line bg-white px-2.5 py-1 text-sm font-semibold hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-30';

const FieldPanel = ({ input, rooms, onEvent }: FieldPanelProps) => {
  const sortedRooms = [...rooms].sort((a, b) => a.roomNo.localeCompare(b.roomNo));
  const statuses = sortedRooms.map((room) => ({ room, status: fieldStatus(input, room.roomNo) }));
  const overdueCheckouts: FieldEvent[] = statuses
    .filter(({ status }) => status.isCheckoutOverdue)
    .map(({ room }) => ({ type: 'checked_out', roomNo: room.roomNo }));

  return (
    <section className='flex flex-col gap-3' aria-labelledby='field-title'>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div className='flex flex-col gap-1'>
          <h2 id='field-title' className='text-xl font-bold'>
            현장 입력 (하우스키퍼 시점)
          </h2>
          <p className='text-sm text-muted'>
            버튼을 누르면 지금 판정 시각에 일어난 일로 기록하고, 위의 판정을 다시 계산해요.
          </p>
        </div>
        <button
          type='button'
          className={BUTTON_STYLE}
          disabled={overdueCheckouts.length === 0}
          onClick={() => onEvent(overdueCheckouts)}
        >
          체크아웃 지난 객실 모두 퇴실 ({overdueCheckouts.length})
        </button>
      </div>

      <ul className='flex flex-col divide-y divide-line rounded-lg border border-line bg-white'>
        {statuses.map(({ room, status }) => (
          <li key={room.roomNo} className='flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5'>
            <span className='w-16 font-mono font-bold'>{room.roomNo}호</span>
            <span className='w-16 text-sm text-muted'>{room.assignee ?? '미배정'}</span>
            <span
              className={`min-w-36 flex-1 text-sm ${status.isCheckoutOverdue ? 'font-semibold text-risk' : 'text-ink'}`}
            >
              {status.label}
            </span>
            <div className='flex gap-2'>
              <button
                type='button'
                className={BUTTON_STYLE}
                disabled={!status.canCheckOut}
                onClick={() => onEvent([{ type: 'checked_out', roomNo: room.roomNo }])}
              >
                퇴실
              </button>
              <button
                type='button'
                className={BUTTON_STYLE}
                disabled={!status.canStart}
                onClick={() => onEvent([{ type: 'cleaning_started', roomNo: room.roomNo, staffId: room.assignee }])}
              >
                청소 시작
              </button>
              <button
                type='button'
                className={BUTTON_STYLE}
                disabled={!status.canFinish}
                onClick={() => onEvent([{ type: 'cleaning_finished', roomNo: room.roomNo }])}
              >
                완료
              </button>
            </div>
          </li>
        ))}
      </ul>

      <p className='text-sm text-muted'>
        판정 시각 <strong className='font-mono'>{formatClock(toMs(input.asOf))}</strong> 기준이에요. 체크아웃 시각이
        지났는데 퇴실을 누르지 않으면 지금부터 {input.policy.overdueMinutes}분 뒤에 빈다고 보고, 청소가 예상 시간을
        넘기면 지금부터 {input.policy.overdueMinutes}분 뒤에 끝난다고 봐요.
      </p>
    </section>
  );
};

export default FieldPanel;
