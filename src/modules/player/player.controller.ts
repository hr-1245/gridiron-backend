import { Controller, Get, Param, SetMetadata, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { playerService } from "./player.service";
import { PositionAttributesResponseDto } from "./dto/fetchData.dto";
import { userSubscriptionGuard } from "src/providers/guards/user-guard/user-subscription.guard";
import { subscriptionEnum } from "src/types/enums/subscription";

@ApiTags("Player Positions")
@ApiBearerAuth('jwt')
@UseGuards(userSubscriptionGuard)
@SetMetadata('requiredPlans', [subscriptionEnum.REGULAR, subscriptionEnum.REGULAR])
@Controller("positions")

export class PlayerController {
  constructor(private readonly playerService: playerService) { }

  // New endpoint: GET /positions/:code/attributes
  @Get(":code/attributes")
  @ApiOperation({ summary: "Fetch attributes for a specific position by code" })
  @ApiResponse({
    status: 200,
    description: "The attributes for the specified position",
    type: PositionAttributesResponseDto,
  })
  async getPositionAttributesByCode(
    @Param("code") code: string
  ): Promise<PositionAttributesResponseDto> {

    return this.playerService.getPositionAttributes({ position: code });
  }

  // Existing dropdown endpoint remains the same
  @Get("dropdown")
  @ApiResponse({
    status: 200,
    description: "Dropdown Position",
  })
  async getPositionDropDown() {
    return this.playerService.getAllPositionDropDown();
  }
}
