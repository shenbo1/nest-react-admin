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
import { MemberLevelService } from './member-level.service';
import { CreateMemberLevelDto } from './dto/create-member-level.dto';
import { UpdateMemberLevelDto } from './dto/update-member-level.dto';
import { QueryMemberLevelDto } from './dto/query-member-level.dto';
import { RequirePermissions } from '@/common/decorators';
import { ClsService } from 'nestjs-cls';

@Controller('mall/member-level')
export class MemberLevelController {
  constructor(
    private readonly memberLevelService: MemberLevelService,
    private readonly cls: ClsService,
  ) {}

  /**
   * 创建会员等级
   */
  @Post()
  @RequirePermissions('member:level:add')
  create(@Body() createDto: CreateMemberLevelDto) {
    const userId = this.cls.get('user').id;
    return this.memberLevelService.create(createDto, userId);
  }

  /**
   * 获取会员等级选项（用于下拉选择）
   * 注意：此路由必须放在 :id 路由之前，否则 'options' 会被当作 id 参数
   */
  @Get('options')
  @RequirePermissions('member:member:list')
  findOptions() {
    return this.memberLevelService.findOptions();
  }

  /**
   * 分页查询列表
   */
  @Get()
  @RequirePermissions('member:level:list')
  findAll(@Query() query: QueryMemberLevelDto) {
    return this.memberLevelService.findAll(query);
  }

  /**
   * 获取详情
   */
  @Get(':id')
  @RequirePermissions('member:level:query')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.memberLevelService.findOne(id);
  }

  /**
   * 更新
   */
  @Put(':id')
  @RequirePermissions('member:level:edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateMemberLevelDto,
  ) {
    const userId = this.cls.get('user').id;
    return this.memberLevelService.update(id, updateDto, userId);
  }

  /**
   * 删除
   */
  @Delete(':id')
  @RequirePermissions('member:level:remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    const userId = this.cls.get('user').id;
    return this.memberLevelService.remove(id, userId);
  }
}
