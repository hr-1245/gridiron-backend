import { Controller, Get, Query, UseGuards, ParseIntPipe, Delete, Param, HttpStatus, UseInterceptors, Post, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { CloudinaryService } from 'src/modules/cloudinary/cloudinary.service';
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
    private readonly cloudinaryService: CloudinaryService,

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
  @ApiQuery({
    name: 'searchName',
    required: false,
    type: String,
    description: 'Search by Folder Name, Player Name, Position, or Hometown',
  })
  @ApiQuery({
    name: 'searchId',
    required: false,
    type: Number,
    description: 'Optional search by ID',
  })
  async getDraftFolders(
    @User() user: userjwtInterface, 
    @Query() query: GetDraftFoldersQueryDto, 
  ) {
    const searchId = query.searchId ? parseInt(query.searchId, 10) : undefined;
    const searchName = query.searchName as any;

    // Call the service to fetch draft folders
    return this.playerDataService.getUserDraftFolders(user.id, searchId, searchName);
  }

  @Get('draft-folders/getById/:id')
  @ApiOperation({ summary: 'Get draft folder by ID' })
  @ApiResponse({
    status: 200,
    description: 'Draft folder retrieved successfully',

  })
  @ApiResponse({ status: 404, description: 'Draft folder not found' })
  async getDraftFolderById(@Param('id', ParseIntPipe) id: number, @User() user: userjwtInterface,) {
    return this.playerDataService.getDraftFolderById(id, user);
  }

  @Post('upload/profile-picture')
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
  async uploadfile(@UploadedFile() file: Express.Multer.File) {
    const result = await this.cloudinaryService.uploadFile(file);

    const { public_id, format, url, secure_url } = result;

    return {
      message: 'Profile Photo Uploaded Sucessfully',
      public_id,
      format,
      url,
      secure_url
    };
  }
  @Get('players/:id')
  @ApiOperation({ summary: 'Get player by ID' })
  @ApiResponse({
    status: 200,
    description: 'Player retrieved successfully',
    schema: {
      example: {
        message: 'Player retrieved successfully',
        data: {
          id: 1,
          name: 'John Doe',
          overallRating: 85,
          height: '6ft 2in',
          weight: 190,
          playerClass: 'Senior',
          isActive: 'isActive',
          position: { id: 1, name: 'Forward' },
          attributes: [{ id: 1, speed: 90 }],
          draftFolder: { id: 1, folderName: 'Draft 2025' },
          images: [{ id: 1, url: 'https://...' }]
        }
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Player not found' })
  async getPlayerById(@Param('id', ParseIntPipe) id: number) {
    return this.playerDataService.getPlayerById(id);
  }

}