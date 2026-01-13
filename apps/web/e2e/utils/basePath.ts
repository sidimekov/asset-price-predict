import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function readEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const env: Record<string, string> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }

  return env;
}

function normalizeBasePath(value: string): string {
  let base = value.trim();
  if (!base) return '';
  if (!base.startsWith('/')) base = `/${base}`;
  return base.replace(/\/$/, '');
}

function resolveBasePath(): string {
  const fromEnv = process.env.NEXT_PUBLIC_BASE_PATH;
  if (fromEnv) return normalizeBasePath(fromEnv);

  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const envPath = path.resolve(currentDir, '..', '..', '.env.local');
  const env = readEnvFile(envPath);
  if (env.NEXT_PUBLIC_BASE_PATH) {
    return normalizeBasePath(env.NEXT_PUBLIC_BASE_PATH);
  }

  return '';
}

export const basePath = resolveBasePath();

export function withBasePath(route: string): string {
  return `${basePath}${route}`;
}

export function buildUrl(route: string): string {
  const baseUrl =
    process.env.PLAYWRIGHT_BASE_URL ||
    process.env.BASE_URL ||
    'http://localhost:3000';
  return `${baseUrl}${withBasePath(route)}`;
}
