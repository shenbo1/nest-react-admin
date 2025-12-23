import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { MenuModule } from './menu/menu.module';
import { DeptModule } from './dept/dept.module';
import { DictModule } from './dict/dict.module';
import { OperLogModule } from './operlog/operlog.module';
import { LoginLogModule } from './loginlog/loginlog.module';
import { ConfigModule } from './config/config.module';
import { NoticeModule } from './notice/notice.module';
import { CodegenModule } from './codegen/codegen.module';

@Module({
  imports: [
    UserModule,
    RoleModule,
    MenuModule,
    DeptModule,
    DictModule,
    OperLogModule,
    LoginLogModule,
    ConfigModule,
    NoticeModule,
    CodegenModule,
  ],
})
export class SystemModule {}
