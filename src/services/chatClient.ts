import { Client } from '@stomp/stompjs';

interface ChatClientConfig {
  brokerURL?: string;
  reconnectDelay?: number;
  heartbeatIncoming?: number;
  heartbeatOutgoing?: number;
  debug?: boolean;
  headers?: Record<string, string>;
}

// CORREÇÃO: Adicionado 'export'
export interface ChatMessage {
  id?: string;
  message: string;
  senderId: string | number;
  senderName?: string;
  timestamp?: string;
  tutoringId: string | number;
  type?: string;
  receiverId?: string | number | null;
  status?: 'sending' | 'sent' | 'received' | 'read' | 'failed';
}

// CORREÇÃO: Adicionado 'export'
export interface ChatSubscriptionOptions {
  subscribeGeneral?: boolean;
  privateWith?: string | number;
}

// CORREÇÃO: Adicionado 'export'
export interface UserInfo {
  id: string | number;
  [key: string]: any;
}

class MentorChatClient {
  private config: Required<ChatClientConfig>;
  private stompClient: Client | null;
  private subscriptions: Map<string, any>;
  private connected: boolean;
  private currentUser: UserInfo | null;
  private currentTutoringId: string | number | null;
  private messageHandlers: Map<string, (message: ChatMessage, type: string, tutoringId: string | number) => void>;
  private connectionHandlers: {
    onConnect: Array<(frame: any) => void>;
    onDisconnect: Array<(frame: any) => void>;
    onError: Array<(error: any) => void>;
  };

  constructor(config: ChatClientConfig = {}) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = '56.124.113.58'; // Em produção, será '56.124.113.58'
    const dynamicBrokerURL = `${protocol}//${host}/seumentor-websocket/`;
    console.log("Tentando conectar ao WebSocket em:", dynamicBrokerURL);

    this.config = {
      brokerURL: dynamicBrokerURL, 
      reconnectDelay: config.reconnectDelay || 5000,
      heartbeatIncoming: config.heartbeatIncoming || 4000,
      heartbeatOutgoing: config.heartbeatOutgoing || 4000,
      debug: config.debug || true,
      headers: config.headers || {},
    };

    this.stompClient = null;
    this.subscriptions = new Map();
    this.connected = false;
    this.currentUser = null;
    this.currentTutoringId = null;
    this.messageHandlers = new Map();
    this.connectionHandlers = {
      onConnect: [],
      onDisconnect: [],
      onError: [],
    };
  }

  private beforeConnect(): void {
    const token = localStorage.getItem('authToken');
    if (token && this.stompClient) {
      this.stompClient.connectHeaders = {
        ...this.stompClient.connectHeaders,
        Authorization: `Bearer ${token}`,
      };
    }
  }

  setCurrentUser(userId: string | number | null = null, userInfo: Partial<UserInfo> = {}): boolean {
    const storedUserId = userId || localStorage.getItem('userId');
    if (!storedUserId) {
      console.error('ID do usuário não fornecido e não encontrado no localStorage');
      return false;
    }
    this.currentUser = {
      id: storedUserId,
      ...userInfo,
    };
    return true;
  }

  setCurrentTutoring(tutoringId: string | number): void {
    this.currentTutoringId = tutoringId;
  }

  async connect(): Promise<any> {
    if (this.stompClient && this.connected) {
      console.warn('Já está conectado ao WebSocket');
      return Promise.resolve();
    }

    const token = localStorage.getItem('authToken');
    const connectHeaders = {
      ...this.config.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    return new Promise((resolve, reject) => {
      this.stompClient = new Client({
        brokerURL: this.config.brokerURL,
        connectHeaders,
        debug: (str: string) => {
          if (this.config.debug) {
            console.log('[STOMP Debug]', str);
          }
        },
        reconnectDelay: this.config.reconnectDelay,
        heartbeatIncoming: this.config.heartbeatIncoming,
        heartbeatOutgoing: this.config.heartbeatOutgoing,
        beforeConnect: this.beforeConnect.bind(this),
      });

      this.stompClient.onConnect = (frame: any) => {
        console.log('Conectado ao WebSocket:', frame);
        this.connected = true;
        this._executeHandlers('onConnect', frame);
        resolve(frame);
      };

      this.stompClient.onStompError = (frame: any) => {
        console.error('Erro STOMP:', frame.headers['message']);
        console.error('Detalhes:', frame.body);
        this._executeHandlers('onError', frame);
        reject(frame);
      };

      this.stompClient.onWebSocketError = (error: any) => {
        console.error('Erro WebSocket:', error);
        this._executeHandlers('onError', error);
        reject(error);
      };

      this.stompClient.onDisconnect = (frame: any) => {
        console.log('Desconectado do WebSocket');
        this.connected = false;
        this._executeHandlers('onDisconnect', frame);
      };

      this.stompClient.activate();
    });
  }

  async initialize(): Promise<boolean> {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      this.setCurrentUser(userId);
      await this.connect();
      return true;
    } catch (error) {
      console.error('Erro ao inicializar chat:', error);
      throw error;
    }
  }

  disconnect(): void {
    if (this.stompClient) {
      this.subscriptions.forEach((subscription, key) => {
        subscription.unsubscribe();
        console.log(`Inscrição cancelada: ${key}`);
      });
      this.subscriptions.clear();

      this.stompClient.deactivate();
      this.connected = false;
      console.log('Desconectado do WebSocket');
    }
  }

  subscribeTutoring(tutoringId: string | number, options: ChatSubscriptionOptions = {}): void {
    if (!this.connected || !this.stompClient) {
      console.error('WebSocket não está conectado');
      return;
    }

    if (options.subscribeGeneral !== false) {
      const generalTopic = `/topic/tutoring/${tutoringId}/general`;
      const generalSub = this._subscribe(generalTopic, (message: any) => {
        const handler = this.messageHandlers.get('general');
        if (handler) {
          handler(JSON.parse(message.body), 'general', tutoringId);
        }
      });
    }

    if (options.privateWith && this.currentUser) {
      const userAId = Math.min(Number(this.currentUser.id), Number(options.privateWith));
      const userBId = Math.max(Number(this.currentUser.id), Number(options.privateWith));
      const privateTopic = `/topic/tutoring/${tutoringId}/private/${userAId}-${userBId}`;

      const privateSub = this._subscribe(privateTopic, (message: any) => {
        const handler = this.messageHandlers.get('private');
        if (handler) {
          handler(JSON.parse(message.body), 'private', tutoringId);
        }
      });
    }
  }

  private _subscribe(topic: string, callback: (message: any) => void): any {
    if (!this.stompClient) return null;

    if (this.subscriptions.has(topic)) {
      console.warn(`Já inscrito no tópico: ${topic}`);
      return this.subscriptions.get(topic);
    }

    const subscription = this.stompClient.subscribe(topic, callback);
    this.subscriptions.set(topic, subscription);
    console.log(`Inscrito no tópico: ${topic}`);
    return subscription;
  }

  sendMessage(tutoringId: string | number, message: string, type: string = 'GENERAL', receiverId: string | number | null = null): boolean {
    if (!this.connected || !this.stompClient || !this.currentUser) {
      console.error('WebSocket não está conectado ou usuário não configurado');
      return false;
    }

    const chatInput: ChatMessage = {
      tutoringId: Number(tutoringId),
      senderId: Number(this.currentUser.id),
      message,
      type: type.toUpperCase(),
      receiverId: receiverId ? Number(receiverId) : null,
    };

    const destination = `/app/chat/tutoring/${tutoringId}/send`;

    try {
      this.stompClient.publish({
        destination,
        body: JSON.stringify(chatInput),
      });
      console.log('Mensagem enviada:', chatInput);
      return true;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      return false;
    }
  }

  sendGeneralMessage(message: string, tutoringId: string | number | null = null): boolean {
    const targetTutoringId = tutoringId || this.currentTutoringId;
    if (!targetTutoringId) {
      console.error('ID da mentoria não especificado');
      return false;
    }
    return this.sendMessage(targetTutoringId, message, 'GENERAL');
  }

  sendPrivateMessage(message: string, receiverId: string | number, tutoringId: string | number | null = null): boolean {
    const targetTutoringId = tutoringId || this.currentTutoringId;
    if (!targetTutoringId) {
      console.error('ID da mentoria não especificado');
      return false;
    }
    return this.sendMessage(targetTutoringId, message, 'PRIVATE', receiverId);
  }

  onMessage(type: string, handler: (message: ChatMessage, type: string, tutoringId: string | number) => void): void {
    if (typeof handler !== 'function') {
      console.error('Handler deve ser uma função');
      return;
    }
    this.messageHandlers.set(type, handler);
  }

  onConnect(handler: (frame: any) => void): void {
    this.connectionHandlers.onConnect.push(handler);
  }

  onDisconnect(handler: (frame: any) => void): void {
    this.connectionHandlers.onDisconnect.push(handler);
  }

  onError(handler: (error: any) => void): void {
    this.connectionHandlers.onError.push(handler);
  }

  private _executeHandlers(type: 'onConnect' | 'onDisconnect' | 'onError', data: any): void {
    const handlers = this.connectionHandlers[type] || [];
    handlers.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Erro ao executar handler ${type}:`, error);
      }
    });
  }

  isConnected(): boolean {
    return this.connected;
  }

  unsubscribe(topic: string): boolean {
    const subscription = this.subscriptions.get(topic);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(topic);
      console.log(`Inscrição cancelada: ${topic}`);
      return true;
    }
    return false;
  }

  async reconnect(): Promise<any> {
    this.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return this.connect();
  }

  clearUserData(): void {
    this.currentUser = null;
    this.currentTutoringId = null;
    this.disconnect();
  }
}

export default MentorChatClient;