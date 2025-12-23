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
import { ProductSkuService } from './product-sku.service';
import { CreateProductSkuDto } from './dto/create-product-sku.dto';
import { UpdateProductSkuDto } from './dto/update-product-sku.dto';

@Controller('mall/product-sku')
export class ProductSkuController {
  constructor(private readonly productSkuService: ProductSkuService) {}

  @Post()
  create(@Body() createProductSkuDto: CreateProductSkuDto) {
    return this.productSkuService.create(createProductSkuDto);
  }

  @Post('bulk')
  bulkCreate(@Body() createProductSkuDtos: CreateProductSkuDto[]) {
    return this.productSkuService.bulkCreate(createProductSkuDtos);
  }

  @Get()
  findAll(@Query('productId') productId?: string) {
    return this.productSkuService.findAll(productId ? +productId : undefined);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productSkuService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductSkuDto: UpdateProductSkuDto,
  ) {
    return this.productSkuService.update(+id, updateProductSkuDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productSkuService.remove(+id);
  }

  @Delete('bulk')
  bulkRemove(@Body() body: { ids: number[] }) {
    return this.productSkuService.bulkRemove(body.ids);
  }
}
