import {
	Controller,
	Get,
	Patch,
	Post,
	Delete,
	Body,
	Param,
	Query,
	HttpCode,
	HttpStatus,
	Inject,
	UseGuards,
} from "@nestjs/common";
import { FlexibleIdPipe } from "../../../common/pipes/flexible-id.pipe";
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { UserService } from '../services/user.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { AdminUserListQueryDto } from "../dto/admin-user-list-query.dto";
import { AdminCreateUserDto } from "../dto/admin-create-user.dto";
import { ResetUserPasswordDto, SuspendUserDto } from "../dto/admin-user-actions.dto";

@Controller("users")
export class UserController {
	constructor(
		private readonly userService: UserService,
		@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
	) {}

	/**
	 * Admin: list users
	 * GET /users
	 */
	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Get()
	@HttpCode(HttpStatus.OK)
	async getUsersForAdmin(@Query() queryDto: AdminUserListQueryDto) {
		this.logger.info("GET /users", { context: "UserController", query: queryDto });

		return this.userService.getUsersForAdmin(queryDto);
	}

	/**
	 * Admin: user stats
	 * GET /users/stats
	 */
	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Get("stats")
	@HttpCode(HttpStatus.OK)
	async getAdminUserStats() {
		this.logger.info("GET /users/stats", { context: "UserController" });

		return this.userService.getAdminUserStats();
	}

	/**
	 * Admin: create user
	 * POST /users
	 */
	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Post()
	@HttpCode(HttpStatus.CREATED)
	async createUserByAdmin(@Body() createUserDto: AdminCreateUserDto): Promise<UserResponseDto> {
		this.logger.info("POST /users", {
			context: "UserController",
			email: createUserDto.email,
			role: createUserDto.role,
		});

		return this.userService.createUserByAdmin(createUserDto);
	}

	/**
	 * Admin: get user by ID
	 * GET /users/:id
	 */
	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Get(":id")
	@HttpCode(HttpStatus.OK)
	async getAdminUser(@Param("id", FlexibleIdPipe) id: string): Promise<UserResponseDto> {
		this.logger.info("GET /users/:id", { context: "UserController", user_id: id });

		return this.userService.getUserById(id);
	}

	/**
	 * Admin: suspend user
	 * PATCH /users/:id/suspend
	 */
	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Patch(":id/suspend")
	@HttpCode(HttpStatus.OK)
	async suspendUser(@Param("id", FlexibleIdPipe) id: string, @Body() body: SuspendUserDto): Promise<UserResponseDto> {
		this.logger.info("PATCH /users/:id/suspend", { context: "UserController", user_id: id, reason: body.reason });

		return this.userService.suspendUser(id, body.reason);
	}

	/**
	 * Admin: activate user
	 * PATCH /users/:id/activate
	 */
	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Patch(":id/activate")
	@HttpCode(HttpStatus.OK)
	async activateUser(@Param("id", FlexibleIdPipe) id: string): Promise<UserResponseDto> {
		this.logger.info("PATCH /users/:id/activate", { context: "UserController", user_id: id });

		return this.userService.activateUser(id);
	}

	/**
	 * Admin: reset user password
	 * PATCH /users/:id/reset-password
	 */
	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Patch(":id/reset-password")
	@HttpCode(HttpStatus.OK)
	async resetUserPassword(
		@Param("id", FlexibleIdPipe) id: string,
		@Body() dto: ResetUserPasswordDto,
	): Promise<{ success: true }> {
		this.logger.info("PATCH /users/:id/reset-password", { context: "UserController", user_id: id });

		return this.userService.resetUserPassword(id, dto);
	}

	/**
	 * Admin: restore deleted user
	 * PATCH /users/:id/restore
	 */
	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Patch(":id/restore")
	@HttpCode(HttpStatus.OK)
	async restoreUser(@Param("id", FlexibleIdPipe) id: string): Promise<UserResponseDto> {
		this.logger.info("PATCH /users/:id/restore", { context: "UserController", user_id: id });

		return this.userService.restoreUser(id);
	}

	/**
	 * Admin: update user by ID
	 * PATCH /users/:id
	 */
	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Patch(":id")
	@HttpCode(HttpStatus.OK)
	async updateUser(
		@Param("id", FlexibleIdPipe) id: string,
		@Body() updateUserDto: UpdateUserDto,
	): Promise<UserResponseDto> {
		this.logger.info("PATCH /users/:id", { context: "UserController", user_id: id });

		return this.userService.updateUser(id, updateUserDto);
	}

	/**
	 * Admin: soft-delete user
	 * DELETE /users/:id
	 */
	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Delete(":id")
	@HttpCode(HttpStatus.OK)
	async deleteUser(@Param("id", FlexibleIdPipe) id: string): Promise<UserResponseDto> {
		this.logger.info("DELETE /users/:id", { context: "UserController", user_id: id });

		return this.userService.deleteUser(id);
	}
}
