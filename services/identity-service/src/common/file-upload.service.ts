import { Injectable, BadRequestException } from '@nestjs/common';
import { extname } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { randomBytes } from 'crypto';

@Injectable()
export class FileUploadService {
  private readonly uploadDir = './uploads';
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  
  // Allowed file types
  private readonly allowedImageTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  private readonly allowedDocumentTypes = ['.pdf', '.jpg', '.jpeg', '.png'];

  constructor() {
    // Ensure upload directories exist
    this.ensureDirectoryExists(`${this.uploadDir}/documents`);
    this.ensureDirectoryExists(`${this.uploadDir}/portfolio`);
    this.ensureDirectoryExists(`${this.uploadDir}/profile-pictures`);
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Validate and save an uploaded file
   */
  async uploadFile(
    file: any,
    category: 'document' | 'portfolio' | 'profile',
    allowedTypes?: string[]
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`
      );
    }

    // Validate file type
    const fileExtension = extname(file.originalname).toLowerCase();
    const validTypes = allowedTypes || this.getAllowedTypes(category);

    if (!validTypes.includes(fileExtension)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${validTypes.join(', ')}`
      );
    }

    // Generate unique filename
    const randomName = randomBytes(16).toString('hex');
    const fileName = `${randomName}${fileExtension}`;
    
    // Determine subdirectory
    const subDir = category === 'document' ? 'documents' : 
                   category === 'portfolio' ? 'portfolio' : 
                   'profile-pictures';

    const filePath = `${this.uploadDir}/${subDir}/${fileName}`;

    // Save file
    writeFileSync(filePath, file.buffer);

    // Return relative URL
    return `/${subDir}/${fileName}`;
  }

  /**
   * Upload multiple files (for portfolio)
   */
  async uploadMultiple(
    files: any[],
    category: 'portfolio',
    maxFiles: number = 10
  ): Promise<string[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    if (files.length > maxFiles) {
      throw new BadRequestException(`Maximum ${maxFiles} files allowed`);
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      const url = await this.uploadFile(file, category);
      uploadedUrls.push(url);
    }

    return uploadedUrls;
  }

  /**
   * Get allowed file types for category
   */
  private getAllowedTypes(category: string): string[] {
    switch (category) {
      case 'document':
        return this.allowedDocumentTypes;
      case 'portfolio':
      case 'profile':
        return this.allowedImageTypes;
      default:
        return this.allowedImageTypes;
    }
  }

  /**
   * Delete a file (for cleanup)
   */
  async deleteFile(fileUrl: string): Promise<void> {
    // TODO: Implement file deletion
    // For now, just a placeholder
    console.log(`Delete file: ${fileUrl}`);
  }
}
