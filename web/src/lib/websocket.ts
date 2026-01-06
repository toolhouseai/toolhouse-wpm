/**
 * WebSocket client for real-time game communication
 */

import type { BaseMessage, WebSocketMessageType } from '../../../src/game/protocol';

export type MessageHandler = (message: BaseMessage) => void;
export type ErrorHandler = (error: Event) => void;
export type OpenHandler = () => void;
export type CloseHandler = () => void;

export enum ConnectionState {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected',
  Reconnecting = 'reconnecting',
  Failed = 'failed',
}

interface ConnectionConfig {
  maxRetries?: number;
  retryDelay?: number; // ms
  url: string;
}

export class GameWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private state: ConnectionState = ConnectionState.Disconnected;
  private retryCount = 0;
  private maxRetries = 5;
  private retryDelay = 1000;
  private messageHandlers: Map<WebSocketMessageType, MessageHandler[]> = new Map();
  private errorHandlers: ErrorHandler[] = [];
  private openHandlers: OpenHandler[] = [];
  private closeHandlers: CloseHandler[] = [];
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageQueue: BaseMessage[] = [];

  constructor(config: ConnectionConfig) {
    this.url = config.url;
    this.maxRetries = config.maxRetries || 5;
    this.retryDelay = config.retryDelay || 1000;
  }

  /**
   * Connect to the WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.setState(ConnectionState.Connecting);
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.setState(ConnectionState.Connected);
          this.retryCount = 0;
          this.flushMessageQueue();
          this.startHeartbeat();
          this.openHandlers.forEach(handler => handler());
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as BaseMessage;
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error) => {
          this.handleError(error);
          reject(error);
        };

        this.ws.onclose = () => {
          this.stopHeartbeat();
          this.handleClose();
        };
      } catch (error) {
        this.setState(ConnectionState.Failed);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setState(ConnectionState.Disconnected);
  }

  /**
   * Send a message to the server
   */
  send(message: BaseMessage): void {
    if (this.state === ConnectionState.Connected && this.ws) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message if not connected
      this.messageQueue.push(message);
    }
  }

  /**
   * Subscribe to a message type
   */
  on(type: WebSocketMessageType, handler: MessageHandler): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }

  /**
   * Unsubscribe from a message type
   */
  off(type: WebSocketMessageType, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Subscribe to connection open event
   */
  onOpen(handler: OpenHandler): void {
    this.openHandlers.push(handler);
  }

  /**
   * Subscribe to connection close event
   */
  onClose(handler: CloseHandler): void {
    this.closeHandlers.push(handler);
  }

  /**
   * Subscribe to connection error event
   */
  onError(handler: ErrorHandler): void {
    this.errorHandlers.push(handler);
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state === ConnectionState.Connected;
  }

  /**
   * Private methods
   */

  private setState(newState: ConnectionState): void {
    this.state = newState;
  }

  private handleMessage(message: BaseMessage): void {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error(`Error in handler for ${message.type}:`, error);
        }
      });
    }
  }

  private handleError(error: Event): void {
    console.error('WebSocket error:', error);
    this.setState(ConnectionState.Failed);
    this.errorHandlers.forEach(handler => {
      try {
        handler(error);
      } catch (err) {
        console.error('Error in error handler:', err);
      }
    });
    this.attemptReconnect();
  }

  private handleClose(): void {
    this.setState(ConnectionState.Disconnected);
    this.closeHandlers.forEach(handler => {
      try {
        handler();
      } catch (error) {
        console.error('Error in close handler:', error);
      }
    });
    this.attemptReconnect();
  }

  private attemptReconnect(): void {
    if (this.retryCount >= this.maxRetries) {
      this.setState(ConnectionState.Failed);
      console.error('Max reconnection attempts reached');
      return;
    }

    this.setState(ConnectionState.Reconnecting);
    this.retryCount++;

    const delay = this.retryDelay * Math.pow(2, this.retryCount - 1);
    this.reconnectTimeout = setTimeout(() => {
      console.log(`Attempting to reconnect (attempt ${this.retryCount}/${this.maxRetries})`);
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        // Send a simple ping message to keep connection alive
        // This prevents timeout on idle connections
      }
    }, 30000); // Every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}
