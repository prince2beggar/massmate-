import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getRequiredRuntimeDatabaseUrl,
  inspectDatabaseConfig,
  isPlaceholderConnectionString,
  parsePostgresUrl,
  redactDatabaseUrl,
} from './config';

const VALID_POOLED_NEON =
  'postgresql://neondb_owner:SuperSecretPass123@ep-cool-river-123456-pooler.ap-southeast-1.aws.neon.tech/messmate_dev?sslmode=require';
const VALID_DIRECT_NEON =
  'postgresql://neondb_owner:SuperSecretPass123@ep-cool-river-123456.ap-southeast-1.aws.neon.tech/messmate_dev?sslmode=require';

test('inspectDatabaseConfig reports missing DATABASE_URL cleanly', () => {
  const result = inspectDatabaseConfig({});
  assert.equal(result.configured, false);
  assert.equal(result.runtimeUrl, null);
  assert.ok(result.issues.some((i) => i.code === 'MISSING_DATABASE_URL'));
  assert.ok(result.issues.some((i) => i.code === 'MISSING_DIRECT_URL'));
});

test('inspectDatabaseConfig rejects .env.example placeholder strings', () => {
  assert.equal(isPlaceholderConnectionString('YOUR_NEON_DATABASE_URL'), true);
  assert.equal(
    isPlaceholderConnectionString('YOUR_NEON_DIRECT_DATABASE_URL'),
    true
  );

  const result = inspectDatabaseConfig({
    DATABASE_URL: 'YOUR_NEON_DATABASE_URL',
    DIRECT_URL: 'YOUR_NEON_DIRECT_DATABASE_URL',
  });
  assert.equal(result.configured, false);
  assert.ok(result.issues.some((i) => i.code === 'PLACEHOLDER_DATABASE_URL'));
  assert.ok(result.issues.some((i) => i.code === 'PLACEHOLDER_DIRECT_URL'));
});

test('inspectDatabaseConfig accepts valid Neon pooled + direct URLs without errors or warnings', () => {
  const result = inspectDatabaseConfig({
    DATABASE_URL: VALID_POOLED_NEON,
    DIRECT_URL: VALID_DIRECT_NEON,
  });

  assert.equal(result.configured, true);
  assert.equal(result.issues.length, 0);
  assert.equal(result.runtimeTarget?.isNeonHost, true);
  assert.equal(result.runtimeTarget?.isPooledHost, true);
  assert.equal(result.runtimeTarget?.database, 'messmate_dev');
  assert.equal(result.directTarget?.isNeonHost, true);
  assert.equal(result.directTarget?.isPooledHost, false);
});

test('inspectDatabaseConfig enforces sslmode=require on Neon hosts', () => {
  const noSslUrl =
    'postgresql://neondb_owner:secret@ep-cool-river-123456-pooler.ap-southeast-1.aws.neon.tech/messmate_dev';
  const result = inspectDatabaseConfig({
    DATABASE_URL: noSslUrl,
    DIRECT_URL: VALID_DIRECT_NEON,
  });

  assert.equal(result.configured, false);
  assert.ok(result.issues.some((i) => i.code === 'INSECURE_SSL_MODE'));
});

test('inspectDatabaseConfig warns if pooled and direct URLs are swapped on Neon', () => {
  const result = inspectDatabaseConfig({
    DATABASE_URL: VALID_DIRECT_NEON,
    DIRECT_URL: VALID_POOLED_NEON,
  });

  assert.equal(result.configured, true);
  assert.ok(
    result.issues.some((i) => i.code === 'UNPOOLED_DATABASE_URL_WARNING')
  );
  assert.ok(result.issues.some((i) => i.code === 'POOLED_DIRECT_URL_WARNING'));
});

test('redactDatabaseUrl masks credentials and never exposes passwords', () => {
  const redacted = redactDatabaseUrl(VALID_POOLED_NEON);
  assert.equal(redacted.includes('SuperSecretPass123'), false);
  assert.equal(redacted.includes('neondb_owner'), false);
  assert.ok(redacted.includes('ep-cool-river-123456-pooler'));
});

test('parsePostgresUrl rejects non-PostgreSQL protocols and missing database names', () => {
  assert.equal(parsePostgresUrl('mysql://user:pass@host/db'), null);
  assert.equal(parsePostgresUrl('postgresql://user:pass@host/'), null);
  assert.equal(parsePostgresUrl('not-a-url'), null);
});

test('getRequiredRuntimeDatabaseUrl throws actionable error when unconfigured and returns URL when valid', () => {
  assert.throws(
    () => getRequiredRuntimeDatabaseUrl({}),
    /Neon PostgreSQL database is not configured/
  );
  assert.equal(
    getRequiredRuntimeDatabaseUrl({
      DATABASE_URL: VALID_POOLED_NEON,
      DIRECT_URL: VALID_DIRECT_NEON,
    }),
    VALID_POOLED_NEON
  );
});
