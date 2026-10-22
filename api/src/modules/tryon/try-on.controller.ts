import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { imageFilePipe, MAX_IMAGE_BYTES } from '../../common/pipes/image-file.pipe.js';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import type { User } from '../users/entities/user.entity.js';
import { CreateTryOnDto } from './dto/try-on.dto.js';
import type { PersonPhoto } from './entities/person-photo.entity.js';
import type { TryOn } from './entities/try-on.entity.js';
import { TryOnService } from './try-on.service.js';

@ApiTags('try-on')
@ApiBearerAuth()
@Roles(UserRole.Customer)
@Controller('me/photos')
export class PersonPhotosController {
  constructor(private readonly tryOnService: TryOnService) {}

  @Get()
  list(@CurrentUser() user: User): Promise<PersonPhoto[]> {
    return this.tryOnService.listPhotos(user.id);
  }

  /** Upload a full-length photo (JPEG, PNG or WebP, up to 8 MB) as form field "photo". */
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { photo: { type: 'string', format: 'binary' } } },
  })
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } }))
  upload(
    @CurrentUser() user: User,
    @UploadedFile(imageFilePipe()) file: Express.Multer.File,
  ): Promise<PersonPhoto> {
    return this.tryOnService.uploadPhoto(user.id, file);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.tryOnService.removePhoto(user.id, id);
  }
}

@ApiTags('try-on')
@ApiBearerAuth()
@Roles(UserRole.Customer)
@Controller('tryons')
export class TryOnController {
  constructor(private readonly tryOnService: TryOnService) {}

  /** Starts a try-on in the background; poll GET /tryons/:id until it is completed or failed. */
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  create(@CurrentUser() user: User, @Body() dto: CreateTryOnDto): Promise<TryOn> {
    return this.tryOnService.create(user.id, dto);
  }

  @Get()
  list(@CurrentUser() user: User): Promise<TryOn[]> {
    return this.tryOnService.list(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string): Promise<TryOn> {
    return this.tryOnService.findOne(user.id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.tryOnService.remove(user.id, id);
  }
}
