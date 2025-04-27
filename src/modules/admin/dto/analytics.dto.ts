import { ApiProperty } from "@nestjs/swagger";

export class analyticsDto {

  @ApiProperty()
  totalUsers: number;

  @ApiProperty()
  subscribedUsers: number;

  @ApiProperty()
  notSubscribedUsers: number;

  @ApiProperty()
  totalSubscriptions: number;

  @ApiProperty()
  totalSubscriptionsRevenueInUSD: number;


 
}