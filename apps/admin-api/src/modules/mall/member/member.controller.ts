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
import { MemberService } from './member.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { QueryMemberDto } from './dto/query-member.dto';
import { RequirePermissions } from '@/common/decorators';
import { ClsService } from 'nestjs-cls';

@Controller('mall/member')
export class MemberController {
  constructor(
    private readonly memberService: MemberService,
    private readonly cls: ClsService,
  ) {}

  /**
   * 创建member
   */
  @Post()
  @RequirePermissions('mall:member:add')
  create(@Body() createDto: CreateMemberDto) {
    const userId = this.cls.get('user').id;
    return this.memberService.create(createDto, userId);
  }

  /**
   * 分页查询列表
   */
  @Get()
  @RequirePermissions('mall:member:list')
  findAll(@Query() query: QueryMemberDto) {
    return this.memberService.findAll(query);
  }

  /**
   * 获取详情
   */
  @Get(':id')
  @RequirePermissions('mall:member:query')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.memberService.findOne(id);
  }

  /**
   * 更新
   */
  @Put(':id')
  @RequirePermissions('mall:member:edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateMemberDto,
  ) {
    const userId = this.cls.get('user').id;
    return this.memberService.update(id, updateDto, userId);
  }

  /**
   * 删除
   */
  @Delete(':id')
  @RequirePermissions('mall:member:remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    const userId = this.cls.get('user').id;
    return this.memberService.remove(id, userId);
  }
}
