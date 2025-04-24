import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: '127.0.0.1',
        port: 6379,
      },
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
    }),
    BullModule.registerQueue({
      name: 'imageProcessing',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
      limiter: {
        max: 5,
        duration: 1000, 
      },
    }),
  ],
  exports: [BullModule],
})
export class BullConfigModule { }