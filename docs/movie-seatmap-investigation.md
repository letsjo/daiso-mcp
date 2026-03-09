# 영화 서비스 좌석맵/상영관 상세 조사

작성일: 2026-03-08 (KST)  
최근 업데이트: 2026-03-10 (KST)  
기준: 저장소에 포함된 최신 실측 문서 + 2026-03-10 재검증

- `docs/megabox-network-analysis-result.md` (2026-03-03)
- `docs/cgv-network-analysis-result.md` (2026-03-06 업데이트 포함)

## 결론 요약

- `Megabox`: 좌석맵 조회는 `구현 완료`, 상영관 상세는 `부분 가능`
- `CGV`: 좌석맵 조회는 `현재 근거 부족`, 상영관 상세는 `현재 근거 부족`
- 따라서 다음 구현 후보는 `Megabox` 좌석 선점 충돌 체크(`selectOccupSeat.do`)이고, `CGV`는 추가 실측 전까지 보류가 맞습니다.

## 0. 2026-03-10 재검증 결과

- `POST /on/oh/ohz/PcntSeatChoi/selectSeatList.do`는 현재 `playSchdlNo` 단독으로도 200 응답을 반환했습니다.
- 유효한 회차에서는 `movieDtlInfo`, `seatListSD01`, `seatTicketAmtList`, `playSeqList`가 함께 반환됐습니다.
- 잘못된 회차에서는 HTTP 200 + `movieDtlInfo: null`, 빈 좌석 배열이 왔습니다.
- 이 결과를 바탕으로 저장소에는 `megabox_get_seat_map` MCP 도구와 `GET /api/megabox/seat-map` REST 엔드포인트를 추가했습니다.

## 1. Megabox 판정

### 이미 확보된 근거

- 상영/잔여좌석:
  - `POST /on/oh/ohb/SimpleBooking/selectBokdList.do`
  - 회차, 시작/종료 시각, `restSeatCnt`, `totSeatCnt` 확인
- 좌석맵:
  - `POST /on/oh/ohz/PcntSeatChoi/selectSeatList.do`
  - `seatListSD01[].seatUniqNo`
  - `seatListSD01[].seatZoneCd`, `seatClassCd`
  - `seatTicketAmtList[].ticketKindCd`, 좌석등급별 요금 확인
- 극장 상세:
  - `infoPage.do` HTML에서 주소, 위경도 추출 가능

### 해석

- 좌석 `남은 수량`은 이미 서비스로 제공 중입니다.
- `selectSeatList.do`는 현재 기준으로 read-only 좌석맵 구현에 충분한 응답을 줍니다.
- 다만 `selectOccupSeat.do`는 `seatOccupText`를 정확히 만들지 못하면 실패하므로, "선점 가능 여부"까지 한 번에 넣는 건 아직 이릅니다.

### 권장 범위

1. `megabox_get_seat_map`
   - 구현 완료
   - 입력:
     - `playSchdlNo`
   - 출력:
     - 좌석 식별자, 열/행/좌표
     - 구역/등급
     - 판매 가능 좌석과 불가 좌석 분류
     - 좌석등급별 요금표
2. `megabox_get_theater_detail`
   - 현재는 주소, 좌표 정도만 안정적
   - 상영관 단위 상세 정보는 추가 근거 확보 전까지 과장하지 않는 편이 안전

### 남은 구현 리스크

- 좌석 구조 응답이 날짜/회차/특별관 조합에 따라 달라질 수 있습니다.
- 캐시를 길게 두기 어렵고, 회차 단위 호출 수가 많아질 수 있습니다.
- `seatStatCd`의 세부 의미를 모두 해석한 것은 아니므로 현재는 raw code를 함께 노출하는 편이 안전합니다.

## 2. CGV 판정

### 이미 확보된 근거

- 극장/영화/시간표:
  - `searchRegnList`
  - `searchOnlyCgvMovList`
  - `searchMovScnInfo`
  - `searchSchByMov`
- 직접 호출은 403이 있고, 현재는 서명 헤더 + Zyte fallback으로 시간표까지 확보

### 부족한 근거

- 좌석맵 전용 엔드포인트 실측 없음
- 상영관 상세(관 이름, 포맷, 좌석 구조) 응답 근거 없음
- OIDC(`oidc.cgv.co.kr`) 기반 토큰 흐름이 필요한 범위는 아직 미분석

### 해석

- 현재 저장소 기준으로 `CGV`는 "회차/잔여좌석"까지만 안정 범위입니다.
- 브라우저에서 보이는 좌석 단계로 더 들어가려면 추가 인증, 추가 API, 혹은 더 깊은 예매 흐름 재현이 필요할 가능성이 큽니다.
- 따라서 지금 단계에서 `cgv_get_seat_map` 같은 도구를 추가하는 것은 과도합니다.

## 3. 상영관 상세 가능성

### Megabox

- 극장 단위 상세: 주소, 좌표까지는 가능
- 상영관 단위 상세: 현재 문서만으로는 부족

### CGV

- 극장 목록/시간표 응답에서 상영관 메타가 충분히 확인되지 않음
- 상영관 이름, 포맷, 좌석 구조를 안정적으로 주는 근거가 아직 없음

## 4. 권장 구현 순서

1. `Megabox` 좌석 선점 가능 여부는 `seatOccupText` 생성 규칙이 고정된 뒤 후속 단계로 분리
2. `Megabox` 좌석맵 응답의 좌석 상태 코드(`seatStatCd`)를 더 세분화할지 검토
3. `CGV`는 좌석맵보다 먼저 예매 단계 추가 실측을 다시 수행
4. 두 서비스 모두 "상영관 상세"는 실측 근거가 확보되기 전까지 TODO 수준에 유지

## 5. 최종 권고

- 단기:
  - `Megabox` 좌석맵은 read-only 범위로 유지합니다.
- 중기:
  - `CGV`는 좌석맵/상영관 상세를 보류합니다.
- 문서/제품 표현:
  - 현재 사용자 문구는 "잔여좌석"까지만 유지하고, "좌석맵"이나 "상영관 상세"는 아직 약속하지 않는 편이 안전합니다.
