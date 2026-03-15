import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
  HttpCode,
  HttpStatus,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { FavoriteService } from '../services/favorite.service';
import { CreateFavoriteDto } from '../dto/create-favorite.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoriteController {
  constructor(
    private readonly favoriteService: FavoriteService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async saveFavorite(@Body() createFavoriteDto: CreateFavoriteDto): Promise<any> {
    this.logger.info('POST /favorites', {
      context: 'FavoriteController',
      user_id: createFavoriteDto.user_id,
      provider_id: createFavoriteDto.provider_id,
    });
    return this.favoriteService.saveFavorite(createFavoriteDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getFavorites(@Query('user_id') userId: string): Promise<any[]> {
    this.logger.info('GET /favorites', {
      context: 'FavoriteController',
      user_id: userId,
    });
    return this.favoriteService.getFavorites(userId);
  }

  @Delete(':provider_id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFavorite(
    @Query('user_id') userId: string,
    @Param('provider_id') providerId: string,
  ): Promise<void> {
    this.logger.info('DELETE /favorites/:provider_id', {
      context: 'FavoriteController',
      user_id: userId,
      provider_id: providerId,
    });
    return this.favoriteService.removeFavorite(userId, providerId);
  }
}
