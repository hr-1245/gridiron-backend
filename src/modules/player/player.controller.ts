import { Controller, Post, UploadedFile, UseInterceptors, Req, BadRequestException, Body, Get, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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
  constructor(private readonly playerOcrService: PlayerOcrService,
    private readonly playeService: playerService
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
  async convertPlayerAttributes(@Body() conversionDto: ConversionDto, @User() user: userjwtInterface) {
    return this.playeService.conversionLogic(conversionDto, user.id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload player image and process OCR-based conversion' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload an image file. The OCR will extract the player name and position code.',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 200, description: 'Player created successfully.' })
  async uploadPlayerImage(
    @UploadedFile() file: Express.Multer.File,
    @User() user: userjwtInterface,
  ) {
    return await this.playerOcrService.processPlayerImage(file, user.id);
  }
}
