# 통합 검색 v1 계약 초안

작성일: 2026-03-08 (KST)

## 목적

- `GET /api/search` 구현 전에 내부 응답 스키마를 먼저 고정합니다.
- `ServiceProvider`와 별개로, 통합 검색에만 참여하는 opt-in adapter 계약을 정의합니다.
- v1에서는 서비스별 그룹 응답을 유지하고 부분 실패를 허용합니다.

## 코드 기준 위치

- 인터페이스: `src/unified-search/interfaces.ts`
- aggregator 초안: `src/unified-search/aggregator.ts`

## 응답 구조

```json
{
  "success": true,
  "data": {
    "query": "강남",
    "results": {
      "daiso": {
        "products": [],
        "stores": [],
        "movies": [],
        "theaters": []
      },
      "cgv": {
        "products": [],
        "stores": [],
        "movies": [],
        "theaters": []
      }
    },
    "errors": []
  },
  "meta": {
    "partialFailure": false,
    "requestedServices": ["daiso", "cgv"],
    "requestedTypes": ["product", "store", "movie", "theater"],
    "limitPerService": 5
  }
}
```

## 버킷 규칙

- 모든 서비스 결과는 같은 shape를 사용합니다.
- 사용하지 않는 버킷도 빈 배열로 유지합니다.
- v1 bucket:
  - `products`
  - `stores`
  - `movies`
  - `theaters`

## item 규칙

모든 item은 아래 공통 필드를 갖습니다.

- `id`
- `title`
- `service`
- 도메인별 `type`

추가 필드는 결과 종류별로 제한적으로 둡니다.

| type    | 주요 필드 예시                                                  |
| :------ | :-------------------------------------------------------------- |
| product | `price`, `originalPrice`, `category`, `imageUrl`, `stockStatus` |
| store   | `address`, `phone`, `latitude`, `longitude`, `distanceKm`       |
| movie   | `rating`, `theaterName`, `playDate`, `startTime`                |
| theater | `address`, `latitude`, `longitude`, `regionCode`, `distanceKm`  |

## adapter 계약

모든 서비스가 구현할 필요는 없습니다. 통합 검색에 참여하는 서비스만 아래 계약을 구현합니다.

```ts
interface UnifiedSearchAdapter {
  readonly service: 'daiso' | 'oliveyoung' | 'megabox' | 'cgv';
  readonly supportedTypes: Array<'product' | 'store' | 'movie' | 'theater'>;
  search(query: UnifiedSearchAdapterQuery): Promise<Partial<UnifiedSearchResultBuckets>>;
}
```

### adapter 입력 규칙

- `service`: 현재 실행 중인 서비스 ID
- `types`: 해당 adapter가 실제로 처리해야 하는 타입 목록
- `limitPerService`: 서비스당 최대 반환 수
- `latitude`, `longitude`: 위치 기반 서비스만 사용
- `timeoutMs`: 상위 controller가 전달할 수 있지만 adapter가 직접 강제할 필요는 없음

## aggregator 규칙

- 서비스 fan-out은 `Promise.all`로 병렬 실행합니다.
- 지원하지 않는 서비스는 `UNSUPPORTED_SERVICE` 오류로 분리합니다.
- adapter 실패는 `UPSTREAM_ERROR`, `TIMEOUT`, `BAD_RESPONSE`로 정규화합니다.
- adapter가 특정 타입을 지원하지 않으면 호출하지 않고 빈 그룹만 남깁니다.

## 현재 초안에서 아직 하지 않은 것

- 실제 서비스 adapter 구현
- `GET /api/search` 라우트 연결
- MCP `multi_search` 도구 연결
- OpenAPI / prompt 노출

## 다음 구현 순서 권장안

1. Daiso / Oliveyoung / Megabox / CGV용 adapter 추가
2. `GET /api/search` REST 엔드포인트 연결
3. 부분 실패 계약 테스트 추가
4. 이후 MCP `multi_search` 도구 연결
