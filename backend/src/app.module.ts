import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { OrdersModule } from './orders/orders.module';
import { AnalyticsModule } from './analytics/analytics.module';

// ConfigModule is a lightweight way to read .env
// We use TypeORM with DATABASE_URL directly for Supabase compatibility

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      autoLoadEntities: true,
      synchronize: true,
      logging: false,
      extra: {
        max: 5,
      },
    }),

    AuthModule,
    ClientsModule,
    OrdersModule,
    AnalyticsModule,
  ],
})
export class AppModule {}