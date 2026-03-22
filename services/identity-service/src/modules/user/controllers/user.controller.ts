import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Inject,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { UserService } from '../services/user.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  /**
   * Get current user profile
   * GET /users/me
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getCurrentUser(@Req() req: Request): Promise<UserResponseDto> {
    // Extract user ID from JWT token (added by JwtAuthGuard)
    const userId = (req as any).user?.id || (req as any).user?.sub;

    this.logger.info('GET /users/me', {
      context: 'UserController',
      user_id: userId,
    });

    if (!userId) {
      throw new Error('User ID not found in request');
    }

    return this.userService.getUserById(userId);
  }

  /**
   * Get user by ID
   * GET /users/:id
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getUser(@Param('id') id: string): Promise<UserResponseDto> {
    this.logger.info('GET /users/:id', {
      context: 'UserController',
      user_id: id,
    });

    return this.userService.getUserById(id);
  }

  /**
   * Update current user profile
   * PATCH /users/me
   */
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateCurrentUser(
    @Req() req: Request,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    // Extract user ID from JWT token
    const userId = (req as any).user?.id || (req as any).user?.sub;

    this.logger.info('PATCH /users/me', {
      context: 'UserController',
      user_id: userId,
    });

    if (!userId) {
      throw new Error('User ID not found in request');
    }

    return this.userService.updateUser(userId, updateUserDto);
  }

  /**
   * Update user by ID  
   * PATCH /users/:id
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    this.logger.info('PATCH /users/:id', {
      context: 'UserController',
      user_id: id,
    });

    return this.userService.updateUser(id, updateUserDto);
  }
}
