import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCatalogue1792702976256 implements MigrationInterface {
  name = 'CreateCatalogue1792702976256';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."brand_tier" AS ENUM('high_street', 'designer')
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."product_gender" AS ENUM('women', 'men', 'unisex')
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."wear_style" AS ENUM('eastern', 'western')
        `);
    await queryRunner.query(`
            CREATE TABLE "brands" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "owner_id" uuid,
                "name" character varying(80) NOT NULL,
                "slug" character varying(80) NOT NULL,
                "description" text,
                "logo_url" character varying(500),
                "website" character varying(200),
                "feed_url" character varying(300),
                "price_divisor" smallint NOT NULL DEFAULT '1',
                "tier" "public"."brand_tier" NOT NULL DEFAULT 'high_street',
                "default_gender" "public"."product_gender" NOT NULL DEFAULT 'women',
                "default_style" "public"."wear_style" NOT NULL DEFAULT 'eastern',
                "verified" boolean NOT NULL DEFAULT false,
                "last_synced_at" TIMESTAMP WITH TIME ZONE,
                "last_sync_report" jsonb,
                CONSTRAINT "PK_b0c437120b624da1034a81fc561" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_e4652d5f7ed0dd6438f68a68d4" ON "brands" ("owner_id")
            WHERE owner_id IS NOT NULL
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_b15428f362be2200922952dc26" ON "brands" ("slug")
        `);
    await queryRunner.query(`
            CREATE TABLE "brand_stores" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "brand_id" uuid NOT NULL,
                "name" character varying(120) NOT NULL,
                "address" character varying(250) NOT NULL,
                "city" character varying(60) NOT NULL,
                "lat" double precision NOT NULL,
                "lng" double precision NOT NULL,
                "phone" character varying(20),
                "opening_hours" character varying(120),
                CONSTRAINT "PK_5cda57c14816fa4a9694fcfb4af" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_9a4b778395c5a8f3534ae62c18" ON "brand_stores" ("brand_id")
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."product_category" AS ENUM(
                'kurta',
                'top',
                'trousers',
                'dupatta',
                'shawl',
                'dress',
                'suit',
                'unstitched',
                'outerwear',
                'shoes',
                'bag',
                'jewellery',
                'accessory',
                'other'
            )
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."occasion" AS ENUM(
                'casual',
                'office',
                'festive',
                'formal',
                'wedding',
                'party'
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "products" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "brand_id" uuid NOT NULL,
                "external_id" character varying(64),
                "title" character varying(200) NOT NULL,
                "description" text,
                "brand_category" character varying(80),
                "category" "public"."product_category" NOT NULL,
                "gender" "public"."product_gender" NOT NULL,
                "style" "public"."wear_style" NOT NULL,
                "colours" text array NOT NULL DEFAULT '{}',
                "occasions" "public"."occasion" array NOT NULL DEFAULT '{}',
                "fabric" character varying(60),
                "price" integer NOT NULL,
                "compare_at_price" integer,
                "images" text array NOT NULL DEFAULT '{}',
                "product_url" character varying(400),
                "is_active" boolean NOT NULL DEFAULT true,
                "ai_tagged" boolean NOT NULL DEFAULT false,
                CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_75895eeb1903f8a17816dafe0a" ON "products" ("price")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_a6fbf2c9b12f3372de99d35d93" ON "products" ("category", "gender", "is_active")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_acc22f7327a67c69edbd60a4bd" ON "products" ("brand_id", "external_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "product_variants" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "product_id" uuid NOT NULL,
                "external_id" character varying(64),
                "size" character varying(40) NOT NULL,
                "sku" character varying(80),
                "in_stock" boolean NOT NULL DEFAULT true,
                "stock_qty" integer,
                CONSTRAINT "PK_281e3f2c55652d6a22c0aa59fd7" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_0789f658feefc85bf172a1440a" ON "product_variants" ("product_id", "external_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "brands"
            ADD CONSTRAINT "FK_c28afa0db2ceaa90125fad8f8b9" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "brand_stores"
            ADD CONSTRAINT "FK_9a4b778395c5a8f3534ae62c18e" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "products"
            ADD CONSTRAINT "FK_1530a6f15d3c79d1b70be98f2be" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "product_variants"
            ADD CONSTRAINT "FK_6343513e20e2deab45edfce1316" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    // Block Supabase's public REST API (see EnableRowLevelSecurity migration).
    await queryRunner.query(`ALTER TABLE "brands" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "brand_stores" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "products" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "product_variants" ENABLE ROW LEVEL SECURITY`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "product_variants" DROP CONSTRAINT "FK_6343513e20e2deab45edfce1316"
        `);
    await queryRunner.query(`
            ALTER TABLE "products" DROP CONSTRAINT "FK_1530a6f15d3c79d1b70be98f2be"
        `);
    await queryRunner.query(`
            ALTER TABLE "brand_stores" DROP CONSTRAINT "FK_9a4b778395c5a8f3534ae62c18e"
        `);
    await queryRunner.query(`
            ALTER TABLE "brands" DROP CONSTRAINT "FK_c28afa0db2ceaa90125fad8f8b9"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_0789f658feefc85bf172a1440a"
        `);
    await queryRunner.query(`
            DROP TABLE "product_variants"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_acc22f7327a67c69edbd60a4bd"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_a6fbf2c9b12f3372de99d35d93"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_75895eeb1903f8a17816dafe0a"
        `);
    await queryRunner.query(`
            DROP TABLE "products"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."occasion"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."product_category"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_9a4b778395c5a8f3534ae62c18"
        `);
    await queryRunner.query(`
            DROP TABLE "brand_stores"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_b15428f362be2200922952dc26"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_e4652d5f7ed0dd6438f68a68d4"
        `);
    await queryRunner.query(`
            DROP TABLE "brands"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."wear_style"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."product_gender"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."brand_tier"
        `);
  }
}
