# TODO

## P0

- [x] `package.json`에 `zod`를 직접 의존성으로 추가하고 전이 의존성 의존을 제거하기
- [x] `openapi.json`, `openapi.yaml` 드리프트 원인을 정리하고 현재 코드 기준으로 산출물 동기화하기
- [x] OpenAPI 산출물 드리프트를 CI에서 자동 검출하도록 검사 단계 추가하기

## P1

- [x] `ServiceRegistry.initializeAll`, `cleanupAll`을 실제 런타임에 연결하거나 인터페이스에서 제거할지 결정하기
- [x] `@modelcontextprotocol/sdk` 업데이트 가능 여부를 확인하고 `npm audit` high 취약점 해소 방향 정리하기
- [x] 로컬 개발 환경을 Node 20으로 고정하도록 문서 또는 도구 설정을 강화하기
- [x] 외부 서비스 API 변경을 빠르게 감지할 최소 스모크 테스트 전략 정리하기

## P2

- [x] `workers-mcp`가 실제로 불필요하면 제거하기
- [x] `package.json` 설명과 일부 문서를 현재 멀티서비스 구조에 맞게 업데이트하기
- [x] `docs/` 분석 문서를 서비스별 인덱스로 묶어 탐색성을 높이기
- [ ] 장기적으로 신규 서비스 추가 절차를 템플릿화하기

## 메모

- 검증 기준 시점: 2026-03-07
- 실행 확인 명령: `npm run check`, `npm run build`, `npm run test:coverage`
