# 통합 검색 continuation 전략 검토

작성일: 2026-03-08 (KST)

## 목적

- `/api/search` 응답에 `returnedCount`, `truncated`, `sortApplied`를 추가한 다음 단계로 `nextCursor` 도입 가능성을 검토합니다.
- 전역 cursor가 아니라 서비스/버킷 단위 continuation이 실제로 가능한지 판단합니다.

## 현재 구조 전제

- 응답은 flat list가 아니라 서비스별 그룹 응답입니다.
- 현재 한 요청 안에 여러 서비스와 여러 타입을 동시에 fan-out 조회할 수 있습니다.
- 이 구조에서는 하나의 `nextCursor`로 전체 응답을 이어 붙이는 방식이 자연스럽지 않습니다.

## 결론

### 1. 전역 `nextCursor`는 도입하지 않음

- `daiso.products`와 `cgv.movies`를 같은 cursor로 이어갈 수 있는 안정적인 모델이 없습니다.
- grouped response에서 전역 cursor는 구현 복잡도에 비해 의미가 약합니다.

### 2. continuation은 `서비스 1개 + 타입 1개` 조건에서만 검토

- continuation이 의미 있으려면 요청 범위를 다음처럼 좁혀야 합니다.
  - 서비스 1개만 선택
  - 타입 1개만 선택
- 예시:
  - `services=daiso&types=product`
  - `services=oliveyoung&types=store`
- 여러 서비스/타입을 동시에 조회하는 현재 fan-out 모드에서는 continuation보다 재조회 비용과 결과 흔들림이 더 큽니다.

### 3. 현재 기준 bucket별 가능성

| 서비스/버킷         | continuation 적합성 | 근거                                                                   |
| :------------------ | :------------------ | :--------------------------------------------------------------------- |
| Daiso products      | 높음                | `page`, `pageSize`, `totalCount`가 이미 있음                           |
| Daiso stores        | 낮음                | HTML 검색 결과를 한 번에 파싱하며 안정적인 upstream paging 근거가 없음 |
| Oliveyoung products | 높음                | `page`, `size`, `totalCount`, `nextPage`가 있음                        |
| Oliveyoung stores   | 중간                | `pageIdx`가 있으나 위치/검색어 조합 안정성 추가 확인 필요              |
| Megabox movies      | 낮음                | 일자 기준 snapshot 목록이며 명시적 paging이 없음                       |
| Megabox theaters    | 낮음                | 목록 + 상세 fan-out 조합이라 cursor 이점이 작음                        |
| CGV movies          | 낮음                | fallback theater 후보에 따라 결과 구성이 흔들릴 수 있음                |
| CGV theaters        | 낮음                | 지역 snapshot 목록이라 paging보다 재조회가 단순함                      |

## 권장 계약 방향

- continuation을 실제로 도입한다면 opaque token을 사용합니다.
- 토큰은 최소한 아래 범위를 포함해야 합니다.
  - `service`
  - `bucket`
  - 원래 검색 조건 요약
  - upstream page/offset 정보
  - 서버 버전 또는 strategy 식별자

예시:

```json
{
  "meta": {
    "services": {
      "daiso": {
        "products": {
          "returnedCount": 5,
          "truncated": true,
          "sortApplied": "service-default",
          "nextCursor": "opaque-token"
        }
      }
    }
  }
}
```

## 도입 전에 필요한 조건

1. 요청 범위를 `서비스 1개 + 타입 1개`로 제한하는 정책 확정
2. adapter별 `stable continuation` 가능 여부를 코드 계약으로 드러낼지 결정
3. `nextCursor`가 없는 bucket은 명시적으로 미지원 처리할지 결정

## 권장 다음 작업

1. `Daiso products`, `Oliveyoung products`, `Oliveyoung stores`만 대상으로 pilot 범위를 정리
2. continuation 요청 조건을 `서비스 1개 + 타입 1개`로 제한할지 API 계약 초안 작성
3. snapshot 성격이 강한 movie/theater bucket은 continuation 미지원으로 문서화할지 검토
