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
import { ProductSpecGroupService } from './product-spec-group.service';
import { CreateProductSpecGroupDto } from './dto/create-product-spec-group.dto';
import { UpdateProductSpecGroupDto } from './dto/update-product-spec-group.dto';

@Controller('mall/spec-group')
export class ProductSpecGroupController {
  constructor(private readonly productSpecGroupService: ProductSpecGroupService) {}

  @Post()
  create(@Body() createProductSpecGroupDto: CreateProductSpecGroupDto) {
    return this.productSpecGroupService.create(createProductSpecGroupDto);
  }

  @Get()
  findAll(@Query('productId') productId?: string) {
    return this.productSpecGroupService.findAll(
      productId ? +productId : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productSpecGroupService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductSpecGroupDto: UpdateProductSpecGroupDto,
  ) {
    return this.productSpecGroupService.update(+id, updateProductSpecGroupDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productSpecGroupService.remove(+id);
  }
}
