# WASM Integration Guide

This guide explains how to use the **WASM Client** in the OperRouter JavaScript SDK.

## Overview

The WASM Client provides a browser-native way to use OperRouter with WebAssembly-powered performance and Rust-level safety. It combines:

- 🦀 **Rust Core**: Config parsing and validation compiled to WASM
- 🌐 **Browser Native**: No Node.js or build tools required
- 🚀 **Performance**: Faster than pure JavaScript for complex operations
- 📦 **Small Bundle**: WASM binary is compact and cacheable

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Browser / Node.js                   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │  @operrouter/js-operrouter (TypeScript)         │    │
│  │                                                  │    │
│  │  WASMClient ────────────────────────────────────│───┐│
│  │     │                                            │   ││
│  │     ├─ Config Validation (WASM)                 │   ││
│  │     ├─ Metadata Extraction (WASM)               │   ││
│  │     └─ HTTP Calls (fetch API)                   │   ││
│  │                                                  │   ││
│  └──────────────────────────────────────────────────┘   ││
│           │                                              ││
│           ▼                                              ││
│  ┌─────────────────────────────────────────────────┐   ││
│  │  operrouter-core-wasm.wasm (Rust)               │◄──┘│
│  │                                                  │    │
│  │  • parse_config()      • validate_config()      │    │
│  │  • get_metadata()      • ping()                 │    │
│  │  • ds_create()         • ds_query()             │    │
│  │  • llm_generate()      • llm_chat()             │    │
│  └──────────────────────────────────────────────────┘    │
│                                                           │
└───────────────────────────────┬───────────────────────────┘
                                │ HTTP JSON-RPC
                                ▼
                    ┌───────────────────────┐
                    │  OperRouter Server    │
                    │  (HTTP Bridge :8080)  │
                    └───────────────────────┘
```

## Prerequisites

### 1. Build the WASM Module

First, build the operrouter-core-wasm bridge:

```bash
# From repository root
cd bridges/operrouter-core-wasm

# Install wasm-pack (one-time setup)
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Build for web
wasm-pack build --target web --out-dir pkg

# Build for Node.js
wasm-pack build --target nodejs --out-dir pkg-node
```

This generates:
- `pkg/` - Web bundle (for browsers)
  - `operrouter_core_wasm_bg.wasm` - WASM binary
  - `operrouter_core_wasm.js` - JS glue code
  - `operrouter_core_wasm.d.ts` - TypeScript types
- `pkg-node/` - Node.js bundle

### 2. Copy WASM Files

**For Browser Usage:**

Copy the `pkg/` directory to your web project's public folder:

```bash
# From your web project
mkdir -p public/wasm
cp -r /path/to/operrouter-core/bridges/operrouter-core-wasm/pkg/* public/wasm/
```

**For Node.js Usage:**

Install the package or symlink it:

```bash
# Option 1: Link locally
cd node_modules/@operrouter
ln -s /path/to/operrouter-core/bridges/operrouter-core-wasm/pkg-node wasm

# Option 2: Copy files
cp -r /path/to/operrouter-core/bridges/operrouter-core-wasm/pkg-node ./wasm-module
```

## Usage

### Browser (ES Modules)

```html
<!DOCTYPE html>
<html>
<head>
  <title>WASM Client Demo</title>
</head>
<body>
  <h1>OperRouter WASM Client</h1>
  <button id="testBtn">Test Connection</button>
  <pre id="output"></pre>

  <script type="module">
    import { WASMClient } from './dist/wasm-client.js';

    const client = new WASMClient('http://localhost:8080', {
      wasmPath: './wasm/operrouter_core_wasm_bg.wasm'
    });

    document.getElementById('testBtn').addEventListener('click', async () => {
      try {
        // Ping server
        const resp = await client.ping();
        document.getElementById('output').textContent = 
          JSON.stringify(resp, null, 2);

        // Create a datasource
        if (resp.success) {
          const dsResp = await client.createDataSource('my_db', {
            driver: 'postgres',
            host: 'localhost',
            port: 5432,
            database: 'testdb',
            username: 'user',
            password: 'pass'
          });
          console.log('DataSource created:', dsResp);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    });
  </script>
</body>
</html>
```

### Node.js (ES Modules)

```javascript
import { WASMClient } from '@operrouter/js-operrouter';

async function main() {
  const client = new WASMClient('http://localhost:8080', {
    // Point to pkg-node directory
    wasmPath: './node_modules/@operrouter/wasm/operrouter_core_wasm_bg.wasm'
  });

  // Ping server
  const pingResp = await client.ping();
  console.log('Ping:', pingResp);

  // Get metadata
  const metadata = await client.getMetadata();
  console.log('Metadata:', metadata);

  // Create and query a datasource
  await client.createDataSource('my_postgres', {
    driver: 'postgres',
    host: 'localhost',
    port: 5432,
    database: 'mydb',
    username: 'postgres',
    password: 'postgres'
  });

  const result = await client.queryDataSource('my_postgres', 
    'SELECT version()'
  );
  console.log('Query result:', result.rows);

  // Close
  await client.closeDataSource('my_postgres');
}

main().catch(console.error);
```

### Vite Configuration

If using Vite, add this to `vite.config.js`:

```javascript
export default {
  optimizeDeps: {
    exclude: ['@operrouter/js-operrouter']
  },
  server: {
    fs: {
      allow: ['..']
    }
  }
}
```

### Webpack Configuration

For Webpack 5, add:

```javascript
module.exports = {
  experiments: {
    asyncWebAssembly: true
  }
}
```

## API Reference

The `WASMClient` implements the same `OperRouterClient` interface as `HTTPClient` and `GRPCWebClient`:

### Constructor

```typescript
new WASMClient(httpEndpoint: string, options?: WASMClientOptions)
```

**Options:**
- `wasmPath?: string` - Path to WASM binary (default: `'./operrouter_core_wasm_bg.wasm'`)

### Core Methods

- `ping(): Promise<PingResponse>`
- `validateConfig(config: object): Promise<ConfigResponse>`
- `loadConfig(path: string): Promise<ConfigResponse>`
- `getMetadata(): Promise<Metadata>`

### DataSource Methods

- `createDataSource(name, config): Promise<DataSourceResponse>`
- `queryDataSource(name, query): Promise<DataSourceQueryResponse>`
- `executeDataSource(name, query): Promise<DataSourceResponse>`
- `insertDataSource(name, data): Promise<DataSourceResponse>`
- `pingDataSource(name): Promise<DataSourceResponse>`
- `closeDataSource(name): Promise<DataSourceResponse>`

### LLM Methods

- `createLLM(name, config): Promise<LLMResponse>`
- `generateLLM(name, prompt): Promise<LLMGenerateResponse>`
- `chatLLM(name, messages): Promise<LLMChatResponse>`
- `embeddingLLM(name, text): Promise<LLMEmbeddingResponse>`
- `pingLLM(name): Promise<LLMResponse>`
- `closeLLM(name): Promise<LLMResponse>`

## Performance Comparison

| Operation | HTTP Client | gRPC-Web | WASM Client |
|-----------|-------------|----------|-------------|
| **Initialization** | Instant | Instant | ~50-100ms (WASM load) |
| **Config Validation** | JSON-RPC call | gRPC call | **WASM (fastest)** |
| **DataSource Query** | JSON-RPC call | gRPC call | JSON-RPC call |
| **Bundle Size** | ~15KB | ~80KB | ~8KB JS + **120KB WASM** |
| **Browser Support** | ✅ All | ✅ Modern | ✅ Modern (WASM) |

### When to Use WASM Client

✅ **Best for:**
- Complex config validation in browser
- Offline-first applications (with local WASM)
- Performance-critical scenarios
- Applications using Rust ecosystem

⚠️ **Consider alternatives:**
- For simple API calls: Use `HTTPClient` (smaller, simpler)
- For high-throughput: Use `GRPCWebClient` (streaming support)
- For Node.js only: Use native Rust SDK directly

## Troubleshooting

### WASM Module Not Found

```
Error: Failed to load WASM module
```

**Solution**: Ensure WASM files are accessible:

```javascript
// Check path is correct
const client = new WASMClient('http://localhost:8080', {
  wasmPath: './correct/path/to/operrouter_core_wasm_bg.wasm'
});
```

### CORS Issues

```
Access to fetch at 'file://.../wasm' from origin 'null' has been blocked
```

**Solution**: Use a local server (not `file://`):

```bash
# Python
python3 -m http.server 8000

# Node.js
npx serve

# VS Code
# Install "Live Server" extension
```

### Import Errors

```
Cannot find module './wasm/operrouter_core_wasm.js'
```

**Solution**: Check build target matches your environment:

```bash
# For web browsers
wasm-pack build --target web

# For Node.js
wasm-pack build --target nodejs

# For bundlers (Webpack, Rollup)
wasm-pack build --target bundler
```

### Memory Issues

```
RuntimeError: memory access out of bounds
```

**Solution**: Increase WASM memory limit or reduce data size. The WASM module has limited memory compared to native.

## Advanced Usage

### Custom WASM Binary Path

```typescript
// Load from CDN
const client = new WASMClient('http://localhost:8080', {
  wasmPath: 'https://cdn.example.com/operrouter_core_wasm_bg.wasm'
});
```

### Preload WASM Module

```javascript
// Preload WASM for faster initialization
const wasmPromise = fetch('./wasm/operrouter_core_wasm_bg.wasm')
  .then(r => r.arrayBuffer());

// Later, when needed
const client = new WASMClient('http://localhost:8080');
await client.ping(); // Will use preloaded WASM
```

### Error Handling

```javascript
try {
  const client = new WASMClient('http://localhost:8080', {
    wasmPath: './wasm/operrouter_core_wasm_bg.wasm'
  });
  
  const resp = await client.createDataSource('my_db', config);
  
  if (!resp.success) {
    console.error('Operation failed:', resp.message);
  }
} catch (error) {
  if (error.message.includes('WASM')) {
    console.error('WASM initialization failed:', error);
  } else {
    console.error('Runtime error:', error);
  }
}
```

## Examples

See the `examples/` directory:

- **wasm-demo.html** - Interactive browser demo with UI
- **wasm-node.ts** - Node.js usage example

Run the browser demo:

```bash
# Build JS SDK
cd sdks/js-operrouter
npm run build

# Copy WASM files
cp ../../bridges/operrouter-core-wasm/pkg/* ./public/wasm/

# Serve with CORS enabled
npx serve -p 3000

# Open http://localhost:3000/examples/wasm-demo.html
```

## Future Enhancements

- [ ] Local DataSource execution (SQLite in WASM)
- [ ] Streaming support (for large queries)
- [ ] Multi-threading with Web Workers
- [ ] Lazy loading (split WASM by feature)
- [ ] React/Vue bindings

## Resources

- [WebAssembly Documentation](https://webassembly.org/)
- [wasm-bindgen Guide](https://rustwasm.github.io/wasm-bindgen/)
- [OperRouter Core WASM](../../bridges/operrouter-core-wasm/README.md)
- [Rust and WebAssembly Book](https://rustwasm.github.io/book/)
