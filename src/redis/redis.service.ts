// src/redis/redis.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { RedisClientType, createClient } from 'redis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;

  constructor(private configService: ConfigService) {
    this.client = createClient({
      url: this.configService.get<string>('REDIS_URL', 'redis://localhost:6379'),
    });

    this.client.on('ready', () => {
      logger.log("Redis connected successfully", "RedisService")
    })

    // Опционально: логирование ошибок
    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });
  }

  async onModuleInit() {
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.disconnect();
  }

  getClient(): RedisClientType {
    return this.client;
  }

  // === Основные методы ===

  async set(key: string, value: string, ttl?: number): Promise<string | null> {
    if (ttl) {
      return this.client.set(key, value, { EX: ttl });
    }
    return this.client.set(key, value);
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async getKeyExpire(key: string, ttl: number): Promise<boolean> {
    return await this.client.expire(key, ttl);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  async incr(key: string): Promise<number> {
    return await this.client.incr(key);
  }
}
