import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { logger } from './logger';

interface Client {
  ws: WebSocket;
  userId: string;
  subscriptions: Set<string>; // case IDs, task IDs, etc.
}

const clients = new Map<string, Client>();

export interface BroadcastEvent {
  type: 'case-updated' | 'task-updated' | 'client-created' | 'notification';
  payload: unknown;
  targetId?: string; // case ID, task ID, etc.
}

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const clientId = Math.random().toString(36).substring(7);
    logger.info(`WebSocket client connected: ${clientId}`);

    const client: Client = {
      ws,
      userId: '',
      subscriptions: new Set(),
    };

    clients.set(clientId, client);

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case 'auth':
            client.userId = message.userId;
            ws.send(JSON.stringify({ type: 'auth-success', clientId }));
            logger.info(`Client ${clientId} authenticated as user ${message.userId}`);
            break;

          case 'subscribe':
            if (Array.isArray(message.ids)) {
              message.ids.forEach((id: string) => client.subscriptions.add(id));
              ws.send(JSON.stringify({ type: 'subscribed', ids: message.ids }));
              logger.debug(`Client ${clientId} subscribed to ${message.ids.join(', ')}`);
            }
            break;

          case 'unsubscribe':
            if (Array.isArray(message.ids)) {
              message.ids.forEach((id: string) => client.subscriptions.delete(id));
              ws.send(JSON.stringify({ type: 'unsubscribed', ids: message.ids }));
            }
            break;

          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;

          default:
            logger.warn(`Unknown message type from client ${clientId}:`, message.type);
        }
      } catch (error) {
        logger.error('Error processing WebSocket message:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      logger.info(`WebSocket client disconnected: ${clientId}`);
      clients.delete(clientId);
    });

    ws.on('error', (error) => {
      logger.error(`WebSocket error for client ${clientId}:`, error);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      clientId,
      message: 'Connected to Dr. Juro real-time updates',
    }));
  });

  logger.info('WebSocket server initialized on /ws');

  return wss;
}

/**
 * Broadcast event to subscribed clients
 */
export function broadcast(event: BroadcastEvent) {
  const message = JSON.stringify(event);

  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      // Send to all if no targetId, or to subscribed clients
      if (!event.targetId || client.subscriptions.has(event.targetId)) {
        client.ws.send(message);
      }
    }
  });

  logger.debug(`Broadcasted event: ${event.type} to ${clients.size} clients`);
}

/**
 * Send event to specific user
 */
export function sendToUser(userId: string, event: BroadcastEvent) {
  const message = JSON.stringify(event);

  clients.forEach((client) => {
    if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  });

  logger.debug(`Sent event to user ${userId}: ${event.type}`);
}
