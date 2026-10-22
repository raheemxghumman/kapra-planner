import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/review.entity.js';
import { TailorProfile } from './entities/tailor-profile.entity.js';
import { TailorService } from './entities/tailor-service.entity.js';
import { TailorRankingService } from './ranking/tailor-ranking.service.js';
import { TailorPanelService } from './tailor-panel.service.js';
import {
  TailorJobsController,
  TailorPanelController,
  TailorsController,
} from './tailors.controller.js';
import { TailorsService } from './tailors.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([TailorProfile, TailorService, Review])],
  controllers: [TailorsController, TailorPanelController, TailorJobsController],
  providers: [TailorsService, TailorPanelService, TailorRankingService],
  exports: [TailorsService, TailorPanelService, TailorRankingService, TypeOrmModule],
})
export class TailorsModule {}
