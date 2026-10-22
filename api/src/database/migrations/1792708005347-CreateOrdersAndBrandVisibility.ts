import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrdersAndBrandVisibility1792708005347 implements MigrationInterface {
  name = 'CreateOrdersAndBrandVisibility1792708005347';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."order_status" AS ENUM(
                'pending_payment',
                'paid',
                'shipped',
                'delivered',
                'cancelled'
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "orders" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "code" character varying(12) NOT NULL,
                "customer_id" uuid NOT NULL,
                "brand_id" uuid NOT NULL,
                "status" "public"."order_status" NOT NULL DEFAULT 'pending_payment',
                "subtotal" integer NOT NULL,
                "shipping_fee" integer NOT NULL,
                "total" integer NOT NULL,
                "ship_name" character varying(80) NOT NULL,
                "ship_phone" character varying(20) NOT NULL,
                "ship_address" character varying(200) NOT NULL,
                "ship_city" character varying(60) NOT NULL,
                "tracking_number" character varying(60),
                "cancel_reason" character varying(300),
                "paid_at" TIMESTAMP WITH TIME ZONE,
                "shipped_at" TIMESTAMP WITH TIME ZONE,
                "delivered_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_3e413c10c595c04c6c70e58a4d" ON "orders" ("code")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_772d0ce0473ac2ccfa26060dbe" ON "orders" ("customer_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_5c2d89d6aeb25ba9582ecfc6d1" ON "orders" ("brand_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_775c9f06fc27ae3ff8fb26f2c4" ON "orders" ("status")
        `);
    await queryRunner.query(`
            CREATE TABLE "order_items" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "order_id" uuid NOT NULL,
                "product_id" uuid,
                "variant_id" uuid,
                "title" character varying(200) NOT NULL,
                "size" character varying(40) NOT NULL,
                "image" character varying(500),
                "unit_price" integer NOT NULL,
                "quantity" smallint NOT NULL,
                CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_145532db85752b29c57d2b7b1f" ON "order_items" ("order_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_9263386c35b6b242540f9493b0" ON "order_items" ("product_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "products"
            ADD "hidden_by_brand" boolean NOT NULL DEFAULT false
        `);
    await queryRunner.query(`
            ALTER TABLE "orders"
            ADD CONSTRAINT "FK_772d0ce0473ac2ccfa26060dbe9" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "orders"
            ADD CONSTRAINT "FK_5c2d89d6aeb25ba9582ecfc6d1d" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "order_items"
            ADD CONSTRAINT "FK_145532db85752b29c57d2b7b1f1" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "order_items"
            ADD CONSTRAINT "FK_9263386c35b6b242540f9493b00" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "order_items"
            ADD CONSTRAINT "FK_db2d0ea722e16e0fe8ab3bce111" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    // Block Supabase's public REST API (see EnableRowLevelSecurity migration).
    await queryRunner.query(`ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "order_items" DROP CONSTRAINT "FK_db2d0ea722e16e0fe8ab3bce111"
        `);
    await queryRunner.query(`
            ALTER TABLE "order_items" DROP CONSTRAINT "FK_9263386c35b6b242540f9493b00"
        `);
    await queryRunner.query(`
            ALTER TABLE "order_items" DROP CONSTRAINT "FK_145532db85752b29c57d2b7b1f1"
        `);
    await queryRunner.query(`
            ALTER TABLE "orders" DROP CONSTRAINT "FK_5c2d89d6aeb25ba9582ecfc6d1d"
        `);
    await queryRunner.query(`
            ALTER TABLE "orders" DROP CONSTRAINT "FK_772d0ce0473ac2ccfa26060dbe9"
        `);
    await queryRunner.query(`
            ALTER TABLE "products" DROP COLUMN "hidden_by_brand"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_9263386c35b6b242540f9493b0"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_145532db85752b29c57d2b7b1f"
        `);
    await queryRunner.query(`
            DROP TABLE "order_items"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_775c9f06fc27ae3ff8fb26f2c4"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_5c2d89d6aeb25ba9582ecfc6d1"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_772d0ce0473ac2ccfa26060dbe"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_3e413c10c595c04c6c70e58a4d"
        `);
    await queryRunner.query(`
            DROP TABLE "orders"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."order_status"
        `);
  }
}
