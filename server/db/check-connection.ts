/**
 * Standalone Neon PostgreSQL connectivity check CLI script.
 *
 * Run via:
 *   npx tsx server/db/check-connection.ts
 *
 * Verifies connectivity against Neon DATABASE_URL and DIRECT_URL
 * without requiring Next.js runtime server-component bundling.
 */

import 'dotenv/config';
import { Pool } from 'pg';
import { inspectDatabaseConfig, redactDatabaseUrl } from './config';

async function main() {
  console.log('\n--- MessMate: Neon PostgreSQL Connectivity Check ---');

  const config = inspectDatabaseConfig(process.env);

  console.log('\n1. Configuration Inspection:');
  console.log(`   - DATABASE_URL: ${config.runtimeTarget ? config.runtimeTarget.redactedUrl : '[NOT SET / INVALID]'}`);
  console.log(`   - DIRECT_URL:   ${config.directTarget ? config.directTarget.redactedUrl : '[NOT SET / INVALID]'}`);

  if (config.issues.length > 0) {
    console.log('\n2. Validation Issues:');
    for (const issue of config.issues) {
      const prefix = issue.severity === 'error' ? '   [ERROR]' : '   [WARN] ';
      console.log(`${prefix} ${issue.message}`);
    }
  }

  if (!config.configured || !config.runtimeUrl) {
    console.log('\n[RESULT] Cannot connect: Real Neon PostgreSQL credentials are not yet configured in .env.');
    console.log('         Please copy .env.example to .env and paste your Neon connection strings.');
    console.log('         See docs/neon-database-setup.md for step-by-step guidance.\n');
    process.exit(1);
  }

  console.log('\n3. Testing Runtime Connection (Pooled)...');
  const pool = new Pool({
    connectionString: config.runtimeUrl,
    connectionTimeoutMillis: 7000,
  });

  try {
    const start = Date.now();
    const result = await pool.query('SELECT NOW() as now, current_database() as db, version() as ver');
    const elapsed = Date.now() - start;
    const row = result.rows[0];

    console.log(`   [SUCCESS] Connected in ${elapsed}ms!`);
    console.log(`   - Database: ${row.db}`);
    console.log(`   - Server Time: ${row.now}`);
    console.log(`   - Version: ${row.ver.split(',')[0]}`);
  } catch (error) {
    const err = error as Error;
    console.error(`   [FAILED] Connection error: ${err.message}`);
    process.exit(1);
  } finally {
    await pool.end();
  }

  console.log('\n[RESULT] Neon PostgreSQL connectivity verified successfully.\n');
}

main().catch((err) => {
  console.error('Unexpected check failure:', err);
  process.exit(1);
});
