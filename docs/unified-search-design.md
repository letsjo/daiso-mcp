# 통합 검색 설계 검토

작성일: 2026-03-07 (KST)

## 결론 요약

- v1은 `단일 flat 목록`보다 `서비스별 그룹 응답`이 안전합니다.
- 외부 공개 인터페이스는 `GET /api/search`를 먼저 추가하고, MCP 도구는 같은 내부 aggregator를 재사용하는 방식이 적합합니다.
- 모든 서비스를 억지로 같은 인터페이스에 맞추기보다, `검색 가능한 서비스만 opt-in`하는 adapter 계층을 두는 편이 현재 구조와 잘 맞습니다.

## 왜 필요한가

현재 구조는 서비스별 API와 MCP 도구가 명확하지만, 사용자는 보통 다음처럼 한 번에 묻습니다.

- `강남 근처에서 살 수 있는 선크림 찾아줘`
- `강남에서 볼 영화랑 주변 극장 같이 알려줘`
- `다이소랑 올리브영에서 같은 키워드로 검색해줘`

이 요청은 지금도 여러 서비스 호출을 조합하면 처리할 수 있지만, 클라이언트 입장에서는 호출 조합 규칙을 알아야 합니다.

## 목표

- 하나의 입력으로 여러 서비스를 병렬 조회합니다.
- 서비스별 성공/실패를 분리해 부분 성공 응답을 허용합니다.
- 기존 서비스 전용 API와 도구를 깨지 않고 얹을 수 있어야 합니다.
- 소매와 영화처럼 도메인이 다른 결과를 무리하게 한 기준으로 섞지 않습니다.

## 비목표

- v1에서 전 서비스 결과를 한 줄 점수로 완벽 랭킹하지 않습니다.
- v1에서 좌석맵, 상영관 상세, 앱 전용 재고 같은 고난도 기능까지 통합하지 않습니다.
- 기존 서비스별 라우트와 MCP 도구를 대체하지 않습니다.

## 권장 인터페이스

### 1. REST 엔드포인트

```text
GET /api/search
```

권장 쿼리:

- `q`: 공통 검색어
- `services`: `daiso,oliveyoung,megabox,cgv`
- `types`: `product,store,movie,theater`
- `lat`, `lng`: 위치 기반 서비스에만 사용
- `limitPerService`: 서비스별 최대 결과 수
- `timeoutMs`: 전체 fan-out 상한

예시:

```text
/api/search?q=gangnam&services=daiso,oliveyoung,megabox,cgv&types=store,theater,movie&lat=37.498&lng=127.027&limitPerService=5
```

### 2. MCP 도구

```text
multi_search
```

입력 구조는 REST와 거의 같게 두고, 내부에서는 같은 aggregator를 호출합니다.

## 내부 구조 권장안

### 현재 구조에서 바로 맞는 방식

```text
UnifiedSearchController
  -> UnifiedSearchAggregator
    -> daiso adapter
    -> oliveyoung adapter
    -> megabox adapter
    -> cgv adapter
```

핵심은 `ServiceProvider`를 바꾸지 않는 것입니다.

이유:

- 현재 `ServiceProvider`는 "MCP 도구 등록" 책임만 갖고 있습니다.
- 통합 검색 가능 여부를 모든 서비스의 필수 계약으로 올리면 후보 서비스 추가가 오히려 어려워집니다.
- 따라서 `adapter` 파일 집합이 서비스별 검색 능력을 선택적으로 노출하는 편이 낫습니다.

## 서비스별 v1 포함 범위

| 서비스     | v1 포함 후보                           | 제외 또는 보류                                       |
| :--------- | :------------------------------------- | :--------------------------------------------------- |
| Daiso      | `products`, `stores`                   | `inventory`는 상품 ID 의존이 커서 v1 제외            |
| Oliveyoung | `stores`, `inventory`의 상품 목록 부분 | Zyte 실패 시 부분 실패 처리 필요                     |
| Megabox    | `theaters`, `movies`                   | `seats`는 영화/지점/날짜 조합이 더 필요해 v1 제외    |
| CGV        | `theaters`, `movies`                   | `timetable`은 theater/movie code 의존이 커서 v1 제외 |

## 응답 형태 권장안

v1은 그룹 응답을 기본으로 둡니다.

```json
{
  "success": true,
  "data": {
    "query": "gangnam",
    "results": {
      "daiso": {
        "products": [],
        "stores": []
      },
      "oliveyoung": {
        "stores": [],
        "products": []
      },
      "megabox": {
        "theaters": [],
        "movies": []
      },
      "cgv": {
        "theaters": [],
        "movies": []
      }
    },
    "errors": [
      {
        "service": "oliveyoung",
        "code": "TIMEOUT",
        "message": "올리브영 API 요청 시간 초과"
      }
    ]
  },
  "meta": {
    "partialFailure": true
  }
}
```

## flat 목록을 v1에서 미루는 이유

- 소매 상품, 소매 매장, 영화, 극장은 비교 기준이 다릅니다.
- 거리, 가격, 상영 여부, 재고 여부를 한 점수로 섞으면 오히려 결과 설명이 어려워집니다.
- 그룹 응답이면 프롬프트 페이지와 MCP 사용 예시도 단순해집니다.

## 실행 전략

### 1단계

- `GET /api/search`만 먼저 추가
- 서비스별 adapter는 `Promise.allSettled`로 병렬 실행
- 부분 실패를 허용

### 2단계

- 같은 aggregator를 쓰는 `multi_search` MCP 도구 추가
- prompt/OpenAPI 문서에 사용 예시 추가

### 3단계

- 충분한 사용 패턴이 쌓이면 `flatResults` 같은 보조 필드를 검토
- 그때도 기본 응답은 그룹 구조를 유지

## 캐시와 성능 메모

- fan-out이므로 서비스 하나가 느리다고 전체를 오래 붙잡지 않도록 개별 timeout이 필요합니다.
- 기존 서비스 캐시는 그대로 두고, 통합 검색 엔드포인트는 짧은 TTL 또는 no-cache로 시작하는 편이 안전합니다.
- 위치 기반 서비스가 섞이면 캐시 키 폭이 커지므로 초기에는 보수적으로 운영해야 합니다.

## 테스트 전략

- 정상: 여러 서비스가 동시에 성공하는 케이스
- 부분 실패: Oliveyoung timeout, CGV 403 fallback 실패 같은 케이스
- 필터: `services`, `types`, `limitPerService`가 올바르게 반영되는지 확인
- 문서: OpenAPI와 prompt 페이지에 통합 검색 예시를 별도로 추가

## 권장 다음 작업

1. `src/search/` 또는 `src/unified-search/` 아래에 adapter와 aggregator 초안 만들기
2. REST 엔드포인트만 먼저 구현하기
3. 부분 실패 응답 스키마와 테스트를 먼저 고정하기
4. 이후 MCP 도구를 같은 내부 함수에 연결하기
