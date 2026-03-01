import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, CreateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')

export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  order: Order;

  @Column()
  chairType: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  unitPrice: number;

  @Column({ nullable: true })
  material: string;

  @Column({ nullable: true })
  color: string;

  @Column({ nullable: true })
  finish: string;

  @Column({ nullable: true })
  upholstery: string;

  @Column({ nullable: true })
  dimensions: string;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;
  
}
