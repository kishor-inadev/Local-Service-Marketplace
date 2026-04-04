import { Module, Global, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

const logger = new Logger('DatabaseModule');

export const DATABASE_POOL = 'DATABASE_POOL';

const databasePoolFactory = {
  provide: DATABASE_POOL,
  useFactory: async (configService: ConfigService) => {
    const connectionString = configService.get<string>("DATABASE_URL");
		const sslEnabled = configService.get<string>("DATABASE_SSL") === "true";
    const pool = new Pool({
			...(connectionString ?
				{ connectionString }
			:	{
					host: configService.get<string>("DATABASE_HOST"),
					port: configService.get<number>("DATABASE_PORT"),
					user: configService.get<string>("DATABASE_USER"),
					password: configService.get<string>("DATABASE_PASSWORD"),
					database: configService.get<string>("DATABASE_NAME"),
				}),
			ssl: sslEnabled || connectionString?.includes("sslmode=require") ? { rejectUnauthorized: false } : false,
			max: 20,
			idleTimeoutMillis: 30000,
			connectionTimeoutMillis: 2000,
		});

    // Test connection
    try {
      await pool.query('SELECT NOW()');
      logger.log('Database connected successfully');
    } catch (error) {
      logger.error('Database connection failed:', error);
      throw error;
    }

    return pool;
  },
  inject: [ConfigService],
};

@Global()
@Module({
  providers: [databasePoolFactory],
  exports: [DATABASE_POOL],
})
export class DatabaseModule {}
