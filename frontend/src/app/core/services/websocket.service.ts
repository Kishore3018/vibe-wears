import { Injectable, signal } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: WebSocket | null = null;
  private messageSubject = new Subject<WebSocketMessage>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  
  // Connection state
  private connectedSignal = signal<boolean>(false);
  readonly isConnected = this.connectedSignal.asReadonly();
  
  // Observable for messages
  readonly messages$: Observable<WebSocketMessage> = this.messageSubject.asObservable();

  constructor() {}

  connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }
    
    const token = localStorage.getItem('access_token');
    const wsUrl = token 
      ? `${environment.wsUrl}?token=${token}` 
      : environment.wsUrl;
    
    try {
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.connectedSignal.set(true);
        this.reconnectAttempts = 0;
        this.startHeartbeat();
      };
      
      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.messageSubject.next(message);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        this.connectedSignal.set(false);
        this.attemptReconnect();
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  send(message: any): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  subscribeToProduct(productId: number): void {
    this.send({
      type: 'subscribe_product',
      product_id: productId
    });
  }

  unsubscribeFromProduct(productId: number): void {
    this.send({
      type: 'unsubscribe_product',
      product_id: productId
    });
  }

  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'stock_update':
        console.log('Stock updated:', message.data);
        break;
      case 'price_update':
        console.log('Price updated:', message.data);
        break;
      case 'order_update':
        console.log('Order updated:', message.data);
        break;
      case 'flash_sale':
        console.log('Flash sale:', message.data);
        break;
      case 'pong':
        // Heartbeat response
        break;
    }
  }

  private startHeartbeat(): void {
    setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, 30000);
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay);
    }
  }
}
