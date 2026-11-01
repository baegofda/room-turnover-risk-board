---
description: 로직 작성 시 사용하는 JavaScript 문법과 구조에 대한 컨벤션을 제공하는 문서입니다.
alwaysApply: true
---

# 선언 규칙

## 변수

var를 제외한 let, const를 사용합니다.

const 사용을 지향하고 재할당이 필요한 경우에 let을 사용합니다.

```typescript
// 나쁨
var foo = 'foo';

// 좋음
let foo = 'foo';

// 좋음
const foo = 'foo';
```

> [ESLint - no-unused-vars](https://eslint.org/docs/latest/rules/no-unused-vars)

## 상수

동일 관심사의 상수는 객체로 그룹핑 합니다.

```typescript
// 나쁨
const LOADING_STATUS_IDLE = 'IDLE';
const LOADING_STATUS_PENDING = 'PENDING';
const LOADING_STATUS_SUCCESS = 'SUCCESS';
const LOADING_STATUS_FAIL = 'FAIL';

// 좋음
const LOADING_STATUS = {
  IDLE: 'IDLE',
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAIL: 'FAIL',
};
```

## 함수

함수 표현식과 화살표 함수를 사용합니다.

```typescript
// 나쁨
function foo() {
  return; // ...
}

// 나쁨
const foo = function () {
  return; // ...
};

// 좋음
const foo = () => {
  return; // ...
};
```

> [함수 표현식 - JavaScript | MDN](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Operators/function)  
> [ESLint - eslint-plugin-prefer-arrow-functions](https://github.com/TristonJ/eslint-plugin-prefer-arrow-functions)

## 파라미터

함수의 파라미터는 Destructuring Parameters를 사용합니다.

함수 사용 시 선언된 파라미터의 위치와 상관없이 사용이 가능하고 특정 파라미터를 사용하지 않을 경우에도 유연하게 대처할 수 있는 Destructuring Parameters를 사용합니다.

```typescript
// 나쁨
const foo = (param1, param2, param3) => {
  return; // ...
};

foo(param1, param3, param2); // 잘못된 사용 발생

// 좋음
const foo = ({ param1, param2, param3 }) => {
  return; // ...
};

foo({ param1, param3, param2 }); // 정상 동작
```

단, eventCallback 등의 상황에 따라 Default Parameter 사용을 허용합니다.

```tsx
const Foo = () => {
  const onClick = e => {
    console.log(e);
  };

  return <button onClick={onClick}>bar</button>;
};
```

> [Destructuring - JavaScript | MDN](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment)

## React Query와 데이터 요청 분리

`queryFn`, `mutationFn` 내부에 직접 데이터 패치 로직(Supabase/Axios/fetch)을 작성하지 않습니다.

요청 함수(api layer)와 React Query Hook(hook layer)을 분리합니다.

```typescript
// api.ts
const getTargets = async () => {
  return request(...);
};

const updateTarget = async ({ id, params }) => {
  return request(...);
};

// hooks.ts
const useTargetsQuery = () => {
  return useQuery({
    queryFn: getTargets,
    queryKey: TARGET_QUERY_KEYS.ALL,
  });
};

const useUpdateTargetMutation = () => {
  return useMutation({
    mutationFn: updateTarget,
  });
};
```

또한 mutation 호출은 `mutate` 대신 `mutateAsync`를 사용하고, `onSuccess/onError` 옵션보다 `try/catch` 흐름을 우선합니다.
