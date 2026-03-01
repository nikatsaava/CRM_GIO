import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  OneToMany, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Client } from '../clients/client.entity';
import { OrderItem } from './order-item.entity';
import { DeletedItemHistory } from './deleted-item-history.entity';
import { DeleteDateColumn, Index} from 'typeorm';



@Entity('orders')
@Index(['orderNumber'])
@Index(['status'])
@Index(['deliveryDeadline'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderNumber: string;

  @ManyToOne(() => Client, (client) => client.orders, { onDelete: 'SET NULL', nullable: true })
  client: Client;

  @Column({ nullable: true })
  clientId: string;

  @Column({ type: 'varchar', default: 'our_design' })
  orderType: 'our_design' | 'custom_design';

  @Column({
    type: 'varchar',
    default: 'awaiting_confirmation',
  })
  status: string;

  @Column({ type: 'date' })
  deliveryDeadline: string;

  @Column({ type: 'date', nullable: true })
  paymentDeadline: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  materialCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  additionalExpenses: number;

  // If set, overrides computed total from items
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  manualTotal: number;

  @Column({ nullable: true })
  additionalNotes: string;

  @Column({ nullable: true })
  source: string;
  
  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
  })
  items: OrderItem[];

  @OneToMany(() => DeletedItemHistory, (h) => h.order, { cascade: true })
  deletedItemsHistory: DeletedItemHistory[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
deletedAt?: Date;
}
