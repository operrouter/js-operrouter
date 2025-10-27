/**
 * Example: DataSource operations using gRPC-Web client
 * 
 * Requirements:
 * - OperRouter server running on gRPC port (default :50051)
 * - Envoy or nginx gRPC-Web proxy running on http://localhost:8081
 * 
 * Envoy config example:
 * listeners:
 *   - address:
 *       socket_address:
 *         address: 0.0.0.0
 *         port_value: 8081
 *     filter_chains:
 *       - filters:
 *           - name: envoy.filters.network.http_connection_manager
 *             typed_config:
 *               "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
 *               codec_type: AUTO
 *               stat_prefix: ingress_http
 *               route_config:
 *                 name: local_route
 *                 virtual_hosts:
 *                   - name: backend
 *                     domains: ["*"]
 *                     routes:
 *                       - match: { prefix: "/" }
 *                         route:
 *                           cluster: operrouter_grpc
 *               http_filters:
 *                 - name: envoy.filters.http.grpc_web
 *                 - name: envoy.filters.http.cors
 *                 - name: envoy.filters.http.router
 *   clusters:
 *     - name: operrouter_grpc
 *       connect_timeout: 0.25s
 *       type: STRICT_DNS
 *       lb_policy: ROUND_ROBIN
 *       http2_protocol_options: {}
 *       load_assignment:
 *         cluster_name: operrouter_grpc
 *         endpoints:
 *           - lb_endpoints:
 *               - endpoint:
 *                   address:
 *                     socket_address:
 *                       address: localhost
 *                       port_value: 50051
 */

import { GRPCWebClient } from '../src/grpc-client.js';

async function main() {
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

    // 2. Create a PostgreSQL datasource
    console.log('\n2. Creating PostgreSQL datasource...');
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
      process.exit(1);
    }
    console.log('✅ PostgreSQL datasource created');

    // 3. Query data from the datasource
    console.log('\n3. Querying data...');
    const queryResp = await client.queryDataSource(
      'my_postgres',
      'SELECT * FROM users LIMIT 10'
    );
    if (!queryResp.success) {
      console.error('❌ Query failed:', queryResp.message);
    } else {
      console.log(`✅ Query successful, found ${queryResp.rows.length} rows`);
      console.log('Sample rows:', JSON.stringify(queryResp.rows, null, 2));
    }

    // 4. Execute a DDL statement (create table if not exists)
    console.log('\n4. Executing DDL statement...');
    const execResp = await client.executeDataSource(
      'my_postgres',
      `CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    );
    if (!execResp.success) {
      console.error('❌ Execute failed:', execResp.message);
    } else {
      console.log('✅ Table created or already exists');
    }

    // 5. Insert data
    console.log('\n5. Inserting data...');
    const insertResp = await client.insertDataSource('my_postgres', {
      name: 'Test User via gRPC-Web',
      created_at: new Date().toISOString(),
    });
    if (!insertResp.success) {
      console.error('❌ Insert failed:', insertResp.message);
    } else {
      console.log('✅ Data inserted successfully');
    }

    // 6. Ping the datasource
    console.log('\n6. Pinging datasource...');
    const pingDsResp = await client.pingDataSource('my_postgres');
    if (!pingDsResp.success) {
      console.error('❌ Datasource ping failed:', pingDsResp.message);
    } else {
      console.log('✅ Datasource is healthy');
    }

    // 7. Close the datasource
    console.log('\n7. Closing datasource...');
    const closeResp = await client.closeDataSource('my_postgres');
    if (!closeResp.success) {
      console.error('❌ Failed to close datasource:', closeResp.message);
    } else {
      console.log('✅ Datasource closed');
    }

    console.log('\n✅ All DataSource operations completed successfully');
  } catch (error) {
    console.error('❌ Error during gRPC-Web operations:', error);
    process.exit(1);
  }
}

main();
