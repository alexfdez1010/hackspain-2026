import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      '.agents/skills/**',
      'generated/**',
      'src/generated/**',
      '.heroui-docs/**',
    ],
  },
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^\\.\\.\\/',
              message:
                "Use absolute imports with the '@/' alias instead of relative parent imports (e.g. '@/components/foo' not '../components/foo').",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
