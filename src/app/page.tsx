import busyDay from '@samples/busy-day.json';

import RoomCard from '@/app/_components/RoomCard';
import { LEVEL_LABELS, LEVEL_STYLES } from '@/app/_components/board.constants';
import { evaluate, formatClock, toMs } from '@/core';
import type { Level } from '@/core';

const SUMMARY_ORDER: Level[] = ['risk', 'warn', 'ok', 'none'];

const Home = () => {
  const outcome = evaluate(busyDay);

  if (!outcome.ok) {
    return (
      <main className='mx-auto max-w-4xl px-4 py-12'>
        <h1 className='text-2xl font-bold'>입력을 판정할 수 없어요</h1>
        <ul className='mt-4 list-disc pl-5'>
          {outcome.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </main>
    );
  }

  const { result } = outcome;
  const attention = result.rooms.filter((room) => room.level === 'risk' || room.level === 'warn');
  const others = result.rooms.filter((room) => room.level === 'ok' || room.level === 'none');

  return (
    <main className='mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10'>
      <header className='flex flex-col gap-3'>
        <p className='text-sm font-semibold text-accent'>예시 데이터로 계산한 결과예요</p>
        <h1 className='text-3xl font-bold'>당일 운영 리스크 보드</h1>
        <p className='text-muted'>
          판정 시각 <strong className='font-mono text-ink'>{formatClock(toMs(result.asOf))}</strong> 기준으로 청소
          순서를 따라가 보고, 체크인 전에 준비가 끝나지 않을 객실을 먼저 보여 줘요.
          {result.assignment === 'default' &&
            ' 배정표가 없어 다음 손님이 빨리 오는 객실부터 맡기는 기본 규칙으로 계산했어요.'}
        </p>
        <ul className='flex flex-wrap gap-2'>
          {SUMMARY_ORDER.map((level) => (
            <li key={level} className={`rounded-full border px-3 py-1 text-sm font-bold ${LEVEL_STYLES[level]}`}>
              {LEVEL_LABELS[level]} {result.summary[level]}
            </li>
          ))}
        </ul>
      </header>

      <section className='flex flex-col gap-3' aria-labelledby='attention-title'>
        <h2 id='attention-title' className='text-xl font-bold'>
          지금 손봐야 할 객실 {attention.length}개
        </h2>
        {attention.length === 0 && <p className='text-muted'>체크인 전에 모든 객실이 여유 있게 준비돼요.</p>}
        {attention.map((room) => (
          <RoomCard key={room.roomNo} room={room} />
        ))}
      </section>

      <section className='flex flex-col gap-3' aria-labelledby='others-title'>
        <h2 id='others-title' className='text-xl font-bold'>
          나머지 객실
        </h2>
        {others.map((room) => (
          <RoomCard key={room.roomNo} room={room} />
        ))}
      </section>
    </main>
  );
};

export default Home;
