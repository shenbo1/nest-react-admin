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
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticleDto } from './dto/query-article.dto';
import { RequirePermissions } from '@/common/decorators';
import { ClsService } from 'nestjs-cls';

@Controller('article')
export class ArticleController {
  constructor(
    private readonly articleService: ArticleService,
    private readonly cls: ClsService,
  ) {}

  /**
   * 创建article
   */
  @Post()
  @RequirePermissions('article:add')
  create(@Body() createDto: CreateArticleDto) {
    const userId = this.cls.get('user').id;
    return this.articleService.create(createDto, userId);
  }

  /**
   * 分页查询列表
   */
  @Get()
  @RequirePermissions('article:list')
  findAll(@Query() query: QueryArticleDto) {
    return this.articleService.findAll(query);
  }

  /**
   * 获取详情
   */
  @Get(':id')
  @RequirePermissions('article:query')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.articleService.findOne(id);
  }

  /**
   * 更新
   */
  @Put(':id')
  @RequirePermissions('article:edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateArticleDto,
  ) {
    const userId = this.cls.get('user').id;
    return this.articleService.update(id, updateDto, userId);
  }

  /**
   * 删除
   */
  @Delete(':id')
  @RequirePermissions('article:remove')
  remove(@Param('id', ParseIntPipe) id: number) {
    const userId = this.cls.get('user').id;
    return this.articleService.remove(id, userId);
  }

  /**
   * 切换状态
   */
  @Put(':id/toggle-status')
  @RequirePermissions('article:edit')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    const userId = this.cls.get('user').id;
    return this.articleService.toggleStatus(id, userId);
  }
}
