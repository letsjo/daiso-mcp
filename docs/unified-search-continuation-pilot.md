# 통합 검색 continuation pilot 계약 초안

작성일: 2026-03-08 (KST)

## 목표

- continuation을 전면 도입하지 않고, 안정성이 높은 bucket만 대상으로 pilot 계약을 먼저 고정합니다.
- 이번 초안은 `GET /api/search`와 `multi_search`가 공통으로 재사용할 수 있는 규칙을 정의합니다.

## 현재 상태

- pilot용 opaque cursor encode/decode 유틸 초안은 `src/unified-search/cursor.ts`에 구현됨
- REST `GET /api/search`와 MCP `multi_search`에 공통 validator 연결 완료
- `daiso products`는 실제 continuation 조회와 `nextCursor` 반환까지 구현 완료
- `oliveyoung products/stores`는 validator만 연결되어 있고 현재는 `CURSOR_NOT_IMPLEMENTED`를 반환

## pilot 범위

### 포함

- `services=daiso&types=product`
- `services=oliveyoung&types=product`
- `services=oliveyoung&types=store`

### 제외

- `daiso store`
- `megabox movie/theater`
- `cgv movie/theater`
- 서비스 2개 이상 또는 타입 2개 이상 요청

## 요청 계약 초안

### 기본 요청

```http
GET /api/search?q=정리함&services=daiso&types=product&limitPerService=5
```

### continuation 요청

```http
GET /api/search?cursor=opaque-token
```

### MCP 도구 요청

```json
{
  "query": "정리함",
  "services": ["daiso"],
  "types": ["product"],
  "limitPerService": 5
}
```

continuation 시:

```json
{
  "cursor": "opaque-token"
}
```

## 핵심 규칙

### 1. cursor가 있으면 검색 조건은 token이 우선

- `cursor`가 들어오면 서버는 token 안의 검색 조건을 신뢰합니다.
- 클라이언트가 `q`, `services`, `types`, `limitPerService`, `lat`, `lng`를 함께 보내더라도 token과 다르면 거부합니다.

### 2. continuation은 `서비스 1개 + 타입 1개`에서만 허용

- 아래 조건이 아니면 `cursor` 요청을 거부합니다.
  - `services.length === 1`
  - `types.length === 1`
  - pilot 허용 bucket에 포함

### 3. 첫 페이지와 다음 페이지의 limit은 고정

- 첫 페이지에서 정한 `limitPerService`는 token 안에 저장합니다.
- 다음 페이지 요청에서 다른 limit을 주면 거부하거나 무시하지 말고 명시적으로 에러 처리합니다.

## 응답 계약 초안

`nextCursor`는 지원 bucket이고 다음 페이지가 있을 때만 노출합니다.

```json
{
  "success": true,
  "data": {
    "query": "정리함",
    "results": {
      "daiso": {
        "products": [{ "id": "P1", "title": "정리함", "service": "daiso", "type": "product" }],
        "stores": [],
        "movies": [],
        "theaters": []
      }
    },
    "errors": []
  },
  "meta": {
    "requestedServices": ["daiso"],
    "requestedTypes": ["product"],
    "limitPerService": 5,
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

## token 내부 payload 초안

외부에는 opaque string만 노출하고, 내부 payload는 아래 수준의 정보를 가집니다.

```json
{
  "v": 1,
  "service": "daiso",
  "bucket": "products",
  "query": "정리함",
  "limitPerService": 5,
  "page": 2
}
```

올리브영 stores 예시:

```json
{
  "v": 1,
  "service": "oliveyoung",
  "bucket": "stores",
  "query": "강남",
  "limitPerService": 5,
  "pageIdx": 2,
  "latitude": 37.498,
  "longitude": 127.027
}
```

## 거부 규칙 초안

- `INVALID_CURSOR`
  - token 파싱 실패
  - version 미지원
  - service/bucket 조합 불일치
- `CURSOR_SCOPE_NOT_SUPPORTED`
  - multi-service 또는 multi-type 요청에 cursor 사용
  - pilot 미지원 bucket에 cursor 사용
- `CURSOR_QUERY_MISMATCH`
  - token과 요청 파라미터가 다름

## 다음 구현 순서

1. `oliveyoung products/stores` pilot 확장

## 비목표

- `megabox`, `cgv` 계열 continuation
- grouped response에서 전역 `nextCursor`
- cursor와 별개로 `page`, `pageSize`를 공통 API 파라미터로 노출하는 일
