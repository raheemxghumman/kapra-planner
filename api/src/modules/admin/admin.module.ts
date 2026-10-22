import {
  Body,
  Controller,
  Get,
  Module,
  Param,
  ParseUUIDPipe,
  Patch,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { Brand } from '../brands/entities/brand.entity.js';
import { TailorsModule } from '../tailors/tailors.module.js';
import { User } from '../users/entities/user.entity.js';
import { AdminService } from './admin.service.js';
import {
  AdminReviewQueryDto,
  AdminUserQueryDto,
  LinkBrandOwnerDto,
  SetReviewHiddenDto,
  SetUserStatusDto,
} from './dto/admin.dto.js';

/** Admin panel. Brand create/edit and catalogue sync live in their own admin controllers. */
@ApiTags('admin')
@ApiBearerAuth()
@Roles(UserRole.Admin)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  stats() {
    return this.adminService.stats();
  }

  @Get('users')
  users(@Query() query: AdminUserQueryDto) {
    return this.adminService.listUsers(query);
  }

  @Patch('users/:id/status')
  setStatus(
    @CurrentUser() admin: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetUserStatusDto,
  ) {
    return this.adminService.setUserStatus(admin.id, id, dto.status);
  }

  @Put('brands/:id/owner')
  linkOwner(@Param('id', ParseUUIDPipe) id: string, @Body() dto: LinkBrandOwnerDto) {
    return this.adminService.linkBrandOwner(id, dto.userId);
  }

  @Get('reviews')
  reviews(@Query() query: AdminReviewQueryDto) {
    return this.adminService.listReviews(query);
  }

  @Patch('reviews/:id')
  hideReview(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SetReviewHiddenDto) {
    return this.adminService.setReviewHidden(id, dto.hidden);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([User, Brand]), TailorsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
