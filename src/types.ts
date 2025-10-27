/**
 * TypeScript types for OperRouter JS SDK
 */

// ==================== Common Types ====================

export interface PingResponse {
  success: boolean;
  message: string;
}

export interface ConfigResponse {
  success: boolean;
  message: string;
}

export interface Metadata {
  name: string;
  version: string;
  description?: string;
}

// ==================== DataSource Types ====================

export interface DataSourceConfig {
  driver: 'postgres' | 'mysql' | 'redis' | 'mongodb' | 'kafka';
  host: string;
  port: number;
  database?: string;
  username?: string;
  password?: string;
  [key: string]: any;
}

export interface DataSourceResponse {
  success: boolean;
  message: string;
}

export interface DataSourceQueryResponse {
  success: boolean;
  rows: Array<Record<string, any>>;
  message: string;
}

// ==================== LLM Types ====================

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'ollama' | 'local';
  model: string;
  api_key?: string;
  base_url?: string;
  [key: string]: any;
}

export interface LLMResponse {
  success: boolean;
  message: string;
}

export interface LLMGenerateResponse {
  success: boolean;
  text: string;
  message: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMChatResponse {
  success: boolean;
  text: string;
  message: string;
}

export interface LLMEmbeddingResponse {
  success: boolean;
  embedding: number[];
  message: string;
}

// ==================== Client Interface ====================

export interface OperRouterClient {
  // Core methods
  ping(): Promise<PingResponse>;
  validateConfig(config: Record<string, any>): Promise<ConfigResponse>;
  loadConfig(path: string): Promise<ConfigResponse>;
  getMetadata(): Promise<Metadata>;

  // DataSource operations
  createDataSource(name: string, config: DataSourceConfig): Promise<DataSourceResponse>;
  queryDataSource(name: string, query: string): Promise<DataSourceQueryResponse>;
  executeDataSource(name: string, query: string): Promise<DataSourceResponse>;
  insertDataSource(name: string, data: Record<string, any>): Promise<DataSourceResponse>;
  pingDataSource(name: string): Promise<DataSourceResponse>;
  closeDataSource(name: string): Promise<DataSourceResponse>;

  // LLM operations
  createLLM(name: string, config: LLMConfig): Promise<LLMResponse>;
  generateLLM(name: string, prompt: string): Promise<LLMGenerateResponse>;
  chatLLM(name: string, messages: ChatMessage[]): Promise<LLMChatResponse>;
  embeddingLLM(name: string, text: string): Promise<LLMEmbeddingResponse>;
  pingLLM(name: string): Promise<LLMResponse>;
  closeLLM(name: string): Promise<LLMResponse>;
}

// ==================== JSON-RPC Types ====================

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params: any;
  id: number;
}

export interface JsonRpcResponse<T = any> {
  jsonrpc: '2.0';
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: number;
}

// ==================== Client Options ====================

export interface ClientOptions {
  timeout?: number;
  headers?: Record<string, string>;
}
