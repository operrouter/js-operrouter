# Changelog

All notable changes to the @operrouter/js-operrouter SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-01-XX

### Added - Stage 1: HTTP JSON-RPC Client
- ✅ `HTTPClient` class with full OperRouter API support
- ✅ 16 methods across 3 categories:
  - **Core**: `ping`, `validateConfig`, `loadConfig`, `getMetadata`
  - **DataSource**: `createDataSource`, `queryDataSource`, `executeDataSource`, `insertDataSource`, `pingDataSource`, `closeDataSource`
  - **LLM**: `createLLM`, `generateLLM`, `chatLLM`, `embeddingLLM`, `pingLLM`, `closeLLM`
- ✅ JSON-RPC 2.0 protocol implementation
- ✅ 30-second timeout with AbortController
- ✅ Complete TypeScript type definitions
- ✅ HTTP examples: `datasource-http.ts`, `llm-http.ts`

### Added - Stage 2: gRPC-Web Client
- ✅ `GRPCWebClient` class using @connectrpc/connect-web
- ✅ Binary protocol support (protobuf over HTTP/2)
- ✅ Same 16-method API as HTTP client
- ✅ Protocol buffer value conversion (JS ↔ Proto)
- ✅ Enum mapping helpers (DataSourceType, LLMProvider, MessageRole)
- ✅ gRPC-Web examples: `datasource-grpc.ts`, `llm-grpc.ts`
- ✅ Envoy proxy configuration documentation

### Features
- **DataSource Support**:
  - PostgreSQL, MySQL, Redis, MongoDB, Apache Kafka
  - Query execution, DDL/DML operations, row insertion
  - Health checks and connection management

- **LLM Support**:
  - OpenAI (GPT-3.5, GPT-4), Ollama, Anthropic Claude, Local models
  - Text generation, chat interface, vector embeddings
  - Health checks and instance management

### Technical Details
- TypeScript 5.3.3 with strict mode
- ES2022 target with DOM APIs
- Generated protobuf bindings from buf
- Dual transport architecture (HTTP + gRPC-Web)

### Known Limitations
- gRPC-Web requires Envoy or nginx proxy (cannot connect directly to gRPC server)
- Examples require @types/node for type checking (not included in main SDK)
- **WASM client requires separate operrouter-core-wasm build step**
- **WASM bundle size is ~120KB (larger than pure JS clients)**
- **WASM still uses HTTP for DataSource/LLM operations (not truly local)**

### Documentation
- ✅ Comprehensive README with API reference
- ✅ Transport comparison table (HTTP vs gRPC-Web vs WASM)
- ✅ Envoy proxy setup guide
- ✅ **WASM integration guide (WASM_GUIDE.md)**
- ✅ 6 working examples (4 TS + 1 HTML + 1 WASM Node.js)

### Dependencies
- `@bufbuild/protobuf`: ^1.10.0
- `@connectrpc/connect`: ^1.4.0
- `@connectrpc/connect-web`: ^1.4.0

### Added - Stage 3: WASM Client
- ✅ `WASMClient` class using operrouter-core-wasm bridge
- ✅ WebAssembly-powered config parsing and validation
- ✅ Browser-native execution (no Node.js required in browser)
- ✅ Same 16-method API as HTTP/gRPC clients
- ✅ Rust core integration via wasm-bindgen
- ✅ Interactive HTML demo: `examples/wasm-demo.html`
- ✅ Node.js WASM example: `examples/wasm-node.ts`
- ✅ Comprehensive WASM setup guide: `WASM_GUIDE.md`

## [Unreleased]

### Planned - Future Enhancements
- Local DataSource execution (SQLite in WASM)
- WASM streaming support for large queries
- Multi-threading with Web Workers
- Lazy loading WASM modules by feature
- React/Vue component bindings
- ⏳ WebAssembly client for browser-native execution
- ⏳ Rust core compilation via wasm-pack
- ⏳ Zero-proxy browser integration
- ⏳ Performance benchmarks vs gRPC-Web

### Future Enhancements
- Unit tests with Jest or Vitest
- Integration tests with test server
- Streaming support (SSE for HTTP, bidirectional for gRPC)
- Retry logic with exponential backoff
- Connection pooling for DataSources
- Response caching layer
- CLI tool for testing operations
- Performance benchmarks (HTTP vs gRPC vs WASM)
