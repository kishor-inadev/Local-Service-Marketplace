import { Injectable, Inject, BadRequestException, ServiceUnavailableException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";
import { firstValueFrom, retry, timeout, catchError } from "rxjs";
import FormData from "form-data";
import "multer";

export interface FileUploadOptions {
  category: string;
  description?: string;
  title?: string;
  altText?: string;
  visibility?: "public" | "private" | "unlisted";
  linkedEntityType?: string;
  linkedEntityId?: string;
  tags?: string[];
}

export interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  path: string;
  url: string;
  size: number;
  mimeType: string;
  category: string;
  uploadedBy?: string;
  linkedEntityType?: string;
  linkedEntityId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileUploadResponse {
  success: boolean;
  count: number;
  files: UploadedFile[];
}

/**
 * Client for interacting with external file-upload-service
 * This service handles all file uploads to the centralized file storage
 * 
 * Error Handling:
 * - Service unreachable: Returns ServiceUnavailableException
 * - Timeout: Returns ServiceUnavailableException after 3 retries
 * - Invalid response: Returns BadRequestException
 */
@Injectable()
export class FileServiceClient {
  private readonly fileServiceUrl: string;
  private readonly defaultTenantId: string;
  private readonly requestTimeout: number;
  private readonly maxRetries: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    this.fileServiceUrl =
      this.configService.get<string>("FILE_UPLOAD_SERVICE_URL") ||
      "https://your-file-service.vercel.app";
    this.defaultTenantId =
      this.configService.get<string>("DEFAULT_TENANT_ID") || "default";
    this.requestTimeout = this.configService.get<number>("REQUEST_TIMEOUT_MS", 72000); // Default to 72 seconds
    this.maxRetries = 3; // Retry 3 times on failure
  }

  /**
   * Upload a single file to the file service
   * Includes retry logic and proper error handling
   */
  async uploadFile(
    file: Express.Multer.File,
    options: FileUploadOptions,
    userId?: string,
    userRole: string = "user",
  ): Promise<UploadedFile> {
    try {
      const formData = new FormData();

      // Add file
      formData.append("files", file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      // Add metadata
      formData.append("category", options.category);
      if (options.description)
        formData.append("description", options.description);
      if (options.title) formData.append("title", options.title);
      if (options.altText) formData.append("altText", options.altText);
      if (options.visibility)
        formData.append("visibility", options.visibility);
      if (options.linkedEntityType)
        formData.append("linkedEntityType", options.linkedEntityType);
      if (options.linkedEntityId)
        formData.append("linkedEntityId", options.linkedEntityId);
      if (options.tags)
        formData.append("tags", options.tags.join(","));

      // Make request to file service with retry logic
      const response = await firstValueFrom(
        this.httpService.post<FileUploadResponse>(
          `${this.fileServiceUrl}/api/files/upload`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              "X-User-Id": userId || "anonymous",
              "X-User-Role": userRole,
              "X-Tenant-Id": this.defaultTenantId,
            },
            timeout: this.requestTimeout,
          },
        ).pipe(
          retry({
            count: this.maxRetries,
            delay: (error, retryCount) => {
              this.logger.warn(
                `File upload attempt ${retryCount} failed, retrying...`,
                {
                  context: "FileServiceClient",
                  error: error.message,
                  category: options.category,
                  userId,
                }
              );
              // Exponential backoff: 1s, 2s, 4s
              return new Promise(resolve => 
                setTimeout(resolve, Math.pow(2, retryCount - 1) * 1000)
              );
            },
          }),
          catchError((error) => {
            throw error;
          })
        ),
      );

      if (!response.data?.files?.[0]) {
        throw new BadRequestException("File upload failed - invalid response from file service");
      }

      this.logger.info("File uploaded successfully", {
        context: "FileServiceClient",
        fileId: response.data.files[0].id,
        category: options.category,
        userId,
      });

      return response.data.files[0];
    } catch (error) {
      this.logger.error("File upload failed after all retries", {
        context: "FileServiceClient",
        error: error.message,
        stack: error.stack,
        category: options.category,
        fileServiceUrl: this.fileServiceUrl,
      });

      // Handle specific error types
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new ServiceUnavailableException(
          `File upload service is currently unavailable. Please try again later. (Service: ${this.fileServiceUrl})`
        );
      }

      if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
        throw new ServiceUnavailableException(
          'File upload service request timed out. The service may be experiencing high load. Please try again.'
        );
      }

      if (error.response?.status === 413) {
        throw new BadRequestException(
          'File size exceeds maximum allowed size. Please upload a smaller file.'
        );
      }

      if (error.response?.status === 415) {
        throw new BadRequestException(
          'File type not allowed. Please upload a valid file format.'
        );
      }

      if (error.response?.data?.error) {
        throw new BadRequestException(
          `File upload failed: ${error.response.data.error}`
        );
      }

      // Generic fallback error
      throw new ServiceUnavailableException(
        `Unable to upload file at this time. Please try again later. If the problem persists, contact support.`
      );
    }
  }

  /**
   * Upload multiple files to the file service
   * Includes retry logic and proper error handling
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    options: FileUploadOptions,
    userId?: string,
    userRole: string = "user",
  ): Promise<UploadedFile[]> {
    try {
      if (!files || files.length === 0) {
        throw new BadRequestException("No files provided");
      }

      if (files.length > 10) {
        throw new BadRequestException("Maximum 10 files allowed per upload");
      }

      const formData = new FormData();

      // Add all files
      files.forEach((file) => {
        formData.append("files", file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype,
        });
      });

      // Add metadata
      formData.append("category", options.category);
      if (options.description)
        formData.append("description", options.description);
      if (options.title) formData.append("title", options.title);
      if (options.visibility)
        formData.append("visibility", options.visibility);
      if (options.linkedEntityType)
        formData.append("linkedEntityType", options.linkedEntityType);
      if (options.linkedEntityId)
        formData.append("linkedEntityId", options.linkedEntityId);
      if (options.tags)
        formData.append("tags", options.tags.join(","));

      // Make request to file service with retry logic
      const response = await firstValueFrom(
        this.httpService.post<FileUploadResponse>(
          `${this.fileServiceUrl}/api/files/upload`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              "X-User-Id": userId || "anonymous",
              "X-User-Role": userRole,
              "X-Tenant-Id": this.defaultTenantId,
            },
            timeout: this.requestTimeout, // Increased timeout from configuration
          },
        ).pipe(
          retry({
            count: this.maxRetries,
            delay: (error, retryCount) => {
              this.logger.warn(
                `Multiple file upload attempt ${retryCount} failed, retrying...`,
                {
                  context: "FileServiceClient",
                  error: error.message,
                  fileCount: files.length,
                  category: options.category,
                }
              );
              return new Promise(resolve => 
                setTimeout(resolve, Math.pow(2, retryCount - 1) * 1000)
              );
            },
          }),
          catchError((error) => {
            throw error;
          })
        ),
      );

      if (!response.data?.files || response.data.files.length === 0) {
        throw new BadRequestException("File upload failed - invalid response from file service");
      }

      this.logger.info("Multiple files uploaded successfully", {
        context: "FileServiceClient",
        count: response.data.files.length,
        category: options.category,
        userId,
      });

      return response.data.files;
    } catch (error) {
      this.logger.error("Multiple file upload failed after all retries", {
        context: "FileServiceClient",
        error: error.message,
        stack: error.stack,
        fileCount: files.length,
        category: options.category,
        fileServiceUrl: this.fileServiceUrl,
      });

      // Handle specific error types
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new ServiceUnavailableException(
          `File upload service is currently unavailable. Please try again later. (Service: ${this.fileServiceUrl})`
        );
      }

      if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
        throw new ServiceUnavailableException(
          'File upload service request timed out. The service may be experiencing high load. Please try again.'
        );
      }

      if (error.response?.status === 413) {
        throw new BadRequestException(
          'Combined file size exceeds maximum allowed size. Please upload fewer or smaller files.'
        );
      }

      if (error.response?.data?.error) {
        throw new BadRequestException(
          `File upload failed: ${error.response.data.error}`
        );
      }

      // Generic fallback error
      throw new ServiceUnavailableException(
        `Unable to upload files at this time. Please try again later. If the problem persists, contact support.`
      );
    }
  }

  /**
   * Get file metadata by ID
   */
  async getFileById(fileId: string): Promise<UploadedFile> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<UploadedFile>(
          `${this.fileServiceUrl}/api/files/${fileId}`,
          {
            headers: {
              "X-Tenant-Id": this.defaultTenantId,
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error("Failed to get file metadata", {
        context: "FileServiceClient",
        fileId,
        error: error.message,
      });
      throw new BadRequestException("Failed to retrieve file metadata");
    }
  }

  /**
   * Get file download URL
   */
  getFileDownloadUrl(fileId: string): string {
    return `${this.fileServiceUrl}/api/files/${fileId}/download`;
  }

  /**
   * Delete a file (admin only)
   */
  async deleteFile(
    fileId: string,
    adminUserId: string,
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.delete(`${this.fileServiceUrl}/api/files/${fileId}`, {
          headers: {
            "X-User-Id": adminUserId,
            "X-User-Role": "admin",
            "X-Tenant-Id": this.defaultTenantId,
          },
        }),
      );

      this.logger.info("File deleted successfully", {
        context: "FileServiceClient",
        fileId,
        adminUserId,
      });
    } catch (error) {
      this.logger.error("Failed to delete file", {
        context: "FileServiceClient",
        fileId,
        error: error.message,
      });
      throw new BadRequestException("Failed to delete file");
    }
  }

  /**
   * Get files by linked entity
   */
  async getFilesByEntity(
    entityType: string,
    entityId: string,
  ): Promise<UploadedFile[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<{ files: UploadedFile[] }>(
          `${this.fileServiceUrl}/api/files`,
          {
            params: {
              linkedEntityType: entityType,
              linkedEntityId: entityId,
            },
            headers: {
              "X-Tenant-Id": this.defaultTenantId,
            },
          },
        ),
      );

      return response.data.files || [];
    } catch (error) {
      this.logger.error("Failed to get files by entity", {
        context: "FileServiceClient",
        entityType,
        entityId,
        error: error.message,
      });
      return [];
    }
  }
}
