import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProfilesWishlistStylist1792704495740 implements MigrationInterface {
  name = 'CreateProfilesWishlistStylist1792704495740';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "measurement_profiles" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "user_id" uuid NOT NULL,
                "label" character varying(60) NOT NULL,
                "chest" numeric(5, 1),
                "waist" numeric(5, 1),
                "hips" numeric(5, 1),
                "shoulder" numeric(5, 1),
                "sleeve_length" numeric(5, 1),
                "shirt_length" numeric(5, 1),
                "trouser_length" numeric(5, 1),
                "neck" numeric(5, 1),
                "notes" character varying(300),
                CONSTRAINT "PK_4117b22796f14bb8d7028858fe3" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f47795435147ff6ffc0920cd07" ON "measurement_profiles" ("user_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "style_profiles" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "user_id" uuid NOT NULL,
                "gender" "public"."product_gender" NOT NULL DEFAULT 'women',
                "styles" "public"."wear_style" array NOT NULL DEFAULT '{eastern}',
                "sizes" jsonb NOT NULL DEFAULT '{}',
                "favourite_colours" text array NOT NULL DEFAULT '{}',
                "avoid_colours" text array NOT NULL DEFAULT '{}',
                "budget_min" integer NOT NULL DEFAULT '3000',
                "budget_max" integer NOT NULL DEFAULT '15000',
                CONSTRAINT "REL_14cfb12bce51fa80a2e0130646" UNIQUE ("user_id"),
                CONSTRAINT "PK_2cc9e98614f760cec72d2821379" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_14cfb12bce51fa80a2e0130646" ON "style_profiles" ("user_id")
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."stylist_request_status" AS ENUM('running', 'completed', 'failed')
        `);
    await queryRunner.query(`
            CREATE TABLE "stylist_requests" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "user_id" uuid NOT NULL,
                "occasion" "public"."occasion" NOT NULL,
                "budget" integer NOT NULL,
                "style" "public"."wear_style",
                "colours" text array NOT NULL DEFAULT '{}',
                "notes" character varying(300),
                "status" "public"."stylist_request_status" NOT NULL DEFAULT 'running',
                "engine" character varying(10),
                "duration_ms" integer,
                "error" character varying(300),
                CONSTRAINT "PK_b9d40d596f74b1629af8d3ad2e6" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_126366f27f955aadd4034bd09a" ON "stylist_requests" ("user_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "outfit_suggestions" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "request_id" uuid NOT NULL,
                "title" character varying(80) NOT NULL,
                "reason" character varying(400) NOT NULL,
                "total_price" integer NOT NULL,
                "rank" smallint NOT NULL,
                CONSTRAINT "PK_3aa1d97e77221b4259b9c6193f4" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_ca2a9558c28aede55090f4a208" ON "outfit_suggestions" ("request_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "outfits" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "user_id" uuid NOT NULL,
                "suggestion_id" uuid,
                "name" character varying(80) NOT NULL,
                "occasion" "public"."occasion",
                CONSTRAINT "PK_f356b7c0267c3b970e469f0401a" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_fef2d9d8451cc140a9212ce66e" ON "outfits" ("user_id")
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."outfit_slot" AS ENUM(
                'top',
                'bottom',
                'dupatta',
                'outer',
                'full_look',
                'shoes',
                'accessory'
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "outfit_items" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "suggestion_id" uuid,
                "outfit_id" uuid,
                "product_id" uuid NOT NULL,
                "variant_id" uuid,
                "slot" "public"."outfit_slot" NOT NULL,
                "reason" character varying(200),
                "position" smallint NOT NULL DEFAULT '0',
                CONSTRAINT "PK_17077db4d983a98f11d2045a1c9" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_5f5d603bf7540a2a7b3d5dc740" ON "outfit_items" ("suggestion_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_914d10641268dd39cac249b096" ON "outfit_items" ("outfit_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "suggestion_feedback" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "suggestion_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                "liked" boolean NOT NULL,
                "reason" character varying(200),
                CONSTRAINT "PK_941f8e639913cffec38ccf1b2c6" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_4c9c208c4258639ee2742bed47" ON "suggestion_feedback" ("user_id")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_6efeb82fe3da4e5caa13dc75f6" ON "suggestion_feedback" ("suggestion_id", "user_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "saved_products" (
                "user_id" uuid NOT NULL,
                "product_id" uuid NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_a742fa3814f3b166decf0da1cf7" PRIMARY KEY ("user_id", "product_id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_5399766c0c857aa5c3ff348c4c" ON "saved_products" ("product_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "measurement_profiles"
            ADD CONSTRAINT "FK_f47795435147ff6ffc0920cd07d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "style_profiles"
            ADD CONSTRAINT "FK_14cfb12bce51fa80a2e0130646e" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "stylist_requests"
            ADD CONSTRAINT "FK_126366f27f955aadd4034bd09ae" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "outfit_suggestions"
            ADD CONSTRAINT "FK_ca2a9558c28aede55090f4a208a" FOREIGN KEY ("request_id") REFERENCES "stylist_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "outfits"
            ADD CONSTRAINT "FK_fef2d9d8451cc140a9212ce66ea" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "outfits"
            ADD CONSTRAINT "FK_0e231fa6c1ab894105a333742c1" FOREIGN KEY ("suggestion_id") REFERENCES "outfit_suggestions"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "outfit_items"
            ADD CONSTRAINT "FK_5f5d603bf7540a2a7b3d5dc7402" FOREIGN KEY ("suggestion_id") REFERENCES "outfit_suggestions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "outfit_items"
            ADD CONSTRAINT "FK_914d10641268dd39cac249b0967" FOREIGN KEY ("outfit_id") REFERENCES "outfits"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "outfit_items"
            ADD CONSTRAINT "FK_9e846ddcbcc1a5537c90ca119e8" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "outfit_items"
            ADD CONSTRAINT "FK_af921d42269c8247ebbc37f4d09" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "suggestion_feedback"
            ADD CONSTRAINT "FK_d7806fc7f2e47ed5eb8c650b46c" FOREIGN KEY ("suggestion_id") REFERENCES "outfit_suggestions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "suggestion_feedback"
            ADD CONSTRAINT "FK_4c9c208c4258639ee2742bed47d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "saved_products"
            ADD CONSTRAINT "FK_e847db0ce4e663ad2a51993ac39" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "saved_products"
            ADD CONSTRAINT "FK_5399766c0c857aa5c3ff348c4ca" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    // Block Supabase's public REST API (see EnableRowLevelSecurity migration).
    await queryRunner.query(`ALTER TABLE "measurement_profiles" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "style_profiles" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "stylist_requests" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "outfit_suggestions" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "outfits" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "outfit_items" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "suggestion_feedback" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "saved_products" ENABLE ROW LEVEL SECURITY`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "saved_products" DROP CONSTRAINT "FK_5399766c0c857aa5c3ff348c4ca"
        `);
    await queryRunner.query(`
            ALTER TABLE "saved_products" DROP CONSTRAINT "FK_e847db0ce4e663ad2a51993ac39"
        `);
    await queryRunner.query(`
            ALTER TABLE "suggestion_feedback" DROP CONSTRAINT "FK_4c9c208c4258639ee2742bed47d"
        `);
    await queryRunner.query(`
            ALTER TABLE "suggestion_feedback" DROP CONSTRAINT "FK_d7806fc7f2e47ed5eb8c650b46c"
        `);
    await queryRunner.query(`
            ALTER TABLE "outfit_items" DROP CONSTRAINT "FK_af921d42269c8247ebbc37f4d09"
        `);
    await queryRunner.query(`
            ALTER TABLE "outfit_items" DROP CONSTRAINT "FK_9e846ddcbcc1a5537c90ca119e8"
        `);
    await queryRunner.query(`
            ALTER TABLE "outfit_items" DROP CONSTRAINT "FK_914d10641268dd39cac249b0967"
        `);
    await queryRunner.query(`
            ALTER TABLE "outfit_items" DROP CONSTRAINT "FK_5f5d603bf7540a2a7b3d5dc7402"
        `);
    await queryRunner.query(`
            ALTER TABLE "outfits" DROP CONSTRAINT "FK_0e231fa6c1ab894105a333742c1"
        `);
    await queryRunner.query(`
            ALTER TABLE "outfits" DROP CONSTRAINT "FK_fef2d9d8451cc140a9212ce66ea"
        `);
    await queryRunner.query(`
            ALTER TABLE "outfit_suggestions" DROP CONSTRAINT "FK_ca2a9558c28aede55090f4a208a"
        `);
    await queryRunner.query(`
            ALTER TABLE "stylist_requests" DROP CONSTRAINT "FK_126366f27f955aadd4034bd09ae"
        `);
    await queryRunner.query(`
            ALTER TABLE "style_profiles" DROP CONSTRAINT "FK_14cfb12bce51fa80a2e0130646e"
        `);
    await queryRunner.query(`
            ALTER TABLE "measurement_profiles" DROP CONSTRAINT "FK_f47795435147ff6ffc0920cd07d"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_5399766c0c857aa5c3ff348c4c"
        `);
    await queryRunner.query(`
            DROP TABLE "saved_products"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_6efeb82fe3da4e5caa13dc75f6"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_4c9c208c4258639ee2742bed47"
        `);
    await queryRunner.query(`
            DROP TABLE "suggestion_feedback"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_914d10641268dd39cac249b096"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_5f5d603bf7540a2a7b3d5dc740"
        `);
    await queryRunner.query(`
            DROP TABLE "outfit_items"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."outfit_slot"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_fef2d9d8451cc140a9212ce66e"
        `);
    await queryRunner.query(`
            DROP TABLE "outfits"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_ca2a9558c28aede55090f4a208"
        `);
    await queryRunner.query(`
            DROP TABLE "outfit_suggestions"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_126366f27f955aadd4034bd09a"
        `);
    await queryRunner.query(`
            DROP TABLE "stylist_requests"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."stylist_request_status"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_14cfb12bce51fa80a2e0130646"
        `);
    await queryRunner.query(`
            DROP TABLE "style_profiles"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_f47795435147ff6ffc0920cd07"
        `);
    await queryRunner.query(`
            DROP TABLE "measurement_profiles"
        `);
  }
}
