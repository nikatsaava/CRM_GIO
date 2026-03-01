import {
  IsString, IsOptional, IsNumber, IsArray,
  ValidateNested, IsIn, IsNotEmpty, IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @IsString()
  @IsNotEmpty()
  chairType: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsOptional() @IsString() material?: string;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsString() finish?: string;
  @IsOptional() @IsString() upholstery?: string;
  @IsOptional() @IsString() dimensions?: string;
  @IsOptional() @IsString() notes?: string;
}

export class DeletedItemHistoryDto {
  @IsString() chairType: string;
  @IsNumber() quantity: number;
  @IsNumber() unitPrice: number;
  @IsNumber() totalPrice: number;
  @IsNumber() paidPortion: number;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsIn(['our_design', 'custom_design'])
  orderType: 'our_design' | 'custom_design';

  @IsIn(['awaiting_confirmation', 'confirmed', 'in_production', 'ready', 'delivered', 'cancelled'])
  status: string;

  @IsDateString()
  deliveryDeadline: string;

  @IsOptional()
  @IsDateString()
  paymentDeadline?: string;

  @IsNumber()
  paidAmount: number;

  @IsNumber()
  materialCost: number;

  @IsNumber()
  additionalExpenses: number;

  @IsOptional()
  @IsNumber()
  manualTotal?: number;

  @IsOptional() @IsString() additionalNotes?: string;
  @IsOptional() @IsString() source?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeletedItemHistoryDto)
  deletedItemsHistory?: DeletedItemHistoryDto[];
}
