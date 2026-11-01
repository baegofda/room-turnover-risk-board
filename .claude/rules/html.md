---
description: HTML 태그는 웹 접근성과 밀접한 관련이 있습니다. 해당 문서는 최소한의 가이드라인만 명시하고 있으며 상황에 맞는 HTML 태그를 사용합니다.
alwaysApply: true
---

# HTML 규칙

## Semantic Markup

Semantic Markup을 준수합니다.

div 태그는 아무런 의미를 가지고 있지 않습니다.

의도와 상황에 맞는 태그를 사용하여 개발자 혹은 유저에게 의도된 바를 제공할 수 있도록 합니다.

```tsx
// 나쁨
const Foo = () => {
  return (
    <div>
      <div>아이템1</div>
      <div>아이템2</div>
    </div>
  );
};

// 좋음
const Foo = () => {
  return (
    <ul>
      <li>아이템1</li>
      <li>아이템2</li>
    </ul>
  );
};
```

```tsx
// 나쁨
const Foo = () => {
  const onClick = () => // ...
  return (
    <div onClick={onClick}>
      버튼
    </div>
  );
};

// 좋음
const Foo = () => {
  const onClick = () => // ...
  return (
    <button onClick={onClick}>
      버튼
    </button>
  );
};
```

> [Semantic Markup](https://developer.mozilla.org/ko/docs/Glossary/Semantics)

## 태그

태그 = 데이터입니다. 불필요한 태그는 작성하지 않습니다.

최소한의 태그를 사용하여 네트워크 측면 그리고 개발자의 시각적 데이터를 최소화하여 가독성을 향상시키고 성능 이점을 가져올 수 있도록 합니다.

```tsx
// 나쁨
const Foo = () => {
  return (
    <div className='p-4'>
      <ul>
        <li>아이템1</li>
        <li>아이템2</li>
      </ul>
    </div>
  );
};

// 좋음
const Foo = () => {
  return (
    <ul className='p-4'>
      <li>아이템1</li>
      <li>아이템2</li>
    </ul>
  );
};
```

> [Semantics - Glossary | MDN](https://developer.mozilla.org/ko/docs/Glossary/Semantics)

## Heading

Heading 태그를 통해 페이지의 명확한 구조화를 진행합니다.

단, 페이지 당 h1은 1개만 존재해야 합니다.

```tsx
// 나쁨
const Foo = () => {
  return (
    <div>
      <h3>유저 정보</h3>
      <div>
        <h2>기본 정보</h2>
        <div>
          <h3>연락처 정보</h3>
        </div>
        <div>
          <h3>주소 정보</h3>
        </div>
      </div>
      <div>
        <h2>결제 정보</h2>
        <div>
          <h3>계좌 정보</h3>
        </div>
        <div>
          <h3>현금영수증 정보</h3>
        </div>
      </div>
    </div>
  );
};

// 좋음
const Foo = () => {
  return (
    <main>
      <h1>유저 정보</h1>
      <section>
        <h2>기본 정보</h2>
        <section>
          <h3>연락처 정보</h3>
        </section>
        <section>
          <h3>주소 정보</h3>
        </section>
      </section>
      <section>
        <h2>결제 정보</h2>
        <section>
          <h3>계좌 정보</h3>
        </section>
        <section>
          <h3>현금영수증 정보</h3>
        </section>
      </section>
    </main>
  );
};
```

만약, Heading 태그를 노출 시킬 수 없는 상황일 경우 sr-only utility class를 사용합니다.

```tsx
const Foo = () => {
  return (
    <main>
      <h1 className='sr-only'>유저 정보</h1>
      <section>
        <h2>기본 정보</h2>
        <section>
          <h3>연락처 정보</h3>
        </section>
        <section>
          <h3>주소 정보</h3>
        </section>
      </section>
      <section>
        <h2>결제 정보</h2>
        <section>
          <h3>계좌 정보</h3>
        </section>
        <section>
          <h3>현금영수증 정보</h3>
        </section>
      </section>
    </main>
  );
};
```

> [h1-h6: HTML 구획 제목 요소 - HTML: Hypertext Markup Language | MDN](https://developer.mozilla.org/ko/docs/Web/HTML/Element/Heading_Elements)  
> [HeadingsMap - Chrome Web Store](https://chrome.google.com/webstore/detail/headingsmap/flbjommegcjonpdmenkdiocclhjacmbi)
