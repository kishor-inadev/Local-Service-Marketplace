import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AdminController } from "./admin.controller";
import { DisputeController } from "./dispute.controller";
import { DisputeService } from './services/dispute.service';
import { AuditLogService } from './services/audit-log.service';
import { SystemSettingService } from './services/system-setting.service';
import { ContactMessageService } from './services/contact-message.service';
import { AdminActionRepository } from './repositories/admin-action.repository';
import { DisputeRepository } from './repositories/dispute.repository';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { SystemSettingRepository } from './repositories/system-setting.repository';
import { ContactMessageRepository } from './repositories/contact-message.repository';
import { NotificationClient } from '../common/notification/notification.client';
import { UserClient } from '../common/user/user.client';
import { PublicController } from '../public/public.controller';

@Module({
	imports: [
		BullModule.registerQueue(
			{ name: 'oversight.audit' },
			{ name: 'oversight.notification' },
		),
	],
	controllers: [AdminController, DisputeController, PublicController],
	providers: [
		DisputeService,
		AuditLogService,
		SystemSettingService,
		ContactMessageService,
		AdminActionRepository,
		DisputeRepository,
		AuditLogRepository,
		SystemSettingRepository,
		ContactMessageRepository,
		NotificationClient,
		UserClient,
	],
	exports: [DisputeService, AuditLogService, SystemSettingService, ContactMessageService],
})
export class AdminModule {}
