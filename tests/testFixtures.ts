/**
 * 테스트 fixture 로더
 */

import { readFileSync } from 'node:fs';

const FIXTURES_ROOT = new URL('./fixtures/', import.meta.url);

export function readTextFixture(path: string): string {
  return readFileSync(new URL(path, FIXTURES_ROOT), 'utf8');
}

export function readJsonFixture<T>(path: string): T {
  return JSON.parse(readTextFixture(path)) as T;
}
