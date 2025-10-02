import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import {
  HealthCheckService,
  HttpHealthIndicator,
  HealthCheck,
  DiskHealthIndicator,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.http.pingCheck('network_ping_yandex', 'http://yandex.ru'),
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.8 }),
      () => this.memory.checkRSS('memory_rss', 4 * 1024 * 1024 * 1024),
      () => this.db.pingCheck('database'),
    ]);
  }
}
