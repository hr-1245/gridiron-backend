import { Body, Controller, Get, HttpStatus, Param, Post, SetMetadata, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { subscriptionEnum } from "src/types/enums/subscription";
import { ConversionDto } from "./dto/convert-manually.dto";
import { User } from "src/utils/user.decorator";
import { userjwtInterface } from "../jwt/interface/jwt.interface";
import { playerService } from "./services/player.service";
import { userSubscriptionGuard } from "src/providers/guards/user-guard/user-subscription.guard";
import { FileInterceptor } from "@nestjs/platform-express";
import { ocrService } from "./services/playerocr.service";
import { ImageConversionDto } from "./dto/image-conversion.dto";

@ApiTags("Player Positions")
@ApiBearerAuth('jwt')
@UseGuards(userSubscriptionGuard)
@SetMetadata('requiredPlans', [subscriptionEnum.REGULAR, subscriptionEnum.REGULAR])
@Controller("positions")

export class PlayerController {
  constructor(private readonly playerService: playerService,
    private ocerService: ocrService
  ) { }

  // New endpoint: GET /positions/:code/attributes
  // @Get(":code/attributes")
  // @ApiOperation({ summary: "Fetch attributes for a specific position by code" })
  // @ApiResponse({
  //   status: 200,
  //   description: "The attributes for the specified position",
  //   type: PositionAttributesResponseDto,
  // })
  // async getPositionAttributesByCode(
  //   @Param("code") code: string
  // ): Promise<PositionAttributesResponseDto> {

  //   return this.playerService.getPositionAttributes({ position: code });
  // }

  // Existing dropdown endpoint remains the same

  //-----------GET DROPDOWN ------------------------
  @Get("dropdown")
  @ApiResponse({
    status: 200,
    description: "Dropdown Position",
  })
  async getPositionDropDown() {
    return this.playerService.getAllPositionDropDown();
  }

  //----------------------CONVERT MANUALLY ----------------------
  @Post("convert-manually")
  @ApiOperation({ summary: "Convert player attributes based on position" })
  @ApiResponse({
    status: 200,
    description: "Player attributes converted successfully",
  })
  async convertPlayerAttributes(@Body() conversionDto: ConversionDto, @User() user: userjwtInterface) {
    return this.playerService.conversionLogic(conversionDto, user.id);
  }

  //-----------------------CONVERT WITH IMAGE -------------------------
  @Post('convert-image')
  @ApiOperation({ summary: 'Upload Profile Picture' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File uploaded successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file format or upload error',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadfile(@UploadedFile() file: Express.Multer.File,@Body() data: ImageConversionDto) {
    return this.ocerService.exectute(file, data);
  }
}
