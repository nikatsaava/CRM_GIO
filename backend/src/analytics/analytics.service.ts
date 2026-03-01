import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Order } from '../orders/order.entity';
import { OrderItem } from '../orders/order-item.entity';
import { Client } from '../clients/client.entity';


function getTotal(order: Order): number {
  if (order.manualTotal !== null && order.manualTotal !== undefined) {
    return Number(order.manualTotal);
  }
  const fromItems = (order.items || []).reduce(
    (s, it) => s + Number(it.unitPrice) * Number(it.quantity),
    0,
  );
  return fromItems;
}

function getPaid(order: Order): number {
  return Number(order.paidAmount);
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private itemRepo: Repository<OrderItem>,
    @InjectRepository(Client) private clientRepo: Repository<Client>,
  ) {}

  async getSummary(range?: { from?: string; to?: string }) {
    const { from, to } = range || {};
  
    const where: any = {};
  
    if (from && to) {
      where.deliveryDeadline = Between(from, to);
    } else if (from) {
      where.deliveryDeadline = MoreThanOrEqual(from);
    } else if (to) {
      where.deliveryDeadline = LessThanOrEqual(to);
    }
  
  
    const orders = await this.orderRepo.find({
      relations: ['client', 'items', 'deletedItemsHistory'],
      where: Object.keys(where).length ? where : undefined,
    });
  
    const clients = await this.clientRepo.find();
  

    const delivered = orders.filter((o) => o.status === 'delivered');
    const active = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status));

    const totalRevenue = delivered.reduce((s, o) => s + getTotal(o), 0);
    const totalCost = delivered.reduce(
      (s, o) => s + Number(o.materialCost) + Number(o.additionalExpenses), 0,
    );
    const totalProfit = totalRevenue - totalCost;
    const totalDebt = active
      .filter((o) => getPaid(o) < getTotal(o))
      .reduce((s, o) => s + (getTotal(o) - getPaid(o)), 0);

    // Chair type stats
    const chairStats: Record<string, { count: number; revenue: number }> = {};
    orders.forEach((o) => {
      (o.items || []).forEach((it) => {
        if (!chairStats[it.chairType]) chairStats[it.chairType] = { count: 0, revenue: 0 };
        chairStats[it.chairType].count += Number(it.quantity);
        chairStats[it.chairType].revenue += Number(it.unitPrice) * Number(it.quantity);
      });
    });

    // Material stats
    const matStats: Record<string, number> = {};
    orders.forEach((o) => {
      (o.items || []).forEach((it) => {
        matStats[it.material] = (matStats[it.material] || 0) + Number(it.quantity);
      });
    });

    // Status counts
    const statusCounts: Record<string, number> = {};
    orders.forEach((o) => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });

    // Debt orders
    const debtOrders = active
      .filter((o) => getPaid(o) < getTotal(o))
      .map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        clientName: o.client ? `${o.client.firstName} ${o.client.lastName}` : '',
        debt: getTotal(o) - getPaid(o),
      }))
      .sort((a, b) => b.debt - a.debt)
      .slice(0, 10);

    // Top clients
    const clientTotals = clients.map((c) => {
      const cOrders = orders.filter((o) => o.clientId === c.id);
      return {
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        phone: c.phone,
        companyName: c.companyName,
        ordersCount: cOrders.length,
        totalSpent: cOrders.reduce((s, o) => s + getTotal(o), 0),
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

    // Monthly stats (last 6 months)
    const monthlyMap: Record<string, { orders: number; revenue: number; profit: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = { orders: 0, revenue: 0, profit: 0 };
    }
    orders.forEach((o) => {
      // o.deliveryDeadline хранится как строка 'YYYY-MM-DD'
      const key = (o.deliveryDeadline || '').slice(0, 7); // 'YYYY-MM'
    
      if (monthlyMap[key]) {
        monthlyMap[key].orders += 1;
        const t = getTotal(o);
        const cost = Number(o.materialCost) + Number(o.additionalExpenses);
        monthlyMap[key].revenue += t;
        monthlyMap[key].profit += t - cost;
      }
    });

    return {
      summary: {
        revenue: totalRevenue,
        costs: totalCost,
        profit: totalProfit,
        totalDebt,          
        totalOrders: orders.length,
        activeOrders: active.length,
        totalClients: clients.length,
      },
      chairStats: Object.entries(chairStats)
        .map(([type, s]) => ({ type, ...s }))
        .sort((a, b) => b.count - a.count),
      materialStats: Object.entries(matStats)
        .map(([material, count]) => ({ material, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
      statusCounts,
      debtOrders,
      topClients: clientTotals,
      monthlyStats: Object.entries(monthlyMap).map(([month, s]) => ({ month, ...s })),
    };
  }
}
