# @operrouter/js-operrouter

JavaScript/TypeScript SDK for [OperRouter](https://github.com/operrouter/operrouter-core) - A powerful operator framework for managing DataSources and LLMs.

## Features

✅ **HTTP JSON-RPC Client** - Simple REST-based integration  
✅ **gRPC-Web Client** - High-performance binary protocol (requires Envoy/nginx proxy)  
✅ **WASM Client** - Browser-native WebAssembly execution with Rust core  
✅ **TypeScript Support** - Full type definitions included  
✅ **DataSource Operations** - PostgreSQL, MySQL, Redis, MongoDB, Kafka  
✅ **LLM Operations** - OpenAI, Ollama, Anthropic Claude, Local models  

## Installation

```bash
npm install @operrouter/js-operrouter
```

## Quick Start

### HTTP Client

```typescript
import { HTTPClient } from '@operrouter/js-operrouter';

const client = new HTTPClient('http://localhost:8080');

// Create a PostgreSQL datasource
const resp = await client.createDataSource('my_db', {
  driver: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  username: 'user',
  password: 'pass',
});

// Query data
const result = await client.queryDataSource('my_db', 'SELECT * FROM users');
console.log(result.rows);
```

### gRPC-Web Client

```typescript
import { GRPCWebClient } from '@operrouter/js-operrouter';

// Requires Envoy/nginx gRPC-Web proxy
const client = new GRPCWebClient('http://localhost:8081');

// Same API as HTTP client
const resp = await client.createLLM('my_llm', {
  provider: 'openai',
  model: 'gpt-3.5-turbo',
  api_key: process.env.OPENAI_API_KEY,
});

const text = await client.generateLLM('my_llm', 'Hello, world!');
console.log(text.text);
```

### WASM Client

```typescript
import { WASMClient } from '@operrouter/js-operrouter';

// Requires operrouter-core-wasm module
const client = new WASMClient('http://localhost:8080', {
  wasmPath: './operrouter_core_wasm_bg.wasm'
});

// Same API as other clients, but with WASM-powered config validation
const resp = await client.validateConfig(config); // Runs in WASM!
const metadata = await client.getMetadata();
```

**Setup Required:** See [WASM_GUIDE.md](./WASM_GUIDE.md) for detailed instructions.

### Core Methods

#### `ping(): Promise<PingResponse>`
Test server connection.

#### `validateConfig(config: object): Promise<ConfigResponse>`
Validate operator configuration.

#### `loadConfig(path: string): Promise<ConfigResponse>`
Load configuration from file.

#### `getMetadata(): Promise<Metadata>`
Get server metadata (name, version, description).

### DataSource Methods

#### `createDataSource(name: string, config: DataSourceConfig): Promise<DataSourceResponse>`
Create a new datasource connection.

**Supported Drivers:**
- `postgres` - PostgreSQL
- `mysql` - MySQL/MariaDB
- `redis` - Redis
- `mongodb` - MongoDB
- `kafka` - Apache Kafka

**Config Example:**
```typescript
{
  driver: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  username: 'user',
  password: 'pass',
  sslmode: 'disable', // Optional
}
```

#### `queryDataSource(name: string, query: string): Promise<DataSourceQueryResponse>`
Execute a SELECT query and return rows.

#### `executeDataSource(name: string, query: string): Promise<DataSourceResponse>`
Execute DDL/DML statements (CREATE, INSERT, UPDATE, DELETE).

#### `insertDataSource(name: string, data: Record<string, any>): Promise<DataSourceResponse>`
Insert a single row of data.

#### `pingDataSource(name: string): Promise<DataSourceResponse>`
Check datasource health.

#### `closeDataSource(name: string): Promise<DataSourceResponse>`
Close datasource connection.

### LLM Methods

#### `createLLM(name: string, config: LLMConfig): Promise<LLMResponse>`
Create a new LLM instance.

**Supported Providers:**
- `openai` - OpenAI (GPT-3.5, GPT-4, etc.)
- `ollama` - Ollama (local models)
- `anthropic` - Anthropic Claude
- `local` - Custom local models

**Config Example:**
```typescript
{
  provider: 'openai',
  model: 'gpt-3.5-turbo',
  api_key: 'sk-...',
}
```

#### `generateLLM(name: string, prompt: string): Promise<LLMGenerateResponse>`
Generate text completion from a prompt.

#### `chatLLM(name: string, messages: ChatMessage[]): Promise<LLMChatResponse>`
Chat with the model using message history.

**ChatMessage format:**
```typescript
{
  role: 'system' | 'user' | 'assistant',
  content: string,
}
```

#### `embeddingLLM(name: string, text: string): Promise<LLMEmbeddingResponse>`
Get vector embedding for text.

#### `pingLLM(name: string): Promise<LLMResponse>`
Check LLM instance health.

#### `closeLLM(name: string): Promise<LLMResponse>`
Close LLM instance.

## Transport Comparison

| Feature | HTTP JSON-RPC | gRPC-Web | WASM Client |
|---------|---------------|----------|-------------|
| **Setup** | ✅ Simple | ⚠️ Requires proxy | ⚠️ Requires WASM build |
| **Performance** | Good | ⚡ Excellent | ⚡ Excellent (config ops) |
| **Protocol** | JSON over HTTP/1.1 | Protobuf over HTTP/2 | WASM + JSON-RPC |
| **Browser Support** | ✅ Native | ✅ Via proxy | ✅ Modern browsers |
| **Bundle Size** | ~15KB | ~80KB | ~8KB + 120KB WASM |
| **Use Case** | Quick integration | Production apps | Browser-native apps |

### Setting up gRPC-Web Proxy (Envoy)

Create `envoy.yaml`:

```yaml
static_resources:
  listeners:
    - address:
        socket_address:
          address: 0.0.0.0
          port_value: 8081
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                codec_type: AUTO
                stat_prefix: ingress_http
                route_config:
                  name: local_route
                  virtual_hosts:
                    - name: backend
                      domains: ["*"]
                      routes:
                        - match: { prefix: "/" }
                          route:
                            cluster: operrouter_grpc
                http_filters:
                  - name: envoy.filters.http.grpc_web
                  - name: envoy.filters.http.cors
                  - name: envoy.filters.http.router
  clusters:
    - name: operrouter_grpc
      connect_timeout: 0.25s
      type: STRICT_DNS
      lb_policy: ROUND_ROBIN
      http2_protocol_options: {}
      load_assignment:
        cluster_name: operrouter_grpc
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: localhost
                      port_value: 50051
```

Run with Docker:
```bash
docker run -d -p 8081:8081 -v $(pwd)/envoy.yaml:/etc/envoy/envoy.yaml envoyproxy/envoy:v1.28-latest
```

## Examples

See the `/examples` directory for complete working examples:

- `examples/datasource-http.ts` - DataSource operations via HTTP
- `examples/datasource-grpc.ts` - DataSource operations via gRPC-Web
- `examples/llm-http.ts` - LLM operations via HTTP
- `examples/llm-grpc.ts` - LLM operations via gRPC-Web
- `examples/wasm-demo.html` - **Interactive browser WASM demo**
- `examples/wasm-node.ts` - **WASM usage in Node.js**

Run an example:
```bash
node --loader ts-node/esm examples/datasource-http.ts
```

For WASM examples, see [WASM_GUIDE.md](./WASM_GUIDE.md).

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Clean
npm run clean
```

## Type Definitions

All types are exported from the main package:

```typescript
import type {
  OperRouterClient,
  DataSourceConfig,
  LLMConfig,
  ChatMessage,
  // ... and more
} from '@operrouter/js-operrouter';
```

## Error Handling

All methods return a `success` boolean and optional `message` field:

```typescript
const resp = await client.createDataSource('my_db', config);
if (!resp.success) {
  console.error('Error:', resp.message);
} else {
  console.log('Success!');
}
```

## License

Apache-2.0

## Links

- [GitHub Repository](https://github.com/operrouter/operrouter-core)
- [Documentation](https://github.com/operrouter/operrouter-core/tree/main/sdks/js-operrouter)
- [Report Issues](https://github.com/operrouter/operrouter-core/issues)
