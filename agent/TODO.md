# TODO

작성 기준: 2026-03-07
최근 업데이트: 2026-03-08

## 완료된 작업

### 의존성 / 보안

- [x] `package.json`에 `zod`를 직접 의존성으로 추가하고 전이 의존성 의존을 제거하기
- [x] `@modelcontextprotocol/sdk` 업데이트 가능 여부를 확인하고 `express-rate-limit` 취약점을 override로 완화하기
- [x] `workers-mcp`가 실제로 불필요한지 확인하고 의존성에서 제거하기

### 빌드 / CI

- [x] `openapi.json`, `openapi.yaml` 드리프트 원인을 정리하고 현재 코드 기준으로 산출물 동기화하기
- [x] OpenAPI 산출물 드리프트를 CI에서 자동 검출하도록 검사 단계 추가하기
- [x] `npm run format`, `npm run format:check`가 `CHANGELOG.md`, `docs/`, `agent/` 문서도 자동 검사하도록 범위 확장하기

### 아키텍처 / 리팩터링

- [x] `ServiceRegistry.initializeAll`, `cleanupAll`을 실제 런타임에 연결하거나 인터페이스에서 제거할지 결정하기
- [x] 멀티서비스 구조에 맞지 않던 패키지/문서 설명을 정리하기

### 개발 환경 / 운영

- [x] 로컬 개발 환경을 Node 20으로 고정하도록 `.nvmrc`, `.node-version`, `volta` 설정을 보강하기
- [x] 외부 서비스 API 변경을 빠르게 감지할 최소 스모크 테스트 전략과 실행 스크립트를 정리하기

### 문서 / 지식 관리

- [x] `agent/` 문서 인덱스, 레포 분석, TODO 문서 생성
- [x] `docs/` 분석 문서를 서비스별 인덱스로 묶어 탐색성을 높이기
- [x] 장기적으로 신규 서비스 추가 절차를 템플릿화하기

## 다음 작업 후보

### 리팩터링

- [x] `[P1]` `src/pages/prompt.ts`, `src/pages/openapiSpecComponents.ts`를 더 잘게 분리해서 450줄 제한 버퍼 확보하기
- [x] `[P1]` 서비스별 MCP 도구 정의에서 반복되는 `inputSchema`, JSON 응답 포맷, 핸들러 래핑을 공통 빌더로 추출하기
- [x] `[P2]` 각 서비스 클라이언트에 흩어진 timeout, HTTP 에러, 응답 파싱 패턴을 공통 유틸로 정리하기

### 테스트 / 운영

- [x] `[P1]` GitHub Actions에 수동 실행 가능한 smoke test 워크플로우 추가하기
- [x] `[P1]` 다이소/메가박스/CGV/올리브영 대표 응답을 fixture로 저장하고 계약 테스트(contract test) 추가하기
- [x] `[P1]` 코드 파일 450줄 제한을 스크립트와 CI에서 자동 검증하기
- [x] `[P2]` `npm run check`에 `check:openapi`를 포함할지 결정하고, 포함 시 로컬 개발 흐름 영향도 검토하기
- [ ] `[P2]` `@modelcontextprotocol/sdk`가 `express-rate-limit` 상향을 포함하면 override 제거하기
- [ ] `[P2]` 수동 smoke test 외에 schedule 기반 외부 연동 점검 워크플로우를 검토하기

### 기능 확장

- [x] `[P1]` 차기 구현 서비스 우선순위 결정하기: `CU`, `GS25`, `Emart24`
- [x] `[P1]` 서비스별 지원 기능 매트릭스 문서 추가하기
- [x] `[P2]` 여러 서비스를 한 번에 조회하는 통합 검색 도구 또는 통합 REST 엔드포인트 설계 검토하기
- [x] `[P2]` 영화 서비스에서 좌석맵/상영관 상세 같은 추가 정보 제공 가능성 조사하기
- [x] `[P1]` 통합 검색 설계를 기준으로 v1 응답 스키마와 서비스 opt-in 인터페이스 초안 만들기
- [x] `[P1]` 통합 검색 aggregator를 실제 `GET /api/search` REST 엔드포인트에 연결하기
- [x] `[P2]` 통합 검색 aggregator를 재사용하는 `multi_search` MCP 도구 추가하기
- [x] `[P2]` `/api/search` 결과 수 제한, 정렬, 페이지네이션 메타데이터 확장 여부 검토하기
- [x] `[P2]` `/api/search` 응답에 서비스/버킷별 `returnedCount`, `truncated`, `sortApplied` 메타데이터 추가하기
- [x] `[P2]` 서비스/버킷별 continuation 전략(`nextCursor`) 도입 가능성 검토하기
- [x] `[P2]` `Daiso products`, `Oliveyoung products/stores` 범위에서 continuation pilot 계약 초안 작성하기
- [x] `[P2]` continuation 요청 조건을 `서비스 1개 + 타입 1개`로 제한할지 API 계약 정리하기
- [x] `[P2]` continuation pilot용 cursor encode/decode 유틸 초안 추가하기
- [ ] `[P2]` continuation cursor validator를 REST/MCP 공통으로 연결하기
- [ ] `[P2]` `daiso products` continuation pilot 구현하기
- [ ] `[P2]` `oliveyoung products/stores` continuation pilot 구현하기
- [ ] `[P2]` store/theater 타입 한정 공통 정렬 옵션(`distance-asc`) 도입 가능성 검토하기
- [ ] `[P2]` `Emart24` 또는 `GS25` 착수 전에 공통 소매 검색/매장 타입 재사용 범위를 정리하기

### 문서 / DX

- [x] `[P1]` `CHANGELOG.md` 추가하고 릴리스 단위 변경사항 기록 시작하기
- [x] `[P1]` Zyte, 외부 차단, 403, 타임아웃 대응을 정리한 트러블슈팅 문서 추가하기
- [x] `[P2]` 신규 서비스 추가 템플릿을 문서 수준에서 끝내지 말고 코드 스캐폴드까지 확장할지 검토하기
- [ ] `[P2]` `docs/` 리서치 산출물(`.js`, `.html`)의 보존 규칙과 포맷 기준을 정리하기

## 메모

- 최근 검증 완료 항목: `npm run check`, `npm run test:coverage`, `npm audit --omit=dev`
- 실서비스 기본 점검 스크립트: `examples/api-test.sh`
- 신규 서비스 추가 시작점: `docs/new-service-template.md`
- 2026-03-08 확인: `@modelcontextprotocol/sdk` 최신 `1.27.1`은 여전히 `express-rate-limit ^8.2.1` 의존이라 override 제거 불가
