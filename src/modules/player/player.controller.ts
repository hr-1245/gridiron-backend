import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
import { ConversionDto } from './dto/convert-manually.dto';
import { userjwtGuard } from 'src/providers/guards/user-guard/user.guard';

@ApiTags('Player OCR')
@Controller('player-ocr')

export class PlayerOcrController {
  constructor(private readonly playerOcrService: PlayerOcrService) { }

  /**
   * Upload an image and process it via Cloudinary and Google Cloud Vision OCR.
   *
   * The request must contain:
   * - A file (multipart/form-data).
   * - A "conversionData" field (JSON string of ConversionDto).
   *
   * @param file - The uploaded image file.
   * @param conversionDataStr - The JSON stringified ConversionDto.
   * @param user - The authenticated user's info.
   */
  @Post('process')
  @ApiOperation({
    summary:
      'Upload an image, process it via Cloudinary and Google Cloud Vision OCR, and update the player record.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        conversionData: {
          type: 'string',
          description:
            'JSON stringified ConversionDto (includes positionId, positionCode, playerName, draft_round, etc.)',
          example:
            '{"positionId":7,"positionCode":"TE","playerName":"John Doe","draft_round":2}',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'Image processed successfully. Returns the image URL, OCR extracted text, parsed attributes, and player info.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request: Missing file or conversion data, or invalid JSON.',
  })
  @UseInterceptors(FileInterceptor('file'))
  async processPlayerImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('conversionData') conversionDataStr: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    if (!conversionDataStr) {
      throw new BadRequestException('Conversion data is required');
    }
    let conversionData: ConversionDto;
    try {
      conversionData = JSON.parse(conversionDataStr);
    } catch (error) {
      throw new BadRequestException('Invalid JSON for conversion data');
    }
    return await this.playerOcrService.processImage(
      file,
      conversionData,
    );
  }
}
