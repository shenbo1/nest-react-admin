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
import { MemberAddressService } from './member-address.service';
import { CreateMemberAddressDto } from './dto/create-member-address.dto';
import { UpdateMemberAddressDto } from './dto/update-member-address.dto';
import { QueryMemberAddressDto } from './dto/query-member-address.dto';
import { RequirePermissions, CurrentUser } from '@/common/decorators';

@ApiTags('会员收货地址')
@Controller('mall/member-address')
export class MemberAddressController {
  constructor(private readonly memberAddressService: MemberAddressService) {}

  @ApiOperation({ summary: '创建收货地址' })
  @RequirePermissions('member:address:add')
  @Post()
  create(
    @Body() dto: CreateMemberAddressDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.memberAddressService.create(dto, userId);
  }

  @ApiOperation({ summary: '分页查询收货地址' })
  @RequirePermissions('member:address:list')
  @Get()
  findAll(@Query() query: QueryMemberAddressDto) {
    return this.memberAddressService.findAll(query);
  }

  @ApiOperation({ summary: '获取会员的所有收货地址' })
  @RequirePermissions('member:address:list')
  @Get('member/:memberId')
  findByMemberId(@Param('memberId', ParseIntPipe) memberId: number) {
    return this.memberAddressService.findByMemberId(memberId);
  }

  @ApiOperation({ summary: '获取收货地址详情' })
  @RequirePermissions('member:address:query')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.memberAddressService.findOne(id);
  }

  @ApiOperation({ summary: '更新收货地址' })
  @RequirePermissions('member:address:edit')
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMemberAddressDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.memberAddressService.update(id, dto, userId);
  }

  @ApiOperation({ summary: '删除收货地址' })
  @RequirePermissions('member:address:remove')
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.memberAddressService.remove(id, userId);
  }

  @ApiOperation({ summary: '设置默认地址' })
  @RequirePermissions('member:address:edit')
  @Put(':id/set-default')
  setDefault(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.memberAddressService.setDefault(id, userId);
  }
}
