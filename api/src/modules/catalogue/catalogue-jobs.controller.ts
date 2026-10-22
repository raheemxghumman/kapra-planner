import { Controller, Get, HttpCode, HttpStatus, Injectable, Logger, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { JobsSecretGuard } from '../../common/guards/jobs-secret.guard.js';
import { ProductsService } from './products.service.js';
import { CatalogueSyncService } from './sync/catalogue-sync.service.js';

/**
 * A sync takes minutes, longer than an HTTP request should stay open, so these endpoints
 * start it in the background and answer 202 Accepted straight away.
 */
@Injectable()
abstract class SyncStarter {
  protected readonly logger = new Logger('CatalogueSync');

  constructor(
    protected readonly syncService: CatalogueSyncService,
    protected readonly productsService: ProductsService,
  ) {}

  protected start(): { started: boolean; message: string } {
    if (this.syncService.isRunning) {
      return { started: false, message: 'A sync is already running' };
    }
    void this.syncService
      .syncAll()
      .then(() => this.productsService.clearFacetsCache())
      .catch((error: Error) => this.logger.error(`Background sync failed: ${error.message}`));
    return { started: true, message: 'Catalogue sync started' };
  }
}

/** Called nightly by GitHub Actions with the shared job secret. */
@ApiTags('jobs')
@Public()
@UseGuards(JobsSecretGuard)
@Controller('jobs')
export class CatalogueJobsController extends SyncStarter {
  @Post('sync')
  @HttpCode(HttpStatus.ACCEPTED)
  sync() {
    return this.start();
  }
}

/** Admins can start a sync by hand and watch its status. */
@ApiTags('admin')
@ApiBearerAuth()
@Roles(UserRole.Admin)
@Controller('admin/catalogue')
export class AdminCatalogueController extends SyncStarter {
  @Post('sync')
  @HttpCode(HttpStatus.ACCEPTED)
  sync() {
    return this.start();
  }

  @Get('sync')
  status(): { running: boolean } {
    return { running: this.syncService.isRunning };
  }
}
