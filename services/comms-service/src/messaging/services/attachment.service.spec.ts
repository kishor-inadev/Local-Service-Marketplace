import { Test, TestingModule } from "@nestjs/testing";
import { AttachmentService } from "./attachment.service";
import { AttachmentRepository } from "../repositories/attachment.repository";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { NotFoundException } from "../../common/exceptions/http.exceptions";

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

const mockAttachment = {
  id: "att-uuid-1",
  message_id: "msg-uuid-1",
  file_url: "https://cdn.example.com/file.pdf",
  file_name: "file.pdf",
  file_size: 1024,
  mime_type: "application/pdf",
  created_at: new Date(),
};

const mockAttachmentRepo = {
  createAttachment: jest.fn(),
  getAttachmentById: jest.fn(),
  getAttachmentsByMessageId: jest.fn(),
  deleteAttachment: jest.fn(),
};

describe("AttachmentService", () => {
  let service: AttachmentService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttachmentService,
        { provide: WINSTON_MODULE_NEST_PROVIDER, useValue: mockLogger },
        { provide: AttachmentRepository, useValue: mockAttachmentRepo },
      ],
    }).compile();

    service = module.get<AttachmentService>(AttachmentService);
  });

  describe("createAttachment", () => {
    it("should create and return a new attachment", async () => {
      mockAttachmentRepo.createAttachment.mockResolvedValue(mockAttachment);
      const result = await service.createAttachment(
        "msg-uuid-1",
        "https://cdn.example.com/file.pdf",
        "file.pdf",
        1024,
        "application/pdf",
      );
      expect(result).toEqual(mockAttachment);
      expect(mockAttachmentRepo.createAttachment).toHaveBeenCalledWith(
        "msg-uuid-1",
        "https://cdn.example.com/file.pdf",
        "file.pdf",
        1024,
        "application/pdf",
      );
    });

    it("should create attachment with only required fields", async () => {
      const minimal = {
        ...mockAttachment,
        file_name: undefined,
        file_size: undefined,
        mime_type: undefined,
      };
      mockAttachmentRepo.createAttachment.mockResolvedValue(minimal);
      const result = await service.createAttachment(
        "msg-uuid-1",
        "https://cdn.example.com/file.pdf",
      );
      expect(result).toBeDefined();
    });
  });

  describe("getAttachmentById", () => {
    it("should return attachment when found", async () => {
      mockAttachmentRepo.getAttachmentById.mockResolvedValue(mockAttachment);
      const result = await service.getAttachmentById("att-uuid-1");
      expect(result).toEqual(mockAttachment);
    });

    it("should throw NotFoundException when not found", async () => {
      mockAttachmentRepo.getAttachmentById.mockResolvedValue(null);
      await expect(service.getAttachmentById("missing")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("getAttachmentsByMessageId", () => {
    it("should return attachments for a message", async () => {
      mockAttachmentRepo.getAttachmentsByMessageId.mockResolvedValue([
        mockAttachment,
      ]);
      const result = await service.getAttachmentsByMessageId("msg-uuid-1");
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockAttachment);
    });

    it("should return empty array when no attachments", async () => {
      mockAttachmentRepo.getAttachmentsByMessageId.mockResolvedValue([]);
      const result = await service.getAttachmentsByMessageId("msg-uuid-1");
      expect(result).toHaveLength(0);
    });
  });

  describe("deleteAttachment", () => {
    it("should delete an existing attachment", async () => {
      mockAttachmentRepo.getAttachmentById.mockResolvedValue(mockAttachment);
      mockAttachmentRepo.deleteAttachment.mockResolvedValue(undefined);
      await service.deleteAttachment("att-uuid-1");
      expect(mockAttachmentRepo.deleteAttachment).toHaveBeenCalledWith(
        "att-uuid-1",
      );
    });

    it("should throw NotFoundException when attachment not found", async () => {
      mockAttachmentRepo.getAttachmentById.mockResolvedValue(null);
      await expect(service.deleteAttachment("missing")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
