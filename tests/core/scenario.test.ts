import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { evaluate } from '@/core';

const load = (name: string) => JSON.parse(readFileSync(new URL(`../../samples/${name}`, import.meta.url), 'utf8'));

describe('시나리오: 체크아웃이 몰린 날', () => {
  it('기대 결과 파일과 같은 판정을 낸다', () => {
    expect(evaluate(load('busy-day.json'))).toEqual(load('busy-day.expected.json'));
  });
});
