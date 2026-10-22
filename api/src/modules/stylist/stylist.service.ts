import {
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { withTimeout } from '../../common/utils/with-timeout.js';
import { WearStyle } from '../catalogue/catalogue.enums.js';
import { ProductsService } from '../catalogue/products.service.js';
import { ProfilesService } from '../profiles/profiles.service.js';
import { RuleStylistService } from './agent/rule-stylist.service.js';
import { StylistAgentService } from './agent/stylist-agent.service.js';
import type { BuiltOutfit, StylistContext } from './agent/stylist.types.js';
import type {
  CreateStylistRequestDto,
  SaveSuggestionDto,
  SuggestionFeedbackDto,
} from './dto/stylist.dto.js';
import { OutfitItem } from './entities/outfit-item.entity.js';
import { OutfitSuggestion } from './entities/outfit-suggestion.entity.js';
import { Outfit } from './entities/outfit.entity.js';
import { StylistRequest, StylistRequestStatus } from './entities/stylist-request.entity.js';
import { SuggestionFeedback } from './entities/suggestion-feedback.entity.js';

/** Longest we let the AI work before switching to the rule-based stylist. */
const AI_TIME_LIMIT_MS = 50_000;

@Injectable()
export class StylistService {
  private readonly logger = new Logger(StylistService.name);

  constructor(
    private readonly agent: StylistAgentService,
    private readonly ruleStylist: RuleStylistService,
    private readonly profilesService: ProfilesService,
    private readonly productsService: ProductsService,
    @InjectRepository(StylistRequest) private readonly requests: Repository<StylistRequest>,
    @InjectRepository(OutfitSuggestion) private readonly suggestions: Repository<OutfitSuggestion>,
    @InjectRepository(SuggestionFeedback) private readonly feedback: Repository<SuggestionFeedback>,
    @InjectRepository(Outfit) private readonly outfits: Repository<Outfit>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async createRequest(userId: string, dto: CreateStylistRequestDto): Promise<StylistRequest> {
    const context = await this.buildContext(userId, dto);
    const request = await this.requests.save(
      this.requests.create({
        userId,
        occasion: dto.occasion,
        budget: dto.budget,
        style: dto.style ?? null,
        colours: context.colours,
        notes: dto.notes ?? null,
      }),
    );

    const startedAt = Date.now();
    let outfits: BuiltOutfit[] = [];
    let engine: 'ai' | 'rules' = 'ai';
    try {
      outfits = await withTimeout(this.agent.run(context), AI_TIME_LIMIT_MS);
    } catch (error) {
      this.logger.warn(
        `AI stylist unavailable (${(error as Error).message}); using rule-based stylist`,
      );
      engine = 'rules';
      outfits = await this.ruleStylist.run(context);
    }

    if (outfits.length === 0) {
      await this.requests.update(request.id, {
        status: StylistRequestStatus.Failed,
        durationMs: Date.now() - startedAt,
        error: 'No complete outfit found within the budget',
      });
      throw new UnprocessableEntityException(
        'We could not find complete outfits within this budget. Try a higher budget or fewer colour limits.',
      );
    }

    // Suggestions and their items are saved together or not at all.
    await this.dataSource.transaction(async (manager) => {
      for (const [rank, outfit] of outfits.entries()) {
        await manager.save(
          manager.create(OutfitSuggestion, {
            requestId: request.id,
            title: outfit.title,
            reason: outfit.reason,
            totalPrice: outfit.total,
            rank,
            items: outfit.items.map((item, position) =>
              manager.create(OutfitItem, {
                productId: item.product.id,
                variantId: item.variantId,
                slot: item.slot,
                reason: item.reason || null,
                position,
              }),
            ),
          }),
        );
      }
      await manager.update(StylistRequest, request.id, {
        status: StylistRequestStatus.Completed,
        engine,
        durationMs: Date.now() - startedAt,
      });
    });

    return this.findRequest(userId, request.id);
  }

  /** Style profile + request + disliked products -> what the stylist works with. */
  private async buildContext(
    userId: string,
    dto: CreateStylistRequestDto,
  ): Promise<StylistContext> {
    const profile = await this.profilesService.getStyleProfile(userId);
    const disliked: { product_id: string }[] = await this.dataSource.query(
      `SELECT DISTINCT i.product_id FROM suggestion_feedback f
       JOIN outfit_items i ON i.suggestion_id = f.suggestion_id
       WHERE f.user_id = $1 AND f.liked = false LIMIT 100`,
      [userId],
    );
    const anchor = dto.anchorProductId
      ? await this.productsService.findStockedById(dto.anchorProductId)
      : undefined;

    return {
      occasion: dto.occasion,
      budget: dto.budget,
      gender: profile.gender,
      styles: dto.style
        ? [dto.style]
        : profile.styles.length
          ? profile.styles
          : [WearStyle.Eastern],
      colours: dto.colours?.length ? dto.colours : profile.favouriteColours,
      avoidColours: profile.avoidColours,
      notes: dto.notes,
      sizes: profile.sizes,
      excludeIds: disliked.map((row) => row.product_id).filter((id) => id !== anchor?.id),
      anchor,
    };
  }

  async findRequest(userId: string, id: string): Promise<StylistRequest> {
    const request = await this.requests.findOne({
      where: { id, userId },
      relations: { suggestions: { items: { product: { brand: true }, variant: true } } },
      order: { suggestions: { rank: 'ASC', items: { position: 'ASC' } } },
    });
    if (!request) throw new NotFoundException('Stylist request not found');
    return request;
  }

  /** The customer's recent requests, newest first, with their suggestions. */
  listRequests(userId: string): Promise<StylistRequest[]> {
    return this.requests.find({
      where: { userId, status: StylistRequestStatus.Completed },
      relations: { suggestions: { items: { product: { brand: true } } } },
      order: { createdAt: 'DESC', suggestions: { rank: 'ASC', items: { position: 'ASC' } } },
      take: 15,
    });
  }

  /** Copies a suggestion into the customer's saved outfits (they can then change it freely). */
  async saveSuggestion(
    userId: string,
    suggestionId: string,
    dto: SaveSuggestionDto,
  ): Promise<Outfit> {
    const suggestion = await this.findOwnSuggestion(userId, suggestionId);
    const outfit = await this.outfits.save(
      this.outfits.create({
        userId,
        suggestionId,
        name: dto.name ?? suggestion.title,
        occasion: suggestion.request.occasion,
        items: suggestion.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          slot: item.slot,
          reason: item.reason,
          position: item.position,
        })),
      }),
    );
    return outfit;
  }

  /** One like/dislike per customer per suggestion; sending again changes it. */
  async giveFeedback(
    userId: string,
    suggestionId: string,
    dto: SuggestionFeedbackDto,
  ): Promise<void> {
    await this.findOwnSuggestion(userId, suggestionId);
    await this.feedback.upsert(
      { userId, suggestionId, liked: dto.liked, reason: dto.reason ?? null },
      { conflictPaths: ['suggestionId', 'userId'] },
    );
  }

  private async findOwnSuggestion(userId: string, id: string): Promise<OutfitSuggestion> {
    const suggestion = await this.suggestions.findOne({
      where: { id, request: { userId } },
      relations: { request: true, items: true },
    });
    if (!suggestion) throw new NotFoundException('Suggestion not found');
    return suggestion;
  }
}
