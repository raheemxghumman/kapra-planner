import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogueModule } from '../catalogue/catalogue.module.js';
import { ProfilesModule } from '../profiles/profiles.module.js';
import { RuleStylistService } from './agent/rule-stylist.service.js';
import { StylistAgentService } from './agent/stylist-agent.service.js';
import { OutfitItem } from './entities/outfit-item.entity.js';
import { OutfitSuggestion } from './entities/outfit-suggestion.entity.js';
import { Outfit } from './entities/outfit.entity.js';
import { StylistRequest } from './entities/stylist-request.entity.js';
import { SuggestionFeedback } from './entities/suggestion-feedback.entity.js';
import { OutfitsService } from './outfits.service.js';
import { OutfitsController, StylistController } from './stylist.controller.js';
import { StylistService } from './stylist.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StylistRequest,
      OutfitSuggestion,
      Outfit,
      OutfitItem,
      SuggestionFeedback,
    ]),
    CatalogueModule,
    ProfilesModule,
  ],
  controllers: [StylistController, OutfitsController],
  providers: [StylistService, StylistAgentService, RuleStylistService, OutfitsService],
  exports: [OutfitsService, TypeOrmModule],
})
export class StylistModule {}
