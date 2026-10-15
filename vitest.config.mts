import { defineConfig } from 'vitest/config';

export default defineConfig({
  // ⚠️ .ts 必须排在 .js 之前：微信开发者工具会把 miniprogram 下的 .ts 编译成同名 .js，
  // 而 Vite 默认解析顺序是 .js 优先，会导致测试抽到编译产物而非 TS 源码（曾致 73 个测试报错）。
  resolve: {
    extensions: ['.ts', '.tsx', '.mts', '.js', '.jsx', '.mjs', '.json'],
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['miniprogram/utils/**/*.ts', 'miniprogram/viewmodels/**/*.ts', 'miniprogram/services/**/*.ts'],
      reporter: ['text', 'json-summary'],
    },
  },
});
