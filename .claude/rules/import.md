---
description: import 규칙
alwaysApply: true
---

# import 규칙

## 절대 경로

상대 경로가 아닌 절대 경로로 작성합니다.

```typescript
// 나쁨
import Component from '../../components/Component';

// 좋음
import Component from '@/components/Component';
```

## 외부/내부 구분

외부 라이브러리에서 가져오는 import와 내부 코드에서 가져오는 import는 한 줄 개행으로 구분합니다.

```typescript
// 나쁨
import clsx from 'clsx';
import React from 'react';
import Component from '@/components/Component';

// 좋음
import clsx from 'clsx';
import React from 'react';

import Component from '@/components/Component';
```
