import { Module } from '@nestjs/common';
import Redis from 'ioredis';
import { redisService } from './redis.service';
@Module({
  providers: [
    redisService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        const redisClient = new Redis({
          host: '127.0.0.1',
          port: 6379,
        });

        redisClient.on('connect', () => {
          console.log('Connected to Redis');
        });

        redisClient.on('error', (err) => {
          console.error('Redis connection error:', err);
        });

        return redisClient;
      },
    }
  ],
  exports: [
    'REDIS_CLIENT',
    redisService,
  ],
})
export class redisModule { }
