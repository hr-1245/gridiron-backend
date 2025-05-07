export enum rolesEnum {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum approvalStatusEnum {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum playerStatusEnum {
  ISACTIVE= 'isActive',
  INACTIVE = 'inActive'
}

export enum POSTION_CODE {
  TightEnd = 'TE',
  QuarterBack = 'QB',
  RunningBack = 'RB',
  WiderReceiver = 'WR',
  DefensiveTackle = 'DT',
  CornerBack = 'CB',
  Safety = 'S',
  LeftGuard = 'LG',
  RightGuard = 'RG',
  LeftTackle = 'LT',
  RightTackle = 'RT',
  LeftEnd = 'LE',
  RightEnd = 'RE',
  LeftOutside_linebacker_above_245_lbs = 'LOLB>',
  RightOutside_linebacker_above_245lbs = 'ROLB>',
  LeftOutside_linebacker_below_245lbs = 'LOLB<',
  All_Middle_Linebackers = 'MLB',
  RightOutside_linebacker_below_245lbs = 'ROLB<',
  FullBack = 'FB',
  Kicker = 'K',
  Punter = 'P',
}


export enum COLLAGE_AGE_ENUM {
  SO_RS = 'SO_RS',
  JR = 'JR',
  JR_RS = 'JR_RS',
  SR = 'SR',
  SR_RS = 'SR_RS',
}

export const CollageAgeMapping: Record<COLLAGE_AGE_ENUM, number> = {
  [COLLAGE_AGE_ENUM.SO_RS]: 3,
  [COLLAGE_AGE_ENUM.JR]: 3,
  [COLLAGE_AGE_ENUM.JR_RS]: 4,
  [COLLAGE_AGE_ENUM.SR]: 4,
  [COLLAGE_AGE_ENUM.SR_RS]: 5,
}
