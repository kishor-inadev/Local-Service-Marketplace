import { Injectable, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { User } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { NotFoundException } from '@/common/exceptions/http.exceptions';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<UserResponseDto> {
    this.logger.info('getUserById', {
      context: 'UserService',
      user_id: id,
    });

    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.mapToDto(user);
  }

  /**
   * Update user profile
   */
  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    this.logger.info('updateUser', {
      context: 'UserService',
      user_id: id,
    });

    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updatedUser = await this.userRepository.update(
      id,
      updateUserDto.name,
      updateUserDto.email,
      updateUserDto.phone,
      updateUserDto.profilePictureUrl,
      updateUserDto.timezone,
      updateUserDto.language,
    );

    return this.mapToDto(updatedUser);
  }

  /**
   * Map User entity to UserResponseDto
   */
  private mapToDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      emailVerified: user.email_verified,
      phoneVerified: user.phone_verified,
      profilePictureUrl: user.profile_picture_url,
      timezone: user.timezone,
      language: user.language,
      lastLoginAt: user.last_login_at,
      status: user.status,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }
}
