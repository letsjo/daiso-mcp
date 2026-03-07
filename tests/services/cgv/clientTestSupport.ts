import { afterEach, beforeEach, vi } from 'vitest';

export function setupMockFetch() {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  return mockFetch;
}
