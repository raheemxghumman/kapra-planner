import { Body, Controller, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UpdateMeDto } from './dto/update-me.dto.js';
import type { User } from './entities/user.entity.js';
import { UsersService } from './users.service.js';

@ApiTags('profile')
@ApiBearerAuth()
@Controller('me')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** Any logged-in user can update their own name, phone and city. */
  @Patch()
  updateMe(@CurrentUser() user: User, @Body() dto: UpdateMeDto): Promise<User> {
    return this.usersService.updateProfile(user.id, dto);
  }
}
