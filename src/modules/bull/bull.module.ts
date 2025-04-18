import { Module } from '@nestjs/common';
import { bullService } from './services/bull.service';

@Module({
  providers: [bullService]
})
export class BullBoardModule { }
