/**
 * OperRouter JS SDK
 * 
 * JavaScript/TypeScript client library for OperRouter
 * Supports HTTP JSON-RPC, gRPC-Web, and WASM backends
 */

export { HTTPClient } from './http-client.js';
export { GRPCWebClient } from './grpc-client.js';
export { WASMClient } from './wasm-client.js';
export type {
  OperRouterClient,
  ClientOptions,
  PingResponse,
  ConfigResponse,
  Metadata,
  DataSourceConfig,
  DataSourceResponse,
  DataSourceQueryResponse,
  LLMConfig,
  LLMResponse,
  LLMGenerateResponse,
  LLMChatResponse,
  LLMEmbeddingResponse,
  ChatMessage,
} from './types.js';
