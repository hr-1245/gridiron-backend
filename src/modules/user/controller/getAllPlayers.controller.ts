import { Controller, Get, Query, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';
import { playerDataService } from 'src/modules/player/services/playerdata.service';
import { User } from 'src/utils/user.decorator';
import { userjwtInterface } from 'src/modules/jwt/interface/jwt.interface';
import { userjwtGuard } from 'src/providers/guards/user-guard/user.guard';

@ApiTags('Player Analytics')
@ApiBearerAuth('jwt')
@Controller('players')
@UseGuards(userjwtGuard)
export class userPlayerCardsController {
  constructor(private readonly playerDataService: playerDataService) { }

  @ApiOperation({ summary: 'Get all converted players for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Players fetched successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by player name' })
  @Get('converted')
  async getAllConvertedPlayers(
    @User() user: userjwtInterface,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('search') searchValue?: string,
  ) {
    return await this.playerDataService.getAllConvertedPlayers(user.id, page, limit, searchValue);
  }

  @ApiOperation({ summary: 'Get converted players by name for the authenticated user' })
  @ApiParam({ name: 'search', type: String, description: 'Player name (partial match)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @Get('converted/name/:search')
  async getConvertedPlayerByName(
    @User() user: userjwtInterface,
    @Param('search') search: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return await this.playerDataService.getConvertedPlayerByName(user.id, search, page, limit);
  }

  @ApiOperation({ summary: 'Get converted players by position for the authenticated user' })
  @ApiParam({ name: 'positionCode', type: String, description: 'Position code (e.g., TE, QB, etc.)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @Get('converted/position/:positionCode')
  async getConvertedPlayerByPosition(
    @User() user: userjwtInterface,
    @Param('positionCode') positionCode: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return await this.playerDataService.getConvertedPlayerByPosition(user.id, positionCode, page, limit);
  }
}
