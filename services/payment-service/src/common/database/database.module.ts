import { Module, Global, Logger, OnModuleDestroy, Inject } from "@nestjs/common";
import { Pool } from "pg";

const logger = new Logger("DatabaseModule");

const databasePoolFactory = async () => {
	const connectionString = process.env.DATABASE_URL;
	const sslEnabled = process.env.DATABASE_SSL === "true";
	const poolMax = parseInt(process.env.DATABASE_POOL_MAX || process.env.DB_POOL_MAX || "20", 10);
	const idleTimeoutMs = parseInt(process.env.DATABASE_IDLE_TIMEOUT_MS || "30000", 10);
	const connectionTimeoutMs = parseInt(process.env.DATABASE_CONNECTION_TIMEOUT_MS || "10000", 10);
	const queryTimeoutMs = parseInt(process.env.DATABASE_QUERY_TIMEOUT_MS || "30000", 10);
	const pool = new Pool({
		...(connectionString ?
			{ connectionString }
		:	{
				host: process.env.DATABASE_HOST || "localhost",
				port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
				database: process.env.DATABASE_NAME || "marketplace",
				user: process.env.DATABASE_USER || "postgres",
				password: process.env.DATABASE_PASSWORD,
			}),
		ssl: sslEnabled || connectionString?.includes("sslmode=require") ? { rejectUnauthorized: false } : false,
		max: poolMax,
		idleTimeoutMillis: idleTimeoutMs,
		connectionTimeoutMillis: connectionTimeoutMs,
		query_timeout: queryTimeoutMs,
		keepAlive: true,
	});

	// Test the connection
	try {
		const client = await pool.connect();
		logger.log("Database connected successfully");
		client.release();
	} catch (error) {
		logger.error("Database connection failed:", error);
		throw error;
	}

	// Handle runtime pool errors (e.g. lost connections) to prevent crashes
	pool.on('error', (err) => {
		logger.error('Unexpected database pool error', err);
	});

	return pool;
};

@Global()
@Module({ providers: [{ provide: "DATABASE_POOL", useFactory: databasePoolFactory }], exports: ["DATABASE_POOL"] })
export class DatabaseModule implements OnModuleDestroy {
	constructor(@Inject("DATABASE_POOL") private readonly pool: Pool) {}

	async onModuleDestroy() {
		await this.pool.end();
		logger.log("Database pool closed");
	}
}
