import { Global, Module } from '@nestjs/common';
import { ConsoleEmailSender } from './console-email.sender.js';
import { EMAIL_SENDER } from './email.types.js';

/** Binds EMAIL_SENDER. Swap ConsoleEmailSender for a Resend sender when the domain is ready. */
@Global()
@Module({
  providers: [{ provide: EMAIL_SENDER, useClass: ConsoleEmailSender }],
  exports: [EMAIL_SENDER],
})
export class EmailModule {}
