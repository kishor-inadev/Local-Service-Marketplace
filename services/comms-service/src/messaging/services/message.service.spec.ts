import { Test, TestingModule } from "@nestjs/testing";
import { MessageService } from "./message.service";
import { MessageRepository } from "../repositories/message.repository";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { NotFoundException } from "../../common/exceptions/http.exceptions";

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

const mockMessage = {
  id: "msg-uuid-1",
  job_id: "job-uuid-1",
  sender_id: "user-uuid-1",
  message: "Hello",
  read: false,
  created_at: new Date(),
};

const mockMessageRepo = {
  createMessage: jest.fn(),
  getMessageById: jest.fn(),
  getMessagesForJob: jest.fn(),
  getUserConversations: jest.fn(),
  markAsRead: jest.fn(),
  deleteMessage: jest.fn(),
};

describe("MessageService", () => {
  let service: MessageService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        { provide: WINSTON_MODULE_NEST_PROVIDER, useValue: mockLogger },
        { provide: MessageRepository, useValue: mockMessageRepo },
      ],
    }).compile();

    service = module.get<MessageService>(MessageService);
  });

  describe("createMessage", () => {
    it("should create and return a new message", async () => {
      mockMessageRepo.createMessage.mockResolvedValue(mockMessage);
      const result = await service.createMessage(
        "job-uuid-1",
        "user-uuid-1",
        "Hello",
      );
      expect(result).toEqual(mockMessage);
      expect(mockMessageRepo.createMessage).toHaveBeenCalledWith(
        "job-uuid-1",
        "user-uuid-1",
        "Hello",
      );
    });
  });

  describe("getMessageById", () => {
    it("should return a message when found", async () => {
      mockMessageRepo.getMessageById.mockResolvedValue(mockMessage);
      const result = await service.getMessageById("msg-uuid-1");
      expect(result).toEqual(mockMessage);
    });

    it("should throw NotFoundException when message not found", async () => {
      mockMessageRepo.getMessageById.mockResolvedValue(null);
      await expect(service.getMessageById("missing-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("getMessagesForJob", () => {
    it("should return paginated messages", async () => {
      const paginated = { data: [mockMessage], total: 1, page: 1, limit: 20 };
      mockMessageRepo.getMessagesForJob.mockResolvedValue(paginated);
      const result = await service.getMessagesForJob("job-uuid-1", { userId: "user-uuid-1", role: "admin" }, 1, 20);
      expect(result).toEqual(paginated);
      expect(mockMessageRepo.getMessagesForJob).toHaveBeenCalledWith(
        "job-uuid-1",
        1,
        20,
      );
    });

    it("should use default page and limit values", async () => {
      const paginated = { data: [], total: 0, page: 1, limit: 20 };
      mockMessageRepo.getMessagesForJob.mockResolvedValue(paginated);
      await service.getMessagesForJob("job-uuid-1", { userId: "user-uuid-1", role: "admin" });
      expect(mockMessageRepo.getMessagesForJob).toHaveBeenCalledWith(
        "job-uuid-1",
        1,
        20,
      );
    });
  });

  describe("getUserConversations", () => {
    it("should return conversations for user", async () => {
      const conversations = [{ job_id: "job-1", last_message: "Hi" }];
      mockMessageRepo.getUserConversations.mockResolvedValue(conversations);
      const result = await service.getUserConversations("user-uuid-1");
      expect(result).toEqual(conversations);
    });
  });

  describe("markMessageAsRead", () => {
    it("should mark message as read", async () => {
      const readMsg = { ...mockMessage, read: true };
      mockMessageRepo.getMessageById.mockResolvedValue(mockMessage);
      mockMessageRepo.markAsRead.mockResolvedValue(readMsg);
      const result = await service.markMessageAsRead("msg-uuid-1");
      expect(result.read).toBe(true);
    });

    it("should throw NotFoundException when message not found", async () => {
      mockMessageRepo.getMessageById.mockResolvedValue(null);
      await expect(service.markMessageAsRead("missing")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("deleteMessage", () => {
    it("should delete an existing message", async () => {
      mockMessageRepo.getMessageById.mockResolvedValue(mockMessage);
      mockMessageRepo.deleteMessage.mockResolvedValue(undefined);
      await service.deleteMessage("msg-uuid-1");
      expect(mockMessageRepo.deleteMessage).toHaveBeenCalledWith("msg-uuid-1");
    });

    it("should throw NotFoundException when message not found", async () => {
      mockMessageRepo.getMessageById.mockResolvedValue(null);
      await expect(service.deleteMessage("missing")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
