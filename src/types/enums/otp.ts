export enum OTP_REASON_ENUM {
  VERIFY_EMAIL = 'VERIFY_EMAIL',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  RESET_PASSWORD = 'RESET_PASSWORD',
}


export interface GenerateOTPOptions {
  digits: boolean;
  lowerCaseAlphabets: boolean;
  upperCaseAlphabets: boolean;
  specialChars: boolean;
}

export interface PaginatedPlayers {
  message: string;
  data: any[];
  totalCount: number;
  totalPages: number;
  positionSummary: { [key: string]: number }; // Position counts with keys like 'wrCount', 'teCount', etc.
}
