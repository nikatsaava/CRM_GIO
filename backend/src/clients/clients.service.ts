import {
  Injectable, NotFoundException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Client } from './client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client) private clientRepo: Repository<Client>,
  ) {}

  async findAll(search?: string, deleted?: 'active' | 'deleted' | 'all') {
    let baseWhere: any = {};
  
    // 🔹 фильтр по удалённости
    if (deleted === 'deleted') {
      baseWhere.isDeleted = true;
    } else if (deleted === 'active') {
      baseWhere.isDeleted = false;
    }
    // если 'all' — ничего не добавляем
  
    if (search) {
      return this.clientRepo.find({
        where: [
          { ...baseWhere, firstName: ILike(`%${search}%`) },
          { ...baseWhere, lastName: ILike(`%${search}%`) },
          { ...baseWhere, phone: ILike(`%${search}%`) },
          { ...baseWhere, companyName: ILike(`%${search}%`) },
        ],
        relations: ['orders'],
        order: { createdAt: 'DESC' },
      });
    }
  
    return this.clientRepo.find({
      where: baseWhere,
      relations: ['orders'],
      order:
        deleted === 'deleted'
          ? { deletedAt: 'DESC' }
          : { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const client = await this.clientRepo.findOne({
      where: { id },
      relations: ['orders', 'orders.items'],
    });
    if (!client) throw new NotFoundException('კლიენტი ვერ მოიძებნა');
    return client;
  }

  async create(dto: CreateClientDto) {
    const existing = await this.clientRepo.findOne({ where: { phone: dto.phone } });
    if (existing) throw new ConflictException('ამ ტელეფონით კლიენტი უკვე არსებობს');
    const client = this.clientRepo.create(dto);
    return this.clientRepo.save(client);
  }

  async update(id: string, dto: UpdateClientDto) {
    const client = await this.clientRepo.findOne({ where: { id } });
    if (!client) throw new NotFoundException('კლიენტი ვერ მოიძებნა');
    if (dto.phone && dto.phone !== client.phone) {
      const existing = await this.clientRepo.findOne({ where: { phone: dto.phone } });
      if (existing) throw new ConflictException('ამ ტელეფონით კლიენტი უკვე არსებობს');
    }
    Object.assign(client, dto);
    return this.clientRepo.save(client);
  }

async remove(id: string) {
  const client = await this.clientRepo.findOne({ where: { id }, relations: ['orders'] });
  if (!client) throw new NotFoundException('კლიენტი ვერ მოიძებნა');

  client.isDeleted = true;
  client.deletedAt = new Date();
  await this.clientRepo.save(client);

  return { message: 'კლიენტი დროებით წაიშალა' };
}

async restore(id: string) {
  const client = await this.clientRepo.findOne({ where: { id }, relations: ['orders'] });
  if (!client) throw new NotFoundException('კლიენტი ვერ მოიძებნა');

  client.isDeleted = false;
  client.deletedAt = null;
  await this.clientRepo.save(client);

  return { message: 'კლიენტი დროებით აღდგა' };
}
async hardDelete(id: string) {
  const client = await this.clientRepo.findOne({ where: { id } });
  if (!client) throw new NotFoundException('კლიენტი ვერ მოიძებნა');
  await this.clientRepo.remove(client);
  return { message: 'კლიენტი სამუდამოდ წაიშალა' };
}
}

