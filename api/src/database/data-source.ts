import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildTypeOrmOptions } from './typeorm.options.js';

/**
 * Data source used only by the TypeORM CLI (migration:generate / run / revert).
 * The app itself connects through TypeOrmModule in app.module.ts.
 */
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

export default new DataSource(
  buildTypeOrmOptions(databaseUrl, process.env.DATABASE_SSL === 'true'),
);
