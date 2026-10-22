import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Supabase publishes every table in the "public" schema through its own REST API (PostgREST),
 * reachable with the project's public anon key. Our app never uses that API: all access goes
 * through NestJS, which connects as the table owner.
 *
 * Enabling row level security with no policies denies every row to Supabase's API roles
 * (anon, authenticated), while the table owner used by our backend is unaffected.
 * Every new table gets the same treatment in its own migration.
 */
const TABLES = ['users', 'refresh_tokens', 'migrations'];

export class EnableRowLevelSecurity1792701400000 implements MigrationInterface {
  name = 'EnableRowLevelSecurity1792701400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of TABLES) {
      await queryRunner.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of TABLES) {
      await queryRunner.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`);
    }
  }
}
