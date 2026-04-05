import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

import { defineConfig } from 'tsup';

const require = createRequire(import.meta.url);
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version?: string };
const packageVersion = pkg.version ?? '0.0.0-dev';

async function runGenerateTypes(cwd: string) {
  try {
    const { generateTypes } = require('@internal/types-builder') as {
      generateTypes?: (cwd: string) => Promise<void> | void;
    };
    if (typeof generateTypes === 'function') {
      await generateTypes(cwd);
    }
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String((error as { code?: unknown }).code) : '';
    if (code !== 'MODULE_NOT_FOUND' && code !== 'ERR_MODULE_NOT_FOUND') {
      throw error;
    }
  }
}

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    cli: 'src/main.ts',
    tui: 'src/tui/index.ts',
  },
  format: ['esm', 'cjs'],
  clean: true,
  dts: false,
  splitting: true,
  treeshake: {
    preset: 'smallest',
  },
  define: {
    MASTRACODE_VERSION: JSON.stringify(packageVersion),
  },
  sourcemap: true,
  onSuccess: async () => {
    await runGenerateTypes(process.cwd());
  },
});
