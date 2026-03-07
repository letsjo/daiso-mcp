# docs 문서 인덱스

이 폴더는 외부 서비스 연동을 위한 네트워크 분석 기록, 검증 스크립트, 운영 메모를 보관합니다.

## 서비스별 인덱스

### 다이소

- `daiso-network-analysis-result.md`
- `daiso-playwright-network-analysis.md`
- `daiso-replay-session-test.html`
- `daiso-test-replay.js`

### 올리브영

- `oliveyoung-network-analysis-result.md`
- `oliveyoung-lightpanda-validation.md`
- `oliveyoung-playwright-mcp-onboarding.md`
- `oliveyoung-playwright-network-analysis.md`
- `oliveyoung-replay-session-test.js`
- `oliveyoung-zyte-bandwidth-test.js`
- `oliveyoung-zyte-replay-test.js`

### 메가박스

- `megabox-network-analysis-result.md`

### CGV

- `cgv-network-analysis-result.md`

### 탐색 후보 서비스

- `cu-network-analysis-result.md`
- `emart24-network-analysis-result.md`
- `gs25-network-analysis-result.md`

## 공통 운영 문서

- `gpts-instruction.md`
- `new-service-template.md`
- `scraping-playbook.md`
- `smoke-test-strategy.md`

## 사용 메모

- 새 서비스 분석 문서는 가능하면 `{서비스명}-` 접두사로 추가합니다.
- 네트워크 분석 문서와 실행 스크립트가 함께 있으면 같은 서비스끼리 이름을 맞춰 둡니다.
- 작업 메모와 TODO는 `docs/`가 아니라 `agent/`에 정리합니다.
- 실서비스 점검 절차는 `smoke-test-strategy.md`와 `examples/api-test.sh`를 함께 봅니다.
