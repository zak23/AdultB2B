import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: this.configService.get('NODE_ENV', 'development'),
    };
  }

  getApiInfo() {
    return {
      name: 'AdultB2B API',
      version: '1.0.0',
      description: 'Professional networking platform for the adult industry',
      docs: '/api/docs',
    };
  }
}
