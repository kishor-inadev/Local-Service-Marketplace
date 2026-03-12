import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

export const DATABASE_POOL = 'DATABASE_POOL';

const databasePoolFactory = {
  provide: DATABASE_POOL,
  useFactory: async (configService: ConfigService) => {
    const pool = new Pool({
      host: configService.get<string>('DATABASE_HOST'),
      port: configService.get<number>('DATABASE_PORT'),
      user: configService.get<string>('DATABASE_USER'),
      password: configService.get<string>('DATABASE_PASSWORD'),
      database: configService.get<string>('DATABASE_NAME'),
      // Optimized connection pool settings
      max: parseInt(configService.get<string>('DB_POOL_MAX', '30')), // Max connections (increased for high load)
      min: parseInt(configService.get<string>('DB_POOL_MIN', '5')), // Minimum idle connections
      idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
      connectionTimeoutMillis: 3000, // Wait max 3 seconds for connection
      maxUses: 7500, // Close and reopen connection after 7500 queries (prevents memory leaks)
      allowExitOnIdle: false, // Keep pool alive
    });

    // Test connection
    try {
      await pool.query('SELECT NOW()');
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
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
