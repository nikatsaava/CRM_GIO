import 'dotenv/config';
import 'reflect-metadata';

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User } from './auth/user.entity';
import { Client } from './clients/client.entity';
import { Order } from './orders/order.entity';
import { OrderItem } from './orders/order-item.entity';
import { DeletedItemHistory } from './orders/deleted-item-history.entity';

async function run() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('supabase')
      ? { rejectUnauthorized: false }
      : false,
    entities: [User, Client, Order, OrderItem, DeletedItemHistory],
    synchronize: true, // MVP: создаст таблицы если их нет
  });

  await ds.initialize();

  const userRepo = ds.getRepository(User);

  const email = process.env.ADMIN_EMAIL || 'admin@tale.ge';
  const password = process.env.ADMIN_PASSWORD || 'tale2024!';

  const existing = await userRepo.findOne({ where: { email } });

  if (existing) {
    console.log(`ℹ️ Admin already exists: ${email}`);
    await ds.destroy();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = userRepo.create({
    email,
    passwordHash,
    role: 'admin',
  });

  await userRepo.save(admin);

  console.log(`✅ Admin created: ${email}`);
  console.log(`✅ Password (from env): ${password}`);

  await ds.destroy();
}

run().catch(async (e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});