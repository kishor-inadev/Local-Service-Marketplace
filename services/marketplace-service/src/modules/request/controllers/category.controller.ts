import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { CategoryService } from '../services/category.service';
import { ServiceCategory } from '../entities/service-category.entity';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllCategories(
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ): Promise<ServiceCategory[]> {
    if (search) {
      const limitNum = limit ? parseInt(limit, 10) : 10;
      return this.categoryService.searchCategories(search, limitNum);
    }
    return this.categoryService.getAllCategories();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getCategoryById(@Param('id') id: string): Promise<ServiceCategory> {
    return this.categoryService.getCategoryById(id);
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCategory(@Body('name') name: string): Promise<ServiceCategory> {
    return this.categoryService.createCategory(name);
  }
}
