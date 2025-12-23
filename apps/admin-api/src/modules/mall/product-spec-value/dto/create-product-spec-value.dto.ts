import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateProductSpecValueDto {
  @IsInt()
  @Min(1)
  specGroupId: number;

  @IsString()
  @IsNotEmpty({ message: '规格值名称不能为空' })
  name: string;

  @IsInt()
  sort?: number = 0;
}
