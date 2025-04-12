import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  Body,
  Get,
  UseGuards,
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
import { Express } from 'express';
import { PlayerOcrService } from './services/playerocr.service';
import { playerService } from './services/player.service';
import { ConversionDto } from './dto/convert-manually.dto';
import { User } from 'src/utils/user.decorator';
import { userjwtInterface } from '../jwt/interface/jwt.interface';
import { userjwtGuard } from 'src/providers/guards/user-guard/user.guard';

@ApiTags('Player OCR')
@ApiBearerAuth('jwt')
@Controller('players/ocr')
@UseGuards(userjwtGuard)
export class PlayerOcrController {
  constructor(
    private readonly playerOcrService: PlayerOcrService,
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

  @Post('ConvertWithImage')
  @UseInterceptors(FilesInterceptor('files', 7)) // allow up to 7 files
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
}
