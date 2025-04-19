import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  Body,
  Get,
  UseGuards,
  Req,
  InternalServerErrorException,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PlayerOcrService } from './services/playerocr.service';
import { playerService } from './services/player.service';
import { ConversionDto } from './dto/convert-manually.dto';
import { User } from 'src/utils/user.decorator';
import { userjwtInterface } from '../jwt/interface/jwt.interface';
import { userjwtGuard } from 'src/providers/guards/user-guard/user.guard';
import { BulkJobTrackerService } from '../bull/services/bull-job-tracker.service';

@ApiTags('Player OCR')
@ApiBearerAuth('jwt')
@Controller('players/ocr')
@UseGuards(userjwtGuard)
export class PlayerOcrController {

  logger: any;
  constructor(
    private readonly playerOcrService: PlayerOcrService,
    private readonly playeService: playerService,
    private readonly bullService: BulkJobTrackerService,
  ) { }

  @Get("dropdown")
  @ApiResponse({
    status: 200,
    description: "Dropdown Position",
  })
  async getPositionDropDown() {
    return this.playeService.getAllPositionDropDown();
  }

  @Post("convert")
  @ApiOperation({ summary: "Convert player attributes based on position" })
  @ApiResponse({
    status: 200,
    description: "Player attributes converted successfully",
  })
  async convertPlayerAttributes(
    @Body() conversionDto: ConversionDto,
    @User() user: userjwtInterface,
  ) {
    return this.playeService.conversionLogic(conversionDto, user.id);
  }

  @Post('ConvertWithImage')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({
    summary:
      'Process uploaded player images (first image is primary, rest are attributes).',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Player image upload (multiple files)',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
      required: ['files'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Player processed successfully',
  })
  async processPlayerImage(
    @UploadedFiles() files: Express.Multer.File[],

    @User() user: userjwtInterface,
  ) {

    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    return this.playerOcrService.processPlayerImage(files, user.id);
  }

  @Post('bulk-upload')
  @UseInterceptors(FilesInterceptor('files'))
  async bulkUpload(
    @UploadedFiles() files: Express.Multer.File[],
    @User() user: userjwtInterface
  ) {

    try {
      const result = await this.playerOcrService.processBulkPlayers(files, user.id);

      // Track the bulk job
      this.bullService.createJob(result.bulkJobId, result.totalPlayers);

      return {
        success: true,
        bulkJobId: result.bulkJobId,
        message: `Bulk processing started for ${result.totalPlayers} players`,
        summary: {
          total: result.totalPlayers,
          success: result.successCount,
          failed: result.failedCount
        }
      };
    } catch (error) {
      this.logger.error('Bulk upload failed', error.stack);
      throw new InternalServerErrorException('Failed to start bulk processing');
    }
  }

  @Get('bulk-status/:jobId')
  async getBulkStatus(@Param('jobId') jobId: string) {
    const status = this.bullService.getJobStatus(jobId);
    if (!status) {
      throw new NotFoundException('Bulk job not found');
    }
    return status;
  }
}
