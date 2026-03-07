# 스모크 테스트 전략

작성일: 2026-03-07 (KST)

## 목적

외부 서비스 API 변경이나 워커 라우트 회귀를 빠르게 감지할 최소 점검 절차를 정리합니다.

## 기본 원칙

- 단위 테스트는 mock 기반 회귀 방지에 집중합니다.
- 스모크 테스트는 실제 HTTP 응답 구조와 외부 연동 상태를 짧게 확인합니다.
- 시크릿이 필요한 엔드포인트와 그렇지 않은 엔드포인트를 분리합니다.

## 점검 계층

### 1. 기본 점검

- `GET /health`
- `GET /`
- `GET /api/daiso/products`
- `GET /api/daiso/products/:id`
- `GET /api/daiso/stores`
- `GET /api/daiso/inventory`
- `GET /api/megabox/theaters`
- `GET /api/megabox/movies`

이 계층은 로컬 개발 서버와 배포 서버에서 모두 가장 먼저 확인합니다.

### 2. 선택 점검

- `GET /api/cgv/theaters`
- `GET /api/oliveyoung/stores`
- `GET /api/oliveyoung/inventory`

이 계층은 외부 서비스 상태, 차단 정책, `ZYTE_API_KEY` 유무 영향을 받을 수 있으므로 필요할 때만 실행합니다.

## 실행 경로

### 로컬 서버 대상

```bash
npm run dev
bash examples/api-test.sh http://localhost:8787
```

### 배포 서버 대상

```bash
bash examples/api-test.sh https://mcp.aka.page
```

### 선택 점검 포함

```bash
INCLUDE_OPTIONAL=1 bash examples/api-test.sh https://mcp.aka.page
```

### GitHub Actions 수동 실행

1. GitHub Actions에서 `Smoke Test` 워크플로우를 선택합니다.
2. `target_url`에 점검할 배포 URL을 입력합니다.
3. 외부 차단/시크릿 영향이 큰 점검까지 포함하려면 `include_optional`을 `true`로 설정합니다.

기본값은 `https://mcp.aka.page`이며, 선택 점검은 배포 대상이 관련 시크릿과 우회 설정을 이미 갖춘 경우에만 권장합니다.

## 실패 시 분류 기준

1. `/health`, `/`가 실패하면 워커 라우팅 또는 배포 상태를 먼저 확인합니다.
2. 다이소/메가박스 기본 점검이 실패하면 서버 코드 변경 또는 외부 응답 스키마 변경 가능성을 봅니다.
3. 선택 점검만 실패하면 `ZYTE_API_KEY`, 외부 차단 정책, 서비스별 일시 장애를 먼저 확인합니다.
4. 응답이 성공이지만 필드 파싱이 깨지면 스모크 테스트 스크립트와 API 응답 스키마를 함께 점검합니다.

## 운영 메모

- 릴리스 직전에는 기본 점검을 한 번 실행합니다.
- 외부 서비스 구조 변경이 의심되면 선택 점검까지 확장합니다.
- 배포 이후 빠른 확인이 필요하면 GitHub Actions `Smoke Test` 워크플로우를 사용합니다.
