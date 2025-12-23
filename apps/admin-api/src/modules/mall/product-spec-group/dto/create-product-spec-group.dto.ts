import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateProductSpecGroupDto {
  @IsInt()
  @Min(1)
  productId: number;

  @IsString()
  @IsNotEmpty({ message: '规格组名称不能为空' })
  name: string;

  @IsInt()
  sort?: number = 0;
}
