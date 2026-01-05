import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MemberInvoiceService } from './member-invoice.service';
import { CreateMemberInvoiceDto } from './dto/create-member-invoice.dto';
import { UpdateMemberInvoiceDto } from './dto/update-member-invoice.dto';
import { QueryMemberInvoiceDto } from './dto/query-member-invoice.dto';
import { RequirePermissions, CurrentUser } from '@/common/decorators';

@ApiTags('会员发票信息')
@Controller('mall/member-invoice')
export class MemberInvoiceController {
  constructor(private readonly memberInvoiceService: MemberInvoiceService) {}

  @ApiOperation({ summary: '创建发票信息' })
  @RequirePermissions('member:invoice:add')
  @Post()
  create(
    @Body() dto: CreateMemberInvoiceDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.memberInvoiceService.create(dto, userId);
  }

  @ApiOperation({ summary: '分页查询发票信息' })
  @RequirePermissions('member:invoice:list')
  @Get()
  findAll(@Query() query: QueryMemberInvoiceDto) {
    return this.memberInvoiceService.findAll(query);
  }

  @ApiOperation({ summary: '获取会员的所有发票信息' })
  @RequirePermissions('member:invoice:list')
  @Get('member/:memberId')
  findByMemberId(@Param('memberId', ParseIntPipe) memberId: number) {
    return this.memberInvoiceService.findByMemberId(memberId);
  }

  @ApiOperation({ summary: '获取发票信息详情' })
  @RequirePermissions('member:invoice:query')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.memberInvoiceService.findOne(id);
  }

  @ApiOperation({ summary: '更新发票信息' })
  @RequirePermissions('member:invoice:edit')
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMemberInvoiceDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.memberInvoiceService.update(id, dto, userId);
  }

  @ApiOperation({ summary: '删除发票信息' })
  @RequirePermissions('member:invoice:remove')
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.memberInvoiceService.remove(id, userId);
  }

  @ApiOperation({ summary: '设置默认发票信息' })
  @RequirePermissions('member:invoice:edit')
  @Put(':id/set-default')
  setDefault(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.memberInvoiceService.setDefault(id, userId);
  }
}
