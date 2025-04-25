import { HttpStatus, Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { otpEntity } from "./entity/otp.entity";
import { Repository } from 'typeorm';
import { OTP_REASON_ENUM } from "src/types/enums/otp";
import { userEntity } from "../user/entity/user.entity";
import { generateOTP, NUMERICAL_OTP } from ".";
import { mailService } from "../mail/mail.service";
import verifyTemplate from "../mail/template/verify-otp";

@Injectable()
export class otpService {
  constructor(
    @InjectRepository(otpEntity)
    private readonly otpRepo: Repository<otpEntity>,

    private readonly mailService: mailService,

    @InjectRepository(userEntity)
    private readonly userRepo: Repository<userEntity>
  ) { }

  /**
   * Generates an OTP code for a user
   * @param email User's email address
   * @param reason Reason for OTP generation
   * @returns Generated OTP code
   */
  async generateOtpCode({ email, reason }: { email: string, reason: OTP_REASON_ENUM }): Promise<number> {
    const user = await this.userRepo.findOne({
      where: { email }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const { id } = user;

    // Remove any existing OTPs for this user and reason
    const otp_requested_by_user = await this.otpRepo.find({
      where: { user: { id }, type: reason }
    });

    await this.otpRepo.remove(otp_requested_by_user);

    // Generate a new OTP code
    const code: number | string = generateOTP({
      length: 6,
      options: NUMERICAL_OTP,
    }) as number;

    // Create OTP record in database
    await this.create({
      email,
      otp: code,
      is_used: false,
      is_expired: false,
      type: reason,
      user: { id } as userEntity
    });

    // Send email with OTP
    this.mailService.sendMail({
      mailOptions: {
        to: email,
        subject: 'Your One-Time Password (OTP) for Verification',
        html: verifyTemplate(email, code)
      }
    });

    return code;
  }
  async findByOtp(otp: number): Promise<otpEntity | null> {
    return this.otpRepo.findOne({
      where: { otp },
      relations: ['user']
    });
  }
  /**
   * Creates an OTP record in the database
   * @param data OTP entity data
   * @returns Created OTP entity
   */
  async create(data: Partial<otpEntity>): Promise<otpEntity> {
    // Calculate the expiry time 5 minutes from now
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 5);

    // Set the expiry time in the data
    data.expires_at = expiry;

    // Save the OTP entry in the database
    return this.otpRepo.save(data);
  }
  /**
   * Deletes an OTP record from the database
   * @param id ID of the OTP record to delete
   * @returns Result of the deletion operation
   */
  async deleteOtp(id: number): Promise<void> {
    await this.otpRepo.delete(id);
  }

  /**
   * Verifies an OTP code
   * @param otp OTP code to verify
   * @param email User's email address
   * @returns Status and message
   */
  async verifyOtpCode({ otp, email }: { otp: number, email: string }): Promise<{ status: HttpStatus; message: string }> {
    const otp_record = await this.otpRepo.findOne({
      where: {
        otp, email
      }
    });

    if (!otp_record) {
      throw new UnauthorizedException('Invalid OTP');
    }

    if (otp_record.is_expired) {
      throw new UnauthorizedException('OTP has expired');
    }

    if (otp_record.is_used) {
      throw new UnauthorizedException('OTP has already been used');
    }

    const currentTime = new Date().getTime();
    const expiry_date = new Date(otp_record.expires_at).getTime();

    if (expiry_date < currentTime) {
      this.otpRepo.update(
        { email, otp },
        { is_expired: true, is_used: true },
      );
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'OTP code has expired',
      };
    }

    this.otpRepo.update({ email, otp }, { is_used: true });

    return { status: HttpStatus.OK, message: 'OTP code is valid' };
  }
}