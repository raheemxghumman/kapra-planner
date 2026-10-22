import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WebSocketGateway, WebSocketServer, type OnGatewayConnection } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { UserStatus } from '../../common/enums/user-status.enum.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { UsersService } from '../users/users.service.js';

/** Private room of one user; everything for them is sent there (all their open tabs get it). */
export const userRoom = (userId: string) => `user:${userId}`;

/**
 * Socket.IO server for live notifications, chat messages and booking updates.
 * The browser connects with { auth: { token: <access token> } }; the token is checked exactly
 * like a REST request, then the socket joins its user's private room. Clients never choose
 * rooms themselves, so nobody can listen to another user's events.
 */
@WebSocketGateway({ path: '/socket.io' })
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  private server: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = (client.handshake.auth as { token?: string })?.token;
      if (!token) throw new Error('no token');
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      const user = await this.usersService.findById(payload.sub);
      if (!user || user.status === UserStatus.Suspended) throw new Error('user not allowed');
      client.data.userId = user.id;
      await client.join(userRoom(user.id));
    } catch {
      client.emit('auth_error', { message: 'Please sign in again' });
      client.disconnect(true);
    }
  }

  /** Sends an event to every open connection of these users. */
  emitToUsers(userIds: string[], event: string, payload: unknown): void {
    if (!this.server) return; // e.g. inside seed scripts, where no socket server runs
    this.server.to(userIds.map(userRoom)).emit(event, payload);
  }
}
