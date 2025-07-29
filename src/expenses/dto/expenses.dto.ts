import { IsNotEmpty, IsString, IsNumber, IsOptional, IsArray, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

enum SplitMethod {
  equal = 'equal',
  custom = 'custom',
}

export class CreateExpenseDto {
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  paidBy: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  splitBetween: string[];

  @IsEnum(SplitMethod)
  @IsNotEmpty()
  splitMethod: SplitMethod;

  @IsOptional()
  @IsArray()
  customSplits?: { userId: string; amount: number }[];

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsOptional()
  @IsString()
  memo?: string;

  @IsOptional()
  @IsString()
  itineraryItemId?: string;
}

export class UpdateExpenseDto {
  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  paidBy?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  splitBetween?: string[];

  @IsOptional()
  @IsEnum(SplitMethod)
  splitMethod?: SplitMethod;

  @IsOptional()
  @IsArray()
  customSplits?: { userId: string; amount: number }[];

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  memo?: string;

  @IsOptional()
  @IsString()
  itineraryItemId?: string;
}

export class CreateBudgetDto {
  @IsOptional()
  @IsNumber()
  totalBudget?: number;

  @IsOptional()
  @IsArray()
  categoryBudgets?: { categoryId: string; amount: number }[];
}

export class UpdateBudgetDto {
  @IsOptional()
  @IsNumber()
  totalBudget?: number;

  @IsOptional()
  @IsArray()
  categoryBudgets?: { categoryId: string; amount: number }[];
}