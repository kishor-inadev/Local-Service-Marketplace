import { Injectable, Inject, LoggerService } from "@nestjs/common";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { PaymentRepository } from "../repositories/payment.repository";
import { UserClient } from "../../common/user/user.client";
import { NotFoundException } from "../../common/exceptions/http.exceptions";

export interface InvoiceData {
  invoice_number: string;
  issue_date: string;
  payment: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    payment_method: string;
    transaction_id: string;
    gateway: string;
    paid_at: string | null;
    created_at: string;
  };
  customer: {
    id: string;
    name: string;
    email: string;
  };
  provider: {
    id: string;
    name: string;
    email: string;
  };
  job_id: string;
  platform: {
    name: string;
    address: string;
    email: string;
  };
}

@Injectable()
export class InvoiceService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly paymentRepository: PaymentRepository,
    private readonly userClient: UserClient,
  ) {}

  async generateInvoice(
    paymentId: string,
    requestingUserId: string,
  ): Promise<InvoiceData> {
    this.logger.log(
      `Generating invoice for payment ${paymentId}`,
      "InvoiceService",
    );

    const payment = await this.paymentRepository.getPaymentById(paymentId);
    if (!payment) {
      throw new NotFoundException("Payment not found");
    }

    // Fetch customer and provider details
    const [customer, provider] = await Promise.all([
      this.userClient.getUserById(payment.user_id).catch(() => ({
        id: payment.user_id,
        name: "Customer",
        email: "N/A",
      })),
      this.userClient.getUserById(payment.provider_id).catch(() => ({
        id: payment.provider_id,
        name: "Provider",
        email: "N/A",
      })),
    ]);

    const createdAtStr =
      payment.created_at instanceof Date
        ? payment.created_at.toISOString()
        : String(payment.created_at);
    const invoiceNumber = this.generateInvoiceNumber(payment.id, createdAtStr);

    return {
      invoice_number: invoiceNumber,
      issue_date: new Date().toISOString(),
      payment: {
        id: payment.id,
        amount:
          typeof payment.amount === "string"
            ? parseFloat(payment.amount)
            : payment.amount,
        currency: payment.currency || "INR",
        status: payment.status,
        payment_method: payment.payment_method || "card",
        transaction_id: payment.transaction_id || "",
        gateway: payment.gateway || "mock",
        paid_at: payment.paid_at
          ? payment.paid_at instanceof Date
            ? payment.paid_at.toISOString()
            : String(payment.paid_at)
          : null,
        created_at: createdAtStr,
      },
      customer: {
        id: customer.id,
        name: customer.name || "Customer",
        email: customer.email || "N/A",
      },
      provider: {
        id: provider.id,
        name: provider.name || "Provider",
        email: provider.email || "N/A",
      },
      job_id: payment.job_id,
      platform: {
        name: "Local Service Marketplace",
        address: "Platform Operator Address",
        email: "billing@marketplace.com",
      },
    };
  }

  generateInvoiceHtml(invoice: InvoiceData): string {
    const formattedAmount = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: invoice.payment.currency,
    }).format(invoice.payment.amount);

    const issueDate = new Date(invoice.issue_date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const paidDate = invoice.payment.paid_at
      ? new Date(invoice.payment.paid_at).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Pending";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoice_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; }
    .invoice { max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #2563eb; padding-bottom: 20px; }
    .header h1 { font-size: 28px; color: #2563eb; }
    .header .invoice-info { text-align: right; }
    .header .invoice-info p { font-size: 14px; color: #666; }
    .header .invoice-number { font-size: 18px; font-weight: bold; color: #333; }
    .parties { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .party { width: 45%; }
    .party h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 8px; }
    .party p { font-size: 14px; margin-bottom: 4px; }
    .party .name { font-weight: bold; font-size: 16px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #f8fafc; padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666; border-bottom: 2px solid #e2e8f0; }
    td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .total-row td { font-weight: bold; font-size: 16px; border-top: 2px solid #333; border-bottom: none; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .status-completed { background: #dcfce7; color: #166534; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-failed { background: #fecaca; color: #991b1b; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #999; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } .invoice { padding: 20px; } }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div>
        <h1>${invoice.platform.name}</h1>
        <p>${invoice.platform.email}</p>
      </div>
      <div class="invoice-info">
        <p class="invoice-number">${invoice.invoice_number}</p>
        <p>Date: ${issueDate}</p>
        <p>Payment ID: ${invoice.payment.id.substring(0, 8)}...</p>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <h3>Bill To (Customer)</h3>
        <p class="name">${invoice.customer.name}</p>
        <p>${invoice.customer.email}</p>
      </div>
      <div class="party">
        <h3>Service Provider</h3>
        <p class="name">${invoice.provider.name}</p>
        <p>${invoice.provider.email}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Job ID</th>
          <th>Method</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Service Payment</td>
          <td>${invoice.job_id.substring(0, 8)}...</td>
          <td>${invoice.payment.payment_method}</td>
          <td style="text-align: right;">${formattedAmount}</td>
        </tr>
        <tr class="total-row">
          <td colspan="3">Total</td>
          <td style="text-align: right;">${formattedAmount}</td>
        </tr>
      </tbody>
    </table>

    <p>
      <strong>Status:</strong>
      <span class="status status-${invoice.payment.status}">${invoice.payment.status}</span>
    </p>
    <p style="margin-top: 8px; font-size: 14px; color: #666;">
      <strong>Transaction ID:</strong> ${invoice.payment.transaction_id || "N/A"}<br>
      <strong>Gateway:</strong> ${invoice.payment.gateway}<br>
      <strong>Paid:</strong> ${paidDate}
    </p>

    <div class="footer">
      <p>This is a computer-generated invoice. No signature required.</p>
      <p>${invoice.platform.name} | ${invoice.platform.email}</p>
    </div>
  </div>
</body>
</html>`;
  }

  private generateInvoiceNumber(paymentId: string, createdAt: string): string {
    const date = new Date(createdAt);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const shortId = paymentId.replace(/-/g, "").substring(0, 8).toUpperCase();
    return `INV-${year}${month}-${shortId}`;
  }
}
