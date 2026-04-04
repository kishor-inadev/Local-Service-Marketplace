import { Module, Global, Logger } from '@nestjs/common';
import { Pool } from 'pg';

const logger = new Logger('DatabaseModule');

const databasePoolFactory = async () => {
  const connectionString = process.env.DATABASE_URL;
	const sslEnabled = process.env.DATABASE_SSL === "true";
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
		max: 20,
		idleTimeoutMillis: 30000,
		connectionTimeoutMillis: 2000,
	});

  // Test the connection
  try {
    const client = await pool.connect();
    logger.log('Database connected successfully');
    client.release();
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }

  return pool;
};

@Global()
@Module({
  providers: [
    {
      provide: 'DATABASE_POOL',
      useFactory: databasePoolFactory,
    },
  ],
  exports: ['DATABASE_POOL'],
})
export class DatabaseModule {}
