<template>
  <v-dialog
    v-model="visible"
    :fullscreen="$vuetify.display.smAndDown"
    :max-width="$vuetify.display.smAndDown ? undefined : '800px'"
    :height="$vuetify.display.smAndDown ? undefined : '600px'"
    transition="dialog-bottom-transition"
    persistent
  >
    <v-card class="d-flex flex-column chat-container">
      <!-- Header -->
      <v-toolbar color="primary" dark flat>
        <v-btn icon @click="closeChat">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        
        <v-toolbar-title class="d-flex align-center">
          <v-avatar size="40" class="mr-3">
            <v-img :src="currentChat?.avatar || '/placeholder-user.jpg'" />
          </v-avatar>
          <div>
            <div class="text-h6">{{ currentChat?.title || 'Chat' }}</div>
            <div class="text-caption">{{ currentChat?.subtitle || '' }}</div>
          </div>
        </v-toolbar-title>

        <v-spacer></v-spacer>

        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props">
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="clearMessages">
              <v-list-item-title>Limpar mensagens</v-list-item-title>
            </v-list-item>
            <v-list-item @click="toggleNotifications">
              <v-list-item-title>
                {{ notifications ? 'Silenciar' : 'Ativar notificações' }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-toolbar>

      <!-- Messages Area -->
      <v-card-text 
        ref="messagesContainer"
        class="flex-grow-1 messages-container pa-4"
        @scroll="handleScroll"
      >
        <div v-if="loading" class="text-center pa-4">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>

        <div v-else-if="messages.length === 0" class="text-center pa-4 text-grey">
          <v-icon size="64" class="mb-4">mdi-message-text-outline</v-icon>
          <p>Nenhuma mensagem ainda. Comece uma conversa!</p>
        </div>

        <div v-else class="messages-list">
          <!-- Date separators and messages -->
          <template v-for="(dayGroup, index) in groupedMessages" :key="index">
            <div class="date-separator my-4">
              <v-chip size="small" variant="tonal">
                {{ formatDateSeparator(dayGroup.date) }}
              </v-chip>
            </div>
            
            <div
              v-for="message in dayGroup.messages"
              :key="message.id"
              class="message-wrapper mb-2"
              :class="{ 'own-message': message.senderId === currentUserId }"
            >
              <div class="message-bubble">
                <div v-if="message.senderId !== currentUserId" class="message-sender">
                  {{ message.senderName }}
                </div>
                <div class="message-content">{{ message.message }}</div>
                <div class="message-time">
                  {{ formatTime(message.timestamp) }}
                  <v-icon 
                    v-if="message.senderId === currentUserId"
                    size="16"
                    class="ml-1"
                    :color="message.status === 'read' ? 'info' : 'grey'"
                  >
                    {{ message.status === 'read' ? 'mdi-check-all' : 'mdi-check' }}
                  </v-icon>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Typing indicator -->
        <div v-if="someoneTyping" class="typing-indicator pa-2">
          <v-chip size="small" color="grey-lighten-3">
            <v-progress-circular
              indeterminate
              :size="16"
              :width="2"
              color="grey"
              class="mr-2"
            ></v-progress-circular>
            {{ typingUser }} está digitando...
          </v-chip>
        </div>

        <!-- Scroll to bottom button -->
        <v-fab
          v-if="showScrollButton"
          class="scroll-to-bottom"
          size="small"
          color="white"
          @click="scrollToBottom"
        >
          <v-icon>mdi-chevron-down</v-icon>
        </v-fab>
      </v-card-text>

      <!-- Input Area -->
      <v-card-actions class="pa-0 input-area">
        <v-container fluid class="pa-2">
          <v-row no-gutters align="center">
            <v-col>
              <v-text-field
                v-model="newMessage"
                :placeholder="isConnected ? 'Digite uma mensagem...' : 'Conectando...'"
                variant="outlined"
                density="compact"
                hide-details
                single-line
                :disabled="!isConnected || sending"
                @keyup.enter="sendMessage"
                @input="handleTyping"
                class="message-input"
              >
                <template v-slot:prepend-inner>
                  <v-btn
                    icon
                    size="small"
                    variant="text"
                    @click="showEmojiPicker = !showEmojiPicker"
                  >
                    <v-icon size="20">mdi-emoticon-outline</v-icon>
                  </v-btn>
                </template>
                <template v-slot:append-inner>
                  <v-btn
                    icon
                    size="small"
                    variant="text"
                    @click="attachFile"
                  >
                    <v-icon size="20">mdi-paperclip</v-icon>
                  </v-btn>
                </template>
              </v-text-field>
            </v-col>
            <v-col cols="auto" class="ml-2">
              <v-btn
                icon
                color="primary"
                :loading="sending"
                :disabled="!newMessage.trim() || !isConnected"
                @click="sendMessage"
              >
                <v-icon>mdi-send</v-icon>
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
      </v-card-actions>

      <!-- Connection Status -->
      <v-snackbar
        v-model="connectionSnackbar"
        :color="isConnected ? 'success' : 'error'"
        :timeout="3000"
        location="top"
      >
        {{ isConnected ? 'Conectado ao chat' : 'Desconectado. Tentando reconectar...' }}
      </v-snackbar>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import MentorChatClient from '@/services/chatClient';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  mentoria: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'close']);

const authStore = useAuthStore();

// Estado do componente
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const chatClient = ref(null);
const messages = ref([]);
const newMessage = ref('');
const loading = ref(true);
const sending = ref(false);
const isConnected = ref(false);
const connectionSnackbar = ref(false);
const messagesContainer = ref(null);
const showScrollButton = ref(false);
const someoneTyping = ref(false);
const typingUser = ref('');
const typingTimeout = ref(null);
const showEmojiPicker = ref(false);
const notifications = ref(true);

const currentUserId = computed(() => authStore.userId);

const currentChat = computed(() => {
  if (!props.mentoria) return null;
  
  return {
    title: props.mentoria.disciplineName,
    subtitle: `${props.mentoria.mentorName} • ${props.mentoria.tutoringClassType}`,
    avatar: props.mentoria.mentorAvatar || '/placeholder-user.jpg',
    id: props.mentoria.id
  };
});

// Agrupar mensagens por data
const groupedMessages = computed(() => {
  const groups = [];
  let currentGroup = null;

  messages.value.forEach(message => {
    const messageDate = new Date(message.timestamp);
    const dateKey = messageDate.toDateString();

    if (!currentGroup || currentGroup.date !== dateKey) {
      currentGroup = {
        date: dateKey,
        messages: []
      };
      groups.push(currentGroup);
    }

    currentGroup.messages.push(message);
  });

  return groups;
});

// Métodos de formatação
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const formatDateSeparator = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Hoje';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Ontem';
  } else {
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
};

// Inicializar cliente de chat
const initializeChatClient = async () => {
  try {
    loading.value = true;
    
    chatClient.value = new MentorChatClient({
      debug: false
    });

    // Configurar handlers
    chatClient.value.onConnect(() => {
      isConnected.value = true;
      connectionSnackbar.value = true;
      subscribeToChat();
    });

    chatClient.value.onDisconnect(() => {
      isConnected.value = false;
      connectionSnackbar.value = true;
    });

    chatClient.value.onError((error) => {
      console.error('Erro no chat:', error);
      isConnected.value = false;
    });

    // Handler de mensagens
    chatClient.value.onMessage('general', (message) => {
      addMessage(message);
    });

    // Conectar
    await chatClient.value.initialize();
    
  } catch (error) {
    console.error('Erro ao inicializar chat:', error);
  } finally {
    loading.value = false;
  }
};

// Inscrever-se no chat da mentoria
const subscribeToChat = () => {
  if (!props.mentoria || !chatClient.value) return;

  chatClient.value.setCurrentTutoring(props.mentoria.id);
  chatClient.value.subscribeTutoring(props.mentoria.id, {
    subscribeGeneral: true
  });

  // Simular carregamento de mensagens anteriores
  loadPreviousMessages();
};

// Carregar mensagens anteriores (simulado por enquanto)
const loadPreviousMessages = () => {
  // Aqui você faria uma chamada à API para buscar mensagens anteriores
  // Por enquanto, vamos apenas limpar as mensagens
  messages.value = [];
};

// Adicionar mensagem à lista
const addMessage = (message) => {
  const formattedMessage = {
    ...message,
    id: message.id || Date.now(),
    timestamp: message.timestamp || new Date(),
    status: message.senderId === currentUserId.value ? 'sent' : 'received'
  };

  messages.value.push(formattedMessage);
  
  // Scroll para o final se estiver próximo
  nextTick(() => {
    if (shouldAutoScroll()) {
      scrollToBottom();
    }
  });

  // Notificação se a mensagem não for nossa
  if (message.senderId !== currentUserId.value && notifications.value) {
    // Aqui você poderia adicionar uma notificação sonora ou visual
  }
};

// Enviar mensagem
const sendMessage = async () => {
  if (!newMessage.value.trim() || !isConnected.value || sending.value) return;

  sending.value = true;
  const messageText = newMessage.value;
  newMessage.value = '';

  try {
    const success = chatClient.value.sendGeneralMessage(messageText);
    
    if (success) {
      // A mensagem será adicionada quando recebida via WebSocket
      // Adicionar imediatamente para feedback visual
      addMessage({
        id: Date.now(),
        message: messageText,
        senderId: currentUserId.value,
        senderName: authStore.userName || 'Você',
        timestamp: new Date(),
        status: 'sent'
      });
    }
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    // Mostrar erro ao usuário
    newMessage.value = messageText; // Restaurar mensagem
  } finally {
    sending.value = false;
  }
};

// Controle de scroll
const handleScroll = () => {
  if (!messagesContainer.value) return;
  
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value.$el;
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
  
  showScrollButton.value = distanceFromBottom > 100;
};

const shouldAutoScroll = () => {
  if (!messagesContainer.value) return true;
  
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value.$el;
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
  
  return distanceFromBottom < 100;
};

const scrollToBottom = () => {
  if (!messagesContainer.value) return;
  
  const container = messagesContainer.value.$el;
  container.scrollTop = container.scrollHeight;
};

// Indicador de digitação
const handleTyping = () => {
  // Implementar lógica de "está digitando" via WebSocket
  // Por enquanto, apenas um placeholder
};

// Outras funcionalidades
const clearMessages = () => {
  if (confirm('Tem certeza que deseja limpar todas as mensagens?')) {
    messages.value = [];
  }
};

const toggleNotifications = () => {
  notifications.value = !notifications.value;
};

const attachFile = () => {
  // Implementar anexo de arquivos
  alert('Funcionalidade de anexar arquivos em desenvolvimento');
};

const closeChat = () => {
  visible.value = false;
  emit('close');
};

// Lifecycle
watch(visible, async (newValue) => {
  if (newValue && !chatClient.value) {
    await initializeChatClient();
  }
});

onUnmounted(() => {
  if (chatClient.value) {
    chatClient.value.disconnect();
  }
});
</script>

<style scoped>
.chat-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.messages-container {
  background-color: #e5ddd5;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4d4d4' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  overflow-y: auto;
  position: relative;
}

.messages-list {
  display: flex;
  flex-direction: column;
}

.date-separator {
  display: flex;
  justify-content: center;
  margin: 16px 0;
}

.message-wrapper {
  display: flex;
  margin-bottom: 4px;
}

.message-wrapper.own-message {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 8px;
  position: relative;
  word-wrap: break-word;
}

.own-message .message-bubble {
  background-color: #dcf8c6;
  border-bottom-right-radius: 0;
}

.message-wrapper:not(.own-message) .message-bubble {
  background-color: white;
  border-bottom-left-radius: 0;
}

.message-sender {
  font-size: 12px;
  color: #06cf9c;
  font-weight: 500;
  margin-bottom: 2px;
}

.message-content {
  font-size: 14px;
  line-height: 1.4;
  color: #303030;
}

.message-time {
  font-size: 11px;
  color: #667781;
  margin-top: 2px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.typing-indicator {
  display: flex;
  justify-content: flex-start;
  margin-top: 8px;
}

.scroll-to-bottom {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.input-area {
  background-color: #f0f0f0;
  border-top: 1px solid #e0e0e0;
}

.message-input {
  background-color: white;
}

@media (max-width: 600px) {
  .message-bubble {
    max-width: 85%;
  }
}
</style>