import { afterEach, beforeEach, vi } from 'vitest';

export const mockFetch = vi.fn();

export function setupUnifiedSearchFetchMock() {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
}

export function createZyteSuccessResponse(body: unknown) {
  return new Response(
    JSON.stringify({
      statusCode: 200,
      httpResponseBody: Buffer.from(JSON.stringify(body), 'utf8').toString('base64'),
    }),
  );
}
