import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { GenerateCodeDto } from './dto/generate-code.dto';
import { getTemplates } from './codegen.templates';

export interface GenerateResult {
  moduleName: string;
  cnName: string;
  menuId: number;
  createdFiles: string[];
  configFiles: string[];
  updatedFiles: string[];
  nextSteps: string[];
}

@Injectable()
export class CodegenService {
  generate(dto: GenerateCodeDto): GenerateResult {
    const moduleName = dto.moduleName.toLowerCase();
    const cnName = dto.cnName?.trim() || `${moduleName}管理`;
    const menuId = dto.menuId ?? 200;
    const pascalName = this.toPascalCase(moduleName);
    const upperName = moduleName.toUpperCase();

    const rootDir = this.resolveRootDir();
    const apiDir = path.join(rootDir, 'apps/admin-api');
    const webDir = path.join(rootDir, 'apps/admin-web');

    if (!fs.existsSync(apiDir) || !fs.existsSync(webDir)) {
      throw new BadRequestException('请在项目根目录启动后端服务');
    }

    const templates = getTemplates(moduleName, cnName, menuId);

    const createdFiles: string[] = [];
    const configFiles: string[] = [];
    const updatedFiles: string[] = [];

    const writeFile = (filePath: string, content: string, target: string[]) => {
      if (fs.existsSync(filePath)) {
        throw new ConflictException(`文件已存在: ${this.toRelativePath(rootDir, filePath)}`);
      }
      this.ensureDir(path.dirname(filePath));
      fs.writeFileSync(filePath, content);
      target.push(this.toRelativePath(rootDir, filePath));
    };

    const moduleDir = path.join(rootDir, templates.paths.moduleDir);
    const pageDir = path.dirname(path.join(rootDir, templates.paths.page));

    if (fs.existsSync(moduleDir)) {
      throw new ConflictException(`模块目录已存在: ${this.toRelativePath(rootDir, moduleDir)}`);
    }

    if (fs.existsSync(pageDir)) {
      throw new ConflictException(`页面目录已存在: ${this.toRelativePath(rootDir, pageDir)}`);
    }

    writeFile(path.join(rootDir, templates.paths.prisma), templates.prisma, createdFiles);
    writeFile(path.join(rootDir, templates.paths.module), templates.module, createdFiles);
    writeFile(path.join(rootDir, templates.paths.controller), templates.controller, createdFiles);
    writeFile(path.join(rootDir, templates.paths.service), templates.service, createdFiles);
    writeFile(path.join(rootDir, templates.paths.dtoCreate), templates.dtoCreate, createdFiles);
    writeFile(path.join(rootDir, templates.paths.dtoUpdate), templates.dtoUpdate, createdFiles);
    writeFile(path.join(rootDir, templates.paths.dtoQuery), templates.dtoQuery, createdFiles);

    writeFile(path.join(rootDir, templates.paths.frontendService), templates.frontendService, createdFiles);
    writeFile(path.join(rootDir, templates.paths.page), templates.frontendPage, createdFiles);

    writeFile(path.join(rootDir, templates.paths.configPermissions), templates.permissions, configFiles);
    writeFile(path.join(rootDir, templates.paths.configSeedMenu), templates.seedMenu, configFiles);
    writeFile(path.join(rootDir, templates.paths.configRoute), templates.route, configFiles);

    this.updateFile(
      rootDir,
      path.join(rootDir, 'apps/admin-api/src/app.module.ts'),
      (content) => this.updateAppModule(content, moduleName, pascalName),
      updatedFiles,
    );

    this.updateFile(
      rootDir,
      path.join(rootDir, 'apps/admin-web/src/constants/permissions.ts'),
      (content) => this.updatePermissions(content, moduleName, cnName, upperName),
      updatedFiles,
    );

    this.updateFile(
      rootDir,
      path.join(rootDir, 'apps/admin-web/src/App.tsx'),
      (content) => this.updateAppRoutes(content, moduleName, pascalName, upperName),
      updatedFiles,
    );

    this.updateFile(
      rootDir,
      path.join(rootDir, 'apps/admin-api/prisma/seed.ts'),
      (content) => this.updateSeedMenus(content, moduleName, cnName, menuId),
      updatedFiles,
    );

    return {
      moduleName,
      cnName,
      menuId,
      createdFiles,
      configFiles,
      updatedFiles,
      nextSteps: [
        'pnpm db:generate',
        'pnpm db:migrate',
        'pnpm db:seed',
      ],
    };
  }

  private updateFile(
    rootDir: string,
    filePath: string,
    updater: (content: string) => string,
    updatedFiles: string[],
  ) {
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException(`自动注册失败，文件不存在: ${this.toRelativePath(rootDir, filePath)}`);
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const next = updater(content);
    if (next !== content) {
      fs.writeFileSync(filePath, next);
      updatedFiles.push(this.toRelativePath(rootDir, filePath));
    }
  }

  private updateAppModule(content: string, moduleName: string, pascalName: string) {
    const moduleClass = `${pascalName}Module`;
    const importLine = `import { ${moduleClass} } from './modules/${moduleName}/${moduleName}.module';`;

    if (!content.includes(importLine)) {
      const importBlock = content.match(/^(import .*;\n)+/m);
      if (importBlock) {
        content = content.replace(importBlock[0], `${importBlock[0]}${importLine}\n`);
      } else {
        content = `${importLine}\n${content}`;
      }
    }

    const importsRegex = /imports:\s*\[([\s\S]*?)\]/m;
    const match = content.match(importsRegex);
    if (!match) {
      throw new BadRequestException('自动注册失败，未找到 AppModule imports 配置');
    }

    if (!match[1].includes(moduleClass)) {
      const indent = this.detectIndent(match[1]);
      const updatedInner = `${match[1].replace(/\s*$/, '')}\n${indent}${moduleClass},\n`;
      content = content.replace(importsRegex, (full, inner) => full.replace(inner, updatedInner));
    }

    return content;
  }

  private updatePermissions(content: string, moduleName: string, cnName: string, upperName: string) {
    const constLine = `export const ${upperName} =`;
    if (!content.includes(constLine)) {
      const insertAt = content.indexOf('// 所有权限');
      if (insertAt === -1) {
        throw new BadRequestException('自动注册失败，未找到权限常量插入位置');
      }

      const block = `// ${cnName}权限\nexport const ${upperName} = {\n  LIST: "${moduleName}:list",\n  ADD: "${moduleName}:add",\n  EDIT: "${moduleName}:edit",\n  REMOVE: "${moduleName}:remove",\n  QUERY: "${moduleName}:query",\n  EXPORT: "${moduleName}:export",\n} as const;\n\n`;
      content = `${content.slice(0, insertAt)}${block}${content.slice(insertAt)}`;
    }

    if (!content.includes(`...${upperName}`)) {
      content = content.replace(
        /export const ALL_PERMISSIONS = \{([\s\S]*?)\} as const;/m,
        (full, inner) => {
          const trimmed = inner.replace(/\s*$/, '');
          return `export const ALL_PERMISSIONS = {${trimmed}\n  ...${upperName},\n} as const;`;
        }
      );
    }

    content = this.ensureMapEntry(
      content,
      'MENU_PERMISSIONS',
      `  "/${moduleName}/list": ${upperName}.LIST,\n`,
    );

    content = this.ensureMapEntry(
      content,
      'ROUTE_PERMISSIONS',
      `  "/${moduleName}/list": ${upperName}.LIST,\n`,
    );

    return content;
  }

  private updateAppRoutes(content: string, moduleName: string, pascalName: string, upperName: string) {
    const permissionsImportRegex = /import\s+\{\s*([^}]+)\s*\}\s+from\s+'\.\/constants\/permissions';/;
    const permMatch = content.match(permissionsImportRegex);
    if (permMatch) {
      const names = permMatch[1]
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      if (!names.includes(upperName)) {
        const updated = `import { ${[...names, upperName].join(', ')} } from './constants/permissions';`;
        content = content.replace(permissionsImportRegex, updated);
      }
    } else {
      throw new BadRequestException('自动注册失败，未找到权限常量导入');
    }

    const lazyImport = `const ${pascalName}List = lazy(() => import('./pages/${moduleName}'));`;
    if (!content.includes(lazyImport)) {
      const lastLazyIndex = content.lastIndexOf('const ');
      const lazyMatches = [...content.matchAll(/const\s+\w+\s*=\s*lazy\(/g)];
      if (lazyMatches.length > 0) {
        const last = lazyMatches[lazyMatches.length - 1];
        const insertPos = content.indexOf('\n', last.index!);
        content = `${content.slice(0, insertPos + 1)}${lazyImport}\n${content.slice(insertPos + 1)}`;
      } else if (lastLazyIndex !== -1) {
        const insertPos = content.indexOf('\n', lastLazyIndex);
        content = `${content.slice(0, insertPos + 1)}${lazyImport}\n${content.slice(insertPos + 1)}`;
      } else {
        content = `${lazyImport}\n${content}`;
      }
    }

    const routeBlock = `            <Route\n              path="${moduleName}/list"\n              element={\n                <AuthRoute requiredPermission={${upperName}.LIST}>\n                  <${pascalName}List />\n                </AuthRoute>\n              }\n            />\n`;

    if (!content.includes(routeBlock)) {
      const marker = '          </Route>\n          <Route path="*"';
      const markerIndex = content.indexOf(marker);
      if (markerIndex === -1) {
        throw new BadRequestException('自动注册失败，未找到路由插入位置');
      }
      content = `${content.slice(0, markerIndex)}${routeBlock}${content.slice(markerIndex)}`;
    }

    return content;
  }

  private updateSeedMenus(content: string, moduleName: string, cnName: string, menuId: number) {
    if (content.includes(`'${moduleName}:list'`) || content.includes(`"${moduleName}:list"`)) {
      return content;
    }

    const menuIndex = content.indexOf('const menus = [');
    if (menuIndex === -1) {
      throw new BadRequestException('自动注册失败，未找到菜单数组');
    }

    const endIndex = content.indexOf('\n  ];', menuIndex);
    if (endIndex === -1) {
      throw new BadRequestException('自动注册失败，未找到菜单数组结束位置');
    }

    const pageId = menuId + 1;
    const btnStartId = menuId + 10;

    const block = `\n    // ${cnName}菜单\n    { id: ${menuId}, parentId: 0, name: '${cnName}', path: '/${moduleName}', type: MenuType.DIR, icon: 'AppstoreOutlined', sort: 10, perms: '${moduleName}:manage' },\n    { id: ${pageId}, parentId: ${menuId}, name: '${cnName}列表', path: '/${moduleName}/list', component: '${moduleName}/index', type: MenuType.MENU, icon: 'UnorderedListOutlined', sort: 1, perms: '${moduleName}:list' },\n    { id: ${btnStartId}, parentId: ${pageId}, name: '${cnName}查询', path: null, type: MenuType.BUTTON, icon: null, sort: 1, perms: '${moduleName}:query' },\n    { id: ${btnStartId + 1}, parentId: ${pageId}, name: '${cnName}新增', path: null, type: MenuType.BUTTON, icon: null, sort: 2, perms: '${moduleName}:add' },\n    { id: ${btnStartId + 2}, parentId: ${pageId}, name: '${cnName}修改', path: null, type: MenuType.BUTTON, icon: null, sort: 3, perms: '${moduleName}:edit' },\n    { id: ${btnStartId + 3}, parentId: ${pageId}, name: '${cnName}删除', path: null, type: MenuType.BUTTON, icon: null, sort: 4, perms: '${moduleName}:remove' },\n    { id: ${btnStartId + 4}, parentId: ${pageId}, name: '${cnName}导出', path: null, type: MenuType.BUTTON, icon: null, sort: 5, perms: '${moduleName}:export' },\n`;

    return `${content.slice(0, endIndex)}${block}${content.slice(endIndex)}`;
  }

  private ensureMapEntry(content: string, mapName: string, entry: string) {
    const regex = new RegExp(`export const ${mapName} = \\{([\\s\\S]*?)\\} as const;`, 'm');
    const match = content.match(regex);
    if (!match) {
      throw new BadRequestException(`自动注册失败，未找到 ${mapName} 配置`);
    }
    if (match[1].includes(entry.trim())) {
      return content;
    }
    const updatedInner = `${match[1].replace(/\\s*$/, '')}\n${entry}`;
    return content.replace(regex, `export const ${mapName} = {${updatedInner}} as const;`);
  }

  private detectIndent(block: string): string {
    const match = block.match(/\n(\s+)\S/);
    return match ? match[1] : '    ';
  }

  private ensureDir(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  private resolveRootDir(): string {
    let dir = process.cwd();
    for (let i = 0; i < 6; i++) {
      if (
        fs.existsSync(path.join(dir, 'pnpm-workspace.yaml')) &&
        fs.existsSync(path.join(dir, 'apps'))
      ) {
        return dir;
      }
      const parent = path.dirname(dir);
      if (parent === dir) {
        break;
      }
      dir = parent;
    }
    return process.cwd();
  }

  private toRelativePath(rootDir: string, filePath: string): string {
    const relative = path.relative(rootDir, filePath);
    return relative.split(path.sep).join('/');
  }

  private toPascalCase(str: string): string {
    return str
      .split(/[-_]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }
}
