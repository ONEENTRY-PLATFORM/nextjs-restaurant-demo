import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * loadEnvFile — minimal `.env`-style loader so Playwright config and tests can read
 * variables from `.env.local` without pulling in `dotenv` as a dep. Existing
 * `process.env` keys win (so CI secrets are not clobbered by the local file).
 *
 * @param   {string} filename - File name relative to the project root.
 * @returns void.
 */
const loadEnvFile = (filename: string): void => {
  const path = join(process.cwd(), filename);
  if (!existsSync(path)) return;
  const content = readFileSync(path, 'utf-8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
};

loadEnvFile('.env.local');
loadEnvFile('.env');
