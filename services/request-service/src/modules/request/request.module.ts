import { Module } from '@nestjs/common';
import { RequestController } from './controllers/request.controller';
import { CategoryController } from './controllers/category.controller';
import { RequestService } from './services/request.service';
import { CategoryService } from './services/category.service';
import { RequestRepository } from './repositories/request.repository';
import { CategoryRepository } from './repositories/category.repository';
import { DatabaseModule } from '../../common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [RequestController, CategoryController],
  providers: [
    RequestService,
    CategoryService,
    RequestRepository,
    CategoryRepository,
  ],
  exports: [RequestService, CategoryService, CategoryRepository],
})
export class RequestModule {}
