import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { SystemMetricsService } from './system-metrics.service';

@WebSocketGateway({
  cors: {
    origin: '*', // 生产环境应配置具体的前端域名
    credentials: true,
  },
})
export class MetricsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private intervalId: NodeJS.Timeout;

  constructor(private systemMetricsService: SystemMetricsService) {}

  // 客户端连接时
  handleConnection(client: any) {
    console.log(`客户端 ${client.id} 已连接`);

    // 立即发送一次当前指标
    this.sendSystemMetrics();

    // 然后每5秒发送一次实时指标
    this.intervalId = setInterval(() => {
      this.sendSystemMetrics();
    }, 5000);
  }

  // 客户端断开连接时
  handleDisconnect(client: any) {
    console.log(`客户端 ${client.id} 已断开连接`);

    // 清除定时器
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  // 发送系统指标
  private async sendSystemMetrics() {
    try {
      const metrics = await this.systemMetricsService.getSystemMetrics();
      this.server.emit('systemMetricsUpdate', metrics);
    } catch (error) {
      console.error('发送系统指标失败:', error);
    }
  }
}
