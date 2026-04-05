import { Pool } from "pg";
import { NotFoundException } from "@nestjs/common";

/**
 * Given an id string that could be either a UUID or a display_id,
 * returns the internal UUID from the specified table.
 *
 * Usage:
 *   const uuid = await resolveId(pool, 'payments', paymentId);
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

export async function resolveId(pool: Pool, table: string, idOrDisplayId: string): Promise<string> {
	if (!ALLOWED_TABLES.has(table)) {
		throw new Error(`resolveId: unknown table '${table}'`);
	}

	const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrDisplayId);

	if (isUuid) {
		return idOrDisplayId;
	}

	// lookup by display_id — table name is safe because it passed the whitelist above
	const result = await pool.query(`SELECT id FROM ${table} WHERE display_id = $1`, [idOrDisplayId.toUpperCase()]);

	if (!result.rows[0]) {
		throw new NotFoundException(`${table} with id '${idOrDisplayId}' not found`);
	}

	return result.rows[0].id;
}
