import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTryOn1792705233264 implements MigrationInterface {
  name = 'CreateTryOn1792705233264';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "person_photos" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "user_id" uuid NOT NULL,
                "url" character varying(500) NOT NULL,
                "public_id" character varying(200) NOT NULL,
                CONSTRAINT "PK_5a62ba75233ae0dd6c9dee6d306" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_2c5db4bda1f486e124f47ccef2" ON "person_photos" ("user_id")
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."try_on_status" AS ENUM('pending', 'processing', 'completed', 'failed')
        `);
    await queryRunner.query(`
            CREATE TABLE "try_ons" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "user_id" uuid NOT NULL,
                "photo_id" uuid NOT NULL,
                "product_id" uuid NOT NULL,
                "status" "public"."try_on_status" NOT NULL DEFAULT 'pending',
                "provider" character varying(30),
                "result_url" character varying(500),
                "result_public_id" character varying(200),
                "error" character varying(300),
                "duration_ms" integer,
                CONSTRAINT "PK_d52e143276bd67b20b1e407524e" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_b79d4631bddfdeeb8bdac42ac0" ON "try_ons" ("user_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_feac95700d4181d2a5e0ef58a0" ON "try_ons" ("photo_id", "product_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "person_photos"
            ADD CONSTRAINT "FK_2c5db4bda1f486e124f47ccef2b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "try_ons"
            ADD CONSTRAINT "FK_b79d4631bddfdeeb8bdac42ac0f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "try_ons"
            ADD CONSTRAINT "FK_8d576ec3df7a772cd5b3be4ff84" FOREIGN KEY ("photo_id") REFERENCES "person_photos"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "try_ons"
            ADD CONSTRAINT "FK_f6be4db6f5a37114983a2eae45c" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    // Block Supabase's public REST API (see EnableRowLevelSecurity migration).
    await queryRunner.query(`ALTER TABLE "person_photos" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "try_ons" ENABLE ROW LEVEL SECURITY`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "try_ons" DROP CONSTRAINT "FK_f6be4db6f5a37114983a2eae45c"
        `);
    await queryRunner.query(`
            ALTER TABLE "try_ons" DROP CONSTRAINT "FK_8d576ec3df7a772cd5b3be4ff84"
        `);
    await queryRunner.query(`
            ALTER TABLE "try_ons" DROP CONSTRAINT "FK_b79d4631bddfdeeb8bdac42ac0f"
        `);
    await queryRunner.query(`
            ALTER TABLE "person_photos" DROP CONSTRAINT "FK_2c5db4bda1f486e124f47ccef2b"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_feac95700d4181d2a5e0ef58a0"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_b79d4631bddfdeeb8bdac42ac0"
        `);
    await queryRunner.query(`
            DROP TABLE "try_ons"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."try_on_status"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_2c5db4bda1f486e124f47ccef2"
        `);
    await queryRunner.query(`
            DROP TABLE "person_photos"
        `);
  }
}
