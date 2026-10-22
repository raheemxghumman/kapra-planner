import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersAndRefreshTokens1792701308768 implements MigrationInterface {
  name = 'CreateUsersAndRefreshTokens1792701308768';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."user_role" AS ENUM('customer', 'brand', 'tailor', 'admin')
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."user_status" AS ENUM('active', 'pending', 'suspended')
        `);
    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "name" character varying(80) NOT NULL,
                "email" character varying(254) NOT NULL,
                "password_hash" character varying NOT NULL,
                "phone" character varying(20),
                "city" character varying(60),
                "role" "public"."user_role" NOT NULL,
                "status" "public"."user_status" NOT NULL DEFAULT 'active',
                "failed_login_attempts" smallint NOT NULL DEFAULT '0',
                "locked_until" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email")
        `);
    await queryRunner.query(`
            CREATE TABLE "refresh_tokens" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "user_id" uuid NOT NULL,
                "token_hash" character varying(64) NOT NULL,
                "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "revoked_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_3ddc983c5f7bcf132fd8732c3f" ON "refresh_tokens" ("user_id")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_a7838d2ba25be1342091b6695f" ON "refresh_tokens" ("token_hash")
        `);
    await queryRunner.query(`
            ALTER TABLE "refresh_tokens"
            ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_a7838d2ba25be1342091b6695f"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_3ddc983c5f7bcf132fd8732c3f"
        `);
    await queryRunner.query(`
            DROP TABLE "refresh_tokens"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"
        `);
    await queryRunner.query(`
            DROP TABLE "users"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."user_status"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."user_role"
        `);
  }
}
