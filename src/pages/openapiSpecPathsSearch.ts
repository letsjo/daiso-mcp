/**
 * OpenAPI 경로 정의 (통합 검색)
 */

export const OPENAPI_PATHS_SEARCH = {
  '/api/search': {
    get: {
      operationId: 'unifiedSearch',
      summary: '통합 검색',
      description: '다이소, 올리브영, 메가박스, CGV를 한 번에 조회하는 통합 검색 엔드포인트입니다.',
      parameters: [
        {
          name: 'q',
          in: 'query',
          required: true,
          description: '공통 검색어',
          schema: { type: 'string' },
          example: '강남',
        },
        {
          name: 'services',
          in: 'query',
          required: false,
          description: '조회할 서비스 목록 (쉼표 구분)',
          schema: { type: 'string', example: 'daiso,oliveyoung,megabox,cgv' },
        },
        {
          name: 'types',
          in: 'query',
          required: false,
          description: '조회할 결과 타입 목록 (쉼표 구분)',
          schema: { type: 'string', example: 'product,store,movie,theater' },
        },
        {
          name: 'lat',
          in: 'query',
          required: false,
          description: '위도',
          schema: { type: 'number', format: 'float', default: 37.5665 },
        },
        {
          name: 'lng',
          in: 'query',
          required: false,
          description: '경도',
          schema: { type: 'number', format: 'float', default: 126.978 },
        },
        {
          name: 'limitPerService',
          in: 'query',
          required: false,
          description: '서비스별 최대 결과 수',
          schema: { type: 'integer', default: 5, minimum: 1, maximum: 50 },
        },
        {
          name: 'timeoutMs',
          in: 'query',
          required: false,
          description: '서비스 fan-out 요청 시간 제한 (밀리초)',
          schema: { type: 'integer', default: 15000, minimum: 1, maximum: 30000 },
        },
      ],
      responses: {
        '200': {
          description: '조회 성공 또는 부분 성공',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UnifiedSearchResponse' },
            },
          },
        },
        '400': {
          description: '잘못된 요청',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },
} as const;
