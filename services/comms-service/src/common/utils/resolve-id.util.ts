import { Pool } from "pg";
import { BadRequestException, NotFoundException } from "@nestjs/common";

/**
 * Given an id string that could be either a UUID or a display_id,
 * returns the internal UUID from the specified table.
 *
 * Usage:
 *   const uuid = await resolveId(pool, 'notifications', notificationId);
 */
// SECURITY: table name must be validated against a known whitelist — never pass raw user input
const ALLOWED_TABLES = new Set([
  "users",
  "providers",
  "service_requests",
  "proposals",
  "jobs",
  "payments",
  "reviews",
  "messages",
  "notifications",
  "disputes",
  "refunds",
  "coupons",
  "service_categories",
  "subscriptions",
  "sessions",
  "locations",
  "admin_actions",
  "background_jobs",
  "events",
]);

// Display ID prefix per table — must match the schema trigger functions exactly
const TABLE_PREFIXES: Record<string, string> = {
  users: "USR",
  sessions: "SES",
  providers: "PRV",
  service_categories: "CAT",
  locations: "LOC",
  service_requests: "REQ",
  proposals: "PRP",
  jobs: "JOB",
  payments: "PAY",
  refunds: "RFD",
  reviews: "REV",
  messages: "MSG",
  notifications: "NTF",
  coupons: "CPN",
  disputes: "DSP",
  admin_actions: "ADM",
  events: "EVT",
  background_jobs: "BGJ",
  subscriptions: "SUB",
};

export async function resolveId(
  pool: Pool,
  table: string,
  idOrDisplayId: string,
): Promise<string> {
  if (!ALLOWED_TABLES.has(table)) {
    throw new Error(`resolveId: unknown table '${table}'`);
  }

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idOrDisplayId,
    );

  if (isUuid) {
    return idOrDisplayId;
  }

  // Validate display_id prefix matches the expected table prefix
  const upper = idOrDisplayId.toUpperCase();
  const expectedPrefix = TABLE_PREFIXES[table];
  if (expectedPrefix && !upper.startsWith(expectedPrefix)) {
    throw new BadRequestException(
      `Invalid ID format: expected a ${expectedPrefix}... display ID for ${table} (got '${idOrDisplayId}'). ` +
        `Provide either a UUID or a valid display ID starting with '${expectedPrefix}'.`,
    );
  }

  // lookup by display_id — table name is safe because it passed the whitelist above
  const result = await pool.query(
    `SELECT id FROM ${table} WHERE display_id = $1`,
    [upper],
  );

  if (!result.rows[0]) {
    throw new NotFoundException(
      `${table} with id '${idOrDisplayId}' not found`,
    );
  }

  return result.rows[0].id;
}
