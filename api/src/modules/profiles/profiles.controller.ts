import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import type { User } from '../users/entities/user.entity.js';
import {
  CreateMeasurementDto,
  UpdateMeasurementDto,
  UpdateStyleProfileDto,
} from './dto/profile.dto.js';
import type { MeasurementProfile } from './entities/measurement-profile.entity.js';
import type { StyleProfile } from './entities/style-profile.entity.js';
import { ProfilesService } from './profiles.service.js';

/** The logged-in customer's own style profile and measurements (/me/...). */
@ApiTags('profile')
@ApiBearerAuth()
@Roles(UserRole.Customer)
@Controller('me')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('style-profile')
  getStyleProfile(@CurrentUser() user: User): Promise<StyleProfile> {
    return this.profilesService.getStyleProfile(user.id);
  }

  @Put('style-profile')
  updateStyleProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateStyleProfileDto,
  ): Promise<StyleProfile> {
    return this.profilesService.updateStyleProfile(user.id, dto);
  }

  @Get('measurements')
  listMeasurements(@CurrentUser() user: User): Promise<MeasurementProfile[]> {
    return this.profilesService.listMeasurements(user.id);
  }

  @Post('measurements')
  createMeasurement(
    @CurrentUser() user: User,
    @Body() dto: CreateMeasurementDto,
  ): Promise<MeasurementProfile> {
    return this.profilesService.createMeasurement(user.id, dto);
  }

  @Patch('measurements/:id')
  updateMeasurement(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMeasurementDto,
  ): Promise<MeasurementProfile> {
    return this.profilesService.updateMeasurement(user.id, id, dto);
  }

  @Delete('measurements/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMeasurement(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.profilesService.deleteMeasurement(user.id, id);
  }
}
