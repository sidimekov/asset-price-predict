import fs from 'node:fs';
import path from 'node:path';

function stripQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function findEnvPath(startDir: string): string | null {
  let currentDir = startDir;
  const { root } = path.parse(startDir);

  while (true) {
    const candidate = path.join(currentDir, '.env');
    if (fs.existsSync(candidate)) return candidate;
    if (currentDir === root) return null;
    currentDir = path.dirname(currentDir);
  }
}

export function loadEnv(envPath?: string) {
  const resolvedPath = envPath ?? findEnvPath(process.cwd());
  if (!resolvedPath) return;

  const contents = fs.readFileSync(resolvedPath, 'utf8');
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const equalsIndex = line.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = line.slice(0, equalsIndex).trim();
    const value = stripQuotes(line.slice(equalsIndex + 1).trim());

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
