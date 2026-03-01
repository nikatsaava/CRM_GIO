import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('deleted_item_history')
export class DeletedItemHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (order) => order.deletedItemsHistory, { onDelete: 'CASCADE' })
  order: Order;

  @Column()
  chairType: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  paidPortion: number;

  @CreateDateColumn()
  deletedAt: Date;
}
