/**
 * 공용 HTTP 유틸리티
 */

export interface FetchOptions extends RequestInit {
  timeout?: number;
}

export function createTimeoutController(timeout: number): {
  controller: AbortController;
  timeoutId: ReturnType<typeof setTimeout>;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  return { controller, timeoutId };
}

export async function fetchWithTimeout(url: string, options: FetchOptions = {}): Promise<Response> {
  const { timeout = 10000, ...restOptions } = options;
  const { controller, timeoutId } = createTimeoutController(timeout);

  try {
    return await fetch(url, {
      ...restOptions,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchJson<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const response = await fetchWithTimeout(url, options);

  if (!response.ok) {
    throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchText(url: string, options: FetchOptions = {}): Promise<string> {
  const response = await fetchWithTimeout(url, options);

  if (!response.ok) {
    throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

export function throwIfResponseNotOk(response: Response, message: string): void {
  if (!response.ok) {
    throw new Error(`${message}: ${response.status}`);
  }
}

export async function parseJsonResponse<T>(
  response: Response,
  fallbackMessage: string = 'API 응답 파싱 실패',
): Promise<T> {
  const text = await response.text();

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(text.slice(0, 120) || fallbackMessage);
  }
}

export function rethrowAsTimeout(error: unknown, message: string): void {
  if (error instanceof Error && error.name === 'AbortError') {
    throw new Error(message);
  }
}
