import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { readFile } from 'node:fs/promises';
import type { Repository } from 'typeorm';
import { AppModule } from '../../app.module.js';
import { slugify } from '../../modules/brands/brands.service.js';
import { Brand } from '../../modules/brands/entities/brand.entity.js';
import type { BrandTier, Gender, WearStyle } from '../../modules/catalogue/catalogue.enums.js';
import { CatalogueSyncService } from '../../modules/catalogue/sync/catalogue-sync.service.js';

interface BrandSeed {
  name: string;
  website: string;
  tier: BrandTier;
  defaultGender: Gender;
  defaultStyle: WearStyle;
  description: string;
  priceDivisor?: number;
}

/**
 * Creates the partner brands from brands.json (if missing) and runs a full catalogue sync.
 * Uses the real Nest app context, so it runs exactly the same code as the nightly job.
 *   npm run seed:catalogue -w api
 */
async function seedCatalogue(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });
  try {
    const brands = app.get<Repository<Brand>>(getRepositoryToken(Brand));
    const file = new URL('../../../src/database/seeds/brands.json', import.meta.url);
    const seeds = JSON.parse(await readFile(file, 'utf8')) as BrandSeed[];

    for (const seed of seeds) {
      const slug = slugify(seed.name);
      if (await brands.existsBy({ slug })) continue;
      await brands.save(
        brands.create({
          ...seed,
          slug,
          feedUrl: `${seed.website}/products.json`,
          priceDivisor: seed.priceDivisor ?? 1,
          verified: true,
        }),
      );
      console.log(`Added brand ${seed.name}`);
    }

    const reports = await app.get(CatalogueSyncService).syncAll();
    const total = reports.reduce((sum, report) => sum + report.created + report.updated, 0);
    console.log(`Synced ${reports.length} brands, ${total} products saved.`);
  } finally {
    await app.close();
  }
}

await seedCatalogue();
