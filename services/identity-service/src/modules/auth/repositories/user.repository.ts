import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { Pool } from "pg";
import { DATABASE_POOL } from "@/common/database/database.module";
import { User } from "../entities/user.entity";
import { AdminCreateUserDto } from "../../user/dto/admin-create-user.dto";

@Injectable()
export class UserRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async create(
    email: string,
    passwordHash: string,
    role: string = "customer",
    phone?: string,
    name?: string,
    timezone?: string,
    language?: string,
  ): Promise<User> {
    const query = `
      INSERT INTO users (email, password_hash, role, phone, name, timezone, language, email_verified, phone_verified, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, false, false, 'active')
      RETURNING *
    `;
    const result = await this.pool.query(query, [
      email,
      passwordHash,
      role,
      phone || null,
      name || null,
      timezone || "UTC", // ✅ NEW
      language || "en", // ✅ NEW
    ]);
    return result.rows[0];
  }

  async findById(id: string): Promise<User | null> {
    const query = "SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL";
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = "SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL";
    const result = await this.pool.query(query, [email]);
    return result.rows[0] || null;
  }

  async findByPhone(phone: string): Promise<User | null> {
    const query = "SELECT * FROM users WHERE phone = $1 AND deleted_at IS NULL";
    const result = await this.pool.query(query, [phone]);
    return result.rows[0] || null;
  }

  async updatePassword(userId: string, passwordHash: string): Promise<User | null> {
    const query = `
      UPDATE users 
      SET password_hash = $1, updated_at = NOW() 
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING *
    `;
    const result = await this.pool.query(query, [passwordHash, userId]);
    return result.rows[0] || null;
  }

  async verifyEmail(userId: string): Promise<void> {
    const query = `
      UPDATE users 
      SET email_verified = true, updated_at = NOW() 
      WHERE id = $1
    `;
    await this.pool.query(query, [userId]);
  }

  async updateStatus(userId: string, status: string): Promise<User | null> {
    const query = `
      UPDATE users 
      SET status = $1, updated_at = NOW() 
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING *
    `;
    const result = await this.pool.query(query, [status, userId]);
    return result.rows[0] || null;
  }

  async update(
    id: string,
    name?: string,
    email?: string,
    phone?: string,
    profilePictureUrl?: string,
    timezone?: string,
    language?: string,
  ): Promise<User> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }

    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }

    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(phone);
    }

    if (profilePictureUrl !== undefined) {
      updates.push(`profile_picture_url = $${paramCount++}`);
      values.push(profilePictureUrl);
    }

    if (timezone !== undefined) {
      updates.push(`timezone = $${paramCount++}`);
      values.push(timezone);
    }

    if (language !== undefined) {
      updates.push(`language = $${paramCount++}`);
      values.push(language);
    }

    if (updates.length === 0) {
      const user = await this.findById(id);
      if (!user) {
        throw new NotFoundException("User not found");
      }
      return user;
    }

    updates.push(`updated_at = now()`);
    values.push(id);

    const query = `
      UPDATE users
      SET ${updates.join(", ")}
      WHERE id = $${paramCount} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    if (result.rows.length === 0) {
      throw new NotFoundException("User not found or update failed");
    }

    return result.rows[0];
  }

  // ✅ NEW METHODS for new fields
  async updateProfilePicture(userId: string, url: string): Promise<User> {
    const query = `
      UPDATE users 
      SET profile_picture_url = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const result = await this.pool.query(query, [url, userId]);
    return result.rows[0];
  }

  async updateTimezone(userId: string, timezone: string): Promise<User> {
    const query = `
      UPDATE users 
      SET timezone = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const result = await this.pool.query(query, [timezone, userId]);
    return result.rows[0];
  }

  async updateLanguage(userId: string, language: string): Promise<User> {
    const query = `
      UPDATE users 
      SET language = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const result = await this.pool.query(query, [language, userId]);
    return result.rows[0];
  }

  async verifyPhone(userId: string): Promise<User> {
    const query = `
      UPDATE users 
      SET phone_verified = true, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows[0];
  }

  async updateLastLogin(userId: string): Promise<void> {
    const query = `
      UPDATE users 
      SET last_login_at = NOW()
      WHERE id = $1
    `;
    await this.pool.query(query, [userId]);
  }

  // ✅ NEW: Advanced query methods
  async getUsersByLanguage(
    language: string,
    limit: number = 50,
  ): Promise<User[]> {
    const query = `
      SELECT 
        id, email, name, phone, role, email_verified, phone_verified,
        profile_picture_url, timezone, language, last_login_at,
        status, created_at
      FROM users
      WHERE language = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const result = await this.pool.query(query, [language, limit]);
    return result.rows;
  }

  async getUsersByTimezone(
    timezone: string,
    limit: number = 50,
  ): Promise<User[]> {
    const query = `
      SELECT 
        id, email, name, phone, role, email_verified, phone_verified,
        profile_picture_url, timezone, language, last_login_at,
        status, created_at
      FROM users
      WHERE timezone = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const result = await this.pool.query(query, [timezone, limit]);
    return result.rows;
  }

  async getInactiveUsers(
    days: number = 30,
    limit: number = 100,
  ): Promise<User[]> {
    const query = `
      SELECT 
        id, email, name, phone, role, email_verified,
        profile_picture_url, timezone, language, last_login_at,
        status, created_at
      FROM users
      WHERE last_login_at < NOW() - INTERVAL '1 day' * $1
        AND deleted_at IS NULL
        AND status = 'active'
      ORDER BY last_login_at ASC
      LIMIT $2
    `;
    const result = await this.pool.query(query, [days, limit]);
    return result.rows;
  }

  async getUsersWithoutProfilePicture(limit: number = 50): Promise<User[]> {
    const query = `
      SELECT 
        id, email, name, phone, role, email_verified,
        profile_picture_url, timezone, language, last_login_at,
        status, created_at
      FROM users
      WHERE profile_picture_url IS NULL
        AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT $1
    `;
    const result = await this.pool.query(query, [limit]);
    return result.rows;
  }

  async deleteExpiredVerificationTokens(): Promise<void> {
    // Expire tokens older than 24h via email_verification_tokens table
    await this.pool.query(
      `DELETE FROM email_verification_tokens WHERE expires_at < NOW()`,
    );
  }

  async deleteOldLoginAttempts(olderThanDays: number): Promise<void> {
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    await this.pool.query(
      `DELETE FROM login_attempts WHERE created_at < $1`,
      [cutoff],
    );
  }

  async softDelete(userId: string): Promise<User | null> {
    const query = `
      UPDATE users
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  async restore(userId: string): Promise<User | null> {
    const query = `
      UPDATE users
      SET deleted_at = NULL, updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NOT NULL
      RETURNING *
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  async createByAdminWithHash(
    dto: AdminCreateUserDto,
    passwordHash: string,
  ): Promise<User> {
    const query = `
      INSERT INTO users (
        email, password_hash, role, phone, name,
        email_verified, phone_verified, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, false, $7)
      RETURNING *
    `;
    const result = await this.pool.query(query, [
      dto.email.toLowerCase().trim(),
      passwordHash,
      dto.role || 'customer',
      dto.phone || null,
      dto.name || null,
      dto.emailVerified ?? false,
      (dto as any).status || 'active',
    ]);
    return result.rows[0];
  }
}
