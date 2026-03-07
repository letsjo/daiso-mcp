/**
 * MCP 도구 정의 공통 빌더
 */

import type { McpToolResponse, ToolHandler, ToolInputSchema, ToolRegistration } from './types.js';

interface CreateToolOptions<TArgs> {
  name: string;
  title: string;
  description: string;
  inputSchema: ToolInputSchema;
  handler: ToolHandler<TArgs>;
}

/**
 * JSON 텍스트 응답 생성
 */
export function createJsonTextResponse(payload: unknown): McpToolResponse {
  return {
    content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
  };
}

/**
 * 도구 등록 정보 생성
 */
export function createTool<TArgs>(options: CreateToolOptions<TArgs>): ToolRegistration {
  const { name, title, description, inputSchema, handler } = options;

  return {
    name,
    metadata: {
      title,
      description,
      inputSchema,
    },
    handler: handler as ToolHandler,
  };
}
