---
description: Storybook 규칙
alwaysApply: true
---

# Storybook 규칙

## 파일 네이밍

`{name}.stories.tsx` 형식을 사용합니다.

각 스토리북 대상에 맞는 네이밍 컨벤션에 맞게 작성합니다.

```typescript
// component
Component.stories.tsx

// util
util.stories.tsx

// effect
useNameEffect.stories.tsx
```

## Meta

### title

`core/{project}/{name}` 규칙을 따릅니다.

```typescript
const meta: Meta<typeof Alert> = {
  title: 'core/internal-ui/Alert',
};
```

### component

컴포넌트 스토리북의 경우에만 작성합니다.

스토리북에 표시할 실제 컴포넌트를 import 후 component 필드에 등록합니다.

```typescript
import { Alert } from '@bbodek/internal-ui';

const meta: Meta<typeof Alert> = {
  component: Alert,
};
```

### argTypes

스토리북에 표시되는 컴포넌트 또는 함수가 받는 모든 파라미터를 정의합니다.

각 옵션은 Storybook Docs의 ArgTypes 규칙을 따릅니다.

```typescript
import { Alert } from '@bbodek/internal-ui';

const meta: Meta<typeof Alert> = {
  argTypes: {
    title: {
      // ...
    },
    useClose: {
      // ...
    },
    // ...
  },
};
```

#### description (필수)

argType에 대한 간결한 설명을 작성합니다.

```typescript
theme: {
  description: 'Alert theme',
},
```

#### control

Docs 패널에서 해당 prop의 값을 변경할 수 있도록 control 타입을 지정합니다.

```typescript
theme: {
  control: 'select',
},
```

#### type (조건부 필수)

argType의 타입 정보를 작성합니다.

필수 항목인 경우 required: true를 포함한 객체 형태로 작성합니다.

```typescript
// Required ❌
title: {
  type: 'string',
},

// Required ⭕️
title: {
  type: {
    name: 'string',
    required: true,
  },
},
```

#### options (조건부 필수)

`control: 'select'`로 지정한 경우 필수로 작성해야 합니다.

```typescript
theme: {
  options: Object.values(ALERT_THEMES),
},
```

#### table (조건부 필수)

enum 타입 정의나 defaultValue 명시 또는 카테고리 그룹화가 필요할 경우 작성합니다.

enum 또는 커스텀 타입 정의 시 필수로 작성하며, generateArgTypeSummary 유틸을 활용할 수 있습니다.

```typescript
theme: {
  table: {
    type: {
      summary: generateArgTypeSummary({
        options: Object.values(ALERT_THEMES),
      }),
    },
    defaultValue: {
      summary: ALERT_THEMES.PRIMARY,
    },
  },
},
```

#### etc

그 외 argType들은 Docs에 명세된 규칙에 따라 자유롭게 작성합니다.

> [ArgTypes | Storybook docs](https://storybook.js.org/docs/react/api/argtypes)

## Story

### args

각 파라미터의 기본값을 지정합니다.

```typescript
export const Default: Story = {
  args: {
    title: '타이틀이 들어갑니다',
    content: '내용이 들어갑니다',
    className: 'w-[500px]',
  },
};
```

### render

DOM 변경이 필요하거나 useState, useEffect 등 훅 또는 함수 사용이 필요할 경우 render를 사용합니다.

```typescript
export const WithCollapsible: Story = {
  args: {
    title: '타이틀이 들어갑니다',
    content: '내용이 들어갑니다',
    className: 'w-[500px]',
    collapsible: true,
  },
  render: (args) => {
    const [value, setValue] = useState('');

    return (
      <div className='in-flex-v-stack gap-y-2'>
        {value}
        {Object.values(ALERT_THEMES).map((theme) => (
          <Alert key={theme} {...args} theme={theme} />
        ))}
      </div>
    );
  },
};
```

> [How to write stories | Storybook docs](https://storybook.js.org/docs/react/writing-stories/introduction)
