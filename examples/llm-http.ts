/**
 * LLM HTTP Example
 * 
 * Demonstrates how to use OperRouter LLM operations via HTTP
 */

import { HTTPClient } from '../src/index.js';

async function main() {
  // Create HTTP client
  const client = new HTTPClient('http://localhost:8080');

  console.log('=== LLM HTTP Example ===\n');

  try {
    // 1. Ping the service
    console.log('1. Pinging service...');
    const pingResp = await client.ping();
    console.log('✅ Ping:', pingResp);

    // 2. Create OpenAI LLM
    console.log('\n2. Creating OpenAI LLM...');
    const createResp = await client.createLLM('my_llm', {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      api_key: process.env.OPENAI_API_KEY || 'sk-your-api-key-here',
    });
    console.log('✅ Create:', createResp);

    // 3. Generate text
    console.log('\n3. Generating text...');
    const generateResp = await client.generateLLM(
      'my_llm',
      'Tell me a joke about programming'
    );
    console.log('✅ Generate:');
    console.log('   Text:', generateResp.text);

    // 4. Chat conversation
    console.log('\n4. Chat conversation...');
    const chatResp = await client.chatLLM('my_llm', [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'What is the capital of France?' },
    ]);
    console.log('✅ Chat:');
    console.log('   Response:', chatResp.text);

    // 5. Generate embeddings
    console.log('\n5. Generating embeddings...');
    const embeddingResp = await client.embeddingLLM('my_llm', 'Hello world');
    console.log('✅ Embedding:');
    console.log(
      '   Vector (first 5):',
      embeddingResp.embedding.slice(0, 5)
    );
    console.log('   Dimension:', embeddingResp.embedding.length);

    // 6. Ping LLM
    console.log('\n6. Pinging LLM...');
    const pingLlmResp = await client.pingLLM('my_llm');
    console.log('✅ Ping LLM:', pingLlmResp);

    // 7. Close LLM
    console.log('\n7. Closing LLM...');
    const closeResp = await client.closeLLM('my_llm');
    console.log('✅ Close:', closeResp);

    console.log('\n=== All operations completed successfully! ===');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
