---
description: React + Tailwind CSS 기반으로 작성된 CSS 컨벤션을 제공하는 문서입니다.
alwaysApply: true
---

# CSS 규칙

## 단위

rem 단위를 사용합니다.

## 선언 순서

prettier-plugin-tailwindcss 기준으로 className을 작성합니다.

> [Automatic Class Sorting with Prettier](https://tailwindcss.com/blog/automatic-class-sorting-with-prettier)

## 흐름

부모 → 자식, 왼쪽 → 오른쪽 흐름 기준으로 CSS를 작성합니다.

```html
<!-- 나쁨 -->
<div>
  <div className='m-2'>...</div>
</div>

<!-- 좋음 -->
<div className='p-2'>
  <div>...</div>
</div>
```

```html
<!-- 나쁨 -->
<div className='flex'>
  <div>...</div>
  <div className='ml-1'>...</div>
</div>

<!-- 좋음 -->
<div className='flex'>
  <div className='mr-1'>...</div>
  <div>...</div>
</div>
```

## 간격

균일한 간격이 필요할 경우 flex 혹은 grid를 통한 gap 속성을 사용합니다.

```tsx
// 나쁨
const Foo = () => {
  return (
    <ul>
      {items.map((item) => {
        return <li className='mb-1 last:mb-0'>{item}</li>;
      })}
    </ul>
  );
};

// 좋음
const Foo = () => {
  return (
    <ul className='flex flex-col gap-1'>
      {items.map((item) => {
        return <li>{item}</li>;
      })}
    </ul>
  );
};
```

## 선택자

태그 선택자 사용은 지양합니다.

태그 선택자는 의도치 않은 스타일 충돌을 일으킬 수 있습니다.

## !important

!important 플래그 사용은 지양합니다.

CSS 우선순위 싸움을 야기하고, 장기적으로 유지보수를 어렵게 만듭니다.

## 애니메이션/위치 변경

애니메이션 등 요소의 위치 변경이 필요할 경우 레이아웃 시프트(layout shift)를 최소화하여 변경합니다.

top/left 등의 position offset을 변경하여 요소의 위치를 변경할 경우 layout 단계부터 다시 그려야 하는 'reflow'가 발생합니다. 이는 부자연스러운 애니메이션, 웹 성능 저하를 야기합니다.

웹 렌더링 레이어를 단계별로 이해하고 고려하여 변경을 진행해야 합니다.

```html
<!-- 나쁨 - layout 단계 부터 다시 시작 -->
<div className='relative top-0 left-0 transition-all duration-300 hover:top-4 hover:left-4'>
  움직임
</div>

<!-- 좋음 - composite 단계만 진행 -->
<div className='transform transition-transform duration-300 hover:translate-x-4 hover:translate-y-4'>
  부드러운 이동
</div>
```

> [Rendering performance | Articles | web.dev](https://web.dev/rendering-performance/)
