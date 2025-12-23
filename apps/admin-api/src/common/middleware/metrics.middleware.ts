import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Counter, Histogram } from 'prom-client';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  private httpRequestCounter: Counter<string>;
  private httpRequestDurationHistogram: Histogram<string>;

  constructor() {
    // Initialize counter for total requests
    this.httpRequestCounter = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
    });

    // Initialize histogram for request duration
    this.httpRequestDurationHistogram = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.1, 0.5, 1, 5, 10],
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl: route } = req;

    // On response finish
    res.on('finish', () => {
      const duration = (Date.now() - startTime) / 1000;
      const status = res.statusCode;

      // Increment request counter
      this.httpRequestCounter.labels(method, route, status.toString()).inc();

      // Record request duration
      this.httpRequestDurationHistogram.labels(method, route, status.toString()).observe(duration);
    });

    next();
  }
}
