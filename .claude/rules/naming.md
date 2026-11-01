---
description: 네이밍 규칙
alwaysApply: true
---

# 네이밍 규칙

## 상수

영문 대문자와 스네이크 케이스(Snake Case)를 사용합니다.

```typescript
// 나쁨
export const constantFoo = // ...

// 좋음
export const CONSTANT_FOO = // ...
```

## Suffix

상황과 목적에 맞는 suffix를 사용합니다.

### API 등 Response key 매핑 - MAPPER

```typescript
export const KINDERGARTEN_MAPPER = {
  NAME: 'name',
  AGE: 'age',
  ADDRESS: 'address',
  // ...
};
```

### Table Column 매핑 - COLUMNS

```typescript
export const KINDERGARTEN_TABLE_DATE_COLUMNS = [
  KINDERGARTEN_MAPPER.CREATED_AT,
  KINDERGARTEN_MAPPER.DELETED_AT,
  // ...
];
```

### Table Header Label 매핑 - COLUMNS_LABELS

```typescript
export const KINDERGARTEN_COLUMNS_LABELS = {
  [KINDERGARTEN_MAPPER.NAME]: '기관명',
  [KINDERGARTEN_MAPPER.CREATED_AT]: '등록일',
  // ...
};
```

### Style 관련 매핑 - STYLES

```typescript
export const KINDERGARTEN_COLUMNS_STYLES = 'bg-gray-03 py-3';
export const KINDERGARTEN_ROWS_STYLES = 'py-3 group-hover:bg-gray-01';
export const KINDERGARTEN_CELLS_STYLES = {
  [KINDERGARTEN_MAPPER.NAME]: 'w-[3rem]',
  [KINDERGARTEN_MAPPER.CREATED_AT]: 'w-[4.5rem]',
  // ...
};

export const BUTTON_STYLES = {
  [BUTTON_COLORS.PRIMARY]: {
    [BUTTON_VARIANTS.FILLED]: {
      [BUTTON_STATUS.DEFAULT]: 'bg-primary-06 text-white hover:bg-primary-07',
      [BUTTON_STATUS.DISABLED]: 'bg-gray-02 text-gray-05',
    },
    // ...
  },
  // ...
};
```

### Status, State 등

```typescript
export const KINDERGARTEN_STATUS = {
  STOP: 'stop',
  NOT_STARTED: 'not-started',
  NOT_STARTED_FREE_TRIAL: 'not-started-free-trial',
  STARTED: 'started',
  TERMINATED: 'terminated',
  DROP: 'drop',
  FREE_TRIAL: 'free-trial',
  // ...
};

export const SEARCH_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  EMPTY: 'empty',
  SUCCESS: 'success',
  // ...
};

export const BUTTON_STATE = {
  DEFAULT: 'default',
  HOVER: 'hover',
  PRESSED: 'pressed',
  DISABLED: 'disabled',
  // ...
};

export const FORM_STEP = {
  ONBOARDING: 'onboarding',
  VERIFICATION_ACCOUNT: 'verification-account',
  VERIFICATION_CODE: 'verification-code',
  RESET_PASSWORD_FORM: 'reset-password-form',
  // ...
};
```

## 함수

카멜 케이스(Camel Case)를 사용합니다.

```typescript
const fooFunc = () => {
  return; // ...
};
```

### Event Callback

`on + {name} + 동사` 규칙을 따릅니다.

```tsx
const Foo = () => {
  const onMenuClick = () => {
    return; // ...
  };

  return <button onClick={onMenuClick}>메뉴</button>;
};
```

### Handler Function

2개 이상의 함수가 실행되는 경우 `handle + {name} + 동사` 규칙을 따릅니다.

```tsx
const Foo = () => {
  const onMenuClick = () => {
    return; // ...
  };

  const onModalToggle = () => {
    return; // ...
  };

  const handleMenuClick = () => {
    onMenuClick();
    onModalToggle();
  };

  return <button onClick={handleMenuClick}>메뉴</button>;
};
```

### API 함수 Prefix

HTTP Method 의미에 따라 함수 Prefix를 맞춥니다.

- `GET` -> `get*`
- `POST` -> `create*`
- `PATCH` -> `update*`
- `PUT` -> `update*`
- `DELETE` -> `delete*`

```typescript
// 좋음
const getTargets = async () => {};
const createTarget = async () => {};
const updateTarget = async () => {};
const deleteTarget = async () => {};
```

### React Query Hook 네이밍

React Query Hook은 Hook 타입에 맞는 suffix를 사용합니다.

- `useQuery` -> `use*Query`
- `useMutation` -> `use*Mutation`

```typescript
// 좋음
const useTargetsQuery = () => {};
const useUpdateTargetMutation = () => {};
```

## 타입

파스칼 케이스(Pascal Case)를 사용합니다.

### type

```typescript
// 나쁨
type fooType = // ...

// 좋음
type FooType = // ...
```

> [ESLint - @typescript-eslint/naming-convention](https://typescript-eslint.io/rules/naming-convention/)

### interface

```typescript
// 나쁨
interface fooInterface {
  // ...
}

// 좋음
interface FooInterface {
  // ...
}
```

> [ESLint - @typescript-eslint/naming-convention](https://typescript-eslint.io/rules/naming-convention/)

## 클래스

파스칼 케이스(Pascal Case)를 사용합니다.

```typescript
// 나쁨
class foo {
  // ...
}

// 좋음
class Foo {
  // ...
}
```

> [ESLint - @typescript-eslint/naming-convention](https://typescript-eslint.io/rules/naming-convention/)

## 컴포넌트

파스칼 케이스(Pascal Case)를 사용합니다.

```typescript
// 나쁨
const foo = () => {
  // ...
};

export default foo;

// 좋음
const Foo = () => {
  // ...
};

export default Foo;
```

## Boolean

`is`, 조동사, `has`, 동사 원형(3인칭 단수) 용법을 사용합니다.

### is + 명사: "(무엇)인가?"

```typescript
// 어드민인가?
const isAdmin = false;
```

### is + 현재진행형(~ing): "~ 하는 중인가?"

```typescript
// 로딩 중인가?
const isLoading = false;
```

### is + 형용사

```typescript
// 열림
const isOpen = false;

// 보이는
const isVisible = false;

// 읽을 수 있는
const isReadable = false;
```

### is + 형용사(과거분사)

```typescript
// 숨겨진
const isHidden = false;

// 인증된
const isAuthorized = false;
```

### 조동사(can) + 동사원형: "~ 할 수 있는가?"

```typescript
// 수정할 수 있는가?
const canEdit = false;
```

### 조동사(should) + 동사원형: "~ 해야 하는가?"

```typescript
// redirect 해야 하는가?
const shouldRedirect = false;
```

### 조동사(will) + 동사원형: "~ 할 것인가?"

```typescript
// 변경될 것인가?
const willChange = false;
```

### has + 명사: "~ 을(를) 가지고 있는가?"

```typescript
// 권한을 가지고 있는가?
const hasPrivilege = false;
```

### has + 과거분사: "~ 이(가) 유지되고 있는가"

```typescript
// 연결이 유지되고 있는가?
const hasConnected = false;
```

### 동사 원형(3인칭 단수)

`supports`: ~을 지원하는가?  
`includes`: ~을 포함하는가?  
`shows`: ~을 보여줄 것인가?  
`allows`: ~을 허용할 것인가?  
`accepts`: ~을 받아 주는가?  
`contains`: ~을 포함하고 있는가?  
etc.

```typescript
// 비디오를 지원하는가?
const supportsVideo = false;

// '사과'를 포함하는가?
const includesApple = false;
```

> [Bool 변수 이름 제대로 짓기 위한 최소한의 영어 문법 · Soojin Ro](https://soojin.ro/blog/naming-boolean-variables)  
> [ESLint - @typescript-eslint/naming-convention](https://typescript-eslint.io/rules/naming-convention/)

## useEffect

`use + {name} + Effect` 규칙을 사용합니다.

```tsx
const useFooEffect = () => {
  useEffect(() => {
    // ...
  }, []);
};

export default useFooEffect;
```

## 한글 네이밍

영문화하기 어려운 경우 한글 네이밍을 사용합니다.

무리한 영문화는 난독을 유발합니다. 변수의 목적을 바로 알 수 있도록 한글 네이밍을 사용합니다.

```typescript
// 나쁨
const samseongDongBbodekKindergarten = '';

// 좋음
const 삼성동뽀득유치원 = '';
```

## 기타

이외의 케이스에는 카멜 케이스를 사용합니다.
