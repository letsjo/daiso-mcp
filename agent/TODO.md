# TODO

작성 기준: 2026-03-07

## 완료된 작업

### 의존성 / 보안

- [x] `package.json`에 `zod`를 직접 의존성으로 추가하고 전이 의존성 의존을 제거하기
- [x] `@modelcontextprotocol/sdk` 업데이트 가능 여부를 확인하고 `express-rate-limit` 취약점을 override로 완화하기
- [x] `workers-mcp`가 실제로 불필요한지 확인하고 의존성에서 제거하기

### 빌드 / CI

- [x] `openapi.json`, `openapi.yaml` 드리프트 원인을 정리하고 현재 코드 기준으로 산출물 동기화하기
- [x] OpenAPI 산출물 드리프트를 CI에서 자동 검출하도록 검사 단계 추가하기

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

- [ ] `[P1]` `src/pages/prompt.ts`, `src/pages/openapiSpecComponents.ts`를 더 잘게 분리해서 450줄 제한 버퍼 확보하기
- [ ] `[P1]` 서비스별 MCP 도구 정의에서 반복되는 `inputSchema`, JSON 응답 포맷, 핸들러 래핑을 공통 빌더로 추출하기
- [ ] `[P2]` 각 서비스 클라이언트에 흩어진 timeout, HTTP 에러, 응답 파싱 패턴을 공통 유틸로 정리하기

### 테스트 / 운영

- [ ] `[P1]` GitHub Actions에 수동 실행 가능한 smoke test 워크플로우 추가하기
- [ ] `[P1]` 다이소/메가박스/CGV/올리브영 대표 응답을 fixture로 저장하고 계약 테스트(contract test) 추가하기
- [ ] `[P2]` `npm run check`에 `check:openapi`를 포함할지 결정하고, 포함 시 로컬 개발 흐름 영향도 검토하기
- [ ] `[P2]` `@modelcontextprotocol/sdk`가 `express-rate-limit` 상향을 포함하면 override 제거하기

### 기능 확장

- [ ] `[P1]` 차기 구현 서비스 우선순위 결정하기: `CU`, `GS25`, `Emart24`
- [ ] `[P1]` 서비스별 지원 기능 매트릭스 문서 추가하기
- [ ] `[P2]` 여러 서비스를 한 번에 조회하는 통합 검색 도구 또는 통합 REST 엔드포인트 설계 검토하기
- [ ] `[P2]` 영화 서비스에서 좌석맵/상영관 상세 같은 추가 정보 제공 가능성 조사하기

### 문서 / DX

- [ ] `[P1]` `CHANGELOG.md` 추가하고 릴리스 단위 변경사항 기록 시작하기
- [ ] `[P1]` Zyte, 외부 차단, 403, 타임아웃 대응을 정리한 트러블슈팅 문서 추가하기
- [ ] `[P2]` 신규 서비스 추가 템플릿을 문서 수준에서 끝내지 말고 코드 스캐폴드까지 확장할지 검토하기

## 메모

- 최근 검증 완료 항목: `npm test`, `npm audit --omit=dev`, `npm run check:openapi`, `npm run format:check`
- 실서비스 기본 점검 스크립트: `examples/api-test.sh`
- 신규 서비스 추가 시작점: `docs/new-service-template.md`
