---
description: React 기반 프로젝트 진행과 JSX 문법에 대한 컨벤션을 제공하는 문서입니다.
alwaysApply: true
---

# React & JSX 규칙

## attribute & props

홑 따옴표(')를 이용한 string 형식을 사용합니다.

```tsx
// 나쁨
const Foo = () => {
  return <ChildComponent prop={'prop'} />;
};

// 좋음
const Foo = () => {
  return <ChildComponent prop='prop' />;
};
```

> [Prettier - jsxSingleQuote](https://prettier.io/docs/options#jsx-single-quote)  
> [ESLint - eslint-plugin-react/jsx-curly-brace-presence](https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/jsx-curly-brace-presence.md)

변수 혹은 조건문을 사용할 경우 중괄호({})를 사용합니다.

```tsx
const Foo = () => {
  return <ChildComponent prop={value} />;
};

const Foo = () => {
  return <ChildComponent prop={조건 ? value1 : value2} />;
};
```

boolean 타입의 true는 값 명시를 생략합니다.

이때, 다른 attribute & props와 함께 사용할 경우 후순위로 선언합니다.

```tsx
// 나쁨
const Foo = () => {
  return <ChildComponent isBoolean={true} />;
};

// 좋음
const Foo = () => {
  return <ChildComponent isBoolean />;
};
```

```tsx
// 나쁨
const Foo = () => {
  return <ChildComponent isBoolean prop={value} />;
};

// 좋음
const Foo = () => {
  return <ChildComponent prop={value} isBoolean />;
};
```

> [ESLint - eslint-plugin-react/jsx-boolean-value](https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/jsx-boolean-value.md)  
> [ESLint - eslint-plugin-react/jsx-sort-props](https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/jsx-sort-props.md)

## Props Drilling

컴포넌트 간의 Props 전달은 2회로 제한합니다.

Props Drilling은 컴포넌트 간의 과도한 결합력, 그로 인해 유지 보수 및 재사용성 관점에 문제가 생길 수 있습니다.

컴포넌트 합성(Composition) 패턴 혹은 Context API를 활용하여 해결합니다.

```tsx
// Props Drilling
const Foo = () => {
  const [userName, setUserName] = useState('bar');

  return (
    <div>
      Foo
      <ParentComponent userName={userName} />
    </div>
  );
};

// userName을 실제로 사용하지 않지만 전달만 진행
const ParentComponent = ({ userName }) => {
  return (
    <div>
      {/* ... */}
      ParentComponent
      <ChildComponent2 userName={userName} />
    </div>
  );
};

// name을 실제로 사용하지 않지만 전달만 진행
const ChildComponent2 = ({ userName }) => {
  return (
    <>
      {/* ... */}
      ChildComponent2
      <ChildComponent3 userName={userName} />
    </>
  );
};

const ChildComponent3 = ({ userName }) => {
  return <strong>{userName}</strong>;
};
```

### 컴포넌트 합성(Composition) 패턴

```tsx
const Foo = () => {
  const [userName, setUserName] = useState('bar');

  return (
    <div>
      Foo
      <ParentComponent>
        <ChildComponent2 />
        <ChildComponent3 userName={userName} />
      </ParentComponent>
    </div>
  );
};

const ParentComponent = ({ children }) => {
  return (
    <div>
      {/* ... */}
      ParentComponent
      {children}
    </div>
  );
};

const ChildComponent2 = () => {
  return (
    <>
      {/* ... */}
      ChildComponent2
    </>
  );
};

const ChildComponent3 = ({ userName }) => {
  return <strong>{userName}</strong>;
};
```

### Context API 사용

단, Context API는 상태 변화 시 불필요한 re-rendering을 야기합니다. 때문에 사용을 지양합니다.

```tsx
const UserContext = createContext(undefined);

export const UserProvider = ({ children }) => {
  const [userName, setUserName] = useState('bar');

  return (
    <UserContext.Provider value={{ userName, setUserName }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextValue => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser는 UserProvider 안에서만 사용 가능합니다.');
  return ctx;
};

const Foo = () => {
  return (
    <UserProvider>
      <div>
        Foo
        <ParentComponent>
          <ChildComponent2 />
          <ChildComponent3 />
        </ParentComponent>
      </div>
    </UserProvider>
  );
};

const ParentComponent = ({ children }) => {
  return (
    <div>
      {/* ... */}
      ParentComponent
      {children}
    </div>
  );
};

const ChildComponent2 = () => {
  return (
    <>
      {/* ... */}
      ChildComponent2
    </>
  );
};

const ChildComponent3 = () => {
  const { userName } = useUser();
  return <strong>{userName}</strong>;
};
```

> [Passing Data Deeply with Context – React](https://react.dev/learn/passing-data-deeply-with-context)  
> [Creating React Components with the Composition Pattern](https://www.telerik.com/blogs/react-component-composition-patterns)

## useEffect

useEffect는 컴포넌트 내에 선언하지 않고 분리하여 사용합니다.

useEffect는 실행 순서가 보장되지 않고 다수 사용할 경우 유지 보수/디버깅 등에 취약합니다.

때문에 window 접근, 클라이언트 초기화 등등 필요한 상황을 제외하고는 사용을 지양합니다.

상태 변화 등은 유저 이벤트를 통하여 관리합니다.

```tsx
// hooks/effects/useScrollEffect.ts
const useStickyScrollEffect = () => {
  const [sticky, setSticky] = useState(false);

  const onStickyScroll = () => setSticky(window.scrollY >= 50);

  useEffect(() => {
    window.addEventListener('scroll', onStickyScroll);
    return () => window.removeEventListener('scroll', onStickyScroll);
  }, []);
};

// components/Foo.tsx
const Foo = () => {
  useStickyScrollEffect();
  return // ...
};
```

## Status

Loading, Pending 등 기본적으로 boolean 타입으로 관리합니다.

이때, boolean 네이밍 규칙을 준수합니다.

```tsx
// 나쁨 - 네이밍 규칙 미준수
const Foo = () => {
  const [searching, setSearching] = useState<boolean>(false);
  if (searching) return <LoadingComponent />;
  return // ...
};

// 좋음
const Foo = () => {
  const [isSearching, setIsSearching] = useState<boolean>(false);
  if (isSearching) return <LoadingComponent />;
  return // ...
};
```

단, 3개 이상의 상태가 필요할 경우 문자열 리터럴 타입(String Literal Types)을 사용합니다.

null 혹은 undefined 등을 추가하여 사용할 경우 falsy 체크가 모호해질 수 있으며 유지 보수/디버깅 등 어려움을 야기합니다.

또, 다수의 status를 명확히 명시할 수 있기에 상태에 따른 풍부한 UI/UX 제공이 가능합니다.

```tsx
// 나쁨
const Foo = () => {
  const [isSearching, setIsSearching] = useState<boolean | null>(null);
  if (isSearching === null) return // ...
  if (isSearching === true) return <LoadingComponent />;
  return // ...
};

// 좋음
export const SEARCH_STATUS = {
  IDLE: 'IDLE',
  LOADING: 'LOADING',
  EMPTY: 'EMPTY',
  SUCCESS: 'SUCCESS',
  FAIL: 'FAIL',
} as const;

export type SearchStatus = (typeof SEARCH_STATUS)[keyof typeof SEARCH_STATUS];

const Foo = () => {
  const [searchStatus, setSearchStatus] = useState<SearchStatus>(SEARCH_STATUS.IDLE);
  if (searchStatus === SEARCH_STATUS.LOADING) return <LoadingComponent />;
  if (searchStatus === SEARCH_STATUS.EMPTY) return <EmptyComponent />;
  if (searchStatus === SEARCH_STATUS.FAIL) return <FailComponent />;
  return // ...
};
```

> [Handbook - Literal Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types)  
> [What are string literal types in TypeScript ? - GeeksforGeeks](https://www.geeksforgeeks.org/what-are-string-literal-types-in-typescript/)

## Multi-Step Form

Multi-Step Form 형식 관리 시 문자열 리터럴 타입(String Literal Types)으로 관리합니다.

문자열 리터럴 타입으로 관리하게 되면 특정 step에서 어떤 데이터를 관리하고 있는지 의도를 명확히 할 수 있습니다.

또, step 간 유지 보수 및 전환에도 유연합니다.

```tsx
// 나쁨
const RegisterForm = () => {
  // ...
  if (value1 === null && value2 === null && value3 === null) return <InfoStep />;
  if (value1 !== null && value2 === null && value3 === null) return <ContractStep />;
  if (value1 !== null && value2 !== null && value3 === null) return <PaymentStep />;
  if (value1 !== null && value2 !== null && value3 !== null) return <ConfirmStep />;
  return <CompleteStep />;
};

// 좋음
export const REGISTER_STEPS = {
  INFO: 'INFO',
  CONTRACT: 'CONTRACT',
  PAYMENT: 'PAYMENT',
  CONFIRM: 'CONFIRM',
  COMPLETE: 'COMPLETE',
} as const;

export type RegisterSteps = (typeof REGISTER_STEPS)[keyof typeof REGISTER_STEPS];

const RegisterForm = () => {
  const [registerStep, setRegisterStep] = useState<RegisterSteps>(REGISTER_STEPS.INFO);
  if (registerStep === REGISTER_STEPS.INFO) return <InfoStep />;
  if (registerStep === REGISTER_STEPS.CONTRACT) return <ContractStep />;
  if (registerStep === REGISTER_STEPS.PAYMENT) return <PaymentStep />;
  if (registerStep === REGISTER_STEPS.CONFIRM) return <ConfirmStep />;
  return <CompleteStep />;
};
```

```tsx
// 좋음
export const REGISTER_STEPS = {
  INFO: 'INFO',
  CONTRACT: 'CONTRACT',
  PAYMENT: 'PAYMENT',
  CONFIRM: 'CONFIRM',
  COMPLETE: 'COMPLETE',
} as const;

export type RegisterSteps = (typeof REGISTER_STEPS)[keyof typeof REGISTER_STEPS];

export const STEP_COMPONENTS: Record<RegisterSteps, React.FC> = {
  INFO: InfoStep,
  CONTRACT: ContractStep,
  PAYMENT: PaymentStep,
  CONFIRM: ConfirmStep,
  COMPLETE: CompleteStep,
};

export const MultiStepForm = () => {
  const [currentStep, setCurrentStep] = useState<RegisterSteps>(REGISTER_STEPS.INFO);
  const ActiveStep = STEP_COMPONENTS[currentStep];
  return <ActiveStep />;
};
```

## Key Prop

배열 형식의 데이터를 렌더링 할 시 고유한 값을 사용하여 key prop을 제공합니다.

```tsx
// 나쁨
const Foo = () => {
  const items = [
    { uuid: 'uuid1', ... },
    { uuid: 'uuid2', ... },
    { uuid: 'uuid3', ... },
  ];

  return (
    <ul>
      {items.map((item, key) => {
        return <li key={key}>{item}</li>;
      })}
    </ul>
  );
};

// 좋음
const Foo = () => {
  const items = [
    { uuid: 'uuid1', ... },
    { uuid: 'uuid2', ... },
    { uuid: 'uuid3', ... },
  ];

  return (
    <ul>
      {items.map((item) => {
        return <li key={item.uuid}>{item.name}</li>;
      })}
    </ul>
  );
};
```

> [Rendering Lists – React](https://react.dev/learn/rendering-lists)

## 타입 참조

글로벌 React namespace를 통한 참조가 아닌 Named import를 사용합니다.

```tsx
// 나쁨
export interface Props extends React.HTMLAttributes<HTMLSpanElement> {
  // ...
}

// 좋음
import { HTMLAttributes } from 'react';

export interface Props extends HTMLAttributes<HTMLSpanElement> {
  // ...
}
```

```tsx
// 나쁨
const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  // ...
};

// 좋음
import { MouseEvent } from 'react';

const onClick = (e: MouseEvent<HTMLButtonElement>) => {
  // ...
};
```

## Prop Name

prop을 통한 컴포넌트 content 렌더 시 label이라는 prop 명칭을 사용합니다.

button, label, input 등등의 상황의 경우 label prop을 사용합니다.

```tsx
// 나쁨
const Button = ({ text }) => {
  return (
    <button>
      {text}
    </button>
  );
};

// 좋음
const Button = ({ label }) => {
  return (
    <button>
      {label}
    </button>
  );
};
```

단, text 관련 Typography 컴포넌트는 children을 사용합니다.

```tsx
// 나쁨
const Typography = ({ label }) => {
  return (
    <p>
      {label}
    </p>
  );
};

// 좋음
const Typography = ({ children }) => {
  return (
    <p>
      {children}
    </p>
  );
};
```
