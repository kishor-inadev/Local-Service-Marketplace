import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PaymentGatewayService } from "./payment-gateway.service";
import { StripeAdapter } from "./adapters/stripe.adapter";
import { RazorpayAdapter } from "./adapters/razorpay.adapter";
import { PayPalAdapter } from "./adapters/paypal.adapter";
import { MockAdapter } from "./adapters/mock.adapter";
import { PayUbizAdapter } from "./adapters/payubiz.adapter";
import { InstamojoAdapter } from "./adapters/instamojo.adapter";

@Module({
	imports: [ConfigModule],
	providers: [
		StripeAdapter,
		RazorpayAdapter,
		PayPalAdapter,
		MockAdapter,
		PayUbizAdapter,
		InstamojoAdapter,
		PaymentGatewayService,
	],
	exports: [PaymentGatewayService],
})
export class PaymentGatewayModule {}
