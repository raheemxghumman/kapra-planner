import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { BrandsService, type BrandSummary, type StorePin } from './brands.service.js';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto.js';
import type { Brand } from './entities/brand.entity.js';

@ApiTags('brands')
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Public()
  @Get()
  list(): Promise<BrandSummary[]> {
    return this.brandsService.listPublic();
  }

  /** Store locations for the map. Declared before ':slug' so "stores" is not read as a slug. */
  @Public()
  @Get('stores')
  stores(): Promise<StorePin[]> {
    return this.brandsService.stores();
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string): Promise<Brand> {
    return this.brandsService.findBySlug(slug);
  }
}

@ApiTags('admin')
@ApiBearerAuth()
@Roles(UserRole.Admin)
@Controller('admin/brands')
export class AdminBrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  list(): Promise<Brand[]> {
    return this.brandsService.listAll();
  }

  @Post()
  create(@Body() dto: CreateBrandDto): Promise<Brand> {
    return this.brandsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBrandDto): Promise<Brand> {
    return this.brandsService.update(id, dto);
  }
}
