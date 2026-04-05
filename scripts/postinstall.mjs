import { cpSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');
const distRoot = path.join(packageRoot, 'dist');
const sourceDistRoot = path.resolve(packageRoot, '../../../mastra/mastracode/dist');

if (!existsSync(sourceDistRoot)) {
  console.warn(`[mastra-mono] Skipping dist bootstrap; source dist not found at ${sourceDistRoot}`);
  process.exit(0);
}

mkdirSync(distRoot, { recursive: true });
cpSync(sourceDistRoot, distRoot, { recursive: true });
console.info(`[mastra-mono] Bootstrapped dist from ${sourceDistRoot}`);
