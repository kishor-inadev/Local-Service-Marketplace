import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProviderPortfolioService } from '../services/provider-portfolio.service';
import { CreatePortfolioDto } from '../dto/create-portfolio.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('provider-portfolio')
export class ProviderPortfolioController {
  constructor(
    private readonly portfolioService: ProviderPortfolioService
  ) { }

  @Post(':providerId')
  @UseInterceptors(FilesInterceptor('images', 10)) // Max 10 images
  @HttpCode(HttpStatus.CREATED)
  async createPortfolioItem(
    @Param('providerId', ParseUUIDPipe) providerId: string,
    @Body() dto: CreatePortfolioDto,
    @UploadedFiles() files: any[],
    @Request() req: any
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one image is required');
    }

    // TODO: Upload images to storage (S3 or local)
    // For now, using placeholder URLs
    const imageUrls = files.map(file => `/uploads/portfolio/${file.filename}`);

    const portfolioItem = await this.portfolioService.createPortfolioItem(
      providerId,
      req.user.userId,
      dto,
      imageUrls
    );

    return {
      success: true,
      data: portfolioItem,
      message: 'Portfolio item created successfully'
    };
  }

  @Get('provider/:providerId')
  async getProviderPortfolio(
    @Param('providerId', ParseUUIDPipe) providerId: string
  ) {
    const portfolio = await this.portfolioService.getProviderPortfolio(providerId);

    // Transform image_url to images array for frontend compatibility
    const transformedPortfolio = portfolio.map(item => ({
      ...item,
      images: [item.image_url] // Convert single image_url to array
    }));

    return {
      success: true,
      data: transformedPortfolio,
      count: transformedPortfolio.length
    };
  }

  @Get(':itemId')
  async getPortfolioItem(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Request() req: any
  ) {
    const item = await this.portfolioService.getPortfolioItemById(
      itemId,
      req.user?.userId
    );

    // Transform image_url to images array for frontend compatibility
    const transformedItem = {
      ...item,
      images: [item.image_url]
    };

    return {
      success: true,
      data: transformedItem
    };
  }

  @Put(':itemId')
  async updatePortfolioItem(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() updateData: { title?: string; description?: string },
    @Request() req: any
  ) {
    const item = await this.portfolioService.updatePortfolioItem(
      itemId,
      req.user.userId,
      updateData
    );

    return {
      success: true,
      data: item,
      message: 'Portfolio item updated successfully'
    };
  }

  @Put(':providerId/reorder')
  async reorderPortfolio(
    @Param('providerId', ParseUUIDPipe) providerId: string,
    @Body('orderedIds') orderedIds: string[],
    @Request() req: any
  ) {
    const portfolio = await this.portfolioService.reorderPortfolio(
      providerId,
      req.user.userId,
      orderedIds
    );

    return {
      success: true,
      data: portfolio,
      message: 'Portfolio reordered successfully'
    };
  }

  @Delete(':itemId')
  async deletePortfolioItem(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Request() req: any
  ) {
    await this.portfolioService.deletePortfolioItem(itemId, req.user.userId);

    return {
      success: true,
      message: 'Portfolio item deleted successfully'
    };
  }
}
