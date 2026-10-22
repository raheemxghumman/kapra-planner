import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DataSourceOptions } from 'typeorm';

/** Folder of this file; ES modules have no __dirname, so we derive it from import.meta.url. */
const databaseDir = dirname(fileURLToPath(import.meta.url));

/** TypeORM expects glob patterns with forward slashes, even on Windows. */
const toGlob = (...parts: string[]) => join(...parts).replace(/\\/g, '/');

/**
 * One place that describes how we connect to PostgreSQL.
 * Used both by the running app (TypeOrmModule) and by the migration CLI (data-source.ts),
 * so the two can never disagree.
 */
export function buildTypeOrmOptions(databaseUrl: string, useSsl: boolean): DataSourceOptions {
  return {
    type: 'postgres',
    url: databaseUrl,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
    // Use PostgreSQL's built-in gen_random_uuid() instead of the uuid-ossp extension.
    uuidExtension: 'pgcrypto',
    entities: [toGlob(databaseDir, '..', '**', '*.entity.{ts,js}')],
    migrations: [toGlob(databaseDir, 'migrations', '*.{ts,js}')],
    // Never let TypeORM change the schema by itself; every change is a reviewed migration.
    synchronize: false,
    migrationsRun: false,
  };
}
