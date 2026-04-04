import { Injectable, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import * as bcrypt from "bcryptjs";
import { User } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { AdminCreateUserDto } from "../dto/admin-create-user.dto";
import { AdminUserListQueryDto } from "../dto/admin-user-list-query.dto";
import { ResetUserPasswordDto } from "../dto/admin-user-actions.dto";
import { ConflictException, NotFoundException } from "@/common/exceptions/http.exceptions";

@Injectable()
export class UserService {
	private readonly saltRounds = 12;

	constructor(
		private readonly userRepository: UserRepository,
		@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
	) {}

	async getUsersForAdmin(
		queryDto: AdminUserListQueryDto,
	): Promise<{ data: UserResponseDto[]; total: number; page: number; limit: number }> {
		const result = await this.userRepository.findAllForAdmin(queryDto);
		return {
			data: result.data.map((user) => this.mapToDto(user)),
			total: result.total,
			page: result.page,
			limit: result.limit,
		};
	}

	async createUserByAdmin(createUserDto: AdminCreateUserDto): Promise<UserResponseDto> {
		const existingUser = await this.userRepository.findByEmail(createUserDto.email.toLowerCase().trim());
		if (existingUser) {
			throw new ConflictException("User with this email already exists");
		}

		const passwordHash = await bcrypt.hash(createUserDto.password, this.saltRounds);

		try {
			const created = await this.userRepository.createByAdminWithHash(createUserDto, passwordHash);
			return this.mapToDto(created);
		} catch (error: any) {
			if (error?.code === "23505") {
				throw new ConflictException("User with this email already exists");
			}

			throw error;
		}
	}

	async suspendUser(userId: string, reason?: string): Promise<UserResponseDto> {
		const updated = await this.userRepository.updateStatus(userId, "suspended");
		if (!updated) {
			throw new NotFoundException(`User with ID ${userId} not found`);
		}

		if (reason) {
			this.logger.info(`User ${userId} suspended. Reason: ${reason}`, "UserService");
		}

		return this.mapToDto(updated);
	}

	async activateUser(userId: string): Promise<UserResponseDto> {
		const updated = await this.userRepository.updateStatus(userId, "active");
		if (!updated) {
			throw new NotFoundException(`User with ID ${userId} not found`);
		}

		return this.mapToDto(updated);
	}

	async resetUserPassword(userId: string, dto: ResetUserPasswordDto): Promise<{ success: true }> {
		const passwordHash = await bcrypt.hash(dto.newPassword, this.saltRounds);
		const updated = await this.userRepository.updatePassword(userId, passwordHash);

		if (!updated) {
			throw new NotFoundException(`User with ID ${userId} not found`);
		}

		return { success: true };
	}

	async deleteUser(userId: string): Promise<UserResponseDto> {
		const deleted = await this.userRepository.softDelete(userId);
		if (!deleted) {
			throw new NotFoundException(`User with ID ${userId} not found`);
		}

		return this.mapToDto(deleted);
	}

	async restoreUser(userId: string): Promise<UserResponseDto> {
		const restored = await this.userRepository.restore(userId);
		if (!restored) {
			throw new NotFoundException(`Deleted user with ID ${userId} not found`);
		}

		return this.mapToDto(restored);
	}

	async getAdminUserStats(): Promise<{
		total: number;
		byStatus: { active: number; suspended: number };
		byRole: { customer: number; provider: number; admin: number };
	}> {
		return this.userRepository.getAdminUserStats();
	}

	/**
	 * Get user by ID
	 */
	async getUserById(id: string): Promise<UserResponseDto> {
		this.logger.info("getUserById", { context: "UserService", user_id: id });

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
		this.logger.info("updateUser", { context: "UserService", user_id: id });

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
