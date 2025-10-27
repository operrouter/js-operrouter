/**
 * Example: WASM client usage in Node.js
 * 
 * Requirements:
 * - Copy operrouter-core-wasm/pkg-node to node_modules/@operrouter/wasm or adjust import path
 * - OperRouter HTTP server running on http://localhost:8080
 * 
 * Note: WASM client uses HTTP bridge for DataSource/LLM operations.
 * It provides the same interface as HTTP/gRPC clients but with WASM-powered
 * config parsing and validation.
 */

import { WASMClient } from '../src/wasm-client.js';

async function main() {
  console.log('🦀 OperRouter WASM Client - Node.js Example\n');

  try {
    // Initialize WASM client
    console.log('1️⃣  Initializing WASM client...');
    const client = new WASMClient('http://localhost:8080', {
      // Adjust path to your operrouter-core-wasm/pkg-node location
      wasmPath: '../../bridges/operrouter-core-wasm/pkg-node/operrouter_core_wasm_bg.wasm'
    });

    // Test ping
    console.log('\n2️⃣  Testing server connection...');
    const pingResp = await client.ping();
    if (!pingResp.success) {
      console.error('❌ Server ping failed:', pingResp.message);
      process.exit(1);
    }
    console.log('✅ Server is alive');

    // Get metadata
    console.log('\n3️⃣  Fetching metadata...');
    const metadata = await client.getMetadata();
    console.log('📊 Metadata:', JSON.stringify(metadata, null, 2));

    // Create a PostgreSQL datasource
    console.log('\n4️⃣  Creating PostgreSQL datasource...');
    const createResp = await client.createDataSource('my_postgres', {
      driver: 'postgres',
      host: 'localhost',
      port: 5432,
      database: 'testdb',
      username: 'postgres',
      password: 'postgres',
      sslmode: 'disable',
    });
    
    if (!createResp.success) {
      console.error('❌ Failed to create datasource:', createResp.message);
      console.log('   Make sure PostgreSQL is running and credentials are correct');
    } else {
      console.log('✅ PostgreSQL datasource created');

      // Query the datasource
      console.log('\n5️⃣  Querying database version...');
      const queryResp = await client.queryDataSource(
        'my_postgres',
        'SELECT version()'
      );
      
      if (queryResp.success) {
        console.log('✅ Query successful:');
        console.log('   Rows:', JSON.stringify(queryResp.rows, null, 2));
      } else {
        console.error('❌ Query failed:', queryResp.message);
      }

      // Ping datasource
      console.log('\n6️⃣  Pinging datasource...');
      const pingDsResp = await client.pingDataSource('my_postgres');
      if (pingDsResp.success) {
        console.log('✅ Datasource is healthy');
      } else {
        console.error('❌ Datasource ping failed:', pingDsResp.message);
      }

      // Close datasource
      console.log('\n7️⃣  Closing datasource...');
      const closeResp = await client.closeDataSource('my_postgres');
      if (closeResp.success) {
        console.log('✅ Datasource closed');
      } else {
        console.error('❌ Failed to close:', closeResp.message);
      }
    }

    // LLM example (requires API key)
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      console.log('\n8️⃣  Testing LLM operations...');
      
      // Create LLM
      const llmCreateResp = await client.createLLM('my_llm', {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        api_key: apiKey,
      });

      if (llmCreateResp.success) {
        console.log('✅ LLM instance created');

        // Generate text
        const generateResp = await client.generateLLM(
          'my_llm',
          'What is WebAssembly in one sentence?'
        );

        if (generateResp.success) {
          console.log('✅ Generated text:', generateResp.text);
        } else {
          console.error('❌ Generation failed:', generateResp.message);
        }

        // Close LLM
        const closeLlmResp = await client.closeLLM('my_llm');
        if (closeLlmResp.success) {
          console.log('✅ LLM instance closed');
        }
      } else {
        console.error('❌ Failed to create LLM:', llmCreateResp.message);
      }
    } else {
      console.log('\n⚠️  Skipping LLM tests (OPENAI_API_KEY not set)');
    }

    console.log('\n✅ All WASM client operations completed!');
    console.log('\n💡 Key Benefits of WASM Client:');
    console.log('   - Browser-native execution (no Node.js required)');
    console.log('   - Rust-powered config parsing and validation');
    console.log('   - Same API as HTTP/gRPC clients');
    console.log('   - Smaller bundle size than full JavaScript implementation');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
