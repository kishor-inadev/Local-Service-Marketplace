import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { BullModule } from "@nestjs/bullmq";
import { UserController } from "./controllers/user.controller";
import { ProviderController } from "./controllers/provider.controller";
import { FavoriteController } from "./controllers/favorite.controller";
import { ProviderDocumentController } from "./controllers/provider-document.controller";
import { ProviderPortfolioController } from "./controllers/provider-portfolio.controller";
import { UserService } from "./services/user.service";
import { ProviderService } from "./services/provider.service";
import { FavoriteService } from "./services/favorite.service";
import { ProviderDocumentService } from "./services/provider-document.service";
import { ProviderPortfolioService } from "./services/provider-portfolio.service";
import { UserRepository } from "./repositories/user.repository";
import { ProviderRepository } from "./repositories/provider.repository";
import { ProviderServiceRepository } from "./repositories/provider-service.repository";
import { ProviderAvailabilityRepository } from "./repositories/provider-availability.repository";
import { FavoriteRepository } from "./repositories/favorite.repository";
import { LocationRepository } from "./repositories/location.repository";
import { ProviderDocumentRepository } from "./repositories/provider-document.repository";
import { ProviderPortfolioRepository } from "./repositories/provider-portfolio.repository";
import { NotificationModule } from "../../common/notification/notification.module";
import { FileUploadService } from "../../common/file-upload.service";
import { FileServiceClient } from "../../common/file-service.client";

@Module({
  imports: [
    NotificationModule,
    BullModule.registerQueue({ name: 'identity.notification' }),
    HttpModule.register({
      timeout: Number(process.env.REQUEST_TIMEOUT_MS) || 72000,
      maxRedirects: 5,
    }),
  ],
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
    FileUploadService,
    FileServiceClient,
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
    FileUploadService,
    FileServiceClient,
  ],
})
export class UserModule {}
