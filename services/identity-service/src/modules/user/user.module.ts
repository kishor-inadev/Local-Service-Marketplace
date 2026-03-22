import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { ProviderController } from './controllers/provider.controller';
import { FavoriteController } from './controllers/favorite.controller';
import { ProviderDocumentController } from './controllers/provider-document.controller';
import { ProviderPortfolioController } from './controllers/provider-portfolio.controller';
import { UserService } from './services/user.service';
import { ProviderService } from './services/provider.service';
import { FavoriteService } from './services/favorite.service';
import { ProviderDocumentService } from './services/provider-document.service';
import { ProviderPortfolioService } from './services/provider-portfolio.service';
import { UserRepository } from './repositories/user.repository';
import { ProviderRepository } from './repositories/provider.repository';
import { ProviderServiceRepository } from './repositories/provider-service.repository';
import { ProviderAvailabilityRepository } from './repositories/provider-availability.repository';
import { FavoriteRepository } from './repositories/favorite.repository';
import { LocationRepository } from './repositories/location.repository';
import { ProviderDocumentRepository } from './repositories/provider-document.repository';
import { ProviderPortfolioRepository } from './repositories/provider-portfolio.repository';
import { NotificationModule } from '../../common/notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [
    UserController,
    ProviderController,
    FavoriteController,
    ProviderDocumentController,
    ProviderPortfolioController,
  ],
  providers: [
    UserService,
    ProviderService,
    FavoriteService,
    ProviderDocumentService,
    ProviderPortfolioService,
    UserRepository,
    ProviderRepository,
    ProviderServiceRepository,
    ProviderAvailabilityRepository,
    FavoriteRepository,
    LocationRepository,
    ProviderDocumentRepository,
    ProviderPortfolioRepository,
  ],
  exports: [
    UserService,
    ProviderService,
    FavoriteService,
    ProviderDocumentService,
    ProviderPortfolioService,
    UserRepository,
    ProviderRepository,
    ProviderServiceRepository,
    ProviderAvailabilityRepository,
    FavoriteRepository,
    LocationRepository,
    ProviderDocumentRepository,
    ProviderPortfolioRepository,
  ],
})
export class UserModule {}
