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
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import type { Product } from '../catalogue/entities/product.entity.js';
import type { User } from '../users/entities/user.entity.js';
import {
  CreateStylistRequestDto,
  RenameOutfitDto,
  SaveSuggestionDto,
  SuggestionFeedbackDto,
  SwapItemDto,
} from './dto/stylist.dto.js';
import type { Outfit } from './entities/outfit.entity.js';
import type { StylistRequest } from './entities/stylist-request.entity.js';
import { OutfitsService } from './outfits.service.js';
import { StylistService } from './stylist.service.js';

@ApiTags('stylist')
@ApiBearerAuth()
@Roles(UserRole.Customer)
@Controller('stylist')
export class StylistController {
  constructor(private readonly stylistService: StylistService) {}

  /** Ask the AI stylist for 2-3 complete outfits. Limited to 6 per minute (AI calls are costly). */
  @Throttle({ default: { limit: 6, ttl: 60_000 } })
  @Post('requests')
  create(@CurrentUser() user: User, @Body() dto: CreateStylistRequestDto): Promise<StylistRequest> {
    return this.stylistService.createRequest(user.id, dto);
  }

  @Get('requests')
  list(@CurrentUser() user: User): Promise<StylistRequest[]> {
    return this.stylistService.listRequests(user.id);
  }

  @Get('requests/:id')
  findOne(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StylistRequest> {
    return this.stylistService.findRequest(user.id, id);
  }

  @Post('suggestions/:id/save')
  save(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveSuggestionDto,
  ): Promise<Outfit> {
    return this.stylistService.saveSuggestion(user.id, id, dto);
  }

  @Put('suggestions/:id/feedback')
  @HttpCode(HttpStatus.NO_CONTENT)
  feedback(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuggestionFeedbackDto,
  ): Promise<void> {
    return this.stylistService.giveFeedback(user.id, id, dto);
  }
}

@ApiTags('outfits')
@ApiBearerAuth()
@Roles(UserRole.Customer)
@Controller('outfits')
export class OutfitsController {
  constructor(private readonly outfitsService: OutfitsService) {}

  @Get()
  list(@CurrentUser() user: User): Promise<Outfit[]> {
    return this.outfitsService.list(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string): Promise<Outfit> {
    return this.outfitsService.findOwn(user.id, id);
  }

  @Patch(':id')
  rename(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RenameOutfitDto,
  ): Promise<Outfit> {
    return this.outfitsService.rename(user.id, id, dto.name);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.outfitsService.remove(user.id, id);
  }

  @Get(':id/items/:itemId/alternatives')
  alternatives(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<Product[]> {
    return this.outfitsService.alternatives(user.id, id, itemId);
  }

  @Put(':id/items/:itemId')
  swap(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: SwapItemDto,
  ): Promise<Outfit> {
    return this.outfitsService.swapItem(user.id, id, itemId, dto);
  }

  @Delete(':id/items/:itemId')
  removeItem(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<Outfit> {
    return this.outfitsService.removeItem(user.id, id, itemId);
  }
}
