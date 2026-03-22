import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';

const databasePoolFactory = async () => {
  const pool = new Pool({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT, 10) || 5441,
    user: process.env.DATABASE_USER || 'admin_service_user',
    password: process.env.DATABASE_PASSWORD || 'admin_service_password',
    database: process.env.DATABASE_NAME || 'admin_service_db',
    max: 20,
  });

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
