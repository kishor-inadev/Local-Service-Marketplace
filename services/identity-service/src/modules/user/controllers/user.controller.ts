import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus,
  Inject,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { FlexibleIdPipe } from "../../../common/pipes/flexible-id.pipe";
import { StrictUuidPipe } from "../../../common/pipes/strict-uuid.pipe";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";
import { UserService } from "../services/user.service";
import { UpdateUserDto } from "../dto/update-user.dto";
import { UserResponseDto } from "../dto/user-response.dto";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { AdminUserListQueryDto } from "../dto/admin-user-list-query.dto";
import { AdminCreateUserDto } from "../dto/admin-create-user.dto";
import {
  ResetUserPasswordDto,
  SuspendUserDto,
} from "../dto/admin-user-actions.dto";
import { FileServiceClient } from "../../../common/file-service.client";

@Controller("users")
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly fileServiceClient: FileServiceClient,
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
    this.logger.info("GET /users", {
      context: "UserController",
      query: queryDto,
    });

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
  async createUserByAdmin(
    @Body() createUserDto: AdminCreateUserDto,
  ): Promise<UserResponseDto> {
    this.logger.info("POST /users", {
      context: "UserController",
      email: createUserDto.email,
      role: createUserDto.role,
    });

    return this.userService.createUserByAdmin(createUserDto);
  }

  /**
   * Get current authenticated user's profile
   * GET /users/me
   */
  @UseGuards(JwtAuthGuard)
  @Get("me")
  @HttpCode(HttpStatus.OK)
  async getMyProfile(@Request() req: any): Promise<UserResponseDto> {
    this.logger.info("GET /users/me", {
      context: "UserController",
      user_id: req.user.userId,
    });
    return this.userService.getUserById(req.user.userId);
  }

  /**
   * Update current authenticated user's profile
   * PATCH /users/me
   */
  @UseGuards(JwtAuthGuard)
  @Patch("me")
  @HttpCode(HttpStatus.OK)
  async updateMyProfile(
    @Request() req: any,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    this.logger.info("PATCH /users/me", {
      context: "UserController",
      user_id: req.user.userId,
    });
    return this.userService.updateUser(req.user.userId, updateUserDto);
  }

  /**
   * Upload profile picture for current user
   * POST /users/me/profile-picture
   */
  @UseGuards(JwtAuthGuard)
  @Post("me/profile-picture")
  @UseInterceptors(FileInterceptor("file"))
  @HttpCode(HttpStatus.OK)
  async uploadProfilePicture(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException("Profile picture file is required");
    }

    this.logger.info("POST /users/me/profile-picture", {
      context: "UserController",
      user_id: req.user.userId,
      filename: file.originalname,
      filesize: file.size,
    });

    const userId = req.user.userId;
    const userRole = req.user.role || "user";

    // Upload file to external file service
    const uploadedFile = await this.fileServiceClient.uploadFile(
      file,
      {
        category: "profile-picture",
        description: "User profile picture",
        visibility: "public",
        linkedEntityType: "user",
        linkedEntityId: userId,
        tags: ["profile", "avatar"],
      },
      userId,
      userRole,
    );

    // Update user profile with file URL
    const updatedUser = await this.userService.updateUser(userId, {
      profilePictureUrl: uploadedFile.url,
    });

    return {
      success: true,
      data: {
        user: updatedUser,
        file: uploadedFile,
      },
      message: "Profile picture uploaded successfully",
    };
  }

  /**
   * Admin: get user by ID
   * GET /users/:id
   */
  @Roles("admin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(":id")
  @HttpCode(HttpStatus.OK)
  async getAdminUser(
    @Param("id", FlexibleIdPipe) id: string,
  ): Promise<UserResponseDto> {
    this.logger.info("GET /users/:id", {
      context: "UserController",
      user_id: id,
    });

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
  async suspendUser(
    @Param("id", StrictUuidPipe) id: string,
    @Body() body: SuspendUserDto,
  ): Promise<UserResponseDto> {
    this.logger.info("PATCH /users/:id/suspend", {
      context: "UserController",
      user_id: id,
      reason: body.reason,
    });

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
  async activateUser(
    @Param("id", StrictUuidPipe) id: string,
  ): Promise<UserResponseDto> {
    this.logger.info("PATCH /users/:id/activate", {
      context: "UserController",
      user_id: id,
    });

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
    @Param("id", StrictUuidPipe) id: string,
    @Body() dto: ResetUserPasswordDto,
  ): Promise<{ success: true }> {
    this.logger.info("PATCH /users/:id/reset-password", {
      context: "UserController",
      user_id: id,
    });

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
  async restoreUser(
    @Param("id", StrictUuidPipe) id: string,
  ): Promise<UserResponseDto> {
    this.logger.info("PATCH /users/:id/restore", {
      context: "UserController",
      user_id: id,
    });

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
    @Param("id", StrictUuidPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    this.logger.info("PATCH /users/:id", {
      context: "UserController",
      user_id: id,
    });

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
  async deleteUser(
    @Param("id", StrictUuidPipe) id: string,
  ): Promise<UserResponseDto> {
    this.logger.info("DELETE /users/:id", {
      context: "UserController",
      user_id: id,
    });

    return this.userService.deleteUser(id);
  }
}
