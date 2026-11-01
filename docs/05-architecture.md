# 05. 기술 스택과 구조

[04. 판정 명세](./04-spec.md)를 구현하는 데 쓰는 기술과 코드 구조예요. 판정 로직을 화면과 떼어 순수 함수로 두는 것이 이 구조의 중심입니다.

## 기술 스택

| 영역 | 선택 | 이유 |
|---|---|---|
| 언어 | TypeScript (`strict`) | 가장 익숙한 언어라 AI가 쓴 코드도 직접 검토할 수 있어요. 명세의 입출력을 타입으로 그대로 옮길 수 있습니다 |
| 프레임워크 | Next.js (App Router) | 화면 하나를 띄우고 Vercel에 바로 배포하기 좋아요 |
| 스타일 | Tailwind CSS v4 | 가장 손에 익은 도구예요. 판정 등급 색상은 테마 토큰으로만 씁니다 |
| 입력 검증 | Zod | 스키마 하나로 런타임 검증과 타입을 함께 얻어요. 명세의 입력 검증 규칙을 그대로 옮깁니다 |
| 테스트 | Vitest | 설정이 적고 빠르며 시나리오별 기대 결과 파일과 비교하기 쉬워요 |
| 시간 처리 | date-fns, @date-fns/tz | 시각 파싱, 더하기와 빼기, `Asia/Seoul` 기준 표시를 직접 구현하지 않고 검증된 함수로 처리해요. 함수 단위로 가져와서 필요한 만큼만 번들에 들어갑니다 |
| 품질 | ESLint, `tsc --noEmit` | 구조 규칙을 문서가 아니라 빌드에서 지키게 합니다 |
| CI | GitHub Actions | 테스트와 타입 검사를 PR마다 돌려요 |
| 배포 | Vercel | 클론하지 않아도 URL로 바로 볼 수 있어요 |

## 구조

```
src/
  core/                 판정 로직. 순수 함수만 둡니다
    schema.ts           Zod 스키마
    types.ts            입력, 결과, 이벤트 타입
    validate.ts         스키마로 잡지 못하는 입력 오류 (중복, 겹치는 예약 등)
    time.ts             date-fns를 감싼 시각 변환과 계산
    estimate.ts         estimateCleaningMinutes
    schedule.ts         작업 순서와 준비 완료 시각 계산
    judge.ts            등급, 대응 시점, 이유
    events.ts           applyEvent (현장 기록 반영)
    index.ts            바깥에 공개하는 함수와 타입
  app/                  Next.js 화면. core의 공개 함수만 호출해요
    _components/        보드(RiskBoard), 간트(Timeline), 현장 기록(FieldPanel), 객실 카드
samples/                시나리오 입력 JSON과 기대 결과
tests/core/             명세 규칙, 현장 기록, 시나리오 테스트
```

## 지키는 규칙

**판정 로직은 화면과 프레임워크를 모릅니다**

- `src/core`는 React와 Next.js를 가져오지 않아요. ESLint `no-restricted-imports`로 막아서 규칙을 어기면 빌드가 실패합니다.
- 화면은 `src/core/index.ts`가 공개한 함수만 호출해요. 안쪽 파일을 직접 가져오지 않습니다.
- 이렇게 나눠 두면 테스트가 화면 없이 판정 로직만 검증하고 PMS와 연결할 때도 입력을 만드는 쪽만 바꾸면 돼요.

**판정 로직은 현재 시각을 읽지 않습니다**

- `src/core` 안에서 `Date.now()`나 인자 없는 `new Date()`를 쓰지 않아요. 판정 시각은 입력의 `asOf`로만 받습니다.
- 같은 입력이면 언제 실행해도 같은 결과가 나와서 테스트가 시간에 따라 흔들리지 않아요.

**청소 시간 추정은 교체할 수 있게 둡니다**

- `estimateCleaningMinutes`는 지금 가정값으로 계산해요. 실제 청소 기록이 쌓이면 이 함수만 바꾸고 작업 순서 계산과 판정은 그대로 둡니다.

**판정 등급 색상은 토큰으로만 씁니다**

- 정상, 주의, 위험 색은 Tailwind 테마 토큰으로 한 번만 정의하고 화면에서는 토큰 이름으로만 써요.
- 등급은 색과 함께 글자로도 표시합니다. 색을 구분하기 어려운 사람도 읽을 수 있어야 해요.

## 버전

Next.js, Tailwind CSS, Zod, Vitest, date-fns는 설정할 때 공식 문서로 현재 버전과 사용법을 확인해요. Tailwind CSS v4는 설정 방식이 v3와 다르고, Zod와 date-fns도 메이저 버전에 따라 API가 달라서 예전 방식이 섞이지 않게 확인합니다. date-fns는 v4부터 시간대 처리를 `@date-fns/tz`로 따로 제공해요.
