/**
 * OpenAPI 컴포넌트 스키마 정의
 */

import { OPENAPI_DAISO_OLIVEYOUNG_COMPONENT_SCHEMAS } from './openapiSpecComponentsDaisoOliveyoung.js';
import { OPENAPI_CGV_COMPONENT_SCHEMAS } from './openapiSpecComponentsCgv.js';
import { OPENAPI_MEGABOX_COMPONENT_SCHEMAS } from './openapiSpecComponentsMegabox.js';
import { OPENAPI_SEARCH_COMPONENT_SCHEMAS } from './openapiSpecComponentsSearch.js';

export const OPENAPI_COMPONENTS = {
  schemas: {
    ...OPENAPI_DAISO_OLIVEYOUNG_COMPONENT_SCHEMAS,
    ...OPENAPI_MEGABOX_COMPONENT_SCHEMAS,
    ...OPENAPI_CGV_COMPONENT_SCHEMAS,
    ...OPENAPI_SEARCH_COMPONENT_SCHEMAS,
    ErrorResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', description: '에러 코드', example: 'MISSING_QUERY' },
            message: {
              type: 'string',
              description: '에러 메시지',
              example: '검색어(q)를 입력해주세요.',
            },
          },
        },
      },
    },
  },
};
