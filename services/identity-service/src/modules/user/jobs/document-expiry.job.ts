import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProviderDocumentRepository } from '../repositories/provider-document.repository';
import { NotificationClient } from '../../../common/notification/notification.client';

@Injectable()
export class DocumentExpiryJob {
  constructor(
    private readonly documentRepository: ProviderDocumentRepository,
    private readonly notificationClient: NotificationClient
  ) {}

  /**
   * Run daily at 9 AM to check for expiring documents
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkExpiringDocuments(): Promise<void> {
    console.log('[DocumentExpiryJob] Checking for expiring documents...');

    try {
      // Get documents expiring in 30 days
      const expiringDocuments = await this.documentRepository.getExpiringDocuments(30);

      console.log(`[DocumentExpiryJob] Found ${expiringDocuments.length} expiring documents`);

      // Send notifications
      for (const doc of expiringDocuments) {
        // Calculate days until expiry
        const daysUntilExpiry = Math.ceil(
          (new Date(doc.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        // Send notification to provider
        await this.notificationClient.sendEmail({
          to: doc.provider_id,
          template: 'documentExpiring',
          variables: {
            documentType: doc.document_type,
            daysRemaining: daysUntilExpiry.toString(),
            expiryDate: doc.expires_at?.toISOString() || ''
          }
        });

        console.log(`[DocumentExpiryJob] Notification sent for document ${doc.id}`);
      }

      console.log('[DocumentExpiryJob] Completed successfully');
    } catch (error) {
      console.error('[DocumentExpiryJob] Error checking expiring documents:', error);
    }
  }

  /**
   * Check for already expired documents (run daily at 1 AM)
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async checkExpiredDocuments(): Promise<void> {
    console.log('[DocumentExpiryJob] Checking for expired documents...');

    try {
      // Get documents that expired in last 7 days
      const recentlyExpired = await this.documentRepository.getExpiringDocuments(-7);

      console.log(`[DocumentExpiryJob] Found ${recentlyExpired.length} recently expired documents`);

      for (const doc of recentlyExpired) {
        // Send urgent notification
        await this.notificationClient.sendEmail({
          to: doc.provider_id,
          template: 'documentExpired',
          variables: {
            documentType: doc.document_type,
            expiryDate: doc.expires_at?.toISOString() || ''
          }
        });

        console.log(`[DocumentExpiryJob] Urgent notification sent for expired document ${doc.id}`);
      }

      console.log('[DocumentExpiryJob] Expired documents check completed');
    } catch (error) {
      console.error('[DocumentExpiryJob] Error checking expired documents:', error);
    }
  }
}
