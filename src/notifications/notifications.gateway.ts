import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const { userId } = client.handshake.query;

    if (!userId) {
      client.disconnect();
      return;
    }

    client.join(userId.toString());
    console.log(`✅ User ${userId} connected to WebSocket`);
  }

  sendNotificationToUser(userId: string, message: string) {
    this.server.to(userId).emit('notification', {
      message,
      timestamp: new Date(),
    });
  }
}
