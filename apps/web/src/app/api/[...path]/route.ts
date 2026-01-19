const DEFAULT_BACKEND_URL =
  process.env.NODE_ENV === 'production'
    ? 'http://api:3001'
    : 'http://localhost:3001';

const backendBaseUrl =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  DEFAULT_BACKEND_URL;

const hopByHopHeaders = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

const buildTargetUrl = (requestUrl: string, path: string[]) => {
  const url = new URL(requestUrl);
  const target = new URL(`/${path.join('/')}`, backendBaseUrl);
  target.search = url.search;
  return target.toString();
};

const cloneHeaders = (headers: Headers) => {
  const outgoing = new Headers();
  headers.forEach((value, key) => {
    if (!hopByHopHeaders.has(key.toLowerCase())) {
      outgoing.set(key, value);
    }
  });
  return outgoing;
};

const proxyRequest = async (
  request: Request,
  context: { params: { path: string[] } },
) => {
  const targetUrl = buildTargetUrl(request.url, context.params.path);
  const headers = cloneHeaders(request.headers);
  const method = request.method.toUpperCase();

  const body =
    method === 'GET' || method === 'HEAD'
      ? undefined
      : await request.arrayBuffer();

  const response = await fetch(targetUrl, {
    method,
    headers,
    body,
    redirect: 'manual',
  });

  const responseHeaders = cloneHeaders(response.headers);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
};

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
