# 신규 서비스 추가 템플릿

이 문서는 새 서비스를 추가할 때 복사해서 사용할 최소 절차와 파일 골격을 정리합니다.

## 1. 디렉터리 생성

```text
src/services/{service}/
├── api.ts
├── client.ts
├── index.ts
├── types.ts
└── tools/
    ├── toolA.ts
    └── toolB.ts
```

## 2. 서비스 ID와 도구 접두사 결정

- 서비스 ID 예시: `daiso`, `oliveyoung`, `megabox`, `cgv`
- 도구 이름 예시: `{service}_search_products`
- REST 경로 예시: `/api/{service}/...`
- 문서 파일 예시: `docs/{service}-network-analysis-result.md`

## 3. 기본 구현 체크리스트

- [ ] `types.ts`에 응답/도메인 타입 정의
- [ ] `api.ts`에 엔드포인트 상수 정리
- [ ] `client.ts`에 외부 요청 로직 정리
- [ ] `tools/`에 MCP 도구 구현
- [ ] `index.ts`에 `ServiceProvider` 구현
- [ ] `src/index.ts`에 서비스 등록
- [ ] 필요한 경우 `src/api/routes/`와 `src/api/*Handlers.ts`에 REST 엔드포인트 추가
- [ ] OpenAPI 반영이 필요하면 관련 `src/pages/openapi*` 모듈 업데이트

## 4. `index.ts` 템플릿

```typescript
import type { ServiceProvider } from '../../core/interfaces.js';
import type { ServiceMetadata, ToolRegistration } from '../../core/types.js';
import { createToolATool } from './tools/toolA.js';
import { createToolBTool } from './tools/toolB.js';

const SERVICE_METADATA: ServiceMetadata = {
  id: '{service}',
  name: '{서비스명}',
  version: '1.0.0',
  description: '{서비스 설명}',
};

class TemplateService implements ServiceProvider {
  readonly metadata = SERVICE_METADATA;

  getTools(): ToolRegistration[] {
    return [createToolATool(), createToolBTool()];
  }
}

export function createTemplateService(): ServiceProvider {
  return new TemplateService();
}
```

## 5. 테스트 체크리스트

- [ ] `tests/services/{service}/index.test.ts`
- [ ] `tests/services/{service}/client.test.ts`
- [ ] `tests/services/{service}/tools/*.test.ts`
- [ ] REST 엔드포인트를 추가했다면 `tests/api/*`, `tests/app/*`에도 테스트 추가
- [ ] `npm test`
- [ ] `npm run test:coverage`

## 6. 문서 체크리스트

- [ ] `README.md` 기능/REST API/구조 반영
- [ ] `docs/README.md` 인덱스 반영
- [ ] 네트워크 분석 문서 추가
- [ ] 필요 시 `agent/TODO.md` 갱신

## 7. 마무리 점검

- [ ] `npm run check`
- [ ] `npm run build`
- [ ] OpenAPI 산출물 diff 확인
- [ ] 커밋 메시지 컨벤션 확인
