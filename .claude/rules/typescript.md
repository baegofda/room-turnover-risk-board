---
description: TypeScript 코드 작성에 대한 컨벤션을 제공하는 문서입니다.
alwaysApply: true
---

# TypeScript 규칙

## 타입 분리

구현 파일(`*.tsx`, `*.ts`) 내 `interface`, `type` 선언을 지양하고 `*.ts`에 분리합니다.

```typescript
// 나쁨 - 구현 파일 내 타입 선언
// Foo.tsx
interface FooProps {
  value: string;
}

// 좋음
// Foo.ts
interface FooProps {
  value: string;
}

// Foo.tsx
import type { FooProps } from './Foo';
```

## interface 우선 사용

타입 선언 시 `type`보다 `interface` 사용을 우선합니다.

- 기본 원칙: `Props`, DTO, API 응답, 도메인 모델 등 객체 구조는 `interface`로 선언합니다.
- 팀 일관성: `Props`는 기본적으로 `interface`를 사용합니다.
- 예외: 유니온/인터섹션/매핑/조건부 타입 등 `type`이 더 적합한 경우에는 `type`을 사용합니다.
- 확장 가능성이 있는 구조(`extends`, declaration merging 가능성)는 `interface`를 사용합니다.

```typescript
// 나쁨
type User = {
  id: string;
  name: string;
};

// 좋음
interface User {
  id: string;
  name: string;
}

// 좋음 - Props는 기본적으로 interface
interface ExcelDownloadButtonProps {
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

// 좋음 - 유니온 type 사용
type LoadingState = LOADING_STATE.IDLE | LOADING_STATE.LOADING | LOADING_STATE.SUCCESS | LOADING_STATE.ERROR;

// 좋음 - 제너릭 분기(조건부 타입)는 type 사용
type ApiResult<T> = T extends Error
  ? { ok: false; error: T }
  : { ok: true; data: T };
```

## 중복

중복된 타입은 Utility Types를 사용하여 상속 혹은 참조할 수 있도록 합니다.

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  age: number;
}

// 나쁨 - 중복 선언
interface UserPreview {
  id: string;
  name: string;
  email: string;
}

// 좋음 - Pick을 이용한 상속
interface UserPreview extends Pick<User, 'id' | 'name' | 'email'> {}
```

> [Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)

## 타입 상속

기존 타입과 관계가 있는 타입을 선언할 때는 새로 정의하지 않고 `extends` 또는 Utility Types를 활용하여 상속합니다.

상속 가능한 구조임에도 새로 정의하면 변경 시 두 곳을 동시에 수정해야 하고, 타입 간 관계가 코드에 드러나지 않습니다.

```typescript
interface BaseButtonProps {
  disabled?: boolean;
  onClick?: () => void;
}

// 나쁨 - 기존 타입과 관계가 있음에도 새로 정의
interface IconButtonProps {
  disabled?: boolean;
  onClick?: () => void;
  icon: React.ReactNode;
}

// 좋음 - extends로 상속
interface IconButtonProps extends BaseButtonProps {
  icon: React.ReactNode;
}
```

일부 필드만 변경이 필요한 경우도 Utility Types를 조합하여 상속합니다.

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// 나쁨 - 관련 타입임에도 독립 선언
interface CreateUserPayload {
  name: string;
  email: string;
}

// 좋음 - Omit으로 불필요한 필드 제거
interface CreateUserPayload extends Omit<User, 'id' | 'createdAt'> {}

// 좋음 - 일부 필드를 선택적으로 변경
interface UpdateUserPayload extends Partial<Omit<User, 'id' | 'createdAt'>> {}
```

> [Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)

## 추론

불필요한 타입 애너테이션(Type Annotation)은 지양합니다.

표현식 기반 타입 추론(Expression-based Interface)과 컨텍스트 기반 타입 추론(Contextual Typing)으로 자동 추론될 경우 명시적 타입 애너테이션은 생략합니다.

```typescript
// 나쁨
const makeFullName = ({
  first,
  last,
}: {
  first: string;
  last: string;
}): string => {
  return `${first} ${last}`;
};

// 좋음
const makeFullName = ({ first, last }: { first: string; last: string }) => {
  return `${first} ${last}`;
};
```

```typescript
// 나쁨
const add = ({ a, b }: { a: number; b: number }): number => {
  return a + b;
};

// 좋음
const add = ({ a, b }: { a: number; b: number }) => {
  return a + b;
};
```

단, 파라미터 타입 리터럴 인라인 선언(`({ foo }: { foo: string })`)도 지양하고 별도 타입 파일에 선언하여 import 합니다.

## any

명시적 any는 사용하지 않습니다.

불가피할 시 unknown을 사용합니다.

> [ESLint - @typescript-eslint/no-explicit-any](https://typescript-eslint.io/rules/no-explicit-any)

## 타입 축소(Narrowing)

예측 가능하게 명확히 추론될 수 있도록 합니다.

TypeScript는 사용되는 데이터를 예측 가능할 수 있도록 하여 에러를 사전에 방지함에 목적도 있습니다.

하여, 실제 로직 상 다뤄지는 데이터만 추론이 될 수 있도록 하고 에러를 방지할 수 있도록 해야 합니다.

```typescript
interface User {
  id: number;
  name: string;
  age: number;
}

interface Users extends User[] {}

// 나쁨 - getName 파라미터 타입 축소 필요
const Foo = () => {
  const users = [
    { id: 0, name: 'foo', age: 30 },
    { id: 1, name: 'bar', age: 31 },
    // ...
  ];

  const getName = ({ name }: User) => {
    console.log(name);
  };

  return (
    <ul>
      {users.map(({ id, name, age }) => {
        return (
          <li key={id}>
            {name}
            {age}
            <button onClick={() => getName({name})}>이름 복사</button>
          </li>
        );
      })}
    </ul>
  );
};

// 좋음 - Pick Utility Types 활용
const Foo = () => {
  const users = [
    { id: 0, name: 'foo', age: 30 },
    { id: 1, name: 'bar', age: 31 },
    // ...
  ];

  const getName = ({ name }: Pick<User, 'name'>) => {
    console.log(name);
  };

  return (
    <ul>
      {users.map(({ id, name, age }) => {
        return (
          <li key={id}>
            {name}
            {age}
            <button onClick={() => getName({name})}>이름 복사</button>
          </li>
        );
      })}
    </ul>
  );
};
```

> [Documentation - Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

## 유니온 타입 상수화

문자열 유니온 타입은 리터럴을 직접 선언하지 않고 상수 객체를 먼저 선언한 뒤 `typeof`/`keyof`로 참조합니다.

```typescript
// 나쁨
type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// 좋음
const LOADING_STATE = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

type LoadingState = (typeof LOADING_STATE)[keyof typeof LOADING_STATE];
```

실제 로직에서도 문자열 리터럴 대신 상수로 참조합니다.

```typescript
if (state === LOADING_STATE.IDLE) {
  // ...
}
```
