import { Body, Controller, Get, Param, Post, SetMetadata, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { playerService } from "./player.service";
import { userSubscriptionGuard } from "src/providers/guards/user-guard/user-subscription.guard";
import { subscriptionEnum } from "src/types/enums/subscription";
import { ConversionDto } from "./dto/convert-manually.dto";
import { combineLatestWith } from "rxjs";

@ApiTags("Player Positions")
// @ApiBearerAuth('jwt')
// @UseGuards(userSubscriptionGuard)
@SetMetadata('requiredPlans', [subscriptionEnum.REGULAR, subscriptionEnum.REGULAR])
@Controller("positions")

export class PlayerController {
  constructor(private readonly playerService: playerService) { }

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
  @Get("dropdown")
  @ApiResponse({
    status: 200,
    description: "Dropdown Position",
  })
  async getPositionDropDown() {
    return this.playerService.getAllPositionDropDown();
  }

  @Post("convert")
  @ApiOperation({ summary: "Convert player attributes based on position" })
  @ApiResponse({
    status: 200,
    description: "Player attributes converted successfully",
  })
  async convertPlayerAttributes(@Body() conversionDto: ConversionDto) {
    console.log(conversionDto);
    return this.playerService.conversionLogic(conversionDto);
  }
}
