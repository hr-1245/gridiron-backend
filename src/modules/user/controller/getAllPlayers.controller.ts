import { Controller, Get, Query, UseGuards, ParseIntPipe, Delete, Param, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { userjwtInterface } from 'src/modules/jwt/interface/jwt.interface';
import { GetDraftFoldersQueryDto } from 'src/modules/player/dto/draft-folder.dto';
import { PlayerDataService } from 'src/modules/player/services/playerdata.service';
import { userjwtGuard } from 'src/providers/guards/user-guard/user.guard';
import { User } from 'src/utils/user.decorator';

@ApiTags('Converted Players')
@ApiBearerAuth('jwt')
@UseGuards(userjwtGuard)
@Controller('players')
export class userPlayerCardsController {
  constructor(private readonly playerDataService: PlayerDataService,

  ) { }

  //--------------------------GET ALL CONVERTED PLAYERS ================
  @Get('getAll/converted/players')
  @ApiOperation({ summary: 'Get all converted players for the authenticated user with pagination' })
  @ApiResponse({ status: 200, description: 'Converted players retrieved successfully.' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of records per page' })
  @ApiQuery({ name: 'searchValue', required: false, type: String, description: 'Search value for player name' })
  @ApiQuery({ name: 'positionCode', required: false, type: String, description: 'Filter by position code' })
  async getConvertedPlayers(
    @User() user: userjwtInterface,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('searchValue') searchValue?: string,
    @Query('positionCode') positionCode?: string,
  ) {
    return this.playerDataService.getConvertedPlayers(user.id, page, limit, searchValue, positionCode);
  }


  //--------------------------DELETE PLAYER CARD BY ID -----------------
  @ApiOperation({ summary: 'Delete a player card by ID for the authenticated user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Player card deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Player card not found or unauthorized access',
  })
  @Delete(':id')
  async deletePlayerCard(
    @Param('id', ParseIntPipe) id: number,
    @User() user: userjwtInterface,
  ) {
    return this.playerDataService.deletePlayerCard(id, user.id);
  }


  @Get('draft-folders')
  @UseGuards(userjwtGuard)
  @ApiOperation({ summary: 'Get all draft folders for user, with optional filters' })
  @ApiQuery({ name: 'searchId', required: false, type: Number, description: 'Search by Folder ID' })
  @ApiQuery({ name: 'searchName', required: false, type: String, description: 'Search by Folder Name' })
  async getDraftFolders(
    @User() user: userjwtInterface,
    @Query() query: GetDraftFoldersQueryDto,
  ) {
    const searchId = query.searchId ? parseInt(query.searchId, 10) : undefined;
    const searchName = query.searchName;

    return this.playerDataService.getUserDraftFolders(user.id, searchId, searchName);
  }
}