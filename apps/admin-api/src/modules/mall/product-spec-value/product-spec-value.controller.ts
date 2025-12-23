import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ProductSpecValueService } from './product-spec-value.service';
import { CreateProductSpecValueDto } from './dto/create-product-spec-value.dto';
import { UpdateProductSpecValueDto } from './dto/update-product-spec-value.dto';

@Controller('mall/product-spec-value')
export class ProductSpecValueController {
  constructor(private readonly productSpecValueService: ProductSpecValueService) {}

  @Post()
  create(@Body() createProductSpecValueDto: CreateProductSpecValueDto) {
    return this.productSpecValueService.create(createProductSpecValueDto);
  }

  @Post('bulk')
  bulkCreate(@Body() createProductSpecValueDtos: CreateProductSpecValueDto[]) {
    return this.productSpecValueService.bulkCreate(createProductSpecValueDtos);
  }

  @Get()
  findAll(@Query('specGroupId') specGroupId?: string) {
    return this.productSpecValueService.findAll(
      specGroupId ? +specGroupId : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productSpecValueService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductSpecValueDto: UpdateProductSpecValueDto,
  ) {
    return this.productSpecValueService.update(+id, updateProductSpecValueDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productSpecValueService.remove(+id);
  }

  @Delete('bulk')
  bulkRemove(@Body() body: { ids: number[] }) {
    return this.productSpecValueService.bulkRemove(body.ids);
  }
}
