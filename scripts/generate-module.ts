#!/usr/bin/env ts-node
/**
 * 模块代码生成器
 *
 * 用法: pnpm gen:module <模块名> [选项]
 *
 * 示例:
 *   pnpm gen:module article              # 生成文章管理模块
 *   pnpm gen:module product --cn 商品    # 生成商品管理模块，指定中文名
 *   pnpm gen:module order --id 300       # 生成订单模块，指定菜单起始ID
 */

import * as fs from 'fs';
import * as path from 'path';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg: string) => console.log(`\n${colors.cyan}${msg}${colors.reset}`),
};

// 解析命令行参数
function parseArgs(): { moduleName: string; cnName: string; menuId: number } {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
${colors.cyan}模块代码生成器${colors.reset}

用法: pnpm gen:module <模块名> [选项]

选项:
  --cn <中文名>    模块中文名称 (默认: 模块名 + "管理")
  --id <数字>      菜单起始ID (默认: 200)
  --help, -h       显示帮助信息

示例:
  pnpm gen:module article              # 生成文章管理模块
  pnpm gen:module product --cn 商品    # 生成商品管理模块
  pnpm gen:module order --id 300       # 指定菜单起始ID为300
`);
    process.exit(0);
  }

  const moduleName = args[0].toLowerCase();
  let cnName = moduleName + '管理';
  let menuId = 200;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--cn' && args[i + 1]) {
      cnName = args[i + 1];
      i++;
    } else if (args[i] === '--id' && args[i + 1]) {
      menuId = parseInt(args[i + 1], 10);
      i++;
    }
  }

  return { moduleName, cnName, menuId };
}

// 工具函数
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function toPascalCase(str: string): string {
  return str.split(/[-_]/).map(capitalize).join('');
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

// 确保目录存在
function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// 写入文件
function writeFile(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  ensureDir(dir);
  fs.writeFileSync(filePath, content);
  log.success(`创建文件: ${filePath.replace(process.cwd(), '.')}`);
}

// ==================== 模板定义 ====================

// Prisma 模型模板
function getPrismaTemplate(name: string, cnName: string): string {
  const pascalName = toPascalCase(name);
  return `/// ${cnName}表
model ${pascalName} {
  id        Int      @id @default(autoincrement())
  name      String   @db.VarChar(100)   /// 名称
  code      String?  @db.VarChar(50)    /// 编码
  content   String?  @db.Text           /// 内容
  sort      Int      @default(0)        /// 排序
  status    Status   @default(ENABLED)  /// 状态
  remark    String?  @db.VarChar(500)   /// 备注

  // 审计字段
  createdBy Int?                        /// 创建者ID
  createdAt DateTime @default(now())    /// 创建时间
  updatedBy Int?                        /// 更新者ID
  updatedAt DateTime @updatedAt         /// 更新时间
  deleted   Boolean  @default(false)    /// 删除标记
  deletedAt DateTime?                   /// 删除时间

  @@map("${name}")
}
`;
}

// Module 模板
function getModuleTemplate(name: string): string {
  const pascalName = toPascalCase(name);
  return `import { Module } from '@nestjs/common';
import { ${pascalName}Controller } from './${name}.controller';
import { ${pascalName}Service } from './${name}.service';

@Module({
  controllers: [${pascalName}Controller],
  providers: [${pascalName}Service],
  exports: [${pascalName}Service],
})
export class ${pascalName}Module {}
`;
}

// Controller 模板
function getControllerTemplate(name: string): string {
  const pascalName = toPascalCase(name);
  return `import {
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
import { ${pascalName}Service } from './${name}.service';
import { Create${pascalName}Dto } from './dto/create-${name}.dto';
import { Update${pascalName}Dto } from './dto/update-${name}.dto';
import { Query${pascalName}Dto } from './dto/query-${name}.dto';
import { RequirePermissions, CurrentUser } from '@/common/decorators';

@Controller('${name}')
export class ${pascalName}Controller {
  constructor(private readonly ${toCamelCase(name)}Service: ${pascalName}Service) {}

  /**
   * 创建${name}
   */
  @Post()
  @RequirePermissions('${name}:add')
  create(
    @Body() createDto: Create${pascalName}Dto,
    @CurrentUser('sub') userId: number,
  ) {
    return this.${toCamelCase(name)}Service.create(createDto, userId);
  }

  /**
   * 分页查询列表
   */
  @Get()
  @RequirePermissions('${name}:list')
  findAll(@Query() query: Query${pascalName}Dto) {
    return this.${toCamelCase(name)}Service.findAll(query);
  }

  /**
   * 获取详情
   */
  @Get(':id')
  @RequirePermissions('${name}:query')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.${toCamelCase(name)}Service.findOne(id);
  }

  /**
   * 更新
   */
  @Put(':id')
  @RequirePermissions('${name}:edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: Update${pascalName}Dto,
    @CurrentUser('sub') userId: number,
  ) {
    return this.${toCamelCase(name)}Service.update(id, updateDto, userId);
  }

  /**
   * 删除
   */
  @Delete(':id')
  @RequirePermissions('${name}:remove')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('sub') userId: number,
  ) {
    return this.${toCamelCase(name)}Service.remove(id, userId);
  }
}
`;
}

// Service 模板
function getServiceTemplate(name: string): string {
  const pascalName = toPascalCase(name);
  const camelName = toCamelCase(name);
  return `import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { Create${pascalName}Dto } from './dto/create-${name}.dto';
import { Update${pascalName}Dto } from './dto/update-${name}.dto';
import { Query${pascalName}Dto } from './dto/query-${name}.dto';

@Injectable()
export class ${pascalName}Service {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建
   */
  async create(dto: Create${pascalName}Dto, userId: number) {
    return this.prisma.${camelName}.create({
      data: {
        ...dto,
        createdBy: userId,
      },
    });
  }

  /**
   * 分页查询
   */
  async findAll(query: Query${pascalName}Dto) {
    const { page = 1, pageSize = 10, name, status } = query;
    const skip = (page - 1) * pageSize;

    const where = {
      deleted: false,
      ...(name && { name: { contains: name } }),
      ...(status && { status }),
    };

    const [list, total] = await Promise.all([
      this.prisma.${camelName}.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.${camelName}.count({ where }),
    ]);

    return {
      list,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取详情
   */
  async findOne(id: number) {
    const record = await this.prisma.${camelName}.findFirst({
      where: { id, deleted: false },
    });
    if (!record) {
      throw new NotFoundException('记录不存在');
    }
    return record;
  }

  /**
   * 更新
   */
  async update(id: number, dto: Update${pascalName}Dto, userId: number) {
    await this.findOne(id);

    return this.prisma.${camelName}.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: userId,
      },
    });
  }

  /**
   * 删除（软删除）
   */
  async remove(id: number, userId: number) {
    await this.findOne(id);

    return this.prisma.${camelName}.update({
      where: { id },
      data: {
        deleted: true,
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }
}
`;
}

// Create DTO 模板
function getCreateDtoTemplate(name: string): string {
  const pascalName = toPascalCase(name);
  return `import { IsString, IsOptional, IsInt, IsEnum, MaxLength, MinLength } from 'class-validator';
import { Status } from '@prisma/client';

export class Create${pascalName}Dto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsInt()
  sort?: number;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}
`;
}

// Update DTO 模板
function getUpdateDtoTemplate(name: string): string {
  const pascalName = toPascalCase(name);
  return `import { PartialType } from '@nestjs/mapped-types';
import { Create${pascalName}Dto } from './create-${name}.dto';

export class Update${pascalName}Dto extends PartialType(Create${pascalName}Dto) {}
`;
}

// Query DTO 模板
function getQueryDtoTemplate(name: string): string {
  const pascalName = toPascalCase(name);
  return `import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Status } from '@prisma/client';
import { PaginationDto } from '@/common/dto';

export class Query${pascalName}Dto extends PaginationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
`;
}

// 前端 API 服务模板
function getFrontendServiceTemplate(name: string, cnName: string): string {
  const pascalName = toPascalCase(name);
  return `import request from '@/utils/request';

export interface ${pascalName} {
  id: number;
  name: string;
  code?: string;
  content?: string;
  sort: number;
  status: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ${pascalName}Query {
  page?: number;
  pageSize?: number;
  name?: string;
  status?: string;
}

export interface ${pascalName}Form {
  name: string;
  code?: string;
  content?: string;
  sort?: number;
  status?: string;
  remark?: string;
}

export const ${toCamelCase(name)}Api = {
  /** 获取${cnName}列表 */
  list(params?: ${pascalName}Query) {
    return request.get<{ list: ${pascalName}[]; total: number }>('/${name}', { params });
  },

  /** 获取${cnName}详情 */
  get(id: number) {
    return request.get<${pascalName}>(\`/${name}/\${id}\`);
  },

  /** 创建${cnName} */
  create(data: ${pascalName}Form) {
    return request.post<${pascalName}>('/${name}', data);
  },

  /** 更新${cnName} */
  update(id: number, data: Partial<${pascalName}Form>) {
    return request.put<${pascalName}>(\`/${name}/\${id}\`, data);
  },

  /** 删除${cnName} */
  delete(id: number) {
    return request.delete(\`/${name}/\${id}\`);
  },
};
`;
}

// 前端页面模板
function getFrontendPageTemplate(name: string, cnName: string): string {
  const pascalName = toPascalCase(name);
  const camelName = toCamelCase(name);
  const upperName = name.toUpperCase();
  return `import { useRef, useState } from 'react';
import { message, Modal, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  ProTable,
  ProColumns,
  ActionType,
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormDigit,
  ProFormSelect,
} from '@ant-design/pro-components';
import { useMutation } from '@tanstack/react-query';
import { ${camelName}Api, ${pascalName}, ${pascalName}Form } from '@/services/${name}';
import { PermissionButton } from '@/components/PermissionButton';
import { ${upperName} } from '@/constants/permissions';

export default function ${pascalName}Page() {
  const actionRef = useRef<ActionType>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<${pascalName} | null>(null);

  // 创建/更新
  const saveMutation = useMutation({
    mutationFn: (data: ${pascalName}Form) => {
      if (editingRecord) {
        return ${camelName}Api.update(editingRecord.id, data);
      }
      return ${camelName}Api.create(data);
    },
    onSuccess: () => {
      message.success(editingRecord ? '更新成功' : '创建成功');
      setModalOpen(false);
      setEditingRecord(null);
      actionRef.current?.reload();
    },
    onError: (error: any) => {
      message.error(error?.message || '操作失败');
    },
  });

  // 删除
  const deleteMutation = useMutation({
    mutationFn: ${camelName}Api.delete,
    onSuccess: () => {
      message.success('删除成功');
      actionRef.current?.reload();
    },
    onError: (error: any) => {
      message.error(error?.message || '删除失败');
    },
  });

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条记录吗？删除后无法恢复。',
      okType: 'danger',
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const handleEdit = (record: ${pascalName}) => {
    setEditingRecord(record);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingRecord(null);
    setModalOpen(true);
  };

  const columns: ProColumns<${pascalName}>[] = [
    {
      title: '名称',
      dataIndex: 'name',
      width: 150,
    },
    {
      title: '编码',
      dataIndex: 'code',
      width: 120,
      search: false,
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 80,
      search: false,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueEnum: {
        ENABLED: { text: '启用', status: 'Success' },
        DISABLED: { text: '禁用', status: 'Error' },
      },
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 200,
      ellipsis: true,
      search: false,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      valueType: 'dateTime',
      search: false,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <PermissionButton
            permission={${upperName}.EDIT}
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </PermissionButton>
          <PermissionButton
            permission={${upperName}.REMOVE}
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </PermissionButton>
        </Space>
      ),
    },
  ];

  return (
    <>
      <ProTable<${pascalName}>
        headerTitle="${cnName}列表"
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        scroll={{ x: 1000 }}
        request={async (params) => {
          const { current, pageSize, ...rest } = params;
          try {
            const res = await ${camelName}Api.list({
              page: current,
              pageSize,
              ...rest,
            });
            return {
              data: res.list,
              total: res.total,
              success: true,
            };
          } catch (error) {
            return { data: [], total: 0, success: false };
          }
        }}
        toolBarRender={() => [
          <PermissionButton
            key="add"
            permission={${upperName}.ADD}
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增
          </PermissionButton>,
        ]}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      <ModalForm<${pascalName}Form>
        title={editingRecord ? '编辑${cnName}' : '新增${cnName}'}
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialValues={editingRecord || { sort: 0, status: 'ENABLED' }}
        onFinish={async (values) => {
          await saveMutation.mutateAsync(values);
          return true;
        }}
        modalProps={{
          destroyOnClose: true,
          maskClosable: false,
        }}
      >
        <ProFormText
          name="name"
          label="名称"
          placeholder="请输入名称"
          rules={[{ required: true, message: '请输入名称' }]}
        />
        <ProFormText
          name="code"
          label="编码"
          placeholder="请输入编码"
        />
        <ProFormDigit
          name="sort"
          label="排序"
          placeholder="请输入排序号"
          min={0}
          fieldProps={{ precision: 0 }}
        />
        <ProFormSelect
          name="status"
          label="状态"
          options={[
            { label: '启用', value: 'ENABLED' },
            { label: '禁用', value: 'DISABLED' },
          ]}
        />
        <ProFormTextArea
          name="content"
          label="内容"
          placeholder="请输入内容"
        />
        <ProFormTextArea
          name="remark"
          label="备注"
          placeholder="请输入备注"
        />
      </ModalForm>
    </>
  );
}
`;
}

// 权限常量模板
function getPermissionTemplate(name: string): string {
  const upperName = name.toUpperCase();
  return `
// ${name} 权限 - 请添加到 src/constants/permissions.ts
export const ${upperName} = {
  LIST: '${name}:list',
  ADD: '${name}:add',
  EDIT: '${name}:edit',
  REMOVE: '${name}:remove',
  QUERY: '${name}:query',
  EXPORT: '${name}:export',
};
`;
}

// 种子文件菜单模板
function getSeedMenuTemplate(name: string, cnName: string, menuId: number): string {
  const pageId = menuId + 1;
  const btnStartId = menuId + 10;
  return `
// ============================================================
// ${cnName}模块菜单配置 - 请添加到 prisma/seed.ts 的 menus 数组中
// ============================================================

// 目录菜单
{
  id: ${menuId},
  parentId: 0,
  name: '${cnName}',
  path: '/${name}',
  type: MenuType.DIR,
  icon: 'AppstoreOutlined',
  sort: 10,
  perms: '${name}:manage'
},

// 页面菜单
{
  id: ${pageId},
  parentId: ${menuId},
  name: '${cnName}列表',
  path: '/${name}/list',
  component: '${name}/index',
  type: MenuType.MENU,
  icon: 'UnorderedListOutlined',
  sort: 1,
  perms: '${name}:list'
},

// 按钮权限
{ id: ${btnStartId}, parentId: ${pageId}, name: '${cnName}查询', path: null, type: MenuType.BUTTON, icon: null, sort: 1, perms: '${name}:query' },
{ id: ${btnStartId + 1}, parentId: ${pageId}, name: '${cnName}新增', path: null, type: MenuType.BUTTON, icon: null, sort: 2, perms: '${name}:add' },
{ id: ${btnStartId + 2}, parentId: ${pageId}, name: '${cnName}修改', path: null, type: MenuType.BUTTON, icon: null, sort: 3, perms: '${name}:edit' },
{ id: ${btnStartId + 3}, parentId: ${pageId}, name: '${cnName}删除', path: null, type: MenuType.BUTTON, icon: null, sort: 4, perms: '${name}:remove' },
{ id: ${btnStartId + 4}, parentId: ${pageId}, name: '${cnName}导出', path: null, type: MenuType.BUTTON, icon: null, sort: 5, perms: '${name}:export' },
`;
}

// 路由配置模板
function getRouteTemplate(name: string, cnName: string): string {
  const pascalName = toPascalCase(name);
  const upperName = name.toUpperCase();
  return `
// ============================================================
// ${cnName}路由配置 - 请添加到 src/App.tsx
// ============================================================

// 1. 添加懒加载导入
const ${pascalName}List = lazy(() => import('./pages/${name}'));

// 2. 添加路由配置 (在 <Routes> 中添加)
<Route
  path="${name}"
  element={
    <AuthRoute requiredPermission={${upperName}.LIST}>
      <${pascalName}List />
    </AuthRoute>
  }
/>

// 3. 添加权限常量导入
import { ${upperName} } from './constants/permissions';
`;
}

// ==================== 主函数 ====================

async function main() {
  const { moduleName, cnName, menuId } = parseArgs();

  // 验证模块名
  if (!/^[a-z][a-z0-9-]*$/.test(moduleName)) {
    log.error('模块名只能包含小写字母、数字和连字符，且必须以字母开头');
    process.exit(1);
  }

  const rootDir = process.cwd();
  const apiDir = path.join(rootDir, 'apps/admin-api');
  const webDir = path.join(rootDir, 'apps/admin-web');

  // 检查目录结构
  if (!fs.existsSync(apiDir) || !fs.existsSync(webDir)) {
    log.error('请在项目根目录下运行此脚本');
    process.exit(1);
  }

  log.title(`开始生成 ${cnName} (${moduleName}) 模块...`);

  // ========== 生成后端代码 ==========
  log.title('📦 生成后端代码');

  const moduleDir = path.join(apiDir, 'src/modules', moduleName);
  const dtoDir = path.join(moduleDir, 'dto');

  // 检查模块是否已存在
  if (fs.existsSync(moduleDir)) {
    log.error(`模块目录已存在: ${moduleDir}`);
    process.exit(1);
  }

  // 生成 Prisma 模型
  writeFile(
    path.join(apiDir, 'prisma', `${moduleName}.prisma`),
    getPrismaTemplate(moduleName, cnName)
  );

  // 生成 Module
  writeFile(
    path.join(moduleDir, `${moduleName}.module.ts`),
    getModuleTemplate(moduleName)
  );

  // 生成 Controller
  writeFile(
    path.join(moduleDir, `${moduleName}.controller.ts`),
    getControllerTemplate(moduleName)
  );

  // 生成 Service
  writeFile(
    path.join(moduleDir, `${moduleName}.service.ts`),
    getServiceTemplate(moduleName)
  );

  // 生成 DTOs
  writeFile(
    path.join(dtoDir, `create-${moduleName}.dto.ts`),
    getCreateDtoTemplate(moduleName)
  );
  writeFile(
    path.join(dtoDir, `update-${moduleName}.dto.ts`),
    getUpdateDtoTemplate(moduleName)
  );
  writeFile(
    path.join(dtoDir, `query-${moduleName}.dto.ts`),
    getQueryDtoTemplate(moduleName)
  );

  // ========== 生成前端代码 ==========
  log.title('🎨 生成前端代码');

  const pageDir = path.join(webDir, 'src/pages', moduleName);

  // 检查页面是否已存在
  if (fs.existsSync(pageDir)) {
    log.error(`页面目录已存在: ${pageDir}`);
    process.exit(1);
  }

  // 生成 API 服务
  writeFile(
    path.join(webDir, 'src/services', `${moduleName}.ts`),
    getFrontendServiceTemplate(moduleName, cnName)
  );

  // 生成页面组件
  writeFile(
    path.join(pageDir, 'index.tsx'),
    getFrontendPageTemplate(moduleName, cnName)
  );

  // ========== 生成配置提示 ==========
  log.title('📋 需要手动添加的配置');

  // 生成配置文件
  const configDir = path.join(rootDir, 'scripts/generated', moduleName);
  ensureDir(configDir);

  writeFile(
    path.join(configDir, 'permissions.ts'),
    getPermissionTemplate(moduleName)
  );

  writeFile(
    path.join(configDir, 'seed-menu.ts'),
    getSeedMenuTemplate(moduleName, cnName, menuId)
  );

  writeFile(
    path.join(configDir, 'route.tsx'),
    getRouteTemplate(moduleName, cnName)
  );

  // ========== 打印后续步骤 ==========
  log.title('🚀 后续步骤');

  console.log(`
${colors.yellow}1. 生成 Prisma Client:${colors.reset}
   pnpm db:generate

${colors.yellow}2. 执行数据库迁移:${colors.reset}
   pnpm db:migrate

${colors.yellow}3. 注册后端模块:${colors.reset}
   编辑 ${colors.cyan}apps/admin-api/src/app.module.ts${colors.reset}
   添加: import { ${toPascalCase(moduleName)}Module } from './modules/${moduleName}/${moduleName}.module';
   在 imports 数组中添加: ${toPascalCase(moduleName)}Module

${colors.yellow}4. 添加权限常量:${colors.reset}
   编辑 ${colors.cyan}apps/admin-web/src/constants/permissions.ts${colors.reset}
   参考: ${colors.cyan}scripts/generated/${moduleName}/permissions.ts${colors.reset}

${colors.yellow}5. 添加前端路由:${colors.reset}
   编辑 ${colors.cyan}apps/admin-web/src/App.tsx${colors.reset}
   参考: ${colors.cyan}scripts/generated/${moduleName}/route.tsx${colors.reset}

${colors.yellow}6. 更新种子文件菜单:${colors.reset}
   编辑 ${colors.cyan}apps/admin-api/prisma/seed.ts${colors.reset}
   参考: ${colors.cyan}scripts/generated/${moduleName}/seed-menu.ts${colors.reset}

${colors.yellow}7. 运行种子文件:${colors.reset}
   pnpm db:seed

${colors.green}✨ 模块代码生成完成！${colors.reset}
`);
}

main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
