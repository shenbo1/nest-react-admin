import {
  IsDecimal,
  IsInt,
  IsJSON,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductSkuDto {
  @IsInt()
  @Min(1)
  productId: number;

  @IsString()
  @IsNotEmpty({ message: 'SKU编码不能为空' })
  skuCode: string;

  @IsJSON({ message: '规格组合必须是JSON格式' })
  specCombination: object;

  @IsDecimal()
  price: number;

  @IsInt()
  @Min(0)
  stock: number;

  @IsOptional()
  @IsDecimal()
  weight?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sales?: number;

  @IsOptional()
  @IsJSON()
  images?: string[];
}
