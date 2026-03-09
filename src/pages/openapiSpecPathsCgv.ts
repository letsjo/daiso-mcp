/**
 * OpenAPI 경로 정의 (CGV)
 */

export const OPENAPI_PATHS_CGV = {
  '/api/cgv/theaters': {
    get: {
      operationId: 'cgvFindTheaters',
      summary: 'CGV 극장 목록 조회',
      description: '날짜/지역 코드 조건으로 CGV 극장 목록을 조회합니다.',
      parameters: [
        {
          name: 'playDate',
          in: 'query',
          required: false,
          description: '조회 날짜 (YYYYMMDD)',
          schema: { type: 'string', example: '20260304' },
        },
        {
          name: 'regionCode',
          in: 'query',
          required: false,
          description: '지역 코드 (예: 01 서울)',
          schema: { type: 'string', example: '01' },
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          description: '최대 결과 수',
          schema: { type: 'integer', default: 30, minimum: 1, maximum: 100 },
        },
      ],
      responses: {
        '200': {
          description: '조회 성공',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CgvTheaterSearchResponse' },
            },
          },
        },
        '500': {
          description: 'CGV API 호출 실패',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },
  '/api/cgv/movies': {
    get: {
      operationId: 'cgvSearchMovies',
      summary: 'CGV 영화 목록 조회',
      description: '날짜/극장 조건으로 CGV 영화 목록을 조회합니다.',
      parameters: [
        {
          name: 'playDate',
          in: 'query',
          required: false,
          description: '조회 날짜 (YYYYMMDD)',
          schema: { type: 'string', example: '20260304' },
        },
        {
          name: 'theaterCode',
          in: 'query',
          required: false,
          description: '극장 코드 (예: 0056)',
          schema: { type: 'string', example: '0056' },
        },
      ],
      responses: {
        '200': {
          description: '조회 성공',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CgvMovieSearchResponse' },
            },
          },
        },
        '500': {
          description: 'CGV API 호출 실패',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },
  '/api/cgv/timetable': {
    get: {
      operationId: 'cgvGetTimetable',
      summary: 'CGV 시간표 조회',
      description: '날짜/극장/영화 조건으로 CGV 상영 시간표를 조회합니다.',
      parameters: [
        {
          name: 'playDate',
          in: 'query',
          required: false,
          description: '조회 날짜 (YYYYMMDD)',
          schema: { type: 'string', example: '20260304' },
        },
        {
          name: 'theaterCode',
          in: 'query',
          required: false,
          description: '극장 코드',
          schema: { type: 'string' },
        },
        {
          name: 'movieCode',
          in: 'query',
          required: false,
          description: '영화 코드',
          schema: { type: 'string' },
        },
        {
          name: 'fromTime',
          in: 'query',
          required: false,
          description: '조회 시작 시각 하한 (HHMM)',
          schema: { type: 'string', example: '1800' },
        },
        {
          name: 'toTime',
          in: 'query',
          required: false,
          description: '조회 시작 시각 상한 (HHMM)',
          schema: { type: 'string', example: '2100' },
        },
        {
          name: 'minRemainingSeats',
          in: 'query',
          required: false,
          description: '최소 남은 좌석 수',
          schema: { type: 'integer', minimum: 0, example: 10 },
        },
        {
          name: 'sort',
          in: 'query',
          required: false,
          description: '정렬 기준',
          schema: {
            type: 'string',
            enum: ['startTime-asc', 'remainingSeats-desc', 'remainingSeats-asc'],
            default: 'startTime-asc',
          },
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          description: '최대 결과 수',
          schema: { type: 'integer', default: 50, minimum: 1, maximum: 200 },
        },
      ],
      responses: {
        '400': {
          description: '잘못된 상영 회차 필터',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        '200': {
          description: '조회 성공',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CgvTimetableResponse' },
            },
          },
        },
        '500': {
          description: 'CGV API 호출 실패',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },
};
