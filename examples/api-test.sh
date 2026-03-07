#!/bin/bash

set -euo pipefail

# 멀티서비스 REST 스모크 테스트 스크립트
# 사용법:
#   ./examples/api-test.sh [API_URL]
# 예시:
#   ./examples/api-test.sh http://localhost:8787
#   ./examples/api-test.sh https://mcp.aka.page
#
# 옵션:
#   INCLUDE_OPTIONAL=1
#   - Olive Young, CGV처럼 외부 환경/시크릿 영향이 큰 엔드포인트까지 함께 점검

API_URL=${1:-"http://localhost:8787"}
INCLUDE_OPTIONAL=${INCLUDE_OPTIONAL:-0}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "필수 명령어가 없습니다: $1" >&2
    exit 1
  fi
}

print_step() {
  echo
  echo "================================"
  echo "$1"
  echo "================================"
}

fetch_json() {
  local endpoint=$1
  shift
  curl -fsS --get "$API_URL$endpoint" "$@"
}

assert_non_empty() {
  local value=$1
  local message=$2

  if [ -z "$value" ]; then
    echo "오류: $message" >&2
    exit 1
  fi
}

require_command curl
require_command jq

echo "멀티서비스 REST 스모크 테스트"
echo "API URL: $API_URL"
echo "INCLUDE_OPTIONAL: $INCLUDE_OPTIONAL"

print_step "1. 헬스 체크"
health_json=$(curl -fsS "$API_URL/health")
echo "$health_json" | jq '.'

print_step "2. 서버 정보 조회"
root_json=$(curl -fsS "$API_URL/")
echo "$root_json" | jq '.'

print_step "3. 다이소 상품 검색"
products_json=$(fetch_json "/api/daiso/products" \
  --data-urlencode "q=수납박스" \
  --data-urlencode "pageSize=3")
echo "$products_json" | jq '.'

product_id=$(echo "$products_json" | jq -r '.data.products[0].id // empty')
assert_non_empty "$product_id" "다이소 상품 검색 결과에서 productId를 찾지 못했습니다."
echo "선택된 productId: $product_id"

print_step "4. 다이소 상품 상세"
product_detail_json=$(curl -fsS "$API_URL/api/daiso/products/$product_id")
echo "$product_detail_json" | jq '.'

print_step "5. 다이소 매장 검색"
daiso_store_json=$(fetch_json "/api/daiso/stores" \
  --data-urlencode "keyword=강남역" \
  --data-urlencode "limit=5")
echo "$daiso_store_json" | jq '.'

print_step "6. 다이소 재고 조회"
daiso_inventory_json=$(fetch_json "/api/daiso/inventory" \
  --data-urlencode "productId=$product_id" \
  --data-urlencode "pageSize=5")
echo "$daiso_inventory_json" | jq '.'

print_step "7. 메가박스 주변 지점 조회"
megabox_theaters_json=$(fetch_json "/api/megabox/theaters" \
  --data-urlencode "lat=37.5665" \
  --data-urlencode "lng=126.9780" \
  --data-urlencode "limit=3")
echo "$megabox_theaters_json" | jq '.'

print_step "8. 메가박스 영화 목록 조회"
megabox_movies_json=$(fetch_json "/api/megabox/movies" \
  --data-urlencode "areaCode=11")
echo "$megabox_movies_json" | jq '.'

if [ "$INCLUDE_OPTIONAL" = "1" ]; then
  print_step "9. CGV 극장 조회"
  cgv_theaters_json=$(fetch_json "/api/cgv/theaters" \
    --data-urlencode "regionCode=01" \
    --data-urlencode "limit=3")
  echo "$cgv_theaters_json" | jq '.'

  print_step "10. 올리브영 매장 조회"
  oliveyoung_stores_json=$(fetch_json "/api/oliveyoung/stores" \
    --data-urlencode "keyword=명동" \
    --data-urlencode "limit=3")
  echo "$oliveyoung_stores_json" | jq '.'

  print_step "11. 올리브영 재고 조회"
  oliveyoung_inventory_json=$(fetch_json "/api/oliveyoung/inventory" \
    --data-urlencode "keyword=선크림" \
    --data-urlencode "storeLimit=3")
  echo "$oliveyoung_inventory_json" | jq '.'
fi

print_step "완료"
echo "스모크 테스트가 끝났습니다."
