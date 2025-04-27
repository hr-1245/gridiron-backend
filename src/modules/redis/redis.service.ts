import { Injectable, Inject } from '@nestjs/common';
import * as Redis from 'ioredis';

@Injectable()
export class redisService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis.Redis
  ) { }

  async set(key: string, value: any, expirationSeconds?: number): Promise<void> {
    const serializedValue = JSON.stringify(value);
    if (expirationSeconds) {
      await this.redisClient.set(key, serializedValue, 'EX', expirationSeconds);
    } else {
      await this.redisClient.set(key, serializedValue);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const result = await this.redisClient.get(key);
    return result ? JSON.parse(result) : null;
  }

  async update(key: string, value: any): Promise<void> {
    await this.set(key, value);
  }

  async delete(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redisClient.exists(key);
    return result === 1;
  }
}
