import { MigrationInterface, QueryRunner } from 'typeorm';

/** Cut-outs of products for live (AR) try-on; see GarmentCutout. */
export class CreateGarmentCutouts1793500000000 implements MigrationInterface {
  name = 'CreateGarmentCutouts1793500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."cutout_status" AS ENUM('ready', 'rejected')`);
    await queryRunner.query(`CREATE TYPE "public"."cutout_source" AS ENUM('flat_lay', 'on_model')`);
    await queryRunner.query(`
            CREATE TABLE "garment_cutouts" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "product_id" uuid NOT NULL,
                "status" "public"."cutout_status" NOT NULL,
                "source" "public"."cutout_source",
                "source_image" character varying(500),
                "cutout_url" character varying(500),
                "cutout_public_id" character varying(200),
                "fit" jsonb,
                "quality" real NOT NULL DEFAULT '0',
                "problem" character varying(200),
                CONSTRAINT "PK_garment_cutouts_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_garment_cutouts_product" FOREIGN KEY ("product_id")
                    REFERENCES "products"("id") ON DELETE CASCADE
            )
        `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_garment_cutouts_product" ON "garment_cutouts" ("product_id")`,
    );
    // Same rule as every other table: Supabase's public REST API must not expose it.
    await queryRunner.query(`ALTER TABLE "garment_cutouts" ENABLE ROW LEVEL SECURITY`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "garment_cutouts"`);
    await queryRunner.query(`DROP TYPE "public"."cutout_source"`);
    await queryRunner.query(`DROP TYPE "public"."cutout_status"`);
  }
}
