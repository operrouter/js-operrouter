/**
 * DataSource HTTP Example
 * 
 * Demonstrates how to use OperRouter DataSource operations via HTTP
 */

import { HTTPClient } from '../src/index.js';

async function main() {
  // Create HTTP client
  const client = new HTTPClient('http://localhost:8080');

  console.log('=== DataSource HTTP Example ===\n');

  try {
    // 1. Ping the service
    console.log('1. Pinging service...');
    const pingResp = await client.ping();
    console.log('✅ Ping:', pingResp);

    // 2. Create PostgreSQL datasource
    console.log('\n2. Creating PostgreSQL datasource...');
    const createResp = await client.createDataSource('my_postgres', {
      driver: 'postgres',
      host: 'localhost',
      port: 5432,
      database: 'testdb',
      username: 'postgres',
      password: 'password',
    });
    console.log('✅ Create:', createResp);

    // 3. Query data
    console.log('\n3. Querying data...');
    const queryResp = await client.queryDataSource(
      'my_postgres',
      'SELECT * FROM users LIMIT 5'
    );
    console.log('✅ Query:', {
      success: queryResp.success,
      rowCount: queryResp.rows.length,
      rows: queryResp.rows,
    });

    // 4. Execute DDL
    console.log('\n4. Executing DDL...');
    const execResp = await client.executeDataSource(
      'my_postgres',
      'CREATE TABLE IF NOT EXISTS test_table (id SERIAL PRIMARY KEY, name TEXT)'
    );
    console.log('✅ Execute:', execResp);

    // 5. Insert data
    console.log('\n5. Inserting data...');
    const insertResp = await client.insertDataSource('my_postgres', {
      id: 1,
      name: 'Test User',
    });
    console.log('✅ Insert:', insertResp);

    // 6. Ping datasource
    console.log('\n6. Pinging datasource...');
    const pingDsResp = await client.pingDataSource('my_postgres');
    console.log('✅ Ping DataSource:', pingDsResp);

    // 7. Close datasource
    console.log('\n7. Closing datasource...');
    const closeResp = await client.closeDataSource('my_postgres');
    console.log('✅ Close:', closeResp);

    console.log('\n=== All operations completed successfully! ===');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
