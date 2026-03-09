# Changelog

이 문서는 릴리스 단위의 주요 변경사항을 기록합니다.

## [Unreleased]

### Added

- GitHub Actions 수동 스모크 테스트 워크플로우 추가
- 서비스별 대표 응답 fixture와 계약 테스트 추가
- 차기 서비스 우선순위 문서와 서비스 지원 매트릭스 문서 추가
- 통합 검색 aggregator를 연결한 `GET /api/search` REST 엔드포인트 추가
- 통합 검색 aggregator를 재사용하는 `multi_search` MCP 도구 추가
- 통합 검색 결과 제한/정렬/페이지네이션 검토 문서 추가
- 통합 검색 응답에 서비스/버킷별 메타데이터 추가
- 통합 검색 continuation 전략 검토 문서 추가
- 통합 검색 continuation pilot 계약 초안 추가
- 통합 검색 continuation cursor 유틸 초안 추가
- 통합 검색 continuation cursor validator와 REST/MCP 연결 추가
- 통합 검색 `daiso products` continuation pilot과 `nextCursor` 반환 추가
- 통합 검색 `oliveyoung products/stores` continuation pilot과 `nextCursor` 반환 추가
- 영화관 좌석 조회용 `minRemainingSeats`, `sort` 공통 필터와 유틸 추가
- 메가박스 read-only 좌석맵 조회 API와 MCP 도구 추가
- CGV 극장명 기반 영화 목록 조회 API(`/api/cgv/movies/by-theater`)와 MCP 도구 추가
- 상품/회차 응답에 공식 상세/예매/좌석 진입용 `links` 필드 추가

### Changed

- OpenAPI 산출물 드리프트를 CI에서 검증하도록 강화
- MCP 도구 정의 공통 빌더 도입으로 서비스별 반복 코드 축소
- 프롬프트/OpenAPI 페이지 정의를 모듈로 분리해 파일 크기 버퍼 확보
- Node 20 고정, 스모크 테스트 전략, 멀티서비스 문서 체계를 정리
- 통합 검색 OpenAPI 스펙과 서비스별 adapter 테스트를 추가해 계약 범위를 확장
- 프롬프트 페이지를 멀티서비스/통합 검색 기준으로 갱신
- 통합 검색의 `limitPerService`, `timeoutMs` 상한을 runtime과 OpenAPI에서 일치시킴
- 통합 검색 계약 문서를 구현 기준 응답 메타데이터로 갱신
- 통합 검색 continuation pilot 문서를 validator 연결 상태 기준으로 갱신
- 통합 검색 prompt/OpenAPI 문서를 cursor-only 요청과 `nextCursor` 기준으로 갱신
- 통합 검색 adapter 구현을 retail/cinema 모듈로 분리해 450줄 제한을 재확보
- 메가박스 `seats`, CGV `timetable` API와 MCP 도구에 시간대/잔여 좌석/정렬 필터를 확장
- 메가박스 좌석맵 조사 문서를 재검증 결과와 구현 상태 기준으로 갱신
- CGV 영화 목록을 실제 상영작 전체 기준 + `popularity-desc` 정렬로 보강
- CGV OpenAPI/프롬프트/GPT 지침에서 극장 검색과 영화 목록 액션의 역할 차이를 명확히 함
- GPT 지침에서 응답의 `links`를 바로 사용자에게 노출하도록 안내 강화
- 메가박스 `officialBookingUrl`을 내부 iframe 경로 대신 공개 `/booking?playSchdlNo=...` 진입점으로 수정

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
