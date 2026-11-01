---
description: 코드 스타일링에 대한 컨벤션을 제공하는 문서입니다.
alwaysApply: true
---

# 코드 스타일 규칙

## 들여쓰기

공백 문자(space) 2개를 사용합니다.

> [Prettier - Tab Width](https://prettier.io/docs/options#tab-width)

## 문장 마무리

문장 마무리는 세미콜론(;)을 사용합니다.

```typescript
// 나쁨
const foo = 0

// 좋음
const foo = 0;
```

> [Prettier - Semicolons](https://prettier.io/docs/options#semicolons)

## 따옴표

홑 따옴표(')를 사용합니다.

```typescript
// 나쁨
const foo = "foo";

// 좋음
const foo = 'foo';
```

> [Prettier - Quotes](https://prettier.io/docs/options#quotes)
