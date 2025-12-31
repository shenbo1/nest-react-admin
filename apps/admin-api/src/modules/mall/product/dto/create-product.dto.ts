import { IsString, IsOptional, IsInt, IsEnum, IsNumber, IsArray, MaxLength, MinLength, Min, IsNotEmpty } from 'class-validator';
import { ProductStatus } from '@prisma/client';

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty({ message: '商品编码不能为空' })
  @MaxLength(50)
  code: string;

  @IsInt()
  @IsNotEmpty({ message: '商品分类不能为空' })
  categoryId: number;

  @IsOptional()
  @IsString()
  content?: string;

  @IsString()
  @IsNotEmpty({ message: '商品主图不能为空' })
  mainImage: string;

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsNotEmpty({ message: '原价不能为空' })
  originalPrice: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsNotEmpty({ message: '现价不能为空' })
  defaultPrice: number;

  @IsInt()
  @Min(0)
  @IsNotEmpty({ message: '库存不能为空' })
  defaultStock: number;

  @IsInt()
  @Min(0)
  @IsNotEmpty({ message: '销量不能为空' })
  sales: number;

  @IsString()
  @IsNotEmpty({ message: '单位不能为空' })
  @MaxLength(20)
  unit: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsNotEmpty({ message: '重量不能为空' })
  defaultWeight: number;

  @IsOptional()
  specs?: any;

  @IsOptional()
  @IsInt()
  sort?: number;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}
