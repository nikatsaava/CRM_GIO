import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany, Index
} from 'typeorm';
import { Order } from '../orders/order.entity';

@Index(['phone'])
@Index(['firstName'])
@Index(['lastName'])
@Entity('clients')

export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  phone: string;

  @Column({ type: 'varchar', default: 'individual' })
  clientType: 'individual' | 'company';

  @Column({ nullable: true })
  companyName: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ default: false })
isDeleted: boolean;

@Column({ type: 'timestamp', nullable: true })
deletedAt: Date | null;

  @OneToMany(() => Order, (order) => order.client)
  orders: Order[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
