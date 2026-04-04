import {
	Controller,
	Post,
	Param,
	Body,
	RawBodyRequest,
	Req,
	Headers,
	HttpCode,
	HttpStatus,
	Inject,
	LoggerService,
} from "@nestjs/common";
import { Request } from "express";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { WebhookService } from "../services/webhook.service";

/**
 * WebhookController
 *
 * Exposes a single webhook endpoint that accepts events from any
 * supported payment gateway.
 *
 * Route: POST /webhooks/:gateway
 *   :gateway — one of "stripe", "razorpay", "paypal", "payubiz", "instamojo", or "mock"
 *
 * The raw request body is forwarded to WebhookService for signature
 * verification (requires rawBody:true in NestFactory.create options,
 * which is set in main.ts).
 *
 * Note: This endpoint is intentionally NOT guarded by JWT since payment
 * gateways call it directly without user tokens.  Authenticity is enforced
 * via gateway-specific HMAC / signature verification inside WebhookService.
 */
@Controller("webhooks")
export class WebhookController {
	constructor(
		@Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
		private readonly webhookService: WebhookService,
	) {}

	/**
	 * Receive a webhook event from a payment gateway.
	 *
	 * POST /webhooks/stripe
	 * POST /webhooks/razorpay
	 * POST /webhooks/paypal
	 * POST /webhooks/mock
	 */
	@Post(":gateway")
	@HttpCode(HttpStatus.OK)
	async receiveWebhook(
		@Param("gateway") gateway: string,
		@Body() payload: Record<string, any>,
		@Req() req: RawBodyRequest<Request>,
		@Headers() headers: Record<string, string>,
	): Promise<{ received: boolean; webhookId: string }> {
		this.logger.log(`Webhook received from gateway: ${gateway}`, "WebhookController");

		const rawBody: Buffer = req.rawBody ?? Buffer.from(JSON.stringify(payload));

		const webhook = await this.webhookService.handleWebhook(gateway.toLowerCase(), rawBody, headers, payload);

		return { received: true, webhookId: webhook.id };
	}
}
