import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { imageFilePipe, MAX_IMAGE_BYTES } from '../../common/pipes/image-file.pipe.js';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { UserStatus } from '../../common/enums/user-status.enum.js';
import { JobsSecretGuard } from '../../common/guards/jobs-secret.guard.js';
import type { User } from '../users/entities/user.entity.js';
import {
  CreateTailorServiceDto,
  ReviewReplyDto,
  TailorQueryDto,
  UpdateTailorServiceDto,
  UpsertTailorProfileDto,
} from './dto/tailor.dto.js';
import { TailorRankingService } from './ranking/tailor-ranking.service.js';
import { TailorPanelService } from './tailor-panel.service.js';
import { TailorsService } from './tailors.service.js';

@ApiTags('tailors')
@Public()
@Controller('tailors')
export class TailorsController {
  constructor(private readonly tailorsService: TailorsService) {}

  /** Map and list search. With ?lat&lng, only tailors within radiusKm, each with its distance. */
  @Get()
  search(@Query() query: TailorQueryDto) {
    return this.tailorsService.search(query);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.tailorsService.findBySlug(slug);
  }

  @Get(':slug/reviews')
  reviews(@Param('slug') slug: string, @Query() query: PaginationQueryDto) {
    return this.tailorsService.reviewsBySlug(slug, query);
  }
}

/** The tailor's own panel. */
@ApiTags('tailor panel')
@ApiBearerAuth()
@Roles(UserRole.Tailor)
@Controller('tailor')
export class TailorPanelController {
  constructor(private readonly panel: TailorPanelService) {}

  @Get('profile')
  async profile(@CurrentUser() user: User) {
    return {
      profile: await this.panel.findOwn(user.id),
      approved: user.status === UserStatus.Active,
    };
  }

  @Put('profile')
  upsert(@CurrentUser() user: User, @Body() dto: UpsertTailorProfileDto) {
    return this.panel.upsert(user.id, dto);
  }

  @Post('profile/gallery')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { photo: { type: 'string', format: 'binary' } } },
  })
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } }))
  addPhoto(@CurrentUser() user: User, @UploadedFile(imageFilePipe()) file: Express.Multer.File) {
    return this.panel.addGalleryImage(user.id, file);
  }

  @Delete('profile/gallery/:index')
  removePhoto(@CurrentUser() user: User, @Param('index', ParseIntPipe) index: number) {
    return this.panel.removeGalleryImage(user.id, index);
  }

  @Post('services')
  addService(@CurrentUser() user: User, @Body() dto: CreateTailorServiceDto) {
    return this.panel.addService(user.id, dto);
  }

  @Patch('services/:id')
  updateService(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTailorServiceDto,
  ) {
    return this.panel.updateService(user.id, id, dto);
  }

  @Delete('services/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeService(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.panel.removeService(user.id, id);
  }

  @Get('reviews')
  reviews(@CurrentUser() user: User, @Query() query: PaginationQueryDto) {
    return this.panel.listReviews(user.id, query);
  }

  @Put('reviews/:id/reply')
  reply(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewReplyDto,
  ) {
    return this.panel.reply(user.id, id, dto.reply);
  }
}

/** Called by the scheduled GitHub Actions job (and cron-job.org) with the x-jobs-secret header. */
@ApiTags('jobs')
@Public()
@UseGuards(JobsSecretGuard)
@Controller('jobs')
export class TailorJobsController {
  constructor(private readonly ranking: TailorRankingService) {}

  @Post('rank-tailors')
  async rank() {
    return { ranked: await this.ranking.recomputeAll() };
  }
}
