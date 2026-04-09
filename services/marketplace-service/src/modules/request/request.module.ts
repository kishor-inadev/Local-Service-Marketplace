import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { RequestController } from "./controllers/request.controller";
import { CategoryController } from "./controllers/category.controller";
import { RequestService } from "./services/request.service";
import { CategoryService } from "./services/category.service";
import { RequestRepository } from "./repositories/request.repository";
import { CategoryRepository } from "./repositories/category.repository";
import { LocationRepository } from "./repositories/location.repository";
import { DatabaseModule } from "../../common/database/database.module";
import { NotificationModule } from "../../common/notification/notification.module";
import { UserModule } from "../../common/user/user.module";
import { FileServiceClient } from "../../common/file-service.client";

@Module({
  imports: [
    DatabaseModule,
    NotificationModule,
    UserModule,
    HttpModule.register({
      timeout: Number(process.env.REQUEST_TIMEOUT_MS) || 72000,
      maxRedirects: 5,
    }),
  ],
  controllers: [RequestController, CategoryController],
  providers: [
    RequestService,
    CategoryService,
    RequestRepository,
    CategoryRepository,
    LocationRepository,
    FileServiceClient,
  ],
  exports: [RequestService, CategoryService, CategoryRepository, FileServiceClient],
})
export class RequestModule {}
