import { Module } from "@nestjs/common";
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

@Module({
  imports: [DatabaseModule, NotificationModule, UserModule],
  controllers: [RequestController, CategoryController],
  providers: [
    RequestService,
    CategoryService,
    RequestRepository,
    CategoryRepository,
    LocationRepository,
  ],
  exports: [RequestService, CategoryService, CategoryRepository],
})
export class RequestModule {}
