import * as OTP from 'otp-generator';
import { GenerateOTPOptions } from 'src/types/enums/otp';


export const generateOTP = ({
  length,
  options,
}: {
  length: number;
  options: GenerateOTPOptions;
}): number | string => {
  return OTP.generate(length, options);
};

export const NUMERICAL_OTP: GenerateOTPOptions = {
  digits: true,
  lowerCaseAlphabets: false,
  specialChars: false,
  upperCaseAlphabets: false,
};

export const ALPHANUMERIC_OTP: GenerateOTPOptions = {
  digits: true,
  lowerCaseAlphabets: true,
  specialChars: false,
  upperCaseAlphabets: true,
};

export const TRULY_RANDOM_OTP: GenerateOTPOptions = {
  digits: true,
  lowerCaseAlphabets: true,
  specialChars: true,
  upperCaseAlphabets: true,
};