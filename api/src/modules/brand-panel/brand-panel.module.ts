import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Module,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { UserStatus } from '../../common/enums/user-status.enum.js';
import { imageFilePipe, MAX_IMAGE_BYTES } from '../../common/pipes/image-file.pipe.js';
import { BrandStore } from '../brands/entities/brand-store.entity.js';
import { Brand } from '../brands/entities/brand.entity.js';
import { CatalogueModule } from '../catalogue/catalogue.module.js';
import { ProductVariant } from '../catalogue/entities/product-variant.entity.js';
import { Product } from '../catalogue/entities/product.entity.js';
import type { User } from '../users/entities/user.entity.js';
import { BrandPanelService } from './brand-panel.service.js';
import {
  BrandProductQueryDto,
  CreateBrandProductDto,
  ProductVisibilityDto,
  StoreDto,
  UpdateBrandProductDto,
  UpdateBrandProfileDto,
  VariantStockDto,
} from './dto/brand-panel.dto.js';

const PHOTO_BODY = {
  schema: { type: 'object', properties: { photo: { type: 'string', format: 'binary' } } },
};
const photoUpload = () =>
  FileInterceptor('photo', { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } });

/** The brand's own panel. Orders are handled through /orders (the service checks ownership). */
@ApiTags('brand panel')
@ApiBearerAuth()
@Roles(UserRole.Brand)
@Controller('brand')
export class BrandPanelController {
  constructor(private readonly panel: BrandPanelService) {}

  @Get('profile')
  async profile(@CurrentUser() user: User) {
    return {
      brand: await this.panel.findOwn(user.id),
      approved: user.status === UserStatus.Active,
    };
  }

  @Put('profile')
  updateProfile(@CurrentUser() user: User, @Body() dto: UpdateBrandProfileDto) {
    return this.panel.updateProfile(user.id, dto);
  }

  @Post('profile/logo')
  @ApiConsumes('multipart/form-data')
  @ApiBody(PHOTO_BODY)
  @UseInterceptors(photoUpload())
  logo(@CurrentUser() user: User, @UploadedFile(imageFilePipe()) file: Express.Multer.File) {
    return this.panel.uploadLogo(user.id, file);
  }

  @Post('stores')
  addStore(@CurrentUser() user: User, @Body() dto: StoreDto) {
    return this.panel.addStore(user.id, dto);
  }

  @Put('stores/:id')
  updateStore(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: StoreDto,
  ) {
    return this.panel.updateStore(user.id, id, dto);
  }

  @Delete('stores/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeStore(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.panel.removeStore(user.id, id);
  }

  @Get('products')
  products(@CurrentUser() user: User, @Query() query: BrandProductQueryDto) {
    return this.panel.listProducts(user.id, query);
  }

  @Post('products')
  createProduct(@CurrentUser() user: User, @Body() dto: CreateBrandProductDto) {
    return this.panel.createProduct(user.id, dto);
  }

  @Patch('products/:id')
  updateProduct(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBrandProductDto,
  ) {
    return this.panel.updateProduct(user.id, id, dto);
  }

  @Put('products/:id/visibility')
  visibility(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ProductVisibilityDto,
  ) {
    return this.panel.setVisibility(user.id, id, dto.hidden);
  }

  @Post('products/:id/images')
  @ApiConsumes('multipart/form-data')
  @ApiBody(PHOTO_BODY)
  @UseInterceptors(photoUpload())
  addImage(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(imageFilePipe()) file: Express.Multer.File,
  ) {
    return this.panel.addImage(user.id, id, file);
  }

  @Delete('products/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeProduct(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.panel.removeProduct(user.id, id);
  }

  @Put('variants/:id/stock')
  stock(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VariantStockDto,
  ) {
    return this.panel.updateStock(user.id, id, dto);
  }

  @Get('analytics')
  analytics(@CurrentUser() user: User) {
    return this.panel.analytics(user.id);
  }
}

@Module({
  imports: [
    TypeOrmModule.forFeature([Brand, BrandStore, Product, ProductVariant]),
    CatalogueModule,
  ],
  controllers: [BrandPanelController],
  providers: [BrandPanelService],
  exports: [BrandPanelService],
})
export class BrandPanelModule {}
