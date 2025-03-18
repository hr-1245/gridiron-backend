import { Injectable } from '@nestjs/common';

import * as nodemailer from 'nodemailer';
import { MailOptions } from './types';


@Injectable()
export class mailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendMail({ mailOptions }: { mailOptions: MailOptions }): Promise<void> {
    if (!mailOptions.from) mailOptions.from = process.env.SMTP_EMAIL;

    const test = await this.transporter.sendMail(mailOptions);

  }
}