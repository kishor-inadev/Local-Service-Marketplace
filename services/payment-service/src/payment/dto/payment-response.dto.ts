export class PaymentResponseDto {
  id: string;
  job_id: string;
  user_id: string;
  provider_id: string;
  amount: number;
  platform_fee: number;
  provider_amount: number;
  currency: string;
  payment_method?: string;
  status: string;
  transaction_id?: string;
  failed_reason?: string;
  /** Gateway used to process this payment (stripe, razorpay, paypal, payubiz, instamojo, mock). */
  gateway: string;
  /**
   * Raw gateway response forwarded to the client.
   *
   * PayUbiz  → { txnid, key, amount, productinfo, firstname, email, hash, surl, furl, payuAction }
   *            Frontend must POST these fields to `payuAction` to complete checkout.
   *
   * Instamojo → { id, longurl, status, amount, currency }
   *             Frontend must redirect user to `longurl` to complete checkout.
   *
   * Other gateways → { clientSecret } (Stripe) or { orderId, currency } (Razorpay/PayPal).
   */
  gateway_response?: Record<string, any>;
  created_at: string;
  updated_at: string;
}
