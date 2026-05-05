import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST'),
      port: 6379,
      username: this.configService.get<string>('REDIS_USERNAME'),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      family: 6
    });
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.set(key, JSON.stringify(value), 'EX', ttl);
    } else {
      await this.client.set(key, JSON.stringify(value));
    }
  }

  async get(key: string): Promise<any> {
    const data = await this.client.get(key);
    if (!data) {
      return null;
    }
    return JSON.parse(data);
  }

  async exists(key: string): Promise<any> {
    return this.client.exists(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}

