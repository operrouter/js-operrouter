/**
 * HTTP JSON-RPC 2.0 Client for OperRouter
 * 
 * Supports all 16 methods:
 * - 4 Core: Ping, ValidateConfig, LoadConfig, GetMetadata
 * - 6 DataSource: Create, Query, Execute, Insert, Ping, Close
 * - 6 LLM: Create, Generate, Chat, Embedding, Ping, Close
 */

import type {
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
  JsonRpcRequest,
  JsonRpcResponse,
} from './types.js';

export class HTTPClient implements OperRouterClient {
  private baseURL: string;
  private timeout: number;
  private headers: Record<string, string>;
  private requestId: number = 0;

  constructor(baseURL: string, options: ClientOptions = {}) {
    this.baseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
    this.timeout = options.timeout || 30000; // 30s default
    this.headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
  }

  /**
   * Internal: Call JSON-RPC method
   */
  private async callRPC<T>(method: string, params: any): Promise<T> {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      method,
      params,
      id: ++this.requestId,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const jsonResponse: JsonRpcResponse<T> = await response.json();

      if (jsonResponse.error) {
        throw new Error(
          `JSON-RPC Error ${jsonResponse.error.code}: ${jsonResponse.error.message}`
        );
      }

      if (!jsonResponse.result) {
        throw new Error('Invalid JSON-RPC response: missing result');
      }

      return jsonResponse.result;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      throw error;
    }
  }

  // ==================== Core Methods ====================

  async ping(): Promise<PingResponse> {
    return this.callRPC<PingResponse>('ping', {});
  }

  async validateConfig(config: Record<string, any>): Promise<ConfigResponse> {
    return this.callRPC<ConfigResponse>('validate_config', { config });
  }

  async loadConfig(path: string): Promise<ConfigResponse> {
    return this.callRPC<ConfigResponse>('load_config', { path });
  }

  async getMetadata(): Promise<Metadata> {
    return this.callRPC<Metadata>('get_metadata', {});
  }

  // ==================== DataSource Methods ====================

  async createDataSource(
    name: string,
    config: DataSourceConfig
  ): Promise<DataSourceResponse> {
    return this.callRPC<DataSourceResponse>('datasource.create', {
      name,
      config,
    });
  }

  async queryDataSource(
    name: string,
    query: string
  ): Promise<DataSourceQueryResponse> {
    return this.callRPC<DataSourceQueryResponse>('datasource.query', {
      name,
      query,
    });
  }

  async executeDataSource(
    name: string,
    query: string
  ): Promise<DataSourceResponse> {
    return this.callRPC<DataSourceResponse>('datasource.execute', {
      name,
      query,
    });
  }

  async insertDataSource(
    name: string,
    data: Record<string, any>
  ): Promise<DataSourceResponse> {
    return this.callRPC<DataSourceResponse>('datasource.insert', {
      name,
      data,
    });
  }

  async pingDataSource(name: string): Promise<DataSourceResponse> {
    return this.callRPC<DataSourceResponse>('datasource.ping', { name });
  }

  async closeDataSource(name: string): Promise<DataSourceResponse> {
    return this.callRPC<DataSourceResponse>('datasource.close', { name });
  }

  // ==================== LLM Methods ====================

  async createLLM(name: string, config: LLMConfig): Promise<LLMResponse> {
    return this.callRPC<LLMResponse>('llm.create', { name, config });
  }

  async generateLLM(
    name: string,
    prompt: string
  ): Promise<LLMGenerateResponse> {
    return this.callRPC<LLMGenerateResponse>('llm.generate', {
      name,
      prompt,
    });
  }

  async chatLLM(
    name: string,
    messages: ChatMessage[]
  ): Promise<LLMChatResponse> {
    return this.callRPC<LLMChatResponse>('llm.chat', { name, messages });
  }

  async embeddingLLM(
    name: string,
    text: string
  ): Promise<LLMEmbeddingResponse> {
    return this.callRPC<LLMEmbeddingResponse>('llm.embedding', {
      name,
      text,
    });
  }

  async pingLLM(name: string): Promise<LLMResponse> {
    return this.callRPC<LLMResponse>('llm.ping', { name });
  }

  async closeLLM(name: string): Promise<LLMResponse> {
    return this.callRPC<LLMResponse>('llm.close', { name });
  }
}
