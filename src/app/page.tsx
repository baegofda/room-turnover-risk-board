import busyDay from '@samples/busy-day.json';

import RiskBoard from '@/app/_components/RiskBoard';
import type { EvaluationInput } from '@/core';

const Home = () => {
  return <RiskBoard input={busyDay as EvaluationInput} />;
};

export default Home;
