import { Module } from '@nestjs/common';
import { ProviderController } from './controllers/provider.controller';
import { FavoriteController } from './controllers/favorite.controller';
import { ProviderService } from './services/provider.service';
import { FavoriteService } from './services/favorite.service';
import { ProviderRepository } from './repositories/provider.repository';
import { ProviderServiceRepository } from './repositories/provider-service.repository';
import { ProviderAvailabilityRepository } from './repositories/provider-availability.repository';
import { FavoriteRepository } from './repositories/favorite.repository';
import { LocationRepository } from './repositories/location.repository';

@Module({
  controllers: [ProviderController, FavoriteController],
  providers: [
    ProviderService,
    FavoriteService,
    ProviderRepository,
    ProviderServiceRepository,
    ProviderAvailabilityRepository,
    FavoriteRepository,
    LocationRepository,
  ],
  exports: [
    ProviderService,
    FavoriteService,
    ProviderRepository,
    ProviderServiceRepository,
    ProviderAvailabilityRepository,
    FavoriteRepository,
    LocationRepository,
  ],
})
export class UserModule {}
