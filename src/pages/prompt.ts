/**
 * 프롬프트 페이지
 *
 * MCP 미지원 AI 에이전트를 위한 API 설명 페이지입니다.
 * 에이전트가 이 페이지를 읽고 GET API를 사용할 수 있습니다.
 */

import {
  createCgvAndCommonPromptSection,
  createDaisoPromptSection,
  createOliveyoungMegaboxPromptSection,
} from './promptSections.js';

/**
 * 프롬프트 텍스트 생성
 */
export function generatePromptText(baseUrl: string): string {
  return `# 멀티서비스 MCP API

다이소, 올리브영, 메가박스, CGV와 통합 검색을 위한 API입니다.
모든 요청은 GET 방식이며, 결과는 JSON으로 반환됩니다.

Base URL: ${baseUrl}

---

## 사용 가능한 기능
${createDaisoPromptSection(baseUrl)}

---

${createOliveyoungMegaboxPromptSection(baseUrl)}

---

${createCgvAndCommonPromptSection(baseUrl)}`;
}

/**
 * 프롬프트 페이지 응답 생성
 */
export function createPromptResponse(baseUrl: string): Response {
  const text = generatePromptText(baseUrl);

  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
