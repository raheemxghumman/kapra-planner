export const EMAIL_SENDER = Symbol('EMAIL_SENDER');

export interface EmailMessage {
  to: string;
  subject: string;
  /** Plain text body; also used to build the simple HTML version. */
  text: string;
}

/**
 * Sends transactional email (receipts, booking updates). Bound to a console logger for now;
 * Resend will be bound here once the project has its own domain. Nothing else changes.
 */
export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}
