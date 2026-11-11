import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FashnProvider } from '../../integrations/tryon/fashn.provider.js';
import { IdmVtonProvider } from '../../integrations/tryon/idm-vton.provider.js';
import { LeffaProvider } from '../../integrations/tryon/leffa.provider.js';
import { TRY_ON_PROVIDERS } from '../../integrations/tryon/tryon.types.js';
import { CatalogueModule } from '../catalogue/catalogue.module.js';
import { PersonPhoto } from './entities/person-photo.entity.js';
import { TryOn } from './entities/try-on.entity.js';
import { PersonPhotosController, TryOnController } from './try-on.controller.js';
import { TryOnService } from './try-on.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([PersonPhoto, TryOn]), CatalogueModule],
  controllers: [PersonPhotosController, TryOnController],
  providers: [
    TryOnService,
    FashnProvider,
    IdmVtonProvider,
    LeffaProvider,
    // The provider chain, tried in this order. Add one (e.g. Gemini with billing) by adding it here.
    {
      provide: TRY_ON_PROVIDERS,
      useFactory: (fashn: FashnProvider, idm: IdmVtonProvider, leffa: LeffaProvider) => [
        fashn,
        idm,
        leffa,
      ],
      inject: [FashnProvider, IdmVtonProvider, LeffaProvider],
    },
  ],
})
export class TryOnModule {}
