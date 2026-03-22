import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { SystemSettingRepository } from '../repositories/system-setting.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { SystemSetting } from '../entities/system-setting.entity';
import { NotFoundException } from '../../common/exceptions/http.exceptions';

@Injectable()
export class SystemSettingService {
  constructor(
    private readonly systemSettingRepository: SystemSettingRepository,
    private readonly auditLogRepository: AuditLogRepository,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  async getAllSettings(): Promise<SystemSetting[]> {
    this.logger.log('Fetching all system settings', 'SystemSettingService');

    return this.systemSettingRepository.getAllSettings();
  }

  async getSettingByKey(key: string): Promise<SystemSetting> {
    this.logger.log(
      `Fetching system setting with key: ${key}`,
      'SystemSettingService',
    );

    const setting = await this.systemSettingRepository.getSettingByKey(key);

    if (!setting) {
      throw new NotFoundException('System setting not found');
    }

    return setting;
  }

  async updateSetting(
    key: string,
    value: string,
    adminId: string,
  ): Promise<SystemSetting> {
    this.logger.log(
      `Updating system setting ${key} to ${value} by admin ${adminId}`,
      'SystemSettingService',
    );

    // Check if setting exists
    const existingSetting =
      await this.systemSettingRepository.getSettingByKey(key);

    if (!existingSetting) {
      throw new NotFoundException('System setting not found');
    }

    // Update setting
    const updatedSetting = await this.systemSettingRepository.updateSetting(
      key,
      value,
    );

    // Create audit log
    await this.auditLogRepository.createAuditLog(
      adminId,
      'update_system_setting',
      'system_setting',
      key,
      { oldValue: existingSetting.value, newValue: value },
    );

    this.logger.log(
      `System setting ${key} updated successfully`,
      'SystemSettingService',
    );

    return updatedSetting;
  }
}
