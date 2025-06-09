// src/stores/chat.js
import { defineStore } from "pinia";
import MentorChatClient from "@/services/chatClient";
import {
  getUserMentoringSessions,
  getUserParticipationSessions,
} from "@/services/userService";
import { getChatHistoryByTutoringId } from "@/services/chatHistoryService";
import { showSnackbar } from "@/components/AppSnackbar.vue";

export const useChatStore = defineStore("chat", {
  state: () => ({
    // Cliente de chat
    chatClient: null,
    isConnected: false,

    // Dados das mentorias
    mentoriasMentor: [],
    mentoriasMentorado: [],

    // Estado do chat
    chatListOpen: false,
    selectedChat: null,
    messages: new Map(), // Map<chatId, Message[]>
    unreadMessages: new Map(), // Map<chatId, count>

    // Notificações
    notifications: [],
    showNotification: false,
    lastNotification: null,

    // Controle de notificação ativa
    notificationTimeout: null,
    lastNotificationId: null,

    // Loading states
    isLoadingMentorias: false,
    isLoadingMessages: false,
    isSendingMessage: false,

    // Configurações
    notificationsEnabled: true,
    soundEnabled: true,

    // Usuário atual
    currentUserId: null,
  }),

  getters: {
    // Todas as mentorias combinadas em formato de chat
    allChats(state) {
      const chats = [];

      // Mentorias onde sou mentor
      state.mentoriasMentor.forEach((mentoria) => {
        if (mentoria.isChatEnable) {
          chats.push({
            ...mentoria,
            id: `mentor_${mentoria.id}`,
            originalId: mentoria.id,
            role: "mentor",
            title: mentoria.disciplineName,
            subtitle: `Você é mentor • ${
              mentoria.participants?.length || 0
            } participante(s)`,
            avatar:
              mentoria.participants?.[0]?.userAvatar || "/placeholder-user.jpg",
            otherUserName: mentoria.participants?.[0]?.userName || "Mentorado",
            lastMessage:
              state.messages.get(`mentor_${mentoria.id}`)?.[
                state.messages.get(`mentor_${mentoria.id}`)?.length - 1
              ]?.message || "",
            lastMessageTime:
              state.messages.get(`mentor_${mentoria.id}`)?.[
                state.messages.get(`mentor_${mentoria.id}`)?.length - 1
              ]?.timestamp || null,
            unreadCount: state.unreadMessages.get(`mentor_${mentoria.id}`) || 0,
          });
        }
      });

      // Mentorias onde sou mentorado
      state.mentoriasMentorado.forEach((mentoria) => {
        if (mentoria.isChatEnable) {
          chats.push({
            ...mentoria,
            id: `mentorado_${mentoria.id}`,
            originalId: mentoria.id,
            role: "mentorado",
            title: mentoria.disciplineName,
            subtitle: `Mentor: ${mentoria.mentorName}`,
            avatar: mentoria.mentorAvatar || "/placeholder-user.jpg",
            otherUserName: mentoria.mentorName,
            lastMessage:
              state.messages.get(`mentorado_${mentoria.id}`)?.[
                state.messages.get(`mentorado_${mentoria.id}`)?.length - 1
              ]?.message || "",
            lastMessageTime:
              state.messages.get(`mentorado_${mentoria.id}`)?.[
                state.messages.get(`mentorado_${mentoria.id}`)?.length - 1
              ]?.timestamp || null,
            unreadCount:
              state.unreadMessages.get(`mentorado_${mentoria.id}`) || 0,
          });
        }
      });

      return chats.sort((a, b) => {
        const timeA = new Date(a.lastMessageTime || a.tutoringDate);
        const timeB = new Date(b.lastMessageTime || b.tutoringDate);
        return timeB - timeA;
      });
    },

    hasActiveChats(state) {
      return this.allChats.length > 0;
    },

    totalUnreadCount(state) {
      let total = 0;
      state.unreadMessages.forEach((count) => {
        total += count;
      });
      return total > 99 ? "99+" : total;
    },

    selectedChatMessages(state) {
      if (!state.selectedChat) return [];
      return state.messages.get(state.selectedChat.id) || [];
    },
  },

  actions: {
    // Inicializar o sistema de chat
    async initialize(userId) {
      this.currentUserId = userId || localStorage.getItem("userId");

      if (!this.currentUserId) {
        console.error("ID do usuário não disponível para inicializar o chat");
        return false;
      }

      try {
        // Carregar mentorias
        await this.loadMentorias();

        // Conectar ao chat
        await this.connectChat();

        return true;
      } catch (error) {
        console.error("Erro ao inicializar sistema de chat:", error);
        return false;
      }
    },

    // Carregar mentorias do usuário
    async loadMentorias() {
      this.isLoadingMentorias = true;

      try {
        const [mentorResponse, mentoradoResponse] = await Promise.all([
          getUserMentoringSessions(this.currentUserId),
          getUserParticipationSessions(this.currentUserId),
        ]);

        this.mentoriasMentor = mentorResponse.data || [];
        this.mentoriasMentorado = mentoradoResponse.data || [];
      } catch (error) {
        console.error("Erro ao carregar mentorias:", error);
        throw error;
      } finally {
        this.isLoadingMentorias = false;
      }
    },

    // Conectar ao servidor de chat
    async connectChat() {
      if (this.isConnected) return;

      try {
        this.chatClient = new MentorChatClient({
          debug: import.meta.env.DEV,
        });

        console.log("Creating MentorChatClient with config:", {
          debug: import.meta.env.DEV,
        });
        // Configurar handlers
        this.chatClient.onConnect(() => {
          this.isConnected = true;
          this.subscribeToAllMentorias();
        });

        this.chatClient.onDisconnect(() => {
          this.isConnected = false;
        });

        this.chatClient.onError((error) => {
          console.error("Erro no chat:", error);
          this.isConnected = false;
        });

        // Handler global de mensagens
        this.chatClient.onMessage("general", (message) => {
          this.handleIncomingMessage(message);
        });

        // Conectar
        await this.chatClient.initialize();
      } catch (error) {
        console.error("Erro ao conectar chat:", error);
        throw error;
      }
    },

    // Inscrever em todas as mentorias
    subscribeToAllMentorias() {
      if (!this.chatClient || !this.isConnected) return;

      // Inscrever em mentorias como mentor
      this.mentoriasMentor.forEach((mentoria) => {
        if (mentoria.isChatEnable) {
          this.chatClient.subscribeTutoring(mentoria.id, {
            subscribeGeneral: true,
          });
        }
      });

      // Inscrever em mentorias como mentorado
      this.mentoriasMentorado.forEach((mentoria) => {
        if (mentoria.isChatEnable) {
          this.chatClient.subscribeTutoring(mentoria.id, {
            subscribeGeneral: true,
          });
        }
      });
    },

    // CORREÇÃO: Processar mensagem recebida
    handleIncomingMessage(message) {
      // Encontrar o chat correspondente
      let chatId = null;

      // Verificar se é de uma mentoria onde sou mentor
      const mentorMentoria = this.mentoriasMentor.find(
        (m) => m.id === message.tutoringId
      );
      if (mentorMentoria) {
        chatId = `mentor_${mentorMentoria.id}`;
      } else {
        // Verificar se é de uma mentoria onde sou mentorado
        const mentoradoMentoria = this.mentoriasMentorado.find(
          (m) => m.id === message.tutoringId
        );
        if (mentoradoMentoria) {
          chatId = `mentorado_${mentoradoMentoria.id}`;
        }
      }

      if (!chatId) return;

      // Adicionar mensagem ao mapa
      if (!this.messages.has(chatId)) {
        this.messages.set(chatId, []);
      }

      const messages = this.messages.get(chatId);

      // Verificar duplicatas com critério mais restrito
      const isDuplicate = messages.some(
        (m) =>
          m.id === message.id ||
          (m.message === message.message &&
            String(m.senderId) === String(message.senderId) &&
            Math.abs(new Date(m.timestamp) - new Date(message.timestamp)) <
              1000) // Reduzido para 1s
      );

      if (!isDuplicate) {
        const newMessage = {
          ...message,
          id:
            message.id ||
            `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: message.timestamp || new Date().toISOString(),
          status:
            String(message.senderId) === String(this.currentUserId)
              ? "sent"
              : "received",
        };

        messages.push(newMessage);

        // CORREÇÃO: Incrementar contador de não lidas se não for nossa mensagem
        if (String(message.senderId) !== String(this.currentUserId)) {
          // Verificar se deve mostrar notificação
          const shouldShowNotification =
            !this.selectedChat ||
            this.selectedChat.id !== chatId ||
            !document.hasFocus(); // Mostrar se janela não tem foco

          if (shouldShowNotification) {
            const currentCount = this.unreadMessages.get(chatId) || 0;
            this.unreadMessages.set(chatId, currentCount + 1);

            // Mostrar notificação com delay para evitar conflitos
            setTimeout(() => {
              this.showMessageNotification(newMessage, chatId);
            }, 100);
          }
        }
      }
    },

    // Carregar histórico de mensagens
    async loadChatHistory(chatId, tutoringId) {
      this.isLoadingMessages = true;

      try {
        const response = await getChatHistoryByTutoringId(tutoringId);

        if (response && response.data) {
          const messages = response.data.map((msg) => ({
            id:
              msg.id ||
              `hist_${msg.timestamp}_${Math.random()
                .toString(36)
                .substr(2, 9)}`,
            message: msg.message || msg.content,
            senderId: msg.senderId,
            senderName:
              msg.senderName ||
              (String(msg.senderId) === String(this.currentUserId)
                ? "Você"
                : msg.senderName),
            timestamp: msg.timestamp || msg.createdAt,
            tutoringId: msg.tutoringId || tutoringId,
            status:
              String(msg.senderId) === String(this.currentUserId)
                ? "read"
                : "received",
          }));

          // Ordenar por timestamp
          messages.sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
          );

          // Armazenar no mapa
          this.messages.set(chatId, messages);
        }
      } catch (error) {
        console.error("Erro ao carregar histórico:", error);
        // Inicializar com array vazio se falhar
        if (!this.messages.has(chatId)) {
          this.messages.set(chatId, []);
        }
      } finally {
        this.isLoadingMessages = false;
      }
    },

    // Enviar mensagem
    async sendMessage(message, chatId, tutoringId) {
      if (!this.isConnected || !message.trim()) return false;

      this.isSendingMessage = true;
      const tempId = `temp_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Adicionar mensagem temporária
      const tempMessage = {
        id: tempId,
        message: message.trim(),
        senderId: this.currentUserId,
        senderName: "Você",
        timestamp: new Date().toISOString(),
        status: "sending",
        isTemp: true,
      };

      if (!this.messages.has(chatId)) {
        this.messages.set(chatId, []);
      }

      this.messages.get(chatId).push(tempMessage);

      try {
        const success = this.chatClient.sendGeneralMessage(
          message.trim(),
          tutoringId
        );

        if (!success) {
          throw new Error("Falha ao enviar mensagem");
        }

        // Atualizar status da mensagem temporária
        const messages = this.messages.get(chatId);
        const msgIndex = messages.findIndex((m) => m.id === tempId);
        if (msgIndex !== -1) {
          messages[msgIndex].status = "sent";
          messages[msgIndex].isTemp = false;
        }

        return true;
      } catch (error) {
        console.error("Erro ao enviar mensagem:", error);

        // Marcar como falha
        const messages = this.messages.get(chatId);
        const msgIndex = messages.findIndex((m) => m.id === tempId);
        if (msgIndex !== -1) {
          messages[msgIndex].status = "failed";
        }

        return false;
      } finally {
        this.isSendingMessage = false;
      }
    },

    // CORREÇÃO: Selecionar um chat
    async selectChat(chat) {
      const previousChat = this.selectedChat;
      this.selectedChat = chat;

      // Marcar como lido
      this.unreadMessages.set(chat.id, 0);

      // Fechar notificação se for do chat selecionado
      if (this.lastNotification && this.lastNotification.chatId === chat.id) {
        this.showNotification = false;
      }

      // Carregar histórico se não tiver mensagens
      if (
        !this.messages.has(chat.id) ||
        this.messages.get(chat.id).length === 0
      ) {
        await this.loadChatHistory(chat.id, chat.originalId);
      }
    },

    // CORREÇÃO: Mostrar notificação com controle de duplicatas
    showMessageNotification(message, chatId) {
      if (!this.notificationsEnabled) return;

      const chat = this.allChats.find((c) => c.id === chatId);
      if (!chat) return;

      // Verificar se já não está mostrando a mesma notificação
      const notificationKey = `${chatId}_${message.id}_${message.timestamp}`;
      if (this.lastNotificationId === notificationKey) {
        return;
      }

      // Limpar timeout anterior se existir
      if (this.notificationTimeout) {
        clearTimeout(this.notificationTimeout);
      }

      // Fechar notificação anterior se estiver aberta
      if (this.showNotification) {
        this.showNotification = false;

        // Aguardar um pouco antes de mostrar a nova
        setTimeout(() => {
          this.displayNotification(message, chat, chatId, notificationKey);
        }, 200);
      } else {
        this.displayNotification(message, chat, chatId, notificationKey);
      }
    },

    displayNotification(message, chat, chatId, notificationKey) {
      this.lastNotification = {
        id: message.id,
        chatId: chatId,
        title: chat.title,
        message:
          message.message.length > 50
            ? message.message.substring(0, 50) + "..."
            : message.message,
        avatar: chat.avatar,
        senderName: message.senderName,
      };

      this.lastNotificationId = notificationKey;
      this.showNotification = true;

      // Som de notificação
      if (this.soundEnabled) {
        this.playNotificationSound();
      }

      // Auto-hide após 4 segundos
      this.notificationTimeout = setTimeout(() => {
        this.showNotification = false;
        this.lastNotificationId = null;
      }, 4000);
    },

    // Tocar som de notificação
    playNotificationSound() {
      try {
        const audio = new Audio("/notification-sound.mp3");
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch (error) {
        // Ignorar erro
      }
    },

    showSnackbarNotification(message, type = "info") {
      // Mapear tipos para cores do snackbar
      const colorMap = {
        success: "success",
        error: "error",
        warning: "warning",
        info: "info",
      };

      // Timeout maior para erros
      const timeout = type === "error" ? 5000 : 3000;

      // Chamar o snackbar global
      showSnackbar(
        message,
        colorMap[type] || "info",
        timeout,
        message.length > 50, 
        false 
      );
    },

    // Abrir/fechar lista de chats
    toggleChatList() {
      this.chatListOpen = !this.chatListOpen;
    },

    // Desconectar
    disconnect() {
      // Limpar timeouts
      if (this.notificationTimeout) {
        clearTimeout(this.notificationTimeout);
        this.notificationTimeout = null;
      }

      if (this.chatClient) {
        this.chatClient.disconnect();
        this.chatClient = null;
      }
      this.isConnected = false;
      this.selectedChat = null;
      this.messages.clear();
      this.unreadMessages.clear();
      this.showNotification = false;
      this.lastNotificationId = null;
    },

    // Reconectar
    async reconnect() {
      this.disconnect();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await this.initialize(this.currentUserId);
    },

    // Limpar dados (para logout)
    clearAll() {
      this.disconnect();
      this.mentoriasMentor = [];
      this.mentoriasMentorado = [];
      this.notifications = [];
      this.lastNotification = null;
      this.currentUserId = null;
    },
  },
});
