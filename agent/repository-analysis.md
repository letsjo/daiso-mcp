# 레포지토리 분석

## 한 줄 요약

이 저장소는 Cloudflare Workers 위에서 동작하는 멀티서비스 MCP 서버이며, MCP 엔드포인트와 일반 GET API, 프롬프트/OpenAPI 페이지를 함께 제공합니다.

## 핵심 구조

- 진입점은 `src/index.ts`입니다.
- 런타임은 `Hono` 앱 위에 `McpServer`를 올린 구조입니다.
- MCP 요청은 `/`와 `/mcp`에서 처리합니다.
- MCP 미지원 클라이언트를 위해 `/api/*`, `/prompt`, `/openapi.json`, `/openapi.yaml`, `/privacy`를 함께 제공합니다.
- 서비스 등록은 `src/core/interfaces.ts`, `src/core/registry.ts`에 정의된 플러그인 구조를 따릅니다.

## 서비스 구성

- `src/services/daiso`: 제품 검색, 매장 검색, 재고 확인, 가격 조회
- `src/services/oliveyoung`: Zyte 기반 매장 검색, 재고 조회
- `src/services/megabox`: 주변 지점 조회, 상영 목록 조회, 잔여 좌석 조회
- `src/services/cgv`: 극장 조회, 영화 조회, 시간표 조회

## 서비스별 구현 방식

- 다이소는 공식/비공식 JSON API를 직접 호출합니다.
- 올리브영은 Zyte Extract API로 내부 API를 우회 호출합니다.
- 메가박스는 상영 API 호출과 지점 상세 HTML 파싱을 함께 사용합니다.
- CGV는 서명 헤더를 포함한 직접 호출을 시도하고, 403이면 Zyte fallback을 사용합니다.

## 품질 상태

- `npm run check` 통과
- `npm run build` 통과
- `npm run test:coverage` 통과
- 테스트 파일 42개, 테스트 334개 전체 통과
- 커버리지 100% 달성
- 코드 파일 길이 제한도 준수 중

## 확인된 강점

- 서비스별 디렉터리 구조가 일관적입니다.
- 테스트 밀도가 높고 회귀 방지 체계가 강합니다.
- OpenAPI와 프롬프트 페이지를 함께 제공해 MCP 미지원 환경까지 고려했습니다.
- `docs/`에 네트워크 분석 문서가 누적되어 있어 신규 서비스 확장 기반이 있습니다.

## 주요 리스크

- `zod`를 소스에서 직접 import하지만 `package.json`에는 직접 의존성으로 선언되어 있지 않습니다.
- `npm run build` 실행 시 `openapi.json`, `openapi.yaml`에 큰 diff가 생겨 체크인된 산출물과 소스 간 드리프트가 확인됐습니다.
- 레포는 Node 20을 요구하지만 현재 워크스페이스는 Node 23이라 로컬 실행 시 engine warning이 발생했습니다.
- `workers-mcp`는 직접 사용 흔적을 찾지 못해 정리 후보입니다.

## 운영 관점 메모

- 추론: 실제 운영 리스크는 내부 코드보다 외부 서비스 API/스크래핑 포인트 변경 가능성이 더 큽니다.
- 현재 테스트 대부분은 mock 기반이라, 외부 서비스 실데이터 기준의 주기적 스모크 테스트가 있으면 더 안정적입니다.

## 현재 워킹트리 상태

- `openapi.json` 수정됨
- `openapi.yaml` 수정됨

위 두 파일은 빌드로 재생성된 결과입니다.
