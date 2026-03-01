import {
  IsString, IsOptional, IsNumber, IsArray,
  ValidateNested, IsIn, IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemDto, DeletedItemHistoryDto } from './create-order.dto';

export class UpdateOrderDto {
  @IsOptional()
  @IsIn(['our_design', 'custom_design'])
  orderType?: 'our_design' | 'custom_design';

  @IsOptional()
  @IsIn(['awaiting_confirmation', 'confirmed', 'in_production', 'ready', 'delivered', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsDateString()
  deliveryDeadline?: string;

  @IsOptional()
  @IsDateString()
  paymentDeadline?: string;

  @IsOptional() @IsNumber() paidAmount?: number;
  @IsOptional() @IsNumber() materialCost?: number;
  @IsOptional() @IsNumber() additionalExpenses?: number;
  @IsOptional() @IsNumber() manualTotal?: number;
  @IsOptional() @IsString() additionalNotes?: string;
  @IsOptional() @IsString() source?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items?: CreateOrderItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeletedItemHistoryDto)
  deletedItemsHistory?: DeletedItemHistoryDto[];
}
