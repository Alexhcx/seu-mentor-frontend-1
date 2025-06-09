import { Client } from "@stomp/stompjs";

class MentorChatClient {
  constructor(config = {}) {
    this.config = {
      brokerURL:
        config.brokerURL || `ws://localhost:8080/buildrun-livechat-websocket`,
      reconnectDelay: config.reconnectDelay || 5000,
      heartbeatIncoming: config.heartbeatIncoming || 4000,
      heartbeatOutgoing: config.heartbeatOutgoing || 4000,
      ...config,
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

    // Função para atualizar o token antes de conectar
    this.beforeConnect = () => {
      const token = localStorage.getItem("authToken");
      if (token && this.stompClient) {
        this.stompClient.connectHeaders = {
          ...this.stompClient.connectHeaders,
          Authorization: `Bearer ${token}`,
        };
      }
    };
  }

  // Configurar informações do usuário atual
  setCurrentUser(userId = null, userInfo = {}) {
    const storedUserId = userId || localStorage.getItem("userId");
    if (!storedUserId) {
      console.error(
        "ID do usuário não fornecido e não encontrado no localStorage"
      );
      return false;
    }
    this.currentUser = {
      id: storedUserId,
      ...userInfo,
    };
    return true;
  }

  // Configurar a mentoria atual
  setCurrentTutoring(tutoringId) {
    this.currentTutoringId = tutoringId;
  }

  // Conectar ao WebSocket
  connect() {
    if (this.stompClient && this.connected) {
      console.warn("Já está conectado ao WebSocket");
      return Promise.resolve();
    }

    // Pegar o token do localStorage
    const token = localStorage.getItem("authToken");
    const connectHeaders = {
      ...this.config.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    return new Promise((resolve, reject) => {
      this.stompClient = new Client({
        brokerURL: this.config.brokerURL,
        connectHeaders: connectHeaders,
        debug: (str) => {
          if (this.config.debug) {
            console.log("[STOMP Debug]", str);
          }
        },
        reconnectDelay: this.config.reconnectDelay,
        heartbeatIncoming: this.config.heartbeatIncoming,
        heartbeatOutgoing: this.config.heartbeatOutgoing,
        beforeConnect: this.beforeConnect,
      });

      this.stompClient.onConnect = (frame) => {
        console.log("Conectado ao WebSocket:", frame);
        this.connected = true;
        this._executeHandlers("onConnect", frame);
        resolve(frame);
      };

      this.stompClient.onStompError = (frame) => {
        console.error("Erro STOMP:", frame.headers["message"]);
        console.error("Detalhes:", frame.body);
        this._executeHandlers("onError", frame);
        reject(frame);
      };

      this.stompClient.onWebSocketError = (error) => {
        console.error("Erro WebSocket:", error);
        this._executeHandlers("onError", error);
        reject(error);
      };

      this.stompClient.onDisconnect = (frame) => {
        console.log("Desconectado do WebSocket");
        this.connected = false;
        this._executeHandlers("onDisconnect", frame);
      };

      this.stompClient.activate();
    });
  }

  // Método de inicialização conveniente
  async initialize() {
    try {
      // Configurar usuário automaticamente
      const userId = localStorage.getItem("userId");
      if (!userId) {
        throw new Error("Usuário não autenticado");
      }

      this.setCurrentUser(userId);

      // Conectar
      await this.connect();

      return true;
    } catch (error) {
      console.error("Erro ao inicializar chat:", error);
      throw error;
    }
  }

  // Desconectar do WebSocket
  disconnect() {
    if (this.stompClient) {
      // Cancelar todas as inscrições
      this.subscriptions.forEach((subscription, key) => {
        subscription.unsubscribe();
        console.log(`Inscrição cancelada: ${key}`);
      });
      this.subscriptions.clear();

      this.stompClient.deactivate();
      this.connected = false;
      console.log("Desconectado do WebSocket");
    }
  }

  // Inscrever-se em um canal de mentoria
  subscribeTutoring(tutoringId, options = {}) {
    if (!this.connected) {
      console.error("WebSocket não está conectado");
      return null;
    }

    const subscriptions = [];

    // Inscrever-se no canal geral da mentoria
    if (options.subscribeGeneral !== false) {
      const generalTopic = `/topic/tutoring/${tutoringId}/general`;
      const generalSub = this._subscribe(generalTopic, (message) => {
        const handler = this.messageHandlers.get("general");
        if (handler) {
          handler(JSON.parse(message.body), "general", tutoringId);
        }
      });
      subscriptions.push({ type: "general", subscription: generalSub });
    }

    // Inscrever-se no canal privado se especificado
    if (options.privateWith && this.currentUser) {
      const userAId = Math.min(
        Number(this.currentUser.id),
        Number(options.privateWith)
      );
      const userBId = Math.max(
        Number(this.currentUser.id),
        Number(options.privateWith)
      );
      const privateTopic = `/topic/tutoring/${tutoringId}/private/${userAId}-${userBId}`;

      const privateSub = this._subscribe(privateTopic, (message) => {
        const handler = this.messageHandlers.get("private");
        if (handler) {
          handler(JSON.parse(message.body), "private", tutoringId);
        }
      });
      subscriptions.push({ type: "private", subscription: privateSub });
    }

    return subscriptions;
  }

  // Método interno para inscrever-se em um tópico
  _subscribe(topic, callback) {
    if (this.subscriptions.has(topic)) {
      console.warn(`Já inscrito no tópico: ${topic}`);
      return this.subscriptions.get(topic);
    }

    const subscription = this.stompClient.subscribe(topic, callback);
    this.subscriptions.set(topic, subscription);
    console.log(`Inscrito no tópico: ${topic}`);
    return subscription;
  }

  // Enviar mensagem para uma mentoria
  sendMessage(tutoringId, message, type = "GENERAL", receiverId = null) {
    if (!this.connected) {
      console.error("WebSocket não está conectado");
      return false;
    }

    if (!this.currentUser) {
      console.error("Usuário não configurado");
      return false;
    }

    const chatInput = {
      tutoringId: Number(tutoringId),
      senderId: Number(this.currentUser.id),
      message: message,
      type: type.toUpperCase(),
      receiverId: receiverId ? Number(receiverId) : null,
    };

    const destination = `/app/chat/tutoring/${tutoringId}/send`;

    try {
      this.stompClient.publish({
        destination: destination,
        body: JSON.stringify(chatInput),
      });
      console.log("Mensagem enviada:", chatInput);
      return true;
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      return false;
    }
  }

  // Enviar mensagem geral
  sendGeneralMessage(message, tutoringId = null) {
    const targetTutoringId = tutoringId || this.currentTutoringId;
    if (!targetTutoringId) {
      console.error("ID da mentoria não especificado");
      return false;
    }
    return this.sendMessage(targetTutoringId, message, "GENERAL");
  }

  // Enviar mensagem privada
  sendPrivateMessage(message, receiverId, tutoringId = null) {
    const targetTutoringId = tutoringId || this.currentTutoringId;
    if (!targetTutoringId) {
      console.error("ID da mentoria não especificado");
      return false;
    }
    return this.sendMessage(targetTutoringId, message, "PRIVATE", receiverId);
  }

  // Registrar handler para mensagens
  onMessage(type, handler) {
    if (typeof handler !== "function") {
      console.error("Handler deve ser uma função");
      return;
    }
    this.messageHandlers.set(type, handler);
  }

  // Registrar handlers de conexão
  onConnect(handler) {
    this.connectionHandlers.onConnect.push(handler);
  }

  onDisconnect(handler) {
    this.connectionHandlers.onDisconnect.push(handler);
  }

  onError(handler) {
    this.connectionHandlers.onError.push(handler);
  }

  // Executar handlers
  _executeHandlers(type, data) {
    const handlers = this.connectionHandlers[type] || [];
    handlers.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Erro ao executar handler ${type}:`, error);
      }
    });
  }

  // Verificar se está conectado
  isConnected() {
    return this.connected;
  }

  // Cancelar inscrição específica
  unsubscribe(topic) {
    const subscription = this.subscriptions.get(topic);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(topic);
      console.log(`Inscrição cancelada: ${topic}`);
      return true;
    }
    return false;
  }

  // Método auxiliar para reconectar com token atualizado
  async reconnect() {
    this.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Aguardar 1 segundo
    return this.connect();
  }

  // Limpar dados do usuário (útil para logout)
  clearUserData() {
    this.currentUser = null;
    this.currentTutoringId = null;
    this.disconnect();
  }
}

export default MentorChatClient;
