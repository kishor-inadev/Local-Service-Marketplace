import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
  Request,
  HttpCode,
  HttpStatus,
  Inject,
  UseGuards,
} from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";
import { FavoriteService } from "../services/favorite.service";
import { CreateFavoriteDto } from "../dto/create-favorite.dto";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("favorites")
export class FavoriteController {
  constructor(
    private readonly favoriteService: FavoriteService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async saveFavorite(
    @Body() createFavoriteDto: CreateFavoriteDto,
    @Request() req: any,
  ): Promise<any> {
    createFavoriteDto.user_id = req.user.userId;
    this.logger.info("POST /favorites", {
      context: "FavoriteController",
      user_id: createFavoriteDto.user_id,
      provider_id: createFavoriteDto.provider_id,
    });
    return this.favoriteService.saveFavorite(createFavoriteDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getFavorites(@Request() req: any): Promise<any> {
    const userId = req.user.userId;
    this.logger.info("GET /favorites", {
      context: "FavoriteController",
      user_id: userId,
    });
    return this.favoriteService.getFavorites(userId);
  }

  @Delete(":provider_id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFavorite(
    @Param("provider_id") providerId: string,
    @Request() req: any,
  ): Promise<void> {
    const userId = req.user.userId;
    this.logger.info("DELETE /favorites/:provider_id", {
      context: "FavoriteController",
      user_id: userId,
      provider_id: providerId,
    });
    return this.favoriteService.removeFavorite(userId, providerId);
  }
}
