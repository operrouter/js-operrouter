/**
 * Example: LLM operations using gRPC-Web client
 * 
 * Requirements:
 * - OperRouter server running on gRPC port (default :50051)
 * - Envoy or nginx gRPC-Web proxy running on http://localhost:8081
 * - OpenAI API key set in OPENAI_API_KEY environment variable
 * 
 * Run with:
 * export OPENAI_API_KEY="sk-..."
 * node --loader ts-node/esm examples/llm-grpc.ts
 */

import { GRPCWebClient } from '../src/grpc-client.js';

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY environment variable not set');
    process.exit(1);
  }

  // Create gRPC-Web client pointing to Envoy proxy
  const client = new GRPCWebClient('http://localhost:8081');

  try {
    // 1. Test server connection
    console.log('1. Testing server connection...');
    const pingResp = await client.ping();
    if (!pingResp.success) {
      console.error('❌ Server ping failed:', pingResp.message);
      process.exit(1);
    }
    console.log('✅ Server is alive');

    // 2. Create an OpenAI LLM instance
    console.log('\n2. Creating OpenAI LLM instance...');
    const createResp = await client.createLLM('my_openai', {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      api_key: apiKey,
    });
    if (!createResp.success) {
      console.error('❌ Failed to create LLM:', createResp.message);
      process.exit(1);
    }
    console.log('✅ OpenAI LLM instance created');

    // 3. Generate text completion
    console.log('\n3. Generating text completion...');
    const generateResp = await client.generateLLM(
      'my_openai',
      'Explain quantum computing in one sentence.'
    );
    if (!generateResp.success) {
      console.error('❌ Generation failed:', generateResp.message);
    } else {
      console.log('✅ Generated text:');
      console.log('  ', generateResp.text);
    }

    // 4. Chat with the model
    console.log('\n4. Testing chat interface...');
    const chatResp = await client.chatLLM('my_openai', [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'What is the capital of France?' },
    ]);
    if (!chatResp.success) {
      console.error('❌ Chat failed:', chatResp.message);
    } else {
      console.log('✅ Chat response:');
      console.log('  ', chatResp.text);
    }

    // 5. Get text embeddings
    console.log('\n5. Getting text embeddings...');
    const embeddingResp = await client.embeddingLLM(
      'my_openai',
      'Hello world'
    );
    if (!embeddingResp.success) {
      console.error('❌ Embedding failed:', embeddingResp.message);
    } else {
      console.log('✅ Embedding generated:');
      console.log('   Dimensions:', embeddingResp.embedding.length);
      console.log(
        '   First 5 values:',
        embeddingResp.embedding.slice(0, 5)
      );
    }

    // 6. Ping the LLM instance
    console.log('\n6. Pinging LLM instance...');
    const pingLlmResp = await client.pingLLM('my_openai');
    if (!pingLlmResp.success) {
      console.error('❌ LLM ping failed:', pingLlmResp.message);
    } else {
      console.log('✅ LLM instance is healthy');
    }

    // 7. Close the LLM instance
    console.log('\n7. Closing LLM instance...');
    const closeResp = await client.closeLLM('my_openai');
    if (!closeResp.success) {
      console.error('❌ Failed to close LLM:', closeResp.message);
    } else {
      console.log('✅ LLM instance closed');
    }

    console.log('\n✅ All LLM operations completed successfully');
  } catch (error) {
    console.error('❌ Error during gRPC-Web operations:', error);
    process.exit(1);
  }
}

main();
