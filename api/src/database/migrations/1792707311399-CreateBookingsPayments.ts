import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBookingsPayments1792707311399 implements MigrationInterface {
  name = 'CreateBookingsPayments1792707311399';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."booking_status" AS ENUM(
                'pending_payment',
                'requested',
                'accepted',
                'in_progress',
                'ready',
                'completed',
                'cancelled',
                'declined'
            )
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."booking_handoff" AS ENUM('drop_off', 'home_visit')
        `);
    await queryRunner.query(`
            CREATE TABLE "bookings" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "code" character varying(12) NOT NULL,
                "customer_id" uuid NOT NULL,
                "tailor_id" uuid NOT NULL,
                "service_id" uuid,
                "service_name" character varying(80) NOT NULL,
                "price" integer NOT NULL,
                "status" "public"."booking_status" NOT NULL DEFAULT 'pending_payment',
                "handoff" "public"."booking_handoff" NOT NULL,
                "appointment_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "address" character varying(200),
                "measurements" jsonb,
                "product_id" uuid,
                "outfit_id" uuid,
                "try_on_id" uuid,
                "notes" character varying(500),
                "due_date" date,
                "closing_reason" character varying(300),
                "paid_at" TIMESTAMP WITH TIME ZONE,
                "completed_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_bee6805982cc1e248e94ce94957" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_9add00bfd42ae2bbe830bab9aa" ON "bookings" ("code")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_8e21b7ae33e7b0673270de4146" ON "bookings" ("customer_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_dc214575b6f16b808f6c62cf1a" ON "bookings" ("tailor_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_48b267d894e32a25ebde4b207a" ON "bookings" ("status")
        `);
    await queryRunner.query(`
            CREATE TABLE "booking_events" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "booking_id" uuid NOT NULL,
                "status" "public"."booking_status" NOT NULL,
                "actor" character varying(10) NOT NULL,
                "note" character varying(300),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_bb7037dff63ec344eba13da5d0b" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f71c073e8e26aca6917ea146c8" ON "booking_events" ("booking_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "messages" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "booking_id" uuid NOT NULL,
                "sender_id" uuid NOT NULL,
                "body" character varying(1000) NOT NULL,
                "read_at" TIMESTAMP WITH TIME ZONE,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_88627704d5c274d9ab2b9641b3" ON "messages" ("booking_id", "created_at")
        `);
    await queryRunner.query(`
            CREATE TABLE "notifications" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "user_id" uuid NOT NULL,
                "type" character varying(40) NOT NULL,
                "title" character varying(120) NOT NULL,
                "body" character varying(300),
                "link" character varying(200),
                "read_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_310667f935698fcd8cb319113a" ON "notifications" ("user_id", "created_at")
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."payment_purpose" AS ENUM('booking', 'order')
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'refunded', 'failed')
        `);
    await queryRunner.query(`
            CREATE TABLE "payments" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "user_id" uuid NOT NULL,
                "purpose" "public"."payment_purpose" NOT NULL,
                "reference_id" uuid NOT NULL,
                "amount" integer NOT NULL,
                "currency" character varying(3) NOT NULL DEFAULT 'PKR',
                "status" "public"."payment_status" NOT NULL DEFAULT 'pending',
                "stripe_session_id" character varying(200),
                "stripe_payment_intent_id" character varying(100),
                "stripe_refund_id" character varying(100),
                "paid_at" TIMESTAMP WITH TIME ZONE,
                "refunded_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_427785468fb7d2733f59e7d7d3" ON "payments" ("user_id")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_d46483e24bb3616c7c7ec9f132" ON "payments" ("stripe_session_id")
            WHERE stripe_session_id IS NOT NULL
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_57bfe2c9b571413110bd080ef8" ON "payments" ("purpose", "reference_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "stripe_events" (
                "event_id" character varying(100) NOT NULL,
                "type" character varying(60) NOT NULL,
                "processed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_d0cc4569d90cb27607b2c743b4c" PRIMARY KEY ("event_id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD CONSTRAINT "FK_8e21b7ae33e7b0673270de4146f" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD CONSTRAINT "FK_dc214575b6f16b808f6c62cf1a9" FOREIGN KEY ("tailor_id") REFERENCES "tailor_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD CONSTRAINT "FK_df22e2beaabc33a432b4f65e3c2" FOREIGN KEY ("service_id") REFERENCES "tailor_services"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD CONSTRAINT "FK_449861df44c0afbe011ee10ee39" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD CONSTRAINT "FK_4863b6ceabb5af98cd3374d9881" FOREIGN KEY ("outfit_id") REFERENCES "outfits"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD CONSTRAINT "FK_1ab3028136ae0debca085d48280" FOREIGN KEY ("try_on_id") REFERENCES "try_ons"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "booking_events"
            ADD CONSTRAINT "FK_f71c073e8e26aca6917ea146c80" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "messages"
            ADD CONSTRAINT "FK_605b081c78bc3eeea959446596a" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "messages"
            ADD CONSTRAINT "FK_22133395bd13b970ccd0c34ab22" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "payments"
            ADD CONSTRAINT "FK_427785468fb7d2733f59e7d7d39" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    // Block Supabase's public REST API (see EnableRowLevelSecurity migration).
    await queryRunner.query(`ALTER TABLE "bookings" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "booking_events" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "stripe_events" ENABLE ROW LEVEL SECURITY`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "payments" DROP CONSTRAINT "FK_427785468fb7d2733f59e7d7d39"
        `);
    await queryRunner.query(`
            ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"
        `);
    await queryRunner.query(`
            ALTER TABLE "messages" DROP CONSTRAINT "FK_22133395bd13b970ccd0c34ab22"
        `);
    await queryRunner.query(`
            ALTER TABLE "messages" DROP CONSTRAINT "FK_605b081c78bc3eeea959446596a"
        `);
    await queryRunner.query(`
            ALTER TABLE "booking_events" DROP CONSTRAINT "FK_f71c073e8e26aca6917ea146c80"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings" DROP CONSTRAINT "FK_1ab3028136ae0debca085d48280"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings" DROP CONSTRAINT "FK_4863b6ceabb5af98cd3374d9881"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings" DROP CONSTRAINT "FK_449861df44c0afbe011ee10ee39"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings" DROP CONSTRAINT "FK_df22e2beaabc33a432b4f65e3c2"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings" DROP CONSTRAINT "FK_dc214575b6f16b808f6c62cf1a9"
        `);
    await queryRunner.query(`
            ALTER TABLE "bookings" DROP CONSTRAINT "FK_8e21b7ae33e7b0673270de4146f"
        `);
    await queryRunner.query(`
            DROP TABLE "stripe_events"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_57bfe2c9b571413110bd080ef8"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_d46483e24bb3616c7c7ec9f132"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_427785468fb7d2733f59e7d7d3"
        `);
    await queryRunner.query(`
            DROP TABLE "payments"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."payment_status"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."payment_purpose"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_310667f935698fcd8cb319113a"
        `);
    await queryRunner.query(`
            DROP TABLE "notifications"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_88627704d5c274d9ab2b9641b3"
        `);
    await queryRunner.query(`
            DROP TABLE "messages"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_f71c073e8e26aca6917ea146c8"
        `);
    await queryRunner.query(`
            DROP TABLE "booking_events"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."booking_status"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_48b267d894e32a25ebde4b207a"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_dc214575b6f16b808f6c62cf1a"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_8e21b7ae33e7b0673270de4146"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_9add00bfd42ae2bbe830bab9aa"
        `);
    await queryRunner.query(`
            DROP TABLE "bookings"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."booking_handoff"
        `);
  }
}
