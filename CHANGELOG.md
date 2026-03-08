# Changelog

이 문서는 릴리스 단위의 주요 변경사항을 기록합니다.

## [Unreleased]

### Added

- GitHub Actions 수동 스모크 테스트 워크플로우 추가
- 서비스별 대표 응답 fixture와 계약 테스트 추가
- 차기 서비스 우선순위 문서와 서비스 지원 매트릭스 문서 추가
- 통합 검색 aggregator를 연결한 `GET /api/search` REST 엔드포인트 추가

### Changed

- OpenAPI 산출물 드리프트를 CI에서 검증하도록 강화
- MCP 도구 정의 공통 빌더 도입으로 서비스별 반복 코드 축소
- 프롬프트/OpenAPI 페이지 정의를 모듈로 분리해 파일 크기 버퍼 확보
- Node 20 고정, 스모크 테스트 전략, 멀티서비스 문서 체계를 정리
- 통합 검색 OpenAPI 스펙과 서비스별 adapter 테스트를 추가해 계약 범위를 확장

### Removed

- 미사용 `workers-mcp` 의존성 제거
- 사용되지 않던 서비스 라이프사이클 추상화 제거

## [1.0.0] - 2026-03-07

### Added

- 현재 `main` 기준선 정리:
  - Cloudflare Workers 기반 멀티서비스 MCP 서버
  - Daiso, Oliveyoung, Megabox, CGV 서비스 구현
  - MCP 도구, 일반 GET API, OpenAPI/프롬프트 페이지 제공
  - `docs/`, `agent/` 기반 문서 및 작업 메모 구조
