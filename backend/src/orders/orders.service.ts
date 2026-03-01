import { Parser } from 'json2csv';
import {
  Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { DeletedItemHistory } from './deleted-item-history.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';


// // Auto-generate next order number
// async function nextOrderNumber(repo: Repository<Order>): Promise<string> {
//   const last = await repo.find({ order: { createdAt: 'DESC' }, take: 1 });
//   if (!last.length) return 'ORD-0001';
//   const match = last[0].orderNumber.match(/(\d+)$/);
//   const num = match ? parseInt(match[1]) + 1 : 1;
//   return 'ORD-' + String(num).padStart(4, '0');
// }

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private itemRepo: Repository<OrderItem>,
    @InjectRepository(DeletedItemHistory) private histRepo: Repository<DeletedItemHistory>,
    
  ) {}

  private async generateOrderNumber(): Promise<string> {
    const result = await this.orderRepo
      .createQueryBuilder('order')
      .withDeleted()
      .select(
        "MAX(CAST(REGEXP_REPLACE(order.orderNumber, '\\D', '', 'g') AS INTEGER))",
        'max',
      )
      .getRawOne();
  
    const next = (result?.max || 0) + 1;
  
    return `ORD-${next}`;
  }

  async exportOrders(): Promise<string> {
    const orders = await this.orderRepo.find({
      relations: ['client', 'items'],
      withDeleted: true,
      order: { createdAt: 'DESC' },
    });
  
    const flatOrders = orders.map(order => {
      const clientName =
        order.client?.companyName ||
        [order.client?.firstName, order.client?.lastName]
          .filter(Boolean)
          .join(' ') ||
        '—';
  
      const phone = order.client?.phone || '';
  
      const total =
        order.manualTotal != null
          ? +order.manualTotal
          : (order.items || []).reduce(
              (s, i) => s + (+i.unitPrice) * (+i.quantity),
              0
            );
  
      const totalQuantity = (order.items || []).reduce(
        (s, i) => s + (+i.quantity),
        0
      );
  
      const itemsText = (order.items || [])
        .map(i => `${i.chairType} (${i.quantity})`)
        .join(', ');
  
      const paid = +order.paidAmount || 0;
      const debt = total - paid;
  
      return {
        orderNumber: order.orderNumber,
        clientName,
        phone,
        items: itemsText,
        totalQuantity,
        status: order.status,
        total,
        paid,
        debt,
        deliveryDeadline: order.deliveryDeadline ?? '',
        deleted: order.deletedAt ? 'YES' : 'NO',
      };
    });
  
    const parser = new Parser({
      fields: [
        { label: 'ნომერი', value: 'orderNumber' },
        { label: 'კლიენტი', value: 'clientName' },
        { label: 'ტელეფონი', value: 'phone' },
        { label: 'შეკვეთილი', value: 'items' },
        { label: 'რაოდენობა', value: 'totalQuantity' },
        { label: 'სტატუსი', value: 'status' },
        { label: 'ჯამი', value: 'total' },
        { label: 'გადახდილი', value: 'paid' },
        { label: 'დავალიანება', value: 'debt' },
        { label: 'ვადა', value: 'deliveryDeadline' },
        { label: 'წაშლილი', value: 'deleted' },
      ],
    });
  
    return parser.parse(flatOrders);
  }

 
  async findAll(
    search?: string,
    status?: string,
    page = 1,
    limit = 20,
    deleted?: string, // 👈 добавляем
  )
   {
    
    const qb = this.orderRepo
    
      .createQueryBuilder('order')
      // .withDeleted()
      .leftJoinAndSelect('order.client', 'client') // только клиент!
      .orderBy('order.deletedAt', 'ASC', 'NULLS FIRST')
      .addOrderBy('order.deliveryDeadline', 'ASC');

// 👇 Обработка фильтра удалённых заказов
if (deleted === 'only') {
  qb.withDeleted().andWhere('order.deletedAt IS NOT NULL');
} else if (deleted === 'all') {
  qb.withDeleted();
} else {
  // active (по умолчанию)
  qb.andWhere('order.deletedAt IS NULL');
}
      
    if (status && status !== 'all') {
      qb.andWhere('order.status = :status', { status });
    }
  
    if (search) {
      qb.andWhere(
        `(client.firstName ILIKE :s OR client.lastName ILIKE :s 
          OR client.phone ILIKE :s 
          OR client.companyName ILIKE :s 
          OR order.orderNumber ILIKE :s)`,
        { s: `%${search}%` },
      );
    }
  
    const [orders, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .cache(10000)
      .getManyAndCount();
  
    return { orders, total, page, limit };
  }


  async findOne(id: string) {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['client', 'items', 'deletedItemsHistory'],
    });
    if (!order) throw new NotFoundException('შეკვეთა ვერ მოიძებნა');
    return order;
  }
  async findByClient(clientId: string) {
    return this.orderRepo.find({
      where: { clientId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: CreateOrderDto) {
    const orderNumber = await this.generateOrderNumber();
    const order = this.orderRepo.create({
      orderNumber,
      clientId: dto.clientId,
      orderType: dto.orderType,
      status: dto.status,
      deliveryDeadline: dto.deliveryDeadline,
      paymentDeadline: dto.paymentDeadline || null,
      paidAmount: dto.paidAmount || 0,
      materialCost: dto.materialCost || 0,
      additionalExpenses: dto.additionalExpenses || 0,
      manualTotal: dto.manualTotal ?? null,
      additionalNotes: dto.additionalNotes || null,
      source: dto.source || null,
    });

    const saved = await this.orderRepo.save(order);

    // Save items
    if (dto.items?.length) {
      const items = dto.items.map((i) =>
        this.itemRepo.create({ ...i, order: saved }),
      );
      await this.itemRepo.save(items);
    }

    // Save history
    if (dto.deletedItemsHistory?.length) {
      const hist = dto.deletedItemsHistory.map((h) =>
        this.histRepo.create({ ...h, order: saved }),
      );
      await this.histRepo.save(hist);
    }

    return this.findOne(saved.id);
  }
  
  
  // async getByClient(clientId: string) {
  //   return this.prisma.order.findMany({
  //     where: {
  //       clientId: clientId,
  //     },
  //     orderBy: {
  //       createdAt: 'desc',
  //     },
  //     include: {
  //       items: true,
  //     },
  //   });
  // }

  async update(id: string, dto: UpdateOrderDto) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('შეკვეთა ვერ მოიძებნა');

    // Update scalar fields
    Object.assign(order, {
      orderType:         dto.orderType         ?? order.orderType,
      status:            dto.status            ?? order.status,
      deliveryDeadline:  dto.deliveryDeadline  ?? order.deliveryDeadline,
      paymentDeadline:   dto.paymentDeadline   !== undefined ? dto.paymentDeadline : order.paymentDeadline,
      paidAmount:        dto.paidAmount        ?? order.paidAmount,
      materialCost:      dto.materialCost      ?? order.materialCost,
      additionalExpenses:dto.additionalExpenses ?? order.additionalExpenses,
      manualTotal:       dto.manualTotal       !== undefined ? dto.manualTotal : order.manualTotal,
      additionalNotes:   dto.additionalNotes   !== undefined ? dto.additionalNotes : order.additionalNotes,
      source:            dto.source            !== undefined ? dto.source : order.source,
    });
    await this.orderRepo.save(order);

    // Replace items if provided
    if (dto.items !== undefined) {
      await this.itemRepo.delete({ order: { id } });
      if (dto.items.length) {
        const items = dto.items.map((i) => this.itemRepo.create({ ...i, order }));
        await this.itemRepo.save(items);
      }
    }

    // Replace history if provided
    if (dto.deletedItemsHistory !== undefined) {
      await this.histRepo.delete({ order: { id } });
      if (dto.deletedItemsHistory.length) {
        const hist = dto.deletedItemsHistory.map((h) => this.histRepo.create({ ...h, order }));
        await this.histRepo.save(hist);
      }
    }

    return this.findOne(id);
  }



  async remove(id: string) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('შეკვეთა ვერ მოიძებნა');
  
    await this.orderRepo.softDelete(id);
  
    return { message: 'შეკვეთა წაიშალა' };
  }
  
  async restore(id: string) {
    return this.orderRepo.restore(id);
  }

  async hardDelete(id: string) {
    const order = await this.orderRepo.findOne({ where: { id }, withDeleted: true });
    if (!order) throw new NotFoundException('Order not found');
  
    await this.orderRepo.remove(order);
    return { success: true };
  }


}
