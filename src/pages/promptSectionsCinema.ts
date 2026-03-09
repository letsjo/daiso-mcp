/**
 * 영화 서비스 및 공통 프롬프트 섹션 정의
 */

export function createMegaboxSeatMapPromptSection(baseUrl: string): string {
  return `### 10. 메가박스 좌석맵 조회

**설명**: 회차 ID(playSchdlNo) 기준으로 메가박스 read-only 좌석맵을 조회합니다.

**URL**: ${baseUrl}/api/megabox/seat-map?playSchdlNo={회차ID}

**필수 파라미터**:
- playSchdlNo: 메가박스 회차 ID (예: 2603101372011)

**예시**:
- ${baseUrl}/api/megabox/seat-map?playSchdlNo=2603101372011`;
}

export function createCgvAndCommonPromptSection(baseUrl: string): string {
  return `### 11. CGV 극장 검색

**설명**: 지역 코드 기준으로 CGV 극장 목록을 조회합니다.

**URL**: ${baseUrl}/api/cgv/theaters?playDate={YYYYMMDD}

**선택 파라미터**:
- playDate: 조회 날짜 (YYYYMMDD, 기본값: 오늘)
- regionCode: 지역 코드 (예: 01)
- limit: 최대 결과 수 (기본값: 30)

**예시**:
- ${baseUrl}/api/cgv/theaters?playDate=20260304&regionCode=01
- ${baseUrl}/api/cgv/theaters?playDate=20260304&limit=10

---

### 12. CGV 영화 검색

**설명**: 날짜/극장 조건으로 CGV 영화 목록을 조회합니다.

**URL**: ${baseUrl}/api/cgv/movies?playDate={YYYYMMDD}

**선택 파라미터**:
- playDate: 조회 날짜 (YYYYMMDD, 기본값: 오늘)
- theaterCode: 극장 코드 (예: 0056)

**예시**:
- ${baseUrl}/api/cgv/movies?playDate=20260304&theaterCode=0056

---

### 13. CGV 시간표 조회

**설명**: 날짜/극장/영화 조건으로 CGV 상영 시간표를 조회합니다.

**URL**: ${baseUrl}/api/cgv/timetable?playDate={YYYYMMDD}

**선택 파라미터**:
- playDate: 조회 날짜 (YYYYMMDD, 기본값: 오늘)
- theaterCode: 극장 코드 (예: 0056)
- movieCode: 영화 코드
- fromTime: 조회 시작 시각 하한 (HHMM)
- toTime: 조회 시작 시각 상한 (HHMM)
- minRemainingSeats: 최소 남은 좌석 수
- sort: 정렬 기준 (startTime-asc, remainingSeats-desc, remainingSeats-asc)
- limit: 최대 결과 수 (기본값: 50)

**예시**:
- ${baseUrl}/api/cgv/timetable?playDate=20260304&theaterCode=0056
- ${baseUrl}/api/cgv/timetable?playDate=20260304&movieCode=200001&fromTime=1800&toTime=2100&minRemainingSeats=10&sort=remainingSeats-desc

---

### 14. 통합 검색

**설명**: 여러 서비스를 한 번에 fan-out 조회하고 서비스별 그룹 결과를 반환합니다.

**URL**: ${baseUrl}/api/search?q={검색어}

**필수 파라미터**:
- q 또는 cursor 중 하나 필수

**선택 파라미터**:
- q: 공통 검색어 (예: 강남, 정리함, 듄)
- cursor: opaque continuation cursor (daiso product, oliveyoung product/store 지원)
- services: 서비스 목록 (예: daiso,oliveyoung)
- types: 결과 타입 목록 (예: product,store)
- lat: 위도
- lng: 경도
- limitPerService: 서비스별 최대 결과 수 (기본값: 5, 최대: 50)
- timeoutMs: fan-out 타임아웃 (기본값: 15000, 최대: 30000)

**예시**:
- ${baseUrl}/api/search?q=강남&services=daiso,oliveyoung&types=store
- ${baseUrl}/api/search?q=듄&services=megabox,cgv&types=movie
- ${baseUrl}/api/search?cursor={nextCursor}

## 응답 형식

### 성공 응답
\`\`\`json
{
  "success": true,
  "data": {
    "query": "정리함",
    "results": { ... },
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
\`\`\`

### 에러 응답
\`\`\`json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지"
  }
}
\`\`\`

### 에러 코드
| 코드 | 설명 |
|------|------|
| MISSING_QUERY | 검색어가 누락됨 |
| INVALID_CURSOR | cursor 파싱 또는 검증 실패 |
| CURSOR_SCOPE_NOT_SUPPORTED | multi-service 또는 multi-type cursor 요청 |
| CURSOR_QUERY_MISMATCH | cursor와 요청 파라미터 불일치 |
| INVALID_SERVICES | 지원하지 않는 서비스 지정 |
| INVALID_TYPES | 지원하지 않는 결과 타입 지정 |
| INVALID_LIMIT | 잘못된 limitPerService 값 |
| INVALID_TIMEOUT | 잘못된 timeoutMs 값 |
| INVALID_LOCATION | 잘못된 좌표 값 |

---

## 사용 팁

1. **한글 검색어**: URL 인코딩이 자동으로 처리됩니다
2. **continuation**: meta.services.{service}.{bucket}.nextCursor가 있으면 같은 범위를 이어서 조회할 수 있습니다
3. **재고 확인 워크플로우**:
   - 먼저 /api/daiso/products로 제품 검색
   - 결과에서 원하는 제품의 id 확인
   - /api/daiso/inventory에 해당 id로 재고 조회
4. **위치 기반 재고**: lat, lng 파라미터로 가까운 매장 우선 조회

---

## MCP 지원 서비스

MCP를 지원하는 AI 에이전트(Claude 등)는 더 풍부한 기능을 사용할 수 있습니다.
MCP 연결 정보: ${baseUrl}/mcp

지원 도구:
- daiso_search_products: 제품 검색
- daiso_find_stores: 매장 검색
- daiso_check_inventory: 재고 확인
- daiso_get_price_info: 가격 정보 조회
- oliveyoung_find_nearby_stores: 올리브영 주변 매장 탐색
- oliveyoung_check_inventory: 올리브영 재고 파악
- megabox_find_nearby_theaters: 메가박스 주변 지점 탐색
- megabox_list_now_showing: 메가박스 영화 목록 조회
- megabox_get_remaining_seats: 메가박스 잔여 좌석 조회
- megabox_get_seat_map: 메가박스 좌석맵 조회
- cgv_find_theaters: CGV 극장 검색
- cgv_search_movies: CGV 영화 검색
- cgv_get_timetable: CGV 시간표 조회
- multi_search: 다중 서비스 통합 검색`;
}
