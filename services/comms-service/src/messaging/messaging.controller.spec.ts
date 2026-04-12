import { Test, TestingModule } from "@nestjs/testing";
import { MessagingController } from "./messaging.controller";
import { MessageService } from "./services/message.service";
import { AttachmentService } from "./services/attachment.service";
import { FileServiceClient } from "../common/file-service.client";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import "multer";

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

const mockMessage = {
  id: "msg-uuid-1",
  job_id: "job-uuid-1",
  sender_id: "user-uuid-1",
  message: "Hello",
  read: false,
  created_at: new Date(),
};

const mockAttachment = {
  id: "att-uuid-1",
  message_id: "msg-uuid-1",
  file_url: "https://cdn.example.com/file.pdf",
  file_name: "file.pdf",
};

const mockMessageService = {
  createMessage: jest.fn(),
  getMessageById: jest.fn(),
  getMessagesForJob: jest.fn(),
  getUserConversations: jest.fn(),
  markMessageAsRead: jest.fn(),
};

const mockAttachmentService = {
  createAttachment: jest.fn(),
  getAttachmentById: jest.fn(),
  getAttachmentsByMessageId: jest.fn(),
};

const mockFileServiceClient = {
  uploadFile: jest.fn(),
};

describe("MessagingController", () => {
  let controller: MessagingController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagingController],
      providers: [
        { provide: WINSTON_MODULE_NEST_PROVIDER, useValue: mockLogger },
        { provide: MessageService, useValue: mockMessageService },
        { provide: AttachmentService, useValue: mockAttachmentService },
        { provide: FileServiceClient, useValue: mockFileServiceClient },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MessagingController>(MessagingController);
  });

  describe("createMessage", () => {
    it("should create message and return success response", async () => {
      mockMessageService.createMessage.mockResolvedValue(mockMessage);
      const result = await controller.createMessage(
        { job_id: "job-uuid-1", message: "Hello" },
        { user: { userId: "user-uuid-1" } },
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMessage);
    });
  });

  describe("getMessagesForJob", () => {
    it("should return paginated messages", async () => {
      const paginated = { data: [mockMessage], total: 1, page: 1, limit: 20 };
      mockMessageService.getMessagesForJob.mockResolvedValue(paginated);
      const result = await controller.getMessagesForJob("job-uuid-1", { user: { userId: "user-uuid-1" } }, 1, 20);
      expect(result).toEqual(paginated);
    });
  });

  describe("getConversations", () => {
    it("should return conversations with total count", async () => {
      const convos = [{ job_id: "j-1", last_message: "Hi" }];
      mockMessageService.getUserConversations.mockResolvedValue(convos);
      const result = await controller.getConversations({
        user: { userId: "user-uuid-1" },
      });
      expect(result.data).toEqual(convos);
      expect(result.total).toBe(1);
    });
  });

  describe("createAttachment", () => {
    it("should create attachment and return success response", async () => {
      mockFileServiceClient.uploadFile.mockResolvedValue({
        url: "https://cdn.example.com/file.pdf",
        originalName: "file.pdf",
        size: 1024,
        mimeType: "application/pdf"
      });
      mockAttachmentService.createAttachment.mockResolvedValue(mockAttachment);
      
      const fileMock = { originalname: "file.pdf", buffer: Buffer.from("test"), mimetype: "application/pdf" } as any;
      const reqMock = { user: { userId: "user-uuid-1", role: "user" } };

      const result = await controller.createAttachment(
        { message_id: "msg-uuid-1" } as any,
        fileMock,
        reqMock
      );
      
      expect(result.success).toBe(true);
      expect(result.data.id).toEqual(mockAttachment.id);
    });
  });

  describe("getAttachmentsByMessage", () => {
    it("should return attachments with count", async () => {
      mockAttachmentService.getAttachmentsByMessageId.mockResolvedValue([
        mockAttachment,
      ]);
      const result = await controller.getAttachmentsByMessage("msg-uuid-1");
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe("getAttachment", () => {
    it("should return single attachment", async () => {
      mockAttachmentService.getAttachmentById.mockResolvedValue(mockAttachment);
      mockMessageService.getMessageById.mockResolvedValue(mockMessage);
      const mockReq = { user: { userId: "user-uuid-1", role: "customer" } };
      const result = await controller.getAttachment("att-uuid-1", mockReq as any);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAttachment);
    });
  });

  describe("getMessage", () => {
    it("should return single message", async () => {
      mockMessageService.getMessageById.mockResolvedValue(mockMessage);
      const result = await controller.getMessage("msg-uuid-1", { user: { id: "user-uuid-1" } } as any);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMessage);
    });
  });

  describe("markAsRead", () => {
    it("should mark message as read", async () => {
      const readMsg = { ...mockMessage, read: true };
      mockMessageService.markMessageAsRead.mockResolvedValue(readMsg);
      const result = await controller.markAsRead("msg-uuid-1", { user: { id: "user-uuid-1" } } as any);
      expect(result.success).toBe(true);
      expect(result.data.read).toBe(true);
    });
  });
});
