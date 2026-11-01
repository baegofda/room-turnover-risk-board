import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // 판정 로직은 화면과 프레임워크를 모르고, 현재 시각을 읽지 않는다 (docs/05-architecture.md)
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'next', 'next/*'],
              message: 'src/core에서는 React와 Next.js를 가져오지 않아요.',
            },
            { group: ['@/app/*'], message: 'src/core는 화면 코드를 가져오지 않아요.' },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message: '판정 시각은 입력의 asOf로만 받아요.',
        },
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: '판정 시각은 입력의 asOf로만 받아요.',
        },
      ],
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);

export default eslintConfig;
