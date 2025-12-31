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

@Controller('mall/sku')
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
  findAll(
    @Query('productId') productId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('lowStock') lowStock?: string,
  ) {
    return this.productSkuService.findAll({
      productId: productId ? +productId : undefined,
      page: page ? +page : 1,
      pageSize: pageSize ? +pageSize : 20,
      keyword,
      lowStock: lowStock === 'true',
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productSkuService.findOne(+id);
  }

  @Get(':id/stock-logs')
  getStockLogs(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.productSkuService.getStockLogs(
      +id,
      page ? +page : 1,
      pageSize ? +pageSize : 20,
    );
  }

  @Get('low-stock/list')
  getLowStockSkus() {
    return this.productSkuService.getLowStockSkus();
  }

  @Post(':id/stock')
  updateStock(
    @Param('id') id: string,
    @Body() body: {
      quantity: number;
      type: 'in' | 'out' | 'order' | 'refund' | 'manual';
      orderId?: string;
      remark?: string;
    },
  ) {
    return this.productSkuService.updateStock(
      +id,
      body.quantity,
      body.type,
      body.orderId,
      body.remark,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductSkuDto: UpdateProductSkuDto,
  ) {
    return this.productSkuService.update(+id, updateProductSkuDto);
  }

  @Delete('bulk')
  bulkRemove(@Body() body: { ids: number[] }) {
    return this.productSkuService.bulkRemove(body.ids);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productSkuService.remove(+id);
  }
}