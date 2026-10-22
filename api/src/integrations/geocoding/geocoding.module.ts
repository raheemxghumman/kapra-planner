import { Controller, Get, Global, Inject, Module, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IsString, Length } from 'class-validator';
import { Public } from '../../common/decorators/public.decorator.js';
import { GeocodeCache } from './geocode-cache.entity.js';
import { GEOCODER, type Geocoder, type Place } from './geocoder.types.js';
import { NominatimGeocoder } from './nominatim.geocoder.js';

class GeoSearchQueryDto {
  @IsString()
  @Length(2, 120)
  q: string;
}

/** Address search for the map's search box (e.g. "Gulberg, Lahore"). */
@ApiTags('geo')
@Controller('geo')
export class GeoController {
  constructor(@Inject(GEOCODER) private readonly geocoder: Geocoder) {}

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Get('search')
  search(@Query() query: GeoSearchQueryDto): Promise<Place[]> {
    return this.geocoder.search(query.q);
  }
}

/** Binds GEOCODER to Nominatim. Global so tailors and brands can geocode addresses. */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([GeocodeCache])],
  controllers: [GeoController],
  providers: [{ provide: GEOCODER, useClass: NominatimGeocoder }],
  exports: [GEOCODER],
})
export class GeocodingModule {}
