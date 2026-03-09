/**
 * 프롬프트 페이지 테스트
 */
import { describe, it, expect } from 'vitest';
import { generatePromptText, createPromptResponse } from '../../src/pages/prompt.js';

describe('generatePromptText', () => {
  it('baseUrl을 포함한 프롬프트 텍스트를 생성한다', () => {
    const baseUrl = 'https://example.com';
    const text = generatePromptText(baseUrl);

    expect(text).toContain('https://example.com');
    expect(text).toContain('Base URL: https://example.com');
  });

  it('API 엔드포인트 문서를 포함한다', () => {
    const text = generatePromptText('https://api.test.com');

    // 제품 검색 API
    expect(text).toContain('/api/daiso/products');
    expect(text).toContain('검색 키워드');

    // 제품 상세 정보 API
    expect(text).toContain('/api/daiso/products/{제품ID}');

    // 매장 찾기 API
    expect(text).toContain('/api/daiso/stores');

    // 재고 확인 API
    expect(text).toContain('/api/daiso/inventory');

    // 올리브영 API
    expect(text).toContain('/api/oliveyoung/stores');
    expect(text).toContain('/api/oliveyoung/inventory');

    // 메가박스 API
    expect(text).toContain('/api/megabox/theaters');
    expect(text).toContain('/api/megabox/movies');
    expect(text).toContain('/api/megabox/seats');
    expect(text).toContain('/api/megabox/seat-map');

    // CGV API
    expect(text).toContain('/api/cgv/theaters');
    expect(text).toContain('/api/cgv/movies');
    expect(text).toContain('/api/cgv/movies/by-theater');
    expect(text).toContain('/api/cgv/timetable');

    // 통합 검색 API
    expect(text).toContain('/api/search?q=');
  });

  it('파라미터 설명을 포함한다', () => {
    const text = generatePromptText('https://test.com');

    expect(text).toContain('page');
    expect(text).toContain('pageSize');
    expect(text).toContain('keyword');
    expect(text).toContain('sido');
    expect(text).toContain('gugun');
    expect(text).toContain('dong');
    expect(text).toContain('lat');
    expect(text).toContain('lng');
    expect(text).toContain('fromTime');
    expect(text).toContain('toTime');
    expect(text).toContain('minRemainingSeats');
    expect(text).toContain('remainingSeats-desc');
    expect(text).toContain('services');
    expect(text).toContain('types');
    expect(text).toContain('cursor');
  });

  it('응답 예시를 포함한다', () => {
    const text = generatePromptText('https://test.com');

    expect(text).toContain('"success": true');
    expect(text).toContain('"products"');
    expect(text).toContain('"stores"');
  });

  it('에러 코드 설명을 포함한다', () => {
    const text = generatePromptText('https://test.com');

    expect(text).toContain('MISSING_QUERY');
    expect(text).toContain('INVALID_CURSOR');
    expect(text).toContain('CURSOR_SCOPE_NOT_SUPPORTED');
    expect(text).toContain('CURSOR_QUERY_MISMATCH');
    expect(text).toContain('INVALID_SERVICES');
    expect(text).toContain('INVALID_TYPES');
    expect(text).toContain('INVALID_LIMIT');
    expect(text).toContain('INVALID_TIMEOUT');
    expect(text).toContain('INVALID_LOCATION');
  });

  it('MCP 연결 정보를 포함한다', () => {
    const text = generatePromptText('https://example.com');

    expect(text).toContain('https://example.com/mcp');
    expect(text).toContain('daiso_search_products');
    expect(text).toContain('daiso_find_stores');
    expect(text).toContain('daiso_check_inventory');
    expect(text).toContain('daiso_get_price_info');
    expect(text).toContain('oliveyoung_find_nearby_stores');
    expect(text).toContain('oliveyoung_check_inventory');
    expect(text).toContain('megabox_find_nearby_theaters');
    expect(text).toContain('megabox_list_now_showing');
    expect(text).toContain('megabox_get_remaining_seats');
    expect(text).toContain('megabox_get_seat_map');
    expect(text).toContain('cgv_find_theaters');
    expect(text).toContain('cgv_search_movies');
    expect(text).toContain('cgv_search_movies_by_theater');
    expect(text).toContain('cgv_get_timetable');
    expect(text).toContain('multi_search');
  });

  it('사용 팁을 포함한다', () => {
    const text = generatePromptText('https://test.com');

    expect(text).toContain('사용 팁');
    expect(text).toContain('한글 검색어');
    expect(text).toContain('continuation');
    expect(text).toContain('재고 확인 워크플로우');
  });
});

describe('createPromptResponse', () => {
  it('Response 객체를 반환한다', () => {
    const response = createPromptResponse('https://test.com');

    expect(response).toBeInstanceOf(Response);
  });

  it('올바른 Content-Type 헤더를 설정한다', () => {
    const response = createPromptResponse('https://test.com');

    expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
  });

  it('캐시 헤더를 설정한다', () => {
    const response = createPromptResponse('https://test.com');

    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');
  });

  it('본문에 프롬프트 텍스트가 포함되어 있다', async () => {
    const response = createPromptResponse('https://test.com');
    const body = await response.text();

    expect(body).toContain('멀티서비스 MCP API');
    expect(body).toContain('https://test.com');
  });
});
