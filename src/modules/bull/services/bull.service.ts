import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { PlayerOcrService } from 'src/modules/player/services/playerocr.service';
import axios from 'axios';
import { Readable } from 'stream';

@Injectable()
@Processor('imageProcessing')
export class ProcessImageJob {
  constructor(private readonly ocrService: PlayerOcrService) { }

  private readonly logger = new Logger(ProcessImageJob.name);

  @OnQueueActive()
  onActive(job: Job<{ userId: number; playerId: number; imageUrl: string; originalName: string }>) {
    this.logger.log(`Job ${job.id} is now active. Processing image: ${job.data.originalName}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(`Job ${job.id} completed successfully with result: ${JSON.stringify(result)}`);
  }

  @OnQueueFailed()
  onFailed(job: Job, err: any) {
    this.logger.error(`Job ${job.id} failed with error: ${err.message}`);
  }

  @Process('processImage')
  async handleImageProcessing(job: Job<{ userId: number; playerId: number; imageUrl: string; originalName: string }>) {
    try {
      this.logger.log(
        `🎯 Job ${job.id}: processing image: ${job.data.originalName} for user ${job.data.userId}`,
      );

      const response = await axios.get(job.data.imageUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, 'binary');

      // Create a mock file object for extraction
      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: job.data.originalName,
        encoding: '7bit',
        mimetype: 'image/png',
        buffer,
        size: buffer.length,
        stream: Readable.from(buffer),
        destination: '',
        filename: '',
        path: '',
      };

      const structuredData = await this.ocrService.extractStructuredPlayerData(file);
      // TODO: Save the extracted attribute data to the database

      this.logger.log(`✅ Job ${job.id} processed successfully`);
      return { status: 'success' };
    } catch (error) {
      this.logger.error(`❌ Job ${job.id} failed: ${error.message}`);
      throw new InternalServerErrorException(error.message);
    }
  }
}
