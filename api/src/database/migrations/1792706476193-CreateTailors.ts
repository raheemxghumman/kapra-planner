import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTailors1792706476193 implements MigrationInterface {
  name = 'CreateTailors1792706476193';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "geocode_cache" (
                "query" character varying(200) NOT NULL,
                "places" jsonb NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_ad069854e6ff8937f36f9996d1f" PRIMARY KEY ("query")
            )
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."service_type" AS ENUM(
                'stitching',
                'alteration',
                'embroidery',
                'bridal'
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "tailor_services" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "tailor_id" uuid NOT NULL,
                "name" character varying(80) NOT NULL,
                "type" "public"."service_type" NOT NULL,
                "description" character varying(300),
                "price" integer NOT NULL,
                "duration_days" smallint NOT NULL,
                "is_active" boolean NOT NULL DEFAULT true,
                CONSTRAINT "PK_d2194955001b16d309a32ab4160" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_249716ae0274dd4a8abef521c2" ON "tailor_services" ("tailor_id")
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."tailor_speciality" AS ENUM(
                'women_eastern',
                'men_eastern',
                'bridal',
                'western',
                'kids',
                'alterations'
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "tailor_profiles" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "user_id" uuid NOT NULL,
                "business_name" character varying(80) NOT NULL,
                "slug" character varying(90) NOT NULL,
                "bio" character varying(1000),
                "phone" character varying(20) NOT NULL,
                "address" character varying(200) NOT NULL,
                "city" character varying(60) NOT NULL,
                "lat" double precision NOT NULL,
                "lng" double precision NOT NULL,
                "specialities" "public"."tailor_speciality" array NOT NULL DEFAULT '{}',
                "price_from" integer,
                "turnaround_days" smallint NOT NULL DEFAULT '7',
                "home_visits" boolean NOT NULL DEFAULT false,
                "gallery" jsonb NOT NULL DEFAULT '[]',
                "rating_avg" double precision NOT NULL DEFAULT '0',
                "rating_count" integer NOT NULL DEFAULT '0',
                "sentiment_avg" double precision,
                "completed_orders" integer NOT NULL DEFAULT '0',
                "cancelled_orders" integer NOT NULL DEFAULT '0',
                "rank_score" double precision NOT NULL DEFAULT '0',
                CONSTRAINT "REL_b132e6ebff42eec2162ded50ef" UNIQUE ("user_id"),
                CONSTRAINT "PK_9ed489b3ba09bdc620d1ca9831d" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_b132e6ebff42eec2162ded50ef" ON "tailor_profiles" ("user_id")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_de0255868dca7a607ed722cc05" ON "tailor_profiles" ("slug")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_e1570ff55ca2848d4a7435f792" ON "tailor_profiles" ("city")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_1ff6564394f40f8f9b48207e3a" ON "tailor_profiles" ("rank_score")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_7d34323c4b1ced2d69c7f911aa" ON "tailor_profiles" ("lat", "lng")
        `);
    await queryRunner.query(`
            CREATE TABLE "reviews" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "tailor_id" uuid NOT NULL,
                "customer_id" uuid NOT NULL,
                "booking_id" uuid,
                "rating" smallint NOT NULL,
                "comment" character varying(1000),
                "sentiment_score" double precision,
                "sentiment_label" character varying(10),
                "is_hidden" boolean NOT NULL DEFAULT false,
                "reply" character varying(500),
                "replied_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_fc68ae877286dbcaa2300ff749" ON "reviews" ("tailor_id")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_069d0975b1a89da14f84b596e6" ON "reviews" ("booking_id")
            WHERE booking_id IS NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "tailor_services"
            ADD CONSTRAINT "FK_249716ae0274dd4a8abef521c25" FOREIGN KEY ("tailor_id") REFERENCES "tailor_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "tailor_profiles"
            ADD CONSTRAINT "FK_b132e6ebff42eec2162ded50efe" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "reviews"
            ADD CONSTRAINT "FK_fc68ae877286dbcaa2300ff749f" FOREIGN KEY ("tailor_id") REFERENCES "tailor_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "reviews"
            ADD CONSTRAINT "FK_4dd42f48aa60ad8c0d5d5c4ea5b" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    // Block Supabase's public REST API (see EnableRowLevelSecurity migration).
    await queryRunner.query(`ALTER TABLE "geocode_cache" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "tailor_services" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "tailor_profiles" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "reviews" DROP CONSTRAINT "FK_4dd42f48aa60ad8c0d5d5c4ea5b"
        `);
    await queryRunner.query(`
            ALTER TABLE "reviews" DROP CONSTRAINT "FK_fc68ae877286dbcaa2300ff749f"
        `);
    await queryRunner.query(`
            ALTER TABLE "tailor_profiles" DROP CONSTRAINT "FK_b132e6ebff42eec2162ded50efe"
        `);
    await queryRunner.query(`
            ALTER TABLE "tailor_services" DROP CONSTRAINT "FK_249716ae0274dd4a8abef521c25"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_069d0975b1a89da14f84b596e6"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_fc68ae877286dbcaa2300ff749"
        `);
    await queryRunner.query(`
            DROP TABLE "reviews"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_7d34323c4b1ced2d69c7f911aa"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_1ff6564394f40f8f9b48207e3a"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_e1570ff55ca2848d4a7435f792"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_de0255868dca7a607ed722cc05"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_b132e6ebff42eec2162ded50ef"
        `);
    await queryRunner.query(`
            DROP TABLE "tailor_profiles"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."tailor_speciality"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_249716ae0274dd4a8abef521c2"
        `);
    await queryRunner.query(`
            DROP TABLE "tailor_services"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."service_type"
        `);
    await queryRunner.query(`
            DROP TABLE "geocode_cache"
        `);
  }
}
