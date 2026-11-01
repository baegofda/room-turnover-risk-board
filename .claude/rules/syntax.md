---
description: 문법 & 구조 규칙
alwaysApply: true
---

# 문법 & 구조

## 문자 합성

템플릿 리터럴을 사용합니다.

```typescript
// 나쁨
const recommendString = 'Template literals';
const message = 'We recommend using' + ' ' + recommendString + '.';
console.log(message); // 'We recommend using Template literals.'

// 좋음
const recommendString = 'Template literals';
const message = `We recommend using ${recommendString}.`;
console.log(message); // 'We recommend using Template literals.'
```

> [Template literals - JavaScript | MDN](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Template_literals)  
> [ESLint - prefer-template](https://eslint.org/docs/latest/rules/prefer-template)

## 객체 접근

점 표기법(Dot Notation)을 사용합니다.

```typescript
// 나쁨 - 괄호표기법(Bracket Notation)
const value = data['depth1']['depth2'];

// 좋음
const value = data.depth1.depth2;
```

접근 depth는 2depth로 제한합니다.

```typescript
// 나쁨
const value = data.depth1.depth2.depth3;

// 좋음
const { depth1 } = data;
const value = depth1.depth2.depth3;

// 좋음
const { depth2 } = data.depth1;
const value = depth2.depth3;
```

> [ESLint - no-restricted-syntax](https://eslint.org/docs/latest/rules/no-restricted-syntax)

변수 등을 통한 동적 접근/할당 시 괄호 표기법(Bracket Notation)을 사용합니다.

```typescript
// 접근
const queryValue = router.query[QUERY_KEY];

// 할당
const obj = {
  name: 'foo',
  age: 31,
};
obj[KEY] = value;
```

> [Property accessors - JavaScript | MDN](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Operators/Property_accessors)

## 스코프 구문

줄 바꿈과 중괄호({})를 사용하여 스코프 구분을 명확히 합니다.

```typescript
const foo = () => {
  if (...) {
    return // ...
  };
  return defaultReturn;
};
```

Early Return 구문과 default return의 경우 한 줄 표현을 허용합니다.

```typescript
const foo = () => {
  if (isEarlyReturn) return null;
  if (...) {
    return // ...
  };
  return defaultReturn;
};
```

## if 문

if-else 구조 대신 다중 if 문을 사용합니다.

```typescript
// 나쁨
const foo = () => {
  if(조건1) {
    return // ...
  } else if (조건2) {
    return // ...
  } else {
    return // ...
  };
};

// 좋음
const foo = () => {
  if(조건1) {
    return // ...
  };
  if (조건2) {
    return // ...
  };
  return // ...
};
```

단, if 아래는 줄 바꿈을 합니다.

```typescript
// 나쁨
const foo = () => {
  if(조건1) {
    return // ...
  };
  if (조건2) {
    return // ...
  };
  if (조건3) {
    return // ...
  };
  return // ...
};

// 좋음
const foo = () => {
  if(조건1) {
    return // ...
  };

  if (조건2) {
    return // ...
  };

  if (조건3) {
    return // ...
  };

  return // ...
};
```

## 비교 연산자

삼중 등호 연산자만 사용합니다.

```typescript
// 나쁨
const isEqual = value1 == value2;
const isDifferent = value1 != value2;

// 좋음
const isEqual = value1 === value2;
const isDifferent = value1 !== value2;
```

> [Equality comparisons and sameness - JavaScript | MDN](https://developer.mozilla.org/ko/docs/Web/JavaScript/Equality_comparisons_and_sameness)  
> [ESLint - eqeqeq](https://eslint.org/docs/latest/rules/eqeqeq)

## return 문

return 문 바로 위는 줄 바꿈을 합니다.

```typescript
// 나쁨
const foo = () => {
  if (...) {
    return // ...
  }; 
  return defaultReturn;
};

// 좋음
const foo = () => {
  if (...) {
    return // ...
  };

  return defaultReturn;
};
```

단, return 문 단일 로직일 경우 줄 바꿈을 하지 않습니다.

```typescript
// 함수
const foo = () => {
  return // ...
};

// 컴포넌트
const Foo = () => {
  return <ChildComponent />;
};
```

> [ESLint - @stylistic/padding-line-between-statements](https://eslint.style/rules/js/padding-line-between-statements)

## 삼항 연산자

조건문은 삼항 연산자로 대체 가능합니다.

```typescript
// 가능
const foo = () => {
  if (조건) {
    return 'foo';
  };
  return 'bar';
};

// 가능
const foo = 조건1 ? 'foo' : 'bar';
```

단, 중첩 삼항 연산자는 허용하지 않습니다.

```typescript
// 나쁨
const foo = 조건1 ? 조건2 ? 'foo' : 'baz' : 'bar';

// 좋음
const foo = () => {
  if (조건1) {
    return 조건2 ? 'foo' : 'baz';
  };
  return 'bar';
};

// 좋음
const foo = () => {
  if (조건1) {
    if (조건2) {
      return 'foo';
    };
    return 'baz';
  };
  return 'bar';
};
```

> [ESLint - no-nested-ternary](https://eslint.org/docs/latest/rules/no-nested-ternary)

## export

component와 hooks는 export만 사용합니다. 즉, default exports를 사용합니다.

```typescript
// 나쁨
export const Foo = () => {
  return // ...
};

// 좋음
const Foo = () => {
  return // ...
};

export default Foo;
```

```typescript
// 나쁨
export const useFoo = () => {
  return // ...
};

// 좋음
const useFoo = () => {
  return // ...
};

export default useFoo;
```

이외의 파일(constants, type, utils, etc.)에서는 다중 export를 사용합니다. 즉, named exports를 사용합니다.

```typescript
export const foo = () => {
  return // ...
};

export const bar = () => {
  return // ...
};
```

> [export - JavaScript | MDN](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Statements/export)
