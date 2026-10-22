import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefundPendingStatus1792707512002 implements MigrationInterface {
  name = 'AddRefundPendingStatus1792707512002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TYPE "public"."payment_status"
            ADD VALUE 'refund_pending'
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."payment_status_old" AS ENUM('pending', 'paid', 'refunded', 'failed')
        `);
    await queryRunner.query(`
            ALTER TABLE "payments"
            ALTER COLUMN "status" TYPE "public"."payment_status_old" USING "status"::"text"::"public"."payment_status_old"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."payment_status"
        `);
    await queryRunner.query(`
            ALTER TYPE "public"."payment_status_old"
            RENAME TO "payment_status"
        `);
  }
}
