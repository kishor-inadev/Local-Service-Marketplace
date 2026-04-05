# Email & SMS Integration Guide

This guide explains how to integrate the email and SMS microservices with the comms-service.

---

## Architecture Overview

```
┌──────────────────┐
│ comms-service     │
│                  │
│  (port 3007)     │
└────────┬─────────┘
         │
         ├─────────────────────┐
         │                     │
         ▼                     ▼
┌────────────────┐    ┌────────────────┐
│ email-service  │    │  sms-service   │
│  (port 4000)   │    │  (port 5000)   │
│                │    │                │
│ MongoDB:27018  │    │ MongoDB:27019  │
└────────────────┘    └────────────────┘
```

**comms-service** makes HTTP requests to email-service and sms-service when sending notifications.

---

## Step 1: Create HTTP Client for Email Service

**File**: `services/comms-service/src/modules/notification/clients/email.client.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

interface EmailPayload {
  to: string | string[];
  subject: string;
  template?: string;
  variables?: Record<string, any>;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    encoding?: string;
  }>;
}

interface EmailResponse {
  success: boolean;
  messageId: string;
  provider: string;
  message: string;
}

@Injectable()
export class EmailClient {
  private readonly logger = new Logger(EmailClient.name);
  private readonly client: AxiosInstance;
  private readonly enabled: boolean;

  constructor(private configService: ConfigService) {
    const emailServiceUrl = this.configService.get<string>('EMAIL_SERVICE_URL');
    this.enabled = this.configService.get<string>('EMAIL_ENABLED') === 'true';

    if (this.enabled && !emailServiceUrl) {
      this.logger.warn('EMAIL_ENABLED=true but EMAIL_SERVICE_URL not configured');
    }

    this.client = axios.create({
      baseURL: emailServiceUrl || 'http://email-service:3500',
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async sendEmail(payload: EmailPayload): Promise<EmailResponse | null> {
    if (!this.enabled) {
      this.logger.debug('Email service is disabled, skipping email send');
      return null;
    }

    try {
      this.logger.log(`Sending email to ${payload.to}`);
      
      const response = await this.client.post<EmailResponse>('/send', payload);
      
      this.logger.log(`Email sent successfully: ${response.data.messageId}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to send email', error.response?.data || error.message);
      throw new Error(`Email service error: ${error.message}`);
    }
  }

  async sendEmailWithTemplate(
    to: string | string[],
    template: string,
    variables: Record<string, any>,
  ): Promise<EmailResponse | null> {
    return this.sendEmail({
      to,
      subject: variables.subject || 'Notification',
      template,
      variables,
    });
  }

  async sendBulkEmail(emails: EmailPayload[]): Promise<any> {
    if (!this.enabled) {
      this.logger.debug('Email service is disabled, skipping bulk email send');
      return null;
    }

    try {
      this.logger.log(`Sending bulk email to ${emails.length} recipients`);
      
      const response = await this.client.post('/bulk', { emails });
      
      this.logger.log('Bulk email sent successfully');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to send bulk email', error.response?.data || error.message);
      throw new Error(`Email service error: ${error.message}`);
    }
  }

  async getEmailStatus(messageId: string): Promise<any> {
    if (!this.enabled) {
      return null;
    }

    try {
      const response = await this.client.get(`/status/${messageId}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get email status', error.message);
      return null;
    }
  }
}
```

---

## Step 2: Create HTTP Client for SMS Service

**File**: `services/comms-service/src/modules/notification/clients/sms.client.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

interface SmsPayload {
  to: string | string[];
  message: string;
  from?: string;
  priority?: 'high' | 'normal' | 'low';
  scheduledAt?: Date;
}

interface SmsResponse {
  success: boolean;
  messageId: string;
  provider: string;
  status: string;
}

interface OtpSendPayload {
  phone: string;
  purpose: string;
  expiryMinutes?: number;
}

interface OtpVerifyPayload {
  phone: string;
  code: string;
  purpose: string;
}

@Injectable()
export class SmsClient {
  private readonly logger = new Logger(SmsClient.name);
  private readonly client: AxiosInstance;
  private readonly enabled: boolean;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    const smsServiceUrl = this.configService.get<string>('SMS_SERVICE_URL');
    this.enabled = this.configService.get<string>('SMS_ENABLED') === 'true';
    this.apiKey = this.configService.get<string>('SMS_API_KEY') || '';

    if (this.enabled && !smsServiceUrl) {
      this.logger.warn('SMS_ENABLED=true but SMS_SERVICE_URL not configured');
    }

    if (this.enabled && !this.apiKey) {
      this.logger.warn('SMS_ENABLED=true but SMS_API_KEY not configured');
    }

    this.client = axios.create({
      baseURL: smsServiceUrl || 'http://sms-service:3000',
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });
  }

  async sendSms(payload: SmsPayload): Promise<SmsResponse | null> {
    if (!this.enabled) {
      this.logger.debug('SMS service is disabled, skipping SMS send');
      return null;
    }

    try {
      this.logger.log(`Sending SMS to ${payload.to}`);
      
      const response = await this.client.post<SmsResponse>('/api/v1/sms/send', payload);
      
      this.logger.log(`SMS sent successfully: ${response.data.messageId}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to send SMS', error.response?.data || error.message);
      throw new Error(`SMS service error: ${error.message}`);
    }
  }

  async sendBulkSms(messages: SmsPayload[]): Promise<any> {
    if (!this.enabled) {
      this.logger.debug('SMS service is disabled, skipping bulk SMS send');
      return null;
    }

    try {
      this.logger.log(`Sending bulk SMS to ${messages.length} recipients`);
      
      const response = await this.client.post('/api/v1/sms/bulk', { messages });
      
      this.logger.log('Bulk SMS sent successfully');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to send bulk SMS', error.response?.data || error.message);
      throw new Error(`SMS service error: ${error.message}`);
    }
  }

  async sendOtp(payload: OtpSendPayload): Promise<any> {
    if (!this.enabled) {
      this.logger.debug('SMS service is disabled, skipping OTP send');
      return null;
    }

    try {
      this.logger.log(`Sending OTP to ${payload.phone} for ${payload.purpose}`);
      
      const response = await this.client.post('/api/v1/sms/otp/send', payload);
      
      this.logger.log('OTP sent successfully');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to send OTP', error.response?.data || error.message);
      throw new Error(`SMS service error: ${error.message}`);
    }
  }

  async verifyOtp(payload: OtpVerifyPayload): Promise<{ valid: boolean; message: string }> {
    if (!this.enabled) {
      this.logger.debug('SMS service is disabled, skipping OTP verification');
      return { valid: false, message: 'SMS service disabled' };
    }

    try {
      this.logger.log(`Verifying OTP for ${payload.phone}`);
      
      const response = await this.client.post('/api/v1/sms/otp/verify', payload);
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to verify OTP', error.response?.data || error.message);
      return { valid: false, message: error.response?.data?.message || 'Verification failed' };
    }
  }

  async getSmsStatus(messageId: string): Promise<any> {
    if (!this.enabled) {
      return null;
    }

    try {
      const response = await this.client.get(`/api/v1/sms/status/${messageId}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get SMS status', error.message);
      return null;
    }
  }
}
```

---

## Step 3: Update Notification Module

**File**: `services/comms-service/src/modules/notification/notification.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationController } from './controllers/notification.controller';
import { NotificationService } from './services/notification.service';
import { NotificationRepository } from './repositories/notification.repository';
import { EmailClient } from './clients/email.client';
import { SmsClient } from './clients/sms.client';

@Module({
  imports: [ConfigModule],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationRepository,
    EmailClient,
    SmsClient,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
```

---

## Step 4: Update Notification Service

**File**: `services/comms-service/src/modules/notification/services/notification.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { NotificationRepository } from '../repositories/notification.repository';
import { EmailClient } from '../clients/email.client';
import { SmsClient } from '../clients/sms.client';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private notificationRepo: NotificationRepository,
    private emailClient: EmailClient,
    private smsClient: SmsClient,
  ) {}

  async sendEmailNotification(userId: string, type: string, data: any): Promise<void> {
    try {
      // Create notification record
      const notification = await this.notificationRepo.create({
        user_id: userId,
        type,
        channel: 'email',
        title: data.subject || 'Notification',
        message: data.message,
        data,
      });

      // Send email via email service
      const emailResponse = await this.emailClient.sendEmailWithTemplate(
        data.email,
        data.template || 'default',
        { ...data, subject: data.subject },
      );

      if (emailResponse) {
        // Update notification with delivery status
        await this.notificationRepo.updateDeliveryStatus(
          notification.id,
          'email',
          emailResponse.messageId,
          'sent',
        );
      }
    } catch (error) {
      this.logger.error(`Failed to send email notification: ${error.message}`);
      throw error;
    }
  }

  async sendSmsNotification(userId: string, type: string, data: any): Promise<void> {
    try {
      // Create notification record
      const notification = await this.notificationRepo.create({
        user_id: userId,
        type,
        channel: 'sms',
        title: 'SMS Notification',
        message: data.message,
        data,
      });

      // Send SMS via SMS service
      const smsResponse = await this.smsClient.sendSms({
        to: data.phone,
        message: data.message,
      });

      if (smsResponse) {
        // Update notification with delivery status
        await this.notificationRepo.updateDeliveryStatus(
          notification.id,
          'sms',
          smsResponse.messageId,
          smsResponse.status,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to send SMS notification: ${error.message}`);
      throw error;
    }
  }

  async sendMultiChannelNotification(
    userId: string,
    type: string,
    emailData: any,
    smsData?: any,
  ): Promise<void> {
    const promises: Promise<void>[] = [];

    if (emailData) {
      promises.push(this.sendEmailNotification(userId, type, emailData));
    }

    if (smsData) {
      promises.push(this.sendSmsNotification(userId, type, smsData));
    }

    await Promise.allSettled(promises);
  }

  // Example: Welcome email
  async sendWelcomeEmail(userId: string, email: string, name: string): Promise<void> {
    await this.sendEmailNotification(userId, 'welcome', {
      email,
      subject: 'Welcome to Local Service Marketplace!',
      template: 'welcome',
      name,
      dashboardUrl: process.env.FRONTEND_URL + '/dashboard',
    });
  }

  // Example: Email verification
  async sendVerificationEmail(userId: string, email: string, name: string, token: string): Promise<void> {
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    await this.sendEmailNotification(userId, 'email_verification', {
      email,
      subject: 'Verify Your Email Address',
      template: 'emailVerification',
      name,
      verificationLink,
    });
  }

  // Example: OTP via SMS
  async sendOtpSms(phone: string, purpose: string): Promise<void> {
    return this.smsClient.sendOtp({ phone, purpose, expiryMinutes: 10 });
  }

  async verifyOtp(phone: string, code: string, purpose: string): Promise<boolean> {
    const result = await this.smsClient.verifyOtp({ phone, code, purpose });
    return result.valid;
  }
}
```

---

## Step 5: Add Email Templates to Email Service

The email templates are already created at:
`services/email-service/src/templates/marketplaceTemplates.js`

Available templates:
- `welcome` - Welcome new users
- `emailVerification` - Email verification
- `passwordReset` - Password reset link
- `newRequest` - New service request for providers
- `proposalReceived` - New proposal for customers
- `jobAssigned` - Job assigned notification
- `paymentReceived` - Payment confirmation

---

## Step 6: Environment Configuration

Update `.env` file:

```env
# Email Service
EMAIL_ENABLED=true
EMAIL_SERVICE_URL=http://email-service:3500
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
DEFAULT_FROM_EMAIL=noreply@marketplace.com
DEFAULT_FROM_NAME=Local Service Marketplace

# SMS Service (optional - costs apply)
SMS_ENABLED=false
SMS_SERVICE_URL=http://sms-service:3000
SMS_API_KEY=change-me-to-a-strong-random-secret
SMS_PROVIDER=mock

# Twilio (when SMS_ENABLED=true and SMS_PROVIDER=twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_FROM_NUMBER=+1234567890
```

---

## Step 7: Install Dependencies

```bash
cd services/comms-service
npm install axios
```

---

## Step 8: Test Integration

### Test Email Service

```bash
# Start email service
docker-compose up --profile email

# Test API
curl -X POST http://localhost:4000/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "template": "welcome",
    "variables": {
      "name": "John Doe",
      "dashboardUrl": "http://localhost:3000/dashboard"
    }
  }'
```

### Test SMS Service

```bash
# Start SMS service
docker-compose up --profile sms

# Test API (with mock provider - no cost)
curl -X POST http://localhost:5000/api/v1/sms/send \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1234567890",
    "message": "Test SMS from marketplace"
  }'

# Test OTP
curl -X POST http://localhost:5000/api/v1/sms/otp/send \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "purpose": "login"
  }'
```

---

## Step 9: Usage Examples

### In Auth Service (after user signup)

```typescript
// services/identity-service/src/modules/auth/services/auth.service.ts

async register(email: string, password: string, role: string) {
  const user = await this.userRepo.create(email, password, role);
  
  // Send welcome email via notification service
  await this.httpService.post(`${NOTIFICATION_SERVICE_URL}/notifications/email`, {
    userId: user.id,
    type: 'welcome',
    data: {
      email: user.email,
      name: user.full_name || 'User',
      template: 'welcome',
    },
  }).toPromise();
  
  return user;
}
```

### In Job Service (when job assigned)

```typescript
// services/marketplace-service/src/modules/job/services/job.service.ts

async assignJob(jobId: string, providerId: string) {
  const job = await this.jobRepo.assign(jobId, providerId);
  const provider = await this.providerService.getProvider(providerId);
  
  // Send notification
  await this.httpService.post(`${NOTIFICATION_SERVICE_URL}/notifications/email`, {
    userId: providerId,
    type: 'job_assigned',
    data: {
      email: provider.email,
      template: 'jobAssigned',
      providerName: provider.name,
      requestTitle: job.title,
      customerName: job.customer_name,
      price: job.price,
      startDate: job.start_date,
      jobUrl: `${FRONTEND_URL}/jobs/${job.id}`,
    },
  }).toPromise();
  
  return job;
}
```

---

## Production Checklist

- [ ] Configure SMTP credentials (Gmail App Password or SendGrid)
- [ ] Set strong API key for SMS service
- [ ] Configure Twilio or AWS SNS for production SMS
- [ ] Test email delivery in production
- [ ] Monitor MongoDB logs (email-service and sms-service)
- [ ] Set up rate limiting for APIs
- [ ] Configure email templates with production branding
- [ ] Set up webhook for SMS delivery status (optional)
- [ ] Monitor costs for SMS providers

---

## Next Steps

1. **Install axios in comms-service**: `npm install axios`
2. **Create client files**: EmailClient and SmsClient
3. **Update NotificationService**: Add methods for email/SMS
4. **Configure SMTP**: Get Gmail App Password
5. **Test**: Send test email and SMS
6. **Integrate**: Use in identity-service, marketplace-service, etc.

---

**Note**: Email service is enabled by default (`EMAIL_ENABLED=true`). SMS is disabled by default (`SMS_ENABLED=false`) to avoid unexpected costs. Enable SMS only when you have configured a provider (Twilio recommended for development).
