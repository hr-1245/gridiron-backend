import {
  Processor,
  Process,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { PlayerOcrService } from 'src/modules/player/services/playerocr.service';
import { PlayerEntity, PositionAttributeMappingEntity } from 'src/modules/player/entity/players.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { POSTION_CODE } from 'src/types/enums/roles';

@Injectable()
@Processor('imageProcessing')
export class ProcessImageJob {
  constructor(
    private readonly ocrService: PlayerOcrService,
    @InjectRepository(PlayerEntity)
    private readonly playerRepo: Repository<PlayerEntity>,
    @InjectRepository(PositionAttributeMappingEntity)
    private readonly mappingRepo: Repository<PositionAttributeMappingEntity>,
  ) {}

  private readonly logger = new Logger(ProcessImageJob.name);

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`Processing image: ${job.data.originalName}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(`Job completed: ${JSON.stringify(result)}`);
  }

  @OnQueueFailed()
  onFailed(job: Job, err: Error) {
    this.logger.error(`Job failed: ${err.message}`);
  }

  @Process('processImage')
  async handleImageProcessing(job: Job<{
    userId: number;
    playerId: string;
    imageUrl: string;
    originalName: string;
    positionCode: string;
  }>) {
    const { playerId, imageUrl, positionCode } = job.data;

    try {
      let gptResult;
      if (positionCode === POSTION_CODE.WiderReceiver) {
        gptResult = await this.ocrService.extractWideReceiverAttributes(imageUrl);
      } else {
        const mappings = await this.mappingRepo.find({
          where: { position: { code: positionCode } },
        });
        const prompt = `Extract: ${mappings.map(m => m.attributeKey).join(', ')}. Return ONLY JSON.`;
        gptResult = await this.ocrService.callGptOcr(imageUrl, prompt);
      }

      await this.ocrService.handleAttributeExtractionResults(
        gptResult,
        positionCode,
        Number(playerId)
      );

      return { status: 'success', attributes: gptResult };
    } catch (error) {
      this.logger.error(`Processing failed: ${error.message}`);
      throw new InternalServerErrorException(error.message);
    }
  }
}