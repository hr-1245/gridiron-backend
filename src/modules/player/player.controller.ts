import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  Body,
  Get,
  UseGuards,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {  FilesInterceptor } from '@nestjs/platform-express';
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
import { bullService } from '../bull/services/bull.service';

@ApiTags('Player OCR')
@ApiBearerAuth('jwt')
@Controller('players/ocr')
@UseGuards(userjwtGuard)
export class PlayerOcrController {

  logger: any;
  constructor(
    private readonly playerOcrService: PlayerOcrService,
    private readonly bullService: bullService,
    private readonly playeService: playerService,
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

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({
    summary: 'Process uploaded player images (bio image + attributes).'
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
      required: ['files']
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - missing files or invalid data'
  })
  async uploadPlayerImages(
    @UploadedFiles() files: Express.Multer.File[],
    @User() user: userjwtInterface
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    try {
      return await this.playerOcrService.processBulkPlayerImages(files, user.id);
    } catch (error) {
      this.logger.error(`Failed to process player images: ${error.message}`, error.stack);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to process player images');
    }
  }
}