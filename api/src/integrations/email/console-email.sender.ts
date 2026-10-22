import { Injectable, Logger } from '@nestjs/common';
import type { EmailMessage, EmailSender } from './email.types.js';

/** Development sender: writes the email to the server log instead of sending it. */
@Injectable()
export class ConsoleEmailSender implements EmailSender {
  private readonly logger = new Logger('Email');

  send(message: EmailMessage): Promise<void> {
    this.logger.log(`To ${message.to}: "${message.subject}"\n${message.text}`);
    return Promise.resolve();
  }
}
