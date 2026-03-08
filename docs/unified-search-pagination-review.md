# 통합 검색 결과 제한/정렬/페이지네이션 검토

작성일: 2026-03-08 (KST)

## 배경

- 현재 `GET /api/search`와 `multi_search`는 서비스별 그룹 응답을 반환합니다.
- 요청 파라미터로는 `limitPerService`만 있고, 응답 메타데이터는 `requestedServices`, `requestedTypes`, `limitPerService`, `timeoutMs` 정도만 노출합니다.
- 클라이언트 입장에서는 각 서비스/버킷이 잘린 결과인지, 어떤 정렬이 적용됐는지, 다음 페이지가 가능한지 알기 어렵습니다.

## 현재 구조에서 바로 드러나는 한계

- 전역 `page`, `pageSize`, `pageToken`은 의미가 약합니다.
  - 응답이 flat list가 아니라 서비스별 그룹 구조이기 때문입니다.
  - `daiso.products`와 `cgv.movies`를 같은 cursor로 넘기는 모델은 안정적이지 않습니다.
- 전역 정렬(`relevance`, `distance`, `latest`)도 일괄 적용이 어렵습니다.
  - 소매/영화 도메인이 섞여 있고, 서비스별 원본 정렬 기준이 다릅니다.
- `limitPerService`는 현재 요청 단위 상한일 뿐, 응답이 실제로 truncate 되었는지는 드러나지 않습니다.

## 이번 검토 결론

### 1. 전역 페이지네이션은 도입하지 않음

- v1/v1.1에서는 `page`, `pageToken`, `totalCount` 같은 전역 페이지네이션 필드를 추가하지 않습니다.
- 이유:
  - grouped response와 맞지 않음
  - adapter별 upstream 데이터 구조가 다름
  - 안정적인 continuation 보장이 어려움

### 2. 전역 정렬 파라미터도 바로 도입하지 않음

- `sort=relevance`, `sort=latest` 같은 전역 정렬은 보류합니다.
- 현재는 서비스별 기본 정렬을 유지하는 것이 안전합니다.
- 예외적으로 거리 기반 정렬은 `store`, `theater` 타입에 한해서만 장기 후보로 둡니다.

### 3. 우선순위는 "응답 메타데이터 확장"

- 가장 먼저 필요한 것은 페이지네이션 자체가 아니라, 현재 응답의 해석 가능성을 높이는 메타데이터입니다.
- 추천 방향:
  - 서비스별 / 버킷별 `returnedCount`
  - 서비스별 / 버킷별 `truncated`
  - 서비스별 / 버킷별 `sortApplied`

예시:

```json
{
  "meta": {
    "partialFailure": false,
    "requestedServices": ["daiso", "cgv"],
    "requestedTypes": ["product", "movie"],
    "limitPerService": 5,
    "services": {
      "daiso": {
        "products": {
          "returnedCount": 5,
          "truncated": true,
          "sortApplied": "service-default"
        }
      },
      "cgv": {
        "movies": {
          "returnedCount": 3,
          "truncated": false,
          "sortApplied": "service-default"
        }
      }
    }
  }
}
```

## continuation이 필요해질 때의 권장 방향

- 전역 cursor 대신 `서비스/버킷 단위 continuation`을 검토합니다.
- 예시:
  - `daiso.products.nextCursor`
  - `oliveyoung.stores.nextCursor`
- 단, 아래 조건이 충족될 때만 도입합니다.
  - upstream 또는 adapter 레벨에서 안정적인 다음 조회 기준을 재구성할 수 있을 것
  - fan-out 재실행 시 결과 흔들림이 과도하지 않을 것

## 이번 검토에서 바로 반영한 사항

- `limitPerService` 상한을 `50`으로 고정하고 runtime 검증을 추가했습니다.
- `timeoutMs` 상한을 `30000`으로 고정하고 runtime 검증을 추가했습니다.
- OpenAPI와 runtime의 제한값 드리프트를 제거했습니다.

## 다음 구현 작업

1. `/api/search` 응답에 서비스/버킷별 `returnedCount`, `truncated`, `sortApplied` 메타데이터 추가
2. `multi_search`도 같은 메타데이터를 그대로 재사용하도록 계약 유지
3. store/theater 타입 한정 공통 정렬 옵션(`distance-asc`) 도입 가능성 별도 검토
