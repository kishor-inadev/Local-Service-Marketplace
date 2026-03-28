import {
  Controller,
  Get,
  Put,
  Body,
  Request,
  ParseUUIDPipe,
  BadRequestException,
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { NotificationPreferencesService } from '../services/notification-preferences.service';
import { FeatureFlagService } from '../services/feature-flag.service';
import { UpdateNotificationPreferencesDto } from '../dto/update-notification-preferences.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('notification-preferences')
export class NotificationPreferencesController {
  constructor(
    private readonly preferencesService: NotificationPreferencesService,
    private readonly featureFlags: FeatureFlagService
  ) {}

  @Get()
  async getPreferences(@Request() req: any) {
    // Feature flag check: Notification preferences
    if (!this.featureFlags.notificationPreferencesEnabled) {
      throw new BadRequestException('Notification preferences are disabled. Set NOTIFICATION_PREFERENCES_ENABLED=true to enable this feature.');
    }

    const preferences = await this.preferencesService.getPreferences(req.user.id);

    return {
      success: true,
      data: preferences
    };
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  async updatePreferences(
    @Body() dto: UpdateNotificationPreferencesDto,
    @Request() req: any
  ) {
    // Feature flag check: Notification preferences
    if (!this.featureFlags.notificationPreferencesEnabled) {
      throw new BadRequestException('Notification preferences are disabled. Set NOTIFICATION_PREFERENCES_ENABLED=true to enable this feature.');
    }

    const preferences = await this.preferencesService.updatePreferences(
      req.user.id,
      dto
    );

    return {
      success: true,
      data: preferences,
      message: 'Notification preferences updated successfully'
    };
  }

  @Put('disable-all')
  @HttpCode(HttpStatus.OK)
  async disableAll(@Request() req: any) {
    // Feature flag check: Notification preferences
    if (!this.featureFlags.notificationPreferencesEnabled) {
      throw new BadRequestException('Notification preferences are disabled. Set NOTIFICATION_PREFERENCES_ENABLED=true to enable this feature.');
    }

    const preferences = await this.preferencesService.disableAllNotifications(
      req.user.id
    );

    return {
      success: true,
      data: preferences,
      message: 'All notifications disabled'
    };
  }

  @Put('enable-all')
  @HttpCode(HttpStatus.OK)
  async enableAll(@Request() req: any) {
    // Feature flag check: Notification preferences
    if (!this.featureFlags.notificationPreferencesEnabled) {
      throw new BadRequestException('Notification preferences are disabled. Set NOTIFICATION_PREFERENCES_ENABLED=true to enable this feature.');
    }

    const preferences = await this.preferencesService.enableAllNotifications(
      req.user.id
    );

    return {
      success: true,
      data: preferences,
      message: 'All notifications enabled'
    };
  }
}
