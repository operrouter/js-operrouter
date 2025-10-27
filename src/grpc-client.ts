/**
 * gRPC-Web Client for OperRouter
 * 
 * Uses @connectrpc/connect-web for browser-compatible gRPC
 * Requires a gRPC-Web proxy (Envoy/nginx) in front of the gRPC server
 */

// @ts-nocheck - Proto generated types need refinement
import { createClient } from '@connectrpc/connect';
import { createConnectTransport } from '@connectrpc/connect-web';
import { OperRouter } from './gen/proto/operrouter_connect.js';
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
} from './types.js';

export class GRPCWebClient implements OperRouterClient {
  private client: ReturnType<typeof createClient<typeof OperRouter>>;

  constructor(baseURL: string, options: ClientOptions = {}) {
    const transport = createConnectTransport({
      baseUrl: baseURL,
      useBinaryFormat: true,
      jsonOptions: {
        ignoreUnknownFields: true,
      },
    });

    this.client = createClient(OperRouter, transport);
  }

  // ==================== Core Methods ====================

  async ping(): Promise<PingResponse> {
    const resp = await this.client.ping({});
    return {
      success: resp.success,
      message: resp.error || '',
    };
  }

  async validateConfig(config: Record<string, any>): Promise<ConfigResponse> {
    const resp = await this.client.validateConfig({
      config: JSON.stringify(config),
    });
    return {
      success: resp.success,
      message: resp.error || '',
    };
  }

  async loadConfig(path: string): Promise<ConfigResponse> {
    const resp = await this.client.loadConfig({ path });
    return {
      success: resp.success,
      message: resp.error || '',
    };
  }

  async getMetadata(): Promise<Metadata> {
    const resp = await this.client.getMetadata({});
    return {
      name: resp.metadata?.name || '',
      version: resp.metadata?.version || '',
      description: resp.metadata?.description,
    };
  }

  // ==================== DataSource Methods ====================

  async createDataSource(
    name: string,
    config: DataSourceConfig
  ): Promise<DataSourceResponse> {
    const dsType = this.mapDataSourceType(config.driver);
    const url = this.buildDataSourceURL(config);
    const extra: Record<string, string> = {};
    Object.keys(config).forEach((key) => {
      if (!['driver', 'host', 'port', 'database', 'username', 'password'].includes(key)) {
        extra[key] = String(config[key]);
      }
    });

    const resp = await this.client.createDataSource({
      name,
      config: {
        type: dsType,
        url,
        extra,
      },
    });

    return {
      success: resp.success,
      message: resp.error || '',
    };
  }

  async queryDataSource(
    name: string,
    query: string
  ): Promise<DataSourceQueryResponse> {
    const resp = await this.client.queryDataSource({ name, query });
    
    const rows: Array<Record<string, any>> = [];
    if (resp.rows) {
      for (const row of resp.rows) {
        const jsRow: Record<string, any> = {};
        if (row.columns) {
          for (const [key, value] of Object.entries(row.columns)) {
            jsRow[key] = this.protoValueToJS(value);
          }
        }
        rows.push(jsRow);
      }
    }

    return {
      success: resp.success,
      rows,
      message: resp.error || '',
    };
  }

  async executeDataSource(
    name: string,
    query: string
  ): Promise<DataSourceResponse> {
    const resp = await this.client.executeDataSource({ name, query });
    return {
      success: resp.success,
      message: resp.error || '',
    };
  }

  async insertDataSource(
    name: string,
    data: Record<string, any>
  ): Promise<DataSourceResponse> {
    const columns: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      columns[key] = this.jsValueToProto(val);
    }

    const resp = await this.client.insertDataSource({
      name,
      data: { columns },
    });

    return {
      success: resp.success,
      message: resp.error || '',
    };
  }

  async pingDataSource(name: string): Promise<DataSourceResponse> {
    const resp = await this.client.pingDataSource({ name });
    return {
      success: resp.healthy,
      message: resp.error || '',
    };
  }

  async closeDataSource(name: string): Promise<DataSourceResponse> {
    const resp = await this.client.closeDataSource({ name });
    return {
      success: resp.success,
      message: resp.error || '',
    };
  }

  // ==================== LLM Methods ====================

  async createLLM(name: string, config: LLMConfig): Promise<LLMResponse> {
    const provider = this.mapLLMProvider(config.provider);
    
    const resp = await this.client.createLLM({
      name,
      config: {
        provider,
        model: config.model,
        apiKey: config.api_key,
      },
    });

    return {
      success: resp.success,
      message: resp.error || '',
    };
  }

  async generateLLM(
    name: string,
    prompt: string
  ): Promise<LLMGenerateResponse> {
    const resp = await this.client.generateLLM({ name, prompt });
    return {
      success: resp.success,
      text: resp.text || '',
      message: resp.error || '',
    };
  }

  async chatLLM(
    name: string,
    messages: ChatMessage[]
  ): Promise<LLMChatResponse> {
    const protoMessages = messages.map((msg) => ({
      role: this.mapMessageRole(msg.role),
      content: msg.content,
    }));

    const resp = await this.client.chatLLM({ name, messages: protoMessages });
    return {
      success: resp.success,
      text: resp.text || '',
      message: resp.error || '',
    };
  }

  async embeddingLLM(
    name: string,
    text: string
  ): Promise<LLMEmbeddingResponse> {
    const resp = await this.client.embeddingLLM({ name, text });
    const embedding = resp.embedding ? Array.from(resp.embedding) : [];

    return {
      success: resp.success,
      embedding,
      message: resp.error || '',
    };
  }

  async pingLLM(name: string): Promise<LLMResponse> {
    const resp = await this.client.pingLLM({ name });
    return {
      success: resp.healthy,
      message: resp.error || '',
    };
  }

  async closeLLM(name: string): Promise<LLMResponse> {
    const resp = await this.client.closeLLM({ name });
    return {
      success: resp.success,
      message: resp.error || '',
    };
  }

  // ==================== Helper Methods ====================

  private mapDataSourceType(driver: string): number {
    const typeMap: Record<string, number> = {
      postgres: 1,
      mysql: 2,
      redis: 3,
      mongodb: 4,
      kafka: 5,
    };
    return typeMap[driver] || 0;
  }

  private mapLLMProvider(provider: string): number {
    const providerMap: Record<string, number> = {
      openai: 1,
      ollama: 2,
      anthropic: 3,
      local: 4,
    };
    return providerMap[provider] || 0;
  }

  private mapMessageRole(role: string): number {
    const roleMap: Record<string, number> = {
      system: 1,
      user: 2,
      assistant: 3,
    };
    return roleMap[role] || 0;
  }

  private buildDataSourceURL(config: DataSourceConfig): string {
    const { driver, host, port, database, username, password } = config;
    if (driver === 'postgres') {
      return `postgresql://${username}:${password}@${host}:${port}/${database}`;
    } else if (driver === 'mysql') {
      return `mysql://${username}:${password}@${host}:${port}/${database}`;
    }
    return `${driver}://${host}:${port}`;
  }

  private protoValueToJS(value: any): any {
    if (!value || !value.value) return null;
    const v = value.value;
    if ('nullValue' in v) return null;
    if ('boolValue' in v) return v.boolValue;
    if ('intValue' in v) return Number(v.intValue);
    if ('floatValue' in v) return v.floatValue;
    if ('stringValue' in v) return v.stringValue;
    if ('bytesValue' in v) return v.bytesValue;
    return v;
  }

  private jsValueToProto(val: any): any {
    if (val === null || val === undefined) {
      return { value: { case: 'nullValue', value: 0 } };
    }
    if (typeof val === 'boolean') {
      return { value: { case: 'boolValue', value: val } };
    }
    if (typeof val === 'number') {
      if (Number.isInteger(val)) {
        return { value: { case: 'intValue', value: BigInt(val) } };
      }
      return { value: { case: 'floatValue', value: val } };
    }
    if (typeof val === 'string') {
      return { value: { case: 'stringValue', value: val } };
    }
    return { value: { case: 'stringValue', value: String(val) } };
  }
}
