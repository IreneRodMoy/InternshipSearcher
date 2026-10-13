const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
  ) {
    super(`HTTP ${status} for ${new URL(url).host}`);
  }
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
}

export async function request(url: string, options: RequestOptions = {}): Promise<Response> {
  const { timeoutMs = 20_000, retries = 1, headers, ...init } = options;
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(url, {
        ...init,
        headers: { 'user-agent': USER_AGENT, 'accept-language': 'en-CA,en;q=0.9,fr-CA;q=0.8', ...headers },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (response.ok || response.status === 304) return response;
      if (attempt >= retries || response.status < 500) throw new HttpError(response.status, url);
    } catch (error) {
      if (error instanceof HttpError || attempt >= retries) throw error;
    }
    await sleep(1000 * 2 ** attempt);
  }
}

export async function getJson<T>(url: string, options?: RequestOptions): Promise<T> {
  const response = await request(url, { ...options, headers: { accept: 'application/json', ...options?.headers } });
  return (await response.json()) as T;
}

export async function getText(url: string, options?: RequestOptions): Promise<string> {
  return (await request(url, options)).text();
}

export function postJson<T>(url: string, body: unknown, options?: RequestOptions): Promise<T> {
  return getJson<T>(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json', ...options?.headers },
  });
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]!);
    }
  });
  await Promise.all(workers);
  return results;
}
