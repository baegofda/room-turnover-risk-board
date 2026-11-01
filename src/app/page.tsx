import busyDay from '@samples/busy-day.json';

import RiskBoard from '@/app/_components/RiskBoard';
import type { EvaluationInput } from '@/core';

const Home = () => {
  return (
    <main className='mx-auto flex w-full max-w-[1400px] flex-col gap-8 px-4 py-10'>
      <header className='flex flex-col gap-3'>
        <p className='text-sm font-semibold text-accent'>예시 데이터로 계산한 결과예요</p>
        <h1 className='text-3xl font-bold'>당일 운영 리스크 보드</h1>
        <p className='max-w-3xl text-muted'>
          청소 인력의 작업 순서를 따라가며 객실마다 준비가 끝나는 시각을 계산하고, 체크인 전에 준비되지 않을 객실을 먼저
          보여 줘요. 13:00 객실 안내 전에 드러나야 손님 모르게 대응할 수 있습니다.
        </p>
      </header>

      <RiskBoard input={busyDay as EvaluationInput} />
    </main>
  );
};

export default Home;
