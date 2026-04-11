import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { DeviceRepository } from "../repositories/device.repository";

export class RegisterDeviceDto {
  device_id: string;
  device_type?: string; // "ios" | "android" | "web"
  os?: string;
}

/**
 * DeviceController - Manage user devices for push notifications
 * 
 * Endpoints:
 * - POST /devices - Register device token
 * - GET /devices - List user's devices
 * - DELETE /devices/:deviceId - Remove device token
 */
@Controller("devices")
@UseGuards(JwtAuthGuard)
export class DeviceController {
  constructor(private readonly deviceRepository: DeviceRepository) {}

  /**
   * Register a device token for push notifications
   * POST /devices
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async registerDevice(
    @Body() dto: RegisterDeviceDto,
    @Request() req: any,
  ) {
    const device = await this.deviceRepository.registerDevice({
      user_id: req.user.userId,
      device_id: dto.device_id,
      device_type: dto.device_type,
      os: dto.os,
    });

    return {
      success: true,
      message: "Device registered successfully",
      data: {
        id: device.id,
        device_id: device.device_id,
        device_type: device.device_type,
        os: device.os,
        last_seen: device.last_seen,
      },
    };
  }

  /**
   * Get all devices for the authenticated user
   * GET /devices
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getUserDevices(@Request() req: any) {
    const devices = await this.deviceRepository.getUserDevices(req.user.userId);

    return {
      success: true,
      message: "Devices retrieved successfully",
      data: devices.map(d => ({
        id: d.id,
        device_id: d.device_id,
        device_type: d.device_type,
        os: d.os,
        last_seen: d.last_seen,
      })),
    };
  }

  /**
   * Remove a device token (logout, revoke permission)
   * DELETE /devices/:deviceId
   */
  @Delete(":deviceId")
  @HttpCode(HttpStatus.OK)
  async removeDevice(
    @Param("deviceId") deviceId: string,
    @Request() req: any,
  ) {
    await this.deviceRepository.removeDevice(req.user.userId, deviceId);

    return {
      success: true,
      message: "Device removed successfully",
    };
  }
}
