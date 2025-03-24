import { User, Channel, Message } from "@shared/schema";

interface SocketResponse {
  type: string;
  [key: string]: any;
}

type MessageHandler = (data: any) => void;

class ChatSocket {
  private socket: WebSocket | null = null;
  private messageHandlers: Record<string, MessageHandler[]> = {};
  private reconnectInterval: number = 3000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private userId: number | null = null;

  constructor() {
    this.setupSocketEvents = this.setupSocketEvents.bind(this);
  }

  connect(userId: number) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log("Socket already connected");
      return;
    }

    this.userId = userId;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    this.socket = new WebSocket(wsUrl);
    this.setupSocketEvents();
  }

  private setupSocketEvents() {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log("Socket connected");
      this.stopReconnect();
      
      // Authenticate with the server
      if (this.userId) {
        this.send('auth', { userId: this.userId });
      }
      
      // Trigger handlers for connection event
      this.triggerHandlers('connect', {});
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Socket message:", data);
        
        if (data.type) {
          this.triggerHandlers(data.type, data);
        }
      } catch (error) {
        console.error("Error parsing socket message:", error);
      }
    };

    this.socket.onclose = () => {
      console.log("Socket disconnected");
      this.triggerHandlers('disconnect', {});
      this.startReconnect();
    };

    this.socket.onerror = (error) => {
      console.error("Socket error:", error);
      this.triggerHandlers('error', { error });
    };
  }

  private startReconnect() {
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(() => {
        console.log("Attempting to reconnect...");
        this.connect(this.userId!);
      }, this.reconnectInterval);
    }
  }

  private stopReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  send(type: string, data: any = {}) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error("Socket not connected");
      return;
    }

    this.socket.send(JSON.stringify({ type, ...data }));
  }

  on(event: string, handler: MessageHandler) {
    if (!this.messageHandlers[event]) {
      this.messageHandlers[event] = [];
    }
    
    this.messageHandlers[event].push(handler);
    return this;
  }

  off(event: string, handler?: MessageHandler) {
    if (!handler) {
      // Remove all handlers for this event
      delete this.messageHandlers[event];
    } else if (this.messageHandlers[event]) {
      // Remove specific handler
      this.messageHandlers[event] = this.messageHandlers[event].filter(h => h !== handler);
    }
    
    return this;
  }

  private triggerHandlers(event: string, data: any) {
    const handlers = this.messageHandlers[event];
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in ${event} handler:`, error);
        }
      });
    }
  }

  fetchChannelMessages(channelId: number) {
    this.send('fetch_channel_messages', { channelId });
  }

  fetchDirectMessages(userId: number) {
    this.send('fetch_direct_messages', { userId });
  }

  sendMessage(content: string, image?: string, channelId?: number, receiverId?: number) {
    this.send('message', {
      content,
      image,
      channelId,
      receiverId
    });
  }

  createChannel(name: string, description: string) {
    this.send('create_channel', {
      name,
      description
    });
  }

  joinChannel(channelId: number) {
    this.send('join_channel', { channelId });
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.stopReconnect();
  }
}

export const chatSocket = new ChatSocket();
