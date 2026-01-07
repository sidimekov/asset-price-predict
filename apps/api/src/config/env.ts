export type NodeEnv = 'development' | 'test' | 'production';

export type Env = {
  nodeEnv: NodeEnv;
  port: number;
  corsOrigins: string[];
};

function parseNodeEnv(v: string | undefined): NodeEnv {
  if (v === 'production' || v === 'test' || v === 'development') return v;
  return 'development';
}

function parsePort(v: string | undefined): number {
  const n = Number(v ?? '');
  if (!Number.isFinite(n) || n <= 0) return 8787;
  return Math.floor(n);
}

function defaultCorsOrigins(nodeEnv: NodeEnv): string[] {
  // dev по умолчанию открываем под Next.js/Vite
  if (nodeEnv !== 'production') {
    return [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
    ];
  }
  return [];
}

function parseCorsOrigins(v: string | undefined, nodeEnv: NodeEnv): string[] {
  // CORS_ORIGINS="https://a.com,https://b.com"
  if (!v?.trim()) return defaultCorsOrigins(nodeEnv);
  return v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function readEnv(processEnv: NodeJS.ProcessEnv = process.env): Env {
  const nodeEnv = parseNodeEnv(processEnv.NODE_ENV);
  const port = parsePort(processEnv.PORT);
  const corsOrigins = parseCorsOrigins(processEnv.CORS_ORIGINS, nodeEnv);

  return { nodeEnv, port, corsOrigins };
}
