<template>
  <div class="mentoring-chat-container">
    <div class="chat-header">
      <v-btn icon variant="text" @click="$emit('back')" class="back-button">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>

      <div class="chat-header-info">
        <v-avatar size="40" class="mr-3">
          <v-img :src="mentoria?.avatar || '/placeholder-user.jpg'" />
        </v-avatar>
        <div class="header-text">
          <div class="chat-title">{{ mentoria?.title }}</div>
          <div class="chat-subtitle">
            {{ mentoria?.otherUserName }} • {{ getStatusText() }}
          </div>
        </div>
      </div>

      <div class="chat-actions">
        <v-btn icon variant="text" @click="toggleInfo">
          <v-icon>mdi-information-outline</v-icon>
        </v-btn>
        <v-menu>
          <template v-slot:activator="{ props: menuProps }">
            <v-btn icon variant="text" v-bind="menuProps">
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="reloadChatHistory" :disabled="!chatStore.isConnected || chatStore.isLoadingMessages">
              <template v-slot:prepend>
                <v-icon size="small">mdi-refresh</v-icon>
              </template>
              <v-list-item-title>Recarregar histórico</v-list-item-title>
            </v-list-item>

            <v-divider class="my-1"></v-divider>

            <v-list-item @click="clearLocalChatMessages">
              <template v-slot:prepend>
                <v-icon size="small">mdi-delete-outline</v-icon>
              </template>
              <v-list-item-title>Limpar conversa (local)</v-list-item-title>
            </v-list-item>

            <v-list-item @click="toggleLocalNotifications">
              <template v-slot:prepend>
                <v-icon size="small">
                  {{ localNotificationsEnabled ? 'mdi-bell-off-outline' : 'mdi-bell-outline' }}
                </v-icon>
              </template>
              <v-list-item-title>
                {{ localNotificationsEnabled ? 'Silenciar' : 'Ativar' }} notificações (desta conversa)
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>

    <div ref="messagesContainer" class="messages-area" @scroll="handleScroll">
      <div v-if="isLoading" class="loading-container">
        <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
        <span class="ml-3">Carregando mensagens...</span>
      </div>

      <div v-else-if="currentChatMessages.length === 0" class="empty-state">
        <v-icon size="64" color="grey-lighten-2">mdi-message-text-outline</v-icon>
        <h3 class="text-h6 mt-4 text-grey">Nenhuma mensagem ainda</h3>
        <p class="text-body-2 text-grey mt-2">
          Envie uma mensagem para começar a conversa sobre {{ mentoria?.title }}
        </p>
      </div>

      <div v-else class="messages-list">
        <template v-for="(group, groupIndex) in groupedMessages" :key="groupIndex">
          <div class="date-separator">
            <v-chip size="small" variant="tonal" color="grey">
              {{ formatDateSeparator(group.date) }}
            </v-chip>
          </div>

          <div v-for="message in group.messages" :key="message.id" class="message-container"
            :class="{ 'own-message': isOwnMessage(message) }">
            <div class="message-bubble" :class="getMessageBubbleClass(message)">
              <div v-if="!isOwnMessage(message)" class="sender-name">
                {{ message.senderName }}
              </div>

              <!-- Renderização condicional: arquivo ou mensagem de texto -->
              <div v-if="isFileMessage(message)" class="message-content file-message-content">
                <v-card 
                  variant="outlined" 
                  class="file-card"
                  @click="downloadFile(renderFileMessage(message).url, renderFileMessage(message).filename)"
                  :class="{ 'own-file-card': isOwnMessage(message) }"
                >
                  <v-card-text class="d-flex align-center pa-3">
                    <v-icon size="28" class="mr-3" color="primary">
                      {{ getFileIcon(renderFileMessage(message).filename) }}
                    </v-icon>
                    <div class="file-info">
                      <div class="file-name text-body-2 font-weight-medium">
                        {{ renderFileMessage(message).filename }}
                      </div>
                      <div class="text-caption text-grey">
                        Clique para baixar
                      </div>
                    </div>
                    <v-icon size="20" class="ml-auto" color="primary">
                      mdi-download
                    </v-icon>
                  </v-card-text>
                </v-card>
              </div>
              <div v-else class="message-content">
                {{ message.message || message.content }}
              </div>

              <div class="message-info">
                <span class="message-time">
                  {{ formatMessageTime(message.timestamp) }}
                </span>
                <div v-if="isOwnMessage(message)" class="message-status">
                  <v-icon :size="16" :color="getStatusIconColor(message.status)" class="status-icon">
                    {{ getStatusIcon(message.status) }}
                  </v-icon>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <v-fab-transition>
        <v-btn v-if="showScrollButton" class="scroll-to-bottom-btn" size="small" icon color="primary"
          @click="scrollToBottom()" elevation="4">
          <v-badge v-if="newMessagesBelowCount > 0" :content="newMessagesBelowCount > 9 ? '9+' : newMessagesBelowCount"
            color="error" floating overlap>
            <v-icon>mdi-chevron-down</v-icon>
          </v-badge>
          <v-icon v-else>mdi-chevron-down</v-icon>
        </v-btn>
      </v-fab-transition>
    </div>

    <div class="input-area">
      <div class="input-container">
        <v-textarea v-model="newMessage" :placeholder="getInputPlaceholder()" variant="solo" density="compact"
          hide-details single-line
          :disabled="!chatStore.isConnected || chatStore.isSendingMessage || !mentoria?.isChatEnable"
          @keydown.enter.prevent="submitMessage" @input="handleTypingInput" @focus="markVisibleMessagesAsRead"
          class="message-input" rows="1" auto-grow max-rows="4" flat>
          <template v-slot:append-inner>
            <v-btn icon variant="text" size="small" @click="attachFile" class="attach-button"
              :disabled="!mentoria?.isChatEnable || isUploadingFile">
              <v-icon>mdi-paperclip</v-icon>
            </v-btn>
          </template>
        </v-textarea>
        <v-btn icon color="primary" @click="submitMessage" :loading="chatStore.isSendingMessage"
          :disabled="!canSendMessage || !mentoria?.isChatEnable" class="send-button" elevation="0">
          <v-icon>mdi-send</v-icon>
        </v-btn>
      </div>
    </div>

    <!-- Overlay de upload - MOVIDO PARA FORA DA ÁREA DE MENSAGENS -->
    <v-overlay 
      v-model="isUploadingFile" 
      persistent 
      class="align-center justify-center" 
      :contained="true"
      :z-index="1000"
    >
      <v-card class="pa-4" width="300" elevation="8">
        <v-card-text class="text-center">
          <v-progress-circular 
            indeterminate 
            :size="70" 
            :width="7" 
            color="primary"
          />
          <div class="mt-3 text-h6">Enviando arquivo...</div>
          <div class="mt-2 text-body-2 text-grey">Por favor, aguarde</div>
        </v-card-text>
      </v-card>
    </v-overlay>

    <!-- Input file oculto -->
    <input 
      ref="fileInput" 
      type="file" 
      style="display: none" 
      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
      @change="(e) => e.target.files[0] && handleFileUpload(e.target.files[0])" 
    />

    <v-dialog v-model="showMentoriaInfo" max-width="500">
      <v-card>
        <v-card-title>Informações da Mentoria</v-card-title>
        <v-card-text>
          <div class="info-item">
            <strong>Disciplina:</strong> {{ mentoria?.title }}
          </div>
          <div class="info-item">
            <strong>{{ mentoria?.role === 'mentor' ? 'Mentorado(s)' : 'Mentor' }}:</strong>
            <span v-if="mentoria?.role === 'mentor'">
              <v-chip size="small" v-for="p in mentoria?.participants" :key="p.userId" class="mr-1 mb-1">
                {{ p.userName }}
              </v-chip>
              <span v-if="!mentoria?.participants?.length">Nenhum participante</span>
            </span>
            <span v-else>{{ mentoria?.otherUserName }}</span>
          </div>
          <div class="info-item">
            <strong>Tipo:</strong> {{ mentoria?.tutoringClassType }}
          </div>
          <div class="info-item">
            <strong>Data da Mentoria:</strong> {{ formatDate(mentoria?.tutoringDate) }}
          </div>
          <div class="info-item">
            <strong>Status da Mentoria:</strong> {{ getStatusText() }}
          </div>
          <div class="info-item">
            <strong>Chat Ativo:</strong> {{ mentoria?.isChatEnable ? 'Sim' : 'Não' }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="showMentoriaInfo = false">Fechar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useChatStore } from '@/stores/chat';
import chatService from '@/services/fileUploadService';

const props = defineProps({
  mentoria: { // This will be chatStore.selectedChat
    type: Object,
    default: () => null // Allow null when no chat is selected
  }
});

const emit = defineEmits(['back']); // messageReceived is handled by store

const authStore = useAuthStore();
const chatStore = useChatStore(); // Use chat store

const fileInput = ref(null);
const isUploadingFile = ref(false);
const uploadProgress = ref(0);

// Estado local do componente (UI específico)
const newMessage = ref('');
const messagesContainer = ref(null);
const showScrollButton = ref(false);
const newMessagesBelowCount = ref(0); // For messages that arrive while scrolled up
// const someoneTyping = ref(false); // Typing indicator needs more robust store integration
// const typingUser = ref('');
const localNotificationsEnabled = ref(true); // Example for per-chat notification setting
const showMentoriaInfo = ref(false);
// const showConnectionIssueSnackbar = ref(false); // Handled by ChatManager

const currentUserId = computed(() => authStore.userId); // Assuming authStore has userId

// Get messages for the current chat from the store
const currentChatMessages = computed(() => {
  if (!props.mentoria || !props.mentoria.id) return [];
  return chatStore.messages.get(props.mentoria.id) || [];
});

const isLoading = computed(() => chatStore.isLoadingMessages);

const groupedMessages = computed(() => {
  const groups = [];
  let currentGroup = null;

  currentChatMessages.value.forEach(message => {
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

const canSendMessage = computed(() => {
  return chatStore.isConnected && newMessage.value.trim() && !chatStore.isSendingMessage && props.mentoria?.isChatEnable;
});

const isOwnMessage = (message) => {
  return String(message.senderId) === String(currentUserId.value);
};

const getMessageBubbleClass = (message) => {
  return {
    'own-bubble': isOwnMessage(message),
    'other-bubble': !isOwnMessage(message)
  };
};

const getStatusIcon = (status) => {
  // Status from chatStore.messages should be: 'sending', 'sent', 'failed', 'read' (or 'delivered' if implemented)
  switch (status) {
    case 'read': return 'mdi-check-all';
    case 'delivered': return 'mdi-check-all';
    case 'sent': return 'mdi-check';
    case 'sending': return 'mdi-clock-outline';
    case 'failed': return 'mdi-alert-circle-outline';
    default: return 'mdi-clock-outline';
  }
};

const getStatusIconColor = (status) => {
  switch (status) {
    case 'read': return 'blue';
    case 'delivered': return 'grey'; // If you implement delivered
    case 'sent': return 'grey';
    case 'sending': return 'grey-lighten-1';
    case 'failed': return 'error';
    default: return 'grey-lighten-1';
  }
};

const getStatusText = () => {
  if (!props.mentoria) return 'Offline';
  // Status from the mentoria object (e.g., EM_ANDAMENTO, AGENDADA)
  // This is different from message status
  switch (props.mentoria.status) {
    case 'EM_ANDAMENTO': return 'Online'; // Or "Ao vivo"
    case 'AGENDADA': return 'Agendada';
    case 'FINALIZADA': return 'Finalizada';
    case 'CANCELADA': return 'Cancelada';
    default: return props.mentoria.status || 'Indisponível';
  }
};

const getInputPlaceholder = () => {
  if (!chatStore.isConnected) return 'Conectando ao chat...';
  if (!props.mentoria) return 'Selecione uma conversa.';
  if (!props.mentoria.isChatEnable) return 'O chat para esta mentoria está desabilitado.';
  if (props.mentoria.status === 'FINALIZADA') return 'Esta mentoria foi finalizada.';
  if (props.mentoria.status === 'CANCELADA') return 'Esta mentoria foi cancelada.';
  return 'Digite uma mensagem...';
};

const formatDateSeparator = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Hoje';
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'long',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
  });
};

const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

// Função formatDate corrigida
const formatDate = (dateInput) => {
  if (!dateInput) return 'Data não disponível';

  try {
    let date;

    // Se for número (timestamp)
    if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    }
    // Se for string
    else if (typeof dateInput === 'string') {
      const trimmedDate = dateInput.trim();
      if (!trimmedDate) return 'Data não disponível';

      // Tenta criar data diretamente (funciona para ISO 8601)
      date = new Date(trimmedDate);

      // Se falhou e tem espaço sem T, tenta adicionar T
      if (isNaN(date.getTime()) && trimmedDate.includes(' ') && !trimmedDate.includes('T')) {
        date = new Date(trimmedDate.replace(' ', 'T'));
      }

      // Se ainda falhou e tem formato DD/MM/YYYY
      if (isNaN(date.getTime()) && trimmedDate.includes('/')) {
        const parts = trimmedDate.split(' ');
        const datePart = parts[0];
        const timePart = parts[1];

        const dateComponents = datePart.split('/');

        if (dateComponents.length === 3) {
          const [day, month, year] = dateComponents.map(Number);

          // Valida componentes
          if (day && month && year) {
            if (timePart) {
              const timeComponents = timePart.split(':').map(Number);
              const [hour = 0, minute = 0, second = 0] = timeComponents;
              date = new Date(year, month - 1, day, hour, minute, second);
            } else {
              date = new Date(year, month - 1, day);
            }
          }
        }
      }

      // Se ainda falhou, tenta verificar se ano está com 2 dígitos
      if (isNaN(date.getTime()) && trimmedDate.includes('/')) {
        const parts = trimmedDate.split(' ');
        const datePart = parts[0];
        const dateComponents = datePart.split('/');

        if (dateComponents.length === 3) {
          const [day, month, yearStr] = dateComponents;
          const dayNum = Number(day);
          const monthNum = Number(month);
          let yearNum = Number(yearStr);

          // Se o ano tem apenas 2 dígitos, assume século 21
          if (yearNum < 100) {
            yearNum = 2000 + yearNum;
          }

          if (dayNum && monthNum && yearNum) {
            date = new Date(yearNum, monthNum - 1, dayNum);
          }
        }
      }
    }
    // Se for objeto Date
    else if (dateInput instanceof Date) {
      date = new Date(dateInput);
    }
    else {
      console.warn('Formato de data não reconhecido:', dateInput);
      return 'Data inválida';
    }

    // Verifica se a data é válida
    if (!date || isNaN(date.getTime())) {
      console.warn('Data inválida após tentativas de conversão:', dateInput);
      return 'Data inválida';
    }

    // Formata a data
    const options = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };

    // Só adiciona hora/minuto se não for 00:00
    const hours = date.getHours();
    const minutes = date.getMinutes();

    if (hours !== 0 || minutes !== 0) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }

    return date.toLocaleDateString('pt-BR', options);

  } catch (error) {
    console.error('Erro ao formatar data:', error, 'Valor recebido:', dateInput);
    return 'Erro ao formatar data';
  }
};

// Função alternativa específica para data da mentoria (sempre sem hora)
const formatMentoringDate = (dateInput) => {
  if (!dateInput) return 'Data não disponível';

  try {
    let date;

    // Processa a data similar à função anterior
    if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else if (typeof dateInput === 'string') {
      const trimmedDate = dateInput.trim();
      if (!trimmedDate) return 'Data não disponível';

      // Remove horário se existir (pega apenas a parte da data)
      const datePart = trimmedDate.split(' ')[0];

      // Se tem formato DD/MM/YYYY
      if (datePart.includes('/')) {
        const [day, month, year] = datePart.split('/').map(Number);
        if (day && month && year) {
          date = new Date(year, month - 1, day);
        }
      } else {
        // Tenta parse direto
        date = new Date(datePart);
      }
    } else if (dateInput instanceof Date) {
      date = new Date(dateInput);
    }

    if (!date || isNaN(date.getTime())) {
      return 'Data inválida';
    }

    // Retorna apenas a data (sem horário)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

  } catch (error) {
    console.error('Erro ao formatar data da mentoria:', error, dateInput);
    return 'Erro ao formatar data';
  }
};


const reloadChatHistory = async () => {
  if (props.mentoria?.originalId && chatStore.isConnected) {
    // The store action will set isLoadingMessages
    await chatStore.loadChatHistory(props.mentoria.id, props.mentoria.originalId);
  }
};

const submitMessage = async () => {
  if (!canSendMessage.value) return;

  const messageText = newMessage.value.trim();
  newMessage.value = ''; // Clear input immediately

  // Scroll to bottom after clearing input and before sending
  nextTick(() => scrollToBottom('smooth'));

  await chatStore.sendMessage(messageText, props.mentoria.id, props.mentoria.originalId);
  // chatStore.sendMessage handles temp message, status updates, and errors.
};

const handleScroll = () => {
  if (!messagesContainer.value) return;
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value;
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

  showScrollButton.value = distanceFromBottom > 200;

  if (distanceFromBottom < 50) {
    if (newMessagesBelowCount.value > 0) {
      markVisibleMessagesAsRead(); // This will also reset newMessagesBelowCount
    }
  }
  // Logic for loading older messages on scroll to top can be added here if pagination is implemented in store
};

const shouldAutoScroll = () => {
  if (!messagesContainer.value) return true; // Auto-scroll if container not yet rendered
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value;
  // Auto-scroll if already at bottom or very close
  return scrollHeight - scrollTop - clientHeight < 100;
};

const scrollToBottom = (behavior = 'smooth') => {
  if (messagesContainer.value) {
    nextTick(() => {
      messagesContainer.value.scrollTo({
        top: messagesContainer.value.scrollHeight,
        behavior: behavior
      });
      // Reset new messages count when explicitly scrolling to bottom
      newMessagesBelowCount.value = 0;
    });
  }
};

const markVisibleMessagesAsRead = () => {
  // This is primarily for the UI's "new messages below" counter.
  // The store's `selectChat` action marks all messages in the chat as read.
  newMessagesBelowCount.value = 0;
  // Potentially, you could also inform the store if only a portion of messages were "seen"
  // but for now, store handles bulk "read" on chat selection/open.
};

const handleTypingInput = () => {
  // Typing indicator logic would go here, likely involving emitting an event through chatStore
  // e.g., chatStore.sendTypingEvent(props.mentoria.originalId, true/false);
  // This requires STOMP client and store support.
};

const attachFile = () => {
  if (!fileInput.value) {
    // Criar input file dinamicamente se não existir
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = false; // Um arquivo por vez
    input.accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar';

    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (file) {
        await handleFileUpload(file);
      }
    };

    input.click();
  } else {
    fileInput.value.click();
  }
};

const handleFileUpload = async (file) => {
  if (!props.mentoria?.originalId) {
    chatStore.showSnackbarNotification('Erro: ID da mentoria não encontrado', 'error');
    return;
  }

  // Lista de extensões permitidas
  const allowedExtensions = [
    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg',
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt',
    'zip', 'rar', '7z', 'tar', 'gz'
  ];
  
  // Extrair extensão do arquivo
  const fileExtension = file.name.split('.').pop().toLowerCase();
  
  // Validar extensão
  if (!allowedExtensions.includes(fileExtension)) {
    chatStore.showSnackbarNotification(
      `Tipo de arquivo não permitido. Extensões aceitas: ${allowedExtensions.join(', ')}`, 
      'error'
    );
    return;
  }
  
  // Validar tamanho (10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    chatStore.showSnackbarNotification('Arquivo muito grande. Máximo permitido: 10MB', 'error');
    return;
  }

  try {
    isUploadingFile.value = true;
    uploadProgress.value = 0;

    // Fazer upload usando o serviço
    const fileUrl = await chatService.uploadFile(file, props.mentoria.originalId);

    // Sucesso
    chatStore.showSnackbarNotification('Arquivo enviado com sucesso!', 'success');

    // Scroll para baixo após o upload
    nextTick(() => scrollToBottom('smooth'));

  } catch (error) {
    console.error('Erro ao fazer upload:', error);

    let errorMessage = 'Erro ao enviar arquivo';
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          errorMessage = 'Você não está autenticado';
          break;
        case 403:
          errorMessage = 'Você não tem permissão para enviar arquivos nesta mentoria';
          break;
        case 404:
          errorMessage = 'Mentoria não encontrada';
          break;
        case 413:
          errorMessage = 'Arquivo muito grande (máximo 10MB)';
          break;
        case 415:
          errorMessage = 'Tipo de arquivo não suportado pelo servidor';
          break;
        case 500:
          errorMessage = 'Erro no servidor ao processar o arquivo';
          break;
        default:
          if (error.response.data?.message) {
            errorMessage = error.response.data.message;
          } else if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          }
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    chatStore.showSnackbarNotification(errorMessage, 'error');
    
  } finally {
    isUploadingFile.value = false;
    uploadProgress.value = 0;
    
    // Limpar o input file para permitir reenvio do mesmo arquivo
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
};

// Adicione esta função para renderizar mensagens com arquivos
const renderFileMessage = (message) => {
  // Pega o conteúdo da mensagem (pode estar em message ou content)
  const content = message.message || message.content || '';

  // Divide as linhas
  const lines = content.split('\n').map(line => line.trim());

  // Extrai o nome do arquivo
  let filename = 'Arquivo';
  let fileUrl = '';

  // Procura pela linha com "Arquivo anexado:"
  const filenameLine = lines.find(line => line.startsWith('Arquivo anexado:'));
  if (filenameLine) {
    filename = filenameLine.replace('Arquivo anexado:', '').trim();
  }

  // Procura pela linha com "Link:"
  const linkLine = lines.find(line => line.startsWith('Link:'));
  if (linkLine) {
    fileUrl = linkLine.replace('Link:', '').trim();
  }

  return {
    filename: filename,
    url: fileUrl,
    isFile: true
  };
};

// Adicione esta computed para verificar se uma mensagem é um arquivo
const isFileMessage = (message) => {
  // Verifica se é uma mensagem de arquivo pelos diferentes indicadores
  return message.type === 'FILE' ||
    message.messageType === 'FILE' ||
    (message.message && message.message.includes('Arquivo anexado:')) ||
    (message.content && message.content.includes('Arquivo anexado:'));
};

// Adicione o método para baixar arquivo
const downloadFile = async (url, filename) => {
  if (!url) {
    chatStore.showSnackbarNotification('URL do arquivo não encontrada', 'error');
    return;
  }

  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'download';
    link.target = '_blank';
    
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
    
  } catch (error) {
    console.error('Erro ao baixar arquivo:', error);
    chatStore.showSnackbarNotification('Erro ao baixar arquivo', 'error');
  }
};

const clearLocalChatMessages = () => {
  if (props.mentoria?.id && confirm('Tem certeza que deseja limpar as mensagens desta conversa (apenas localmente)?')) {
    chatStore.messages.set(props.mentoria.id, []);
    chatStore.showSnackbarNotification('Mensagens limpas localmente', 'success');
  }
};

const toggleLocalNotifications = () => {
  localNotificationsEnabled.value = !localNotificationsEnabled.value;
  // This state would be used to suppress new message notifications from this specific chat
  // if chatStore.showNotification considered it.
};

const toggleInfo = () => {
  showMentoriaInfo.value = !showMentoriaInfo.value;
};

// Watch for changes in the selected chat (mentoria prop)
watch(() => props.mentoria, async (newMentoria, oldMentoria) => {
  if (newMentoria && newMentoria.id) {
    if (!oldMentoria || newMentoria.id !== oldMentoria.id) {
      // New chat selected, reset UI state and scroll
      newMessagesBelowCount.value = 0;
      // History loading is handled by chatStore.selectChat
      // but ensure scroll to bottom for new chat.
      nextTick(() => scrollToBottom('auto'));
    }
  } else {
    // No chat selected, clear messages (though currentChatMessages computed will do this)
    newMessagesBelowCount.value = 0;
  }
}, { immediate: true });


// Watch messages for the current chat to handle auto-scroll and new message counter
// ===================================================
// CORREÇÃO NO WATCHER DE MENSAGENS - LÓGICA MELHORADA
// ===================================================
watch(currentChatMessages, (newMessages, oldMessages) => {
  if (newMessages.length > oldMessages.length) {
    console.log(`💬 Novas mensagens no chat atual: ${newMessages.length - oldMessages.length}`);

    const newMessagesReceived = newMessages.slice(oldMessages.length);
    let shouldAutoScrollToBottom = false;

    newMessagesReceived.forEach(message => {
      if (isOwnMessage(message)) {
        shouldAutoScrollToBottom = true; // Sempre scroll para próprias mensagens
      } else {
        if (shouldAutoScroll()) {
          shouldAutoScrollToBottom = true;
        } else {
          // Incrementar contador apenas para mensagens de outros
          newMessagesBelowCount.value += 1;
        }
      }
    });

    if (shouldAutoScrollToBottom) {
      nextTick(() => scrollToBottom('smooth'));
    }
  } else if (newMessages.length > 0 && oldMessages.length === 0) {
    // Histórico carregado
    nextTick(() => scrollToBottom('auto'));
  }
}, { deep: true });


// Watch for connection changes for UI feedback (e.g., disable input)
// The global snackbar is in ChatManager. This is for specific UI elements here.
// watch(() => chatStore.isConnected, (connected) => {
//   showConnectionIssueSnackbar.value = !connected;
// });

onMounted(() => {
  if (props.mentoria && props.mentoria.id) {
    if (chatStore.unreadMessages.has(props.mentoria.id)) {
      chatStore.unreadMessages.set(props.mentoria.id, 0);
    }
    if (currentChatMessages.value.length === 0 && !chatStore.isLoadingMessages) {
      reloadChatHistory();
    } else {
      nextTick(() => scrollToBottom('auto'));
    }
  }
});

const getFileIcon = (filename) => {
  if (!filename) return 'mdi-file';

  const extension = filename.split('.').pop().toLowerCase();

  const iconMap = {
    // Imagens
    'jpg': 'mdi-file-image',
    'jpeg': 'mdi-file-image',
    'png': 'mdi-file-image',
    'gif': 'mdi-file-image',
    'bmp': 'mdi-file-image',
    'svg': 'mdi-file-image',
    'webp': 'mdi-file-image',

    // Documentos
    'pdf': 'mdi-file-pdf-box',
    'doc': 'mdi-file-word',
    'docx': 'mdi-file-word',
    'txt': 'mdi-file-document',

    // Planilhas
    'xls': 'mdi-file-excel',
    'xlsx': 'mdi-file-excel',
    'csv': 'mdi-file-delimited',

    // Arquivos compactados
    'zip': 'mdi-folder-zip',
    'rar': 'mdi-folder-zip',
    '7z': 'mdi-folder-zip',
    'tar': 'mdi-folder-zip',
    'gz': 'mdi-folder-zip',

    // Outros
    'json': 'mdi-code-json',
    'xml': 'mdi-file-code',
    'html': 'mdi-language-html5',
    'css': 'mdi-language-css3',
    'js': 'mdi-language-javascript',
    'ts': 'mdi-language-typescript',
    'vue': 'mdi-vuejs',
    'py': 'mdi-language-python',
    'java': 'mdi-language-java',
    'cpp': 'mdi-file-code',
    'c': 'mdi-file-code',
  };

  return iconMap[extension] || 'mdi-file';
};

onUnmounted(() => {
  // No client to disconnect here, store manages it.
  // Clear any component-specific timers or listeners if they were added.
});

</script>

<style scoped>
.mentoring-chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f0f2f5;
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  padding: 8.5px 16px;
  background-color: #004aad;
  color: white;
  min-height: 56px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.back-button {
  margin-right: 8px;
  color: white !important;
}

.chat-header-info {
  display: flex;
  align-items: center;
  flex-grow: 1;
  min-width: 0;
}

.header-text {
  flex-grow: 1;
  overflow: hidden;
  margin-left: 8px;
}

.chat-title {
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-subtitle {
  font-size: 0.75rem;
  opacity: 0.85;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-actions {
  display: flex;
  align-items: center;
}

.chat-actions .v-btn {
  color: white !important;
}

.messages-area {
  flex-grow: 1;
  overflow-y: auto;
  padding: 16px 12px;
  background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAGCAYAAADgzO9IAAAAFUlEQVQImWNgoAgg+vmP8WyMGUwPMAAALuwFR1QOimAAAAAASUVORK5CYII=");
  background-repeat: repeat;
  position: relative;
}

.loading-container,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #54656f;
  height: 100%;
  box-sizing: border-box;
  text-align: center;
}

.loading-container span {
  margin-top: 12px;
}

.empty-state .v-icon {
  opacity: 0.3;
}

.empty-state h3 {
  color: #111b21;
  margin-top: 16px;
}

.empty-state p {
  color: #54656f;
}


.messages-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.date-separator {
  display: flex;
  justify-content: center;
  margin: 16px 0;
}

.date-separator .v-chip {
  background-color: #e9edef;
  color: #54656f;
  font-size: 0.75rem;
  padding: 4px 8px;
  height: auto;
  box-shadow: 0 1px 0.5px rgba(0, 0, 0, 0.1);
}

.message-container {
  display: flex;
  margin-bottom: 1px;
}

.message-container.own-message {
  justify-content: flex-end;
}

.message-bubble {
  max-width: calc(100% - 60px);
  width: fit-content;
  padding: 7px 10px;
  border-radius: 7.5px;
  position: relative;
  word-wrap: break-word;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.08);
  line-height: 1.35;
  font-size: 0.9rem;
}

.own-bubble {
  background-color: #dcf8c6;
  border-bottom-right-radius: 2px;
}

.other-bubble {
  background-color: #ffffff;
  border-bottom-left-radius: 2px;
}

.sender-name {
  font-size: 0.8rem;
  color: #056162;
  font-weight: 500;
  margin-bottom: 2px;
  padding-left: 2px;
}

.message-content {
  color: #111b21;
  margin-bottom: 3px;
  white-space: pre-wrap;
}

.message-info {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 0px;
  height: 16px;
  float: right;
  clear: both;
  line-height: 1;
}

.message-time {
  font-size: 0.7rem;
  color: #667781;
  margin-right: 2px;
}

.status-icon {
  opacity: 0.9;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0;
  padding: 0 8px;
}

.typing-bubble {
  background-color: #ffffff;
  padding: 7px 10px;
  border-radius: 7.5px;
  border-bottom-left-radius: 2px;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.08);
}

.typing-dots span {
  width: 5px;
  height: 5px;
  background-color: #8696a0;
  border-radius: 50%;
  display: inline-block;
  margin: 0 1px;
  animation: typing 1.2s infinite ease-in-out both;
}

.typing-dots span:nth-child(1) {
  animation-delay: -0.24s;
}

.typing-dots span:nth-child(2) {
  animation-delay: -0.12s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0s;
}

@keyframes typing {

  0%,
  80%,
  100% {
    transform: translateY(0px) scale(0.7);
    opacity: 0.5;
  }

  40% {
    transform: translateY(-2px) scale(1);
    opacity: 1;
  }
}

.typing-text {
  font-size: 0.8rem;
  color: #54656f;
  font-style: italic;
}

.scroll-to-bottom-btn {
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 10;
}

.scroll-to-bottom-btn .v-badge :deep(.v-badge__badge) {
  font-size: 0.65rem;
  min-width: 14px;
  height: 14px;
  padding: 0 3px;
  line-height: 14px;
}

.input-area {
  padding: 6px 10px;
  background-color: #f0f2f5;
  border-top: 1px solid #dde0e1;
  flex-shrink: 0;
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  background-color: #ffffff;
  border-radius: 21px;
  padding: 5px 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.attach-button {
  color: #54656f !important;
  align-self: center;
}

.attach-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.message-input {
  flex-grow: 1;
  align-self: center;
  padding: 0;
}

.message-input :deep(.v-input__control) {
  min-height: auto !important;
}

.message-input :deep(.v-field) {
  padding: 6px 0px;
  box-shadow: none !important;
  background-color: transparent !important;
  min-height: auto;
  line-height: 1.4;
}

.message-input :deep(textarea) {
  padding: 0 !important;
  margin: 0;
  max-height: 100px;
  overflow-y: auto !important;
}

.message-input :deep(.v-field__outline) {
  display: none;
}

.message-input :deep(.v-field__append-inner) {
  padding-top: 0;
  align-self: center;
}

.send-button {
  margin: 0;
  width: 42px !important;
  height: 42px !important;
  align-self: flex-end;
}

.send-button .v-icon {
  font-size: 1.5rem;
}

.info-item {
  margin-bottom: 10px;
  font-size: 0.9rem;
}

.info-item strong {
  display: block;
  margin-bottom: 3px;
  color: #333;
  font-weight: 500;
}

@media (max-width: 600px) {
  .message-bubble {
    max-width: 80%;
  }

  .chat-header {
    padding: 8px 12px;
    min-height: 52px;
  }

  .messages-area {
    padding: 12px 8px;
  }

  .input-area {
    padding: 5px 8px;
  }

  .input-container {
    padding: 4px 6px;
    gap: 4px;
  }

  .send-button,
  .attach-button {
    width: 38px !important;
    height: 38px !important;
  }

  .send-button .v-icon {
    font-size: 1.3rem;
  }

  .message-input :deep(textarea) {
    max-height: 80px;
  }
}

.file-message {
  width: 100%;
  max-width: 300px;
}

.file-card {
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: rgba(255, 255, 255, 0.95);
}

.file-card:hover {
  background-color: rgba(255, 255, 255, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.own-message .file-card {
  background-color: rgba(236, 244, 255, 0.95);
}

.own-message .file-card:hover {
  background-color: rgba(236, 244, 255, 1);
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.message-bubble.own-bubble .file-card {
  border-color: #1976d2;
}

.message-bubble.other-bubble .file-card {
  border-color: #e0e0e0;
}

/* Estilos para o overlay */
.v-overlay--contained {
  position: absolute !important;
}

/* Estilos para mensagens de arquivo */
.file-message-content {
  width: 100%;
  max-width: 320px;
}

.file-card {
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  margin: 0;
}

.file-card:hover {
  background-color: #f5f5f5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.own-message .file-card {
  background-color: #e3f2fd;
  border-color: #90caf9;
}

.own-message .file-card:hover {
  background-color: #bbdefb;
}

.file-info {
  flex: 1;
  min-width: 0;
  text-align: left;
}

.file-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #1976d2;
  max-width: 200px;
}

.message-bubble .file-card {
  box-shadow: none;
}

.message-bubble .file-card .v-card-text {
  background: transparent;
}

/* Ajuste para o ícone de arquivo */
.file-card .v-icon {
  flex-shrink: 0;
}

/* Garante que o overlay apareça sobre tudo */
.mentoring-chat-container {
  position: relative;
}

</style>