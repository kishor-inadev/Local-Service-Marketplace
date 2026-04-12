import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { Pool } from "pg";
import { DATABASE_POOL } from "@/common/database/database.module";
import { User } from "../entities/user.entity";
import { AdminCreateUserDto } from "../dto/admin-create-user.dto";
import { resolveId } from "@/common/utils/resolve-id.util";
import {
  AdminUserListQueryDto,
  AdminUserSortBy,
} from "../dto/admin-user-list-query.dto";

@Injectable()
export class UserRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  private getSortColumn(sortBy?: AdminUserSortBy): string {
    switch (sortBy) {
      case AdminUserSortBy.EMAIL:
        return "email";
      case AdminUserSortBy.NAME:
        return "name";
      case AdminUserSortBy.ROLE:
        return "role";
      case AdminUserSortBy.LAST_LOGIN_AT:
        return "last_login_at";
      case AdminUserSortBy.CREATED_AT:
      default:
        return "created_at";
    }
  }

  async findById(id: string): Promise<User | null> {
    id = await resolveId(this.pool, "users", id);
    // Excludes password_hash — use findByEmail for auth lookups that need it
    const query = `
      SELECT id, display_id, email, name, phone, role, role_id, status, email_verified, profile_picture_url,
             timezone, language, created_at, updated_at, last_login_at, deleted_at
      FROM users WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = "SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL";
    const result = await this.pool.query(query, [email]);
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
      // No updates, just return current user
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

  async findAllForAdmin(
    queryDto: AdminUserListQueryDto,
  ): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const page = queryDto.page ?? 1;
    const limit = queryDto.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = ["deleted_at IS NULL"];
    const values: unknown[] = [];

    if (queryDto.search) {
      values.push(`%${queryDto.search}%`);
      conditions.push(
        `(email ILIKE $${values.length} OR name ILIKE $${values.length})`,
      );
    }

    if (queryDto.role) {
      values.push(queryDto.role);
      conditions.push(`role = $${values.length}`);
    }

    if (queryDto.status) {
      values.push(queryDto.status);
      conditions.push(`status = $${values.length}`);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;
    const sortColumn = this.getSortColumn(queryDto.sortBy);
    const sortOrder =
      queryDto.sortOrder?.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const query = `
      SELECT id, display_id, email, name, phone, role, role_id, status, email_verified, profile_picture_url,
             timezone, language, created_at, updated_at, last_login_at, deleted_at
      FROM users
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder} NULLS LAST, id ${sortOrder}
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    const countQuery = `SELECT COUNT(*)::int AS total FROM users ${whereClause}`;

    const [result, countResult] = await Promise.all([
      this.pool.query(query, [...values, limit, offset]),
      this.pool.query(countQuery, values),
    ]);

    return { data: result.rows, total: countResult.rows[0].total, page, limit };
  }

  async createByAdminWithHash(
    dto: AdminCreateUserDto,
    passwordHash: string,
  ): Promise<User> {
    const query = `
      INSERT INTO users (email, name, phone, password_hash, role, role_id, email_verified, timezone, language, status)
      VALUES (
        $1,
        $2,
        NULLIF($3, ''),
        $4,
        $5,
        (SELECT id FROM roles WHERE name = $5),
        $6,
        COALESCE(NULLIF($7, ''), 'UTC'),
        COALESCE(NULLIF($8, ''), 'en'),
        $9
      )
      RETURNING *
    `;

    const values = [
      dto.email.toLowerCase().trim(),
      dto.name?.trim() || null,
      dto.phone || null,
      passwordHash,
      dto.role,
      dto.emailVerified ?? false,
      dto.timezone ?? "UTC",
      dto.language ?? "en",
      dto.status ?? "active",
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async updateStatus(
    userId: string,
    status: "active" | "suspended",
  ): Promise<User | null> {
    userId = await resolveId(this.pool, "users", userId);
    const query = `
      UPDATE users
      SET status = $1, updated_at = now()
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await this.pool.query(query, [status, userId]);
    return result.rows[0] || null;
  }

  async updatePassword(
    userId: string,
    passwordHash: string,
  ): Promise<User | null> {
    userId = await resolveId(this.pool, "users", userId);
    const query = `
      UPDATE users
      SET password_hash = $1, updated_at = now()
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await this.pool.query(query, [passwordHash, userId]);
    return result.rows[0] || null;
  }

  async softDelete(userId: string): Promise<User | null> {
    userId = await resolveId(this.pool, "users", userId);
    const query = `
      UPDATE users
      SET status = 'deleted', deleted_at = now(), updated_at = now()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await this.pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  async restore(userId: string): Promise<User | null> {
    userId = await resolveId(this.pool, "users", userId);
    const query = `
      UPDATE users
      SET status = 'active', deleted_at = NULL, updated_at = now()
      WHERE id = $1 AND deleted_at IS NOT NULL
      RETURNING *
    `;

    const result = await this.pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  async getAdminUserStats(): Promise<{
    total: number;
    byStatus: { active: number; suspended: number };
    byRole: { customer: number; provider: number; admin: number };
  }> {
    const query = `
      SELECT
        COUNT(*) FILTER (WHERE deleted_at IS NULL) AS total,
        COUNT(*) FILTER (WHERE status = 'active' AND deleted_at IS NULL) AS active,
        COUNT(*) FILTER (WHERE status = 'suspended' AND deleted_at IS NULL) AS suspended,
        COUNT(*) FILTER (WHERE role = 'customer' AND deleted_at IS NULL) AS customers,
        COUNT(*) FILTER (WHERE role = 'provider' AND deleted_at IS NULL) AS providers,
        COUNT(*) FILTER (WHERE role = 'admin' AND deleted_at IS NULL) AS admins
      FROM users
    `;

    const result = await this.pool.query(query);
    const row = result.rows[0];

    return {
      total: parseInt(row.total, 10) || 0,
      byStatus: {
        active: parseInt(row.active, 10) || 0,
        suspended: parseInt(row.suspended, 10) || 0,
      },
      byRole: {
        customer: parseInt(row.customers, 10) || 0,
        provider: parseInt(row.providers, 10) || 0,
        admin: parseInt(row.admins, 10) || 0,
      },
    };
  }
}
