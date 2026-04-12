import {
  Injectable,
  Inject,
  LoggerService,
  OnModuleInit,
} from "@nestjs/common";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { KafkaService } from "../../kafka/kafka.service";
import { NotificationRepository } from "../repositories/notification.repository";

@Injectable()
export class EventConsumerService implements OnModuleInit {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly kafkaService: KafkaService,
    private readonly notificationRepository: NotificationRepository,
  ) { }

  async onModuleInit() {
    if (this.kafkaService.isKafkaEnabled()) {
      this.logger.log("Starting Kafka event consumer", "EventConsumerService");
      await this.kafkaService.startConsuming(this.handleEvent.bind(this));
    }
  }

  private async handleEvent(event: any): Promise<void> {
    this.logger.log(
      `Processing event: ${event.eventType}`,
      "EventConsumerService",
    );

    try {
      switch (event.eventType) {
        case "request_created":
          await this.handleRequestCreated(event);
          break;
        case "proposal_submitted":
          await this.handleProposalSubmitted(event);
          break;
        case "proposal_accepted":
          await this.handleProposalAccepted(event);
          break;
        case "proposal_rejected":
          await this.handleProposalRejected(event);
          break;
        case "job_created":
          await this.handleJobCreated(event);
          break;
        case "job_started":
          await this.handleJobStarted(event);
          break;
        case "job_completed":
          await this.handleJobCompleted(event);
          break;
        case "job_cancelled":
          await this.handleJobCancelled(event);
          break;
        case "payment_completed":
          await this.handlePaymentCompleted(event);
          break;
        case "review_submitted":
          await this.handleReviewSubmitted(event);
          break;
        default:
          this.logger.log(
            `Unhandled event type: ${event.eventType}`,
            "EventConsumerService",
          );
      }
    } catch (error: any) {
      this.logger.error(
        `Error handling event ${event.eventType}: ${error.message}`,
        error.stack,
        "EventConsumerService",
      );
    }
  }

  private async handleRequestCreated(event: any): Promise<void> {
    const ref = event.data.requestDisplayId || event.data.displayId || "";
    const refSuffix = ref ? ` (Ref: ${ref})` : "";
    await this.notificationRepository.createNotification(
      event.data.userId,
      "request",
      `Your service request has been created successfully${refSuffix}`,
    );
  }

  private async handleProposalSubmitted(event: any): Promise<void> {
    // Notify request creator (customer) about new proposal
    const requestRef = event.data.requestDisplayId || "";
    const proposalRef =
      event.data.proposalDisplayId || event.data.displayId || "";
    const refParts = [
      requestRef && `Request: ${requestRef}`,
      proposalRef && `Proposal: ${proposalRef}`,
    ].filter(Boolean);
    const refSuffix = refParts.length ? ` (${refParts.join(", ")})` : "";
    // customerId is the customer who owns the request; fall back to userId for legacy events
    const recipientId = event.data.customerId || event.data.userId;
    await this.notificationRepository.createNotification(
      recipientId,
      "proposal",
      `A provider has submitted a proposal for your request${refSuffix}`,
    );
  }

  private async handleProposalAccepted(event: any): Promise<void> {
    // Notify provider about accepted proposal
    const jobRef = event.data.jobDisplayId || "";
    const proposalRef =
      event.data.proposalDisplayId || event.data.displayId || "";
    const refParts = [
      proposalRef && `Proposal: ${proposalRef}`,
      jobRef && `Job: ${jobRef}`,
    ].filter(Boolean);
    const refSuffix = refParts.length ? ` (${refParts.join(", ")})` : "";
    await this.notificationRepository.createNotification(
      event.data.providerId,
      "proposal",
      `Your proposal has been accepted${refSuffix}`,
    );
  }

  private async handleProposalRejected(event: any): Promise<void> {
    // Notify provider about rejected proposal
    const requestRef = event.data.requestDisplayId || "";
    const proposalRef =
      event.data.proposalDisplayId || event.data.displayId || "";
    const refParts = [
      proposalRef && `Proposal: ${proposalRef}`,
      requestRef && `Request: ${requestRef}`,
    ].filter(Boolean);
    const refSuffix = refParts.length ? ` (${refParts.join(", ")})` : "";
    await this.notificationRepository.createNotification(
      event.data.providerId,
      "proposal",
      `Your proposal was not selected for this request${refSuffix}`,
    );
  }

  private async handleJobCreated(event: any): Promise<void> {
    // Notify provider about job creation
    const ref = event.data.jobDisplayId || event.data.displayId || "";
    const refSuffix = ref ? ` (Ref: ${ref})` : "";
    await this.notificationRepository.createNotification(
      event.data.providerId,
      "job",
      `A new job has been assigned to you${refSuffix}`,
    );
  }

  private async handleJobStarted(event: any): Promise<void> {
    // Notify customer that job has started
    const ref = event.data.jobDisplayId || event.data.displayId || "";
    const refSuffix = ref ? ` (Ref: ${ref})` : "";
    await this.notificationRepository.createNotification(
      event.data.userId, // Customer ID
      "job",
      `The provider has started working on your job${refSuffix}`,
    );
  }

  private async handleJobCompleted(event: any): Promise<void> {
    // Notify customer that job is completed
    const ref = event.data.jobDisplayId || event.data.displayId || "";
    const refSuffix = ref ? ` (Ref: ${ref})` : "";
    await this.notificationRepository.createNotification(
      event.data.userId, // Customer ID
      "job",
      `Your job has been completed${refSuffix}`,
    );
  }

  private async handleJobCancelled(event: any): Promise<void> {
    // Notify both provider and customer about cancellation
    const ref = event.data.jobDisplayId || event.data.displayId || "";
    const refSuffix = ref ? ` (Ref: ${ref})` : "";
    await this.notificationRepository.createNotification(
      event.data.providerId,
      "job",
      `A job assigned to you has been cancelled${refSuffix}`,
    );
    // Also notify the customer who placed the request
    if (event.data.userId) {
      await this.notificationRepository.createNotification(
        event.data.userId,
        "job",
        `Your job has been cancelled${refSuffix}`,
      );
    }
  }

  private async handlePaymentCompleted(event: any): Promise<void> {
    // Notify about successful payment
    const ref = event.data.paymentDisplayId || event.data.displayId || "";
    const refSuffix = ref ? ` (Ref: ${ref})` : "";
    await this.notificationRepository.createNotification(
      event.data.userId, // Customer ID
      "payment",
      `Payment of ${event.data.amount} ${event.data.currency} completed successfully${refSuffix}`,
    );
  }

  private async handleReviewSubmitted(event: any): Promise<void> {
    // Notify provider that a review was submitted for their service
    if (!event.data.providerId) return;
    const ref = event.data.reviewDisplayId || event.data.displayId || "";
    const refSuffix = ref ? ` (Ref: ${ref})` : "";
    await this.notificationRepository.createNotification(
      event.data.providerId,
      "review",
      `A customer has submitted a review for your service${refSuffix}`,
    );
  }
}
