import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '@/common/database/database.module';
import { ProviderDocument } from '../entities/provider-document.entity';
import { UploadDocumentDto } from '../dto/upload-document.dto';

@Injectable()
export class ProviderDocumentRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async create(data: UploadDocumentDto): Promise<ProviderDocument> {
    const query = `
      INSERT INTO provider_documents (
        provider_id, document_type, document_url, document_name, document_number, expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      data.provider_id,
      data.document_type,
      data.document_url,
      data.document_name,
      data.document_number || null,
      data.expiry_date || null  // Frontend sends expiry_date, store in expires_at
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async findById(documentId: string): Promise<ProviderDocument | null> {
    const query = `SELECT * FROM provider_documents WHERE id = $1`;
    const result = await this.pool.query(query, [documentId]);
    return result.rows[0] || null;
  }

  async findByProvider(providerId: string): Promise<ProviderDocument[]> {
    const query = `
      SELECT * FROM provider_documents
      WHERE provider_id = $1
      ORDER BY created_at DESC
    `;
    const result = await this.pool.query(query, [providerId]);
    return result.rows;
  }

  async verify(documentId: string, verified: boolean, verifiedBy?: string): Promise<ProviderDocument> {
    const query = `
      UPDATE provider_documents
      SET verified = $1,
          verified_by = $2,
          verified_at = NOW()
      WHERE id = $3
      RETURNING *
    `;

    const result = await this.pool.query(query, [verified, verifiedBy, documentId]);
    return result.rows[0];
  }

  async getPendingDocuments(limit: number = 20): Promise<ProviderDocument[]> {
    const query = `
      SELECT pd.*, p.business_name
      FROM provider_documents pd
      JOIN providers p ON pd.provider_id = p.id
      WHERE pd.verified = false
      ORDER BY pd.created_at ASC
      LIMIT $1
    `;
    const result = await this.pool.query(query, [limit]);
    return result.rows;
  }

  async getExpiringDocuments(days: number = 30): Promise<ProviderDocument[]> {
    const query = `
      SELECT pd.*, p.business_name, p.user_id
      FROM provider_documents pd
      JOIN providers p ON pd.provider_id = p.id
      WHERE pd.expires_at IS NOT NULL
        AND pd.expires_at > NOW()
        AND pd.expires_at <= NOW() + INTERVAL '1 day' * $1
        AND pd.verified = true
      ORDER BY pd.expires_at ASC
    `;
    const result = await this.pool.query(query, [days]);
    return result.rows;
  }

  async delete(documentId: string): Promise<void> {
    const query = `DELETE FROM provider_documents WHERE id = $1`;
    await this.pool.query(query, [documentId]);
  }
}
