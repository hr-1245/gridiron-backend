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
import { userManualConversionLimitGuard } from 'src/providers/guards/user-guard/playerManualConversionLimit.guard';
import { userOcrConversionLimitGuard } from 'src/providers/guards/user-guard/playerConversionlimitGuard.guard';
import { PlayerDataService } from './services/playerdata.service';

@ApiTags('Convert Player To Maden')
@ApiBearerAuth('jwt')
@Controller('Conversion/Player')
export class PlayerOcrController {

  logger: any;
  constructor(

    private readonly playerOcrService: PlayerOcrService,

    private readonly playeService: playerService,

    private readonly playeDataService: PlayerDataService,
  ) { }


  //--------GET DROPWDOWN ---------
  @Get("dropdown")
  @UseGuards(userjwtGuard)
  @ApiResponse({
    status: 200,
    description: "Dropdown Position",
  })
  async getPositionDropDown() {
    return this.playeService.getAllPositionDropDown();
  }


  //------------------CONVERT MANUALLY----------
  @Post("convert/manually")
  @UseGuards(userManualConversionLimitGuard)
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


  //------BULK CONVERT WITH AI MODEL----
  @Post('convert/AI')
  @UseGuards(userOcrConversionLimitGuard)
  @UseInterceptors(FilesInterceptor('files'))
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
  @ApiBody({
    description: 'Player image upload with draft folder',
    required: true,
    type: 'multipart/form-data',
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
        draftFolderName: {
          type: 'string',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - missing files or invalid data'
  })
  async uploadPlayerImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: { draftFolderName?: string },
    @User() user: userjwtInterface
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    try {
      return await this.playerOcrService.processBulkPlayerImages(
        files,
        user.id,
        body.draftFolderName as any
      );
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Failed to process image upload. Please ensure you have included at least one player bio image.');
    }
  }
}