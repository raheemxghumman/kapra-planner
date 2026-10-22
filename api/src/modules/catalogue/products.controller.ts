import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';
import type { Paginated } from '../../common/dto/pagination.dto.js';
import { ProductQueryDto } from './dto/product-query.dto.js';
import type { Product } from './entities/product.entity.js';
import { ProductsService, type Facets } from './products.service.js';

/** The catalogue is public: anyone can browse before creating an account. */
@ApiTags('catalogue')
@Public()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /** Search and filter products (paginated). */
  @Get()
  search(@Query() query: ProductQueryDto): Promise<Paginated<Product>> {
    return this.productsService.search(query);
  }

  /** Counts per category, brand and colour, plus the price range, for the filter sidebar. */
  @Get('facets')
  facets(): Promise<Facets> {
    return this.productsService.facets();
  }

  /** A random selection of products with photos (landing page). */
  @Get('featured')
  featured(
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number,
  ): Promise<Product[]> {
    return this.productsService.featured(Math.min(limit, 30));
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Product> {
    return this.productsService.findById(id);
  }

  @Get(':id/similar')
  similar(@Param('id', ParseUUIDPipe) id: string): Promise<Product[]> {
    return this.productsService.findSimilar(id);
  }
}
