<template>
  <v-dialog v-model="visible" :fullscreen="$vuetify.display.smAndDown"
    :max-width="$vuetify.display.smAndDown ? undefined : '1200px'"
    :height="$vuetify.display.smAndDown ? undefined : '700px'"
    transition="dialog-bottom-transition"
    persistent
    class="chat-dialog"
  >

    <v-card class="chat-list-container">
      <!-- Sidebar de Conversas -->
      <v-navigation-drawer v-model="drawer" :rail="!mdAndUp && !drawerExpanded" :permanent="mdAndUp"
        :temporary="!mdAndUp" width="400" class="chat-sidebar" :class="{ 'drawer-expanded': drawerExpanded }"
        :style="chatSidebarStyles" rounded>
        <!-- Header da Sidebar -->
        <v-toolbar color="primary" dark flat class="sidebar-header">
          <v-btn
            icon="mdi mdi-close"
            @click="close"
            class="close-button"
            > <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title class="sidebar-title">
            <v-icon class="mr-2">mdi-message-text</v-icon>
            Conversas
          </v-toolbar-title>

          <v-spacer></v-spacer>

          <v-badge :content="chatStore.totalUnreadCount" :model-value="chatStore.totalUnreadCount > 0" color="error"
            overlap>
            <v-icon>mdi-bell</v-icon>
          </v-badge>

          <v-btn icon @click="refreshChats" :loading="chatStore.isLoadingMentorias">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>

          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn icon v-bind="props">
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item @click="markAllAsRead">
                <v-list-item-title>Marcar todas como lidas</v-list-item-title>
              </v-list-item>
              <v-list-item @click="showArchivedChats = !showArchivedChats">
                <v-list-item-title>
                  {{ showArchivedChats ? 'Ocultar' : 'Mostrar' }} arquivadas
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-toolbar>

        <!-- Status de Conexão -->
        <v-alert v-if="!chatStore.isConnected" type="warning" variant="tonal" density="compact" class="ma-2">
          <v-icon class="mr-2">mdi-wifi-off</v-icon>
          Reconectando...
        </v-alert>

        <!-- Barra de Pesquisa -->
        <div class="search-container">
          <v-text-field v-model="searchQuery" placeholder="Pesquisar conversas..." prepend-inner-icon="mdi-magnify"
            variant="solo" flat hide-details single-line clearable class="search-field"></v-text-field>
        </div>

        <!-- Filtros -->
        <div class="filters-container">
          <v-chip-group v-model="selectedFilter" mandatory class="filter-chips">
            <v-chip value="all" size="small">
              Todas ({{ chatStore.allChats.length }})
            </v-chip>
            <v-chip value="unread" size="small">
              Não lidas ({{ unreadCount }})
            </v-chip>
            <v-chip value="active" size="small">
              Ativas ({{ activeCount }})
            </v-chip>
          </v-chip-group>
        </div>

        <!-- Lista de Conversas -->
        <v-list class="chat-list" lines="two">
          <template v-if="chatStore.isLoadingMentorias">
            <v-list-item v-for="n in 5" :key="n">
              <template v-slot:prepend>
                <v-skeleton-loader type="avatar"></v-skeleton-loader>
              </template>
              <v-skeleton-loader type="list-item-two-line"></v-skeleton-loader>
            </v-list-item>
          </template>

          <template v-else-if="filteredChats.length === 0">
            <div class="empty-chats">
              <v-icon size="48" color="grey-lighten-2">mdi-message-outline</v-icon>
              <p class="text-grey mt-2">
                {{ searchQuery ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa disponível' }}
              </p>
            </div>
          </template>

          <template v-else>
            <v-list-item
              v-for="chat in filteredChats"
              :key="chat.id"
              :active="chatStore.selectedChat?.id === chat.id"
              @click="selectChat(chat)"
              :class="{
                'has-unread': chat.unreadCount > 0,
                'chat-active': chat.status === 'EM_ANDAMENTO'
              }" class="chat-item">
              <template v-slot:prepend>
                <v-badge
                  :content="chat.unreadCount"
                  :model-value="chat.unreadCount > 0"
                  color="error"
                  overlap
                  offset-x="8"
                  offset-y="8"
                  class="v-badge-custom"
                >
                  <v-avatar size="56" class="chat-avatar">
                    <v-img
                      :src="chat.avatar || '/placeholder-user.jpg'"
                      :alt="chat.title"
                    />
                    <div
                      v-if="chat.status === 'EM_ANDAMENTO'"
                      class="online-indicator"
                    ></div>
                  </v-avatar>
                </v-badge>
              </template>

              <v-list-item-title class="chat-title">
                {{ chat.title }}
                <v-chip v-if="chat.status === 'EM_ANDAMENTO'" size="x-small" color="success" class="ml-2">
                  Ao vivo
                </v-chip>
              </v-list-item-title>

              <v-list-item-subtitle class="chat-subtitle">
                <div class="subtitle-line">
                  <v-icon size="14" class="mr-1">{{ chat.role === 'mentor' ? 'mdi-school' : 'mdi-account' }}</v-icon>
                  <span class="role-text">{{ chat.role === 'mentor' ? 'Você é mentor' : 'Você é mentorado' }}</span>
                </div>
                <div class="last-message">
                  <v-icon
                    v-if="chat.lastMessageSent && isOwnMessage(chat)"
                    size="16"
                    class="mr-1"
                    :color="chat.lastMessageRead ? 'blue' : 'grey'"
                  >
                    {{ chat.lastMessageRead ? 'mdi-check-all' : 'mdi-check' }}
                  </v-icon>
                  {{ chat.lastMessage || 'Clique para iniciar a conversa' }}
                </div>
              </v-list-item-subtitle>

              <template v-slot:append>
                <div class="chat-meta">
                  <div class="chat-time">
                    {{ formatChatTime(chat.lastMessageTime || chat.tutoringDate) }}
                  </div>
                  <div class="chat-status">
                    <v-icon
                      size="16"
                      :color="getStatusColor(chat.status)"
                      class="status-icon"
                    >
                      {{ getStatusIcon(chat.status) }}
                    </v-icon>
                  </div>
                </div>
              </template>
            </v-list-item>
          </template>
        </v-list>
      </v-navigation-drawer>

      <v-main class="chat-main">
        <div v-if="!chatStore.selectedChat" class="empty-chat-area">
          <div class="empty-content">
            <!-- Animação de fundo sutil -->
            <div class="background-animation">
              <div class="floating-bubble bubble-1"></div>
              <div class="floating-bubble bubble-2"></div>
              <div class="floating-bubble bubble-3"></div>
              <div class="floating-bubble bubble-4"></div>
            </div>

            <!-- Conteúdo principal -->
            <div class="main-content">
              <div class="icon-container">
                <div class="icon-wrapper">
                  <v-icon size="80" color="primary" class="main-icon">mdi-message-text-outline</v-icon>
                  <div class="icon-pulse"></div>
                </div>
              </div>

              <div class="text-content">
                <h3 class="welcome-title">Bem-vindo ao seu centro de mentorias</h3>
                <p class="welcome-subtitle">
                  Selecione uma conversa à esquerda para começar a interagir com seus mentores e mentorados
                </p>
              </div>

              <!-- Cards de recursos -->
              <div class="features-grid">
                <v-card class="feature-card" elevation="0" variant="tonal">
                  <v-card-text class="feature-content">
                    <div class="feature-icon-wrapper">
                      <v-icon color="primary" size="28">mdi-message-fast</v-icon>
                    </div>
                    <div class="feature-text">
                      <h4 class="feature-title">Tempo Real</h4>
                      <p class="feature-description">Mensagens instantâneas e notificações</p>
                    </div>
                  </v-card-text>
                </v-card>

                <v-card class="feature-card" elevation="0" variant="tonal">
                  <v-card-text class="feature-content">
                    <div class="feature-icon-wrapper">
                      <v-icon color="success" size="28">mdi-file-document</v-icon>
                    </div>
                    <div class="feature-text">
                      <h4 class="feature-title">Compartilhamento</h4>
                      <p class="feature-description">Envie arquivos e documentos facilmente</p>
                    </div>
                  </v-card-text>
                </v-card>

                <v-card class="feature-card" elevation="0" variant="tonal">
                  <v-card-text class="feature-content">
                    <div class="feature-icon-wrapper">
                      <v-icon color="info" size="28">mdi-school</v-icon>
                    </div>
                    <div class="feature-text">
                      <h4 class="feature-title">Aprendizado</h4>
                      <p class="feature-description">Tire dúvidas e evolua constantemente</p>
                    </div>
                  </v-card-text>
                </v-card>
              </div>

              <!-- Call to action -->
              <div class="cta-section">
                <v-btn size="large" color="primary" variant="elevated" prepend-icon="mdi-arrow-left" class="cta-button"
                  @click="() => { }">
                  Escolher Conversa
                </v-btn>
              </div>
            </div>
          </div>
        </div>

        <MentoringChat v-else :key="chatStore.selectedChat.id" :mentoria="chatStore.selectedChat" @back="handleChatBack"
          @messageReceived="handleMessageReceived" class="mentoring-chat" />
      </v-main>

      <!-- Botão flutuante para mobile -->
      <v-btn v-if="smAndDown.value && chatStore.selectedChat" fab fixed bottom left color="primary"
        @click="toggleDrawer" class="mobile-drawer-toggle">
        <v-icon>mdi-menu</v-icon>
      </v-btn>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useChatStore } from '@/stores/chat';
import { useAuthStore } from '@/stores/auth';
import MentoringChat from './MentoringChat.vue';
import { useDisplay } from 'vuetify';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'close']);

// Stores
const chatStore = useChatStore();
const authStore = useAuthStore();

// Estado local
const drawer = ref(true);
const drawerExpanded = ref(false);
const searchQuery = ref('');
const selectedFilter = ref('all');
const showArchivedChats = ref(false);
const { mdAndUp, smAndDown } = useDisplay();

// Computed
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// Contadores
const unreadCount = computed(() => {
  return chatStore.allChats.filter(chat => chat.unreadCount > 0).length;
});

const activeCount = computed(() => {
  return chatStore.allChats.filter(chat => chat.status === 'EM_ANDAMENTO').length;
});

// Filtrar chats
const filteredChats = computed(() => {
  let filtered = chatStore.allChats;

  // Filtro por pesquisa
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(chat =>
      chat.title.toLowerCase().includes(query) ||
      chat.otherUserName.toLowerCase().includes(query) ||
      (chat.lastMessage && chat.lastMessage.toLowerCase().includes(query))
    );
  }

  // Filtro por tipo
  switch (selectedFilter.value) {
    case 'unread':
      filtered = filtered.filter(chat => chat.unreadCount > 0);
      break;
    case 'active':
      filtered = filtered.filter(chat => chat.status === 'EM_ANDAMENTO');
      break;
  }

  // Filtro de arquivadas (se implementar)
  if (!showArchivedChats.value) {
    filtered = filtered.filter(chat => !chat.archived);
  }

  return filtered;
});

// Métodos
const isOwnMessage = (chat) => {
  // Verifica se a última mensagem foi enviada pelo usuário atual
  const lastMsg = chatStore.messages.get(chat.id)?.[chatStore.messages.get(chat.id)?.length - 1];
  return lastMsg && String(lastMsg.senderId) === String(authStore.userId);
};

const selectChat = async (chat) => {
  await chatStore.selectChat(chat);

  // Em mobile, fechar o drawer
  if (!mdAndUp.value) {
    drawer.value = false;
  }
};

const formatChatTime = (date) => {
  if (!date) return '';

  // Função auxiliar para normalizar a data
  const parseDate = (dateInput) => {
    // Se já é uma instância de Date válida
    if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
      return dateInput;
    }

    // Se é string
    if (typeof dateInput === 'string') {
      // Primeiro, tentar o parse nativo
      let parsed = new Date(dateInput);

      // Se deu certo, retornar
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }

      // Tentar formato brasileiro DD/MM/AAAA HH:mm ou DD/MM/AAAA
      const brDateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2}))?/;
      const brMatch = dateInput.match(brDateRegex);

      if (brMatch) {
        const [, day, month, year, hour = '00', minute = '00'] = brMatch;
        parsed = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));

        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }

      // Tentar formato ISO sem timezone
      const cleanDate = dateInput.replace(/[+-]\d{2}:\d{2}$/, '');
      parsed = new Date(cleanDate);

      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    // Se é number (timestamp)
    if (typeof dateInput === 'number') {
      const parsed = new Date(dateInput);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    return null;
  };

  // Tentar parsear a data
  const messageDate = parseDate(date);

  if (!messageDate) {
    console.warn('Data inválida recebida:', date);
    return '';
  }

  const now = new Date();
  const diffInMillis = now - messageDate;
  const diffInHours = Math.abs(diffInMillis) / (1000 * 60 * 60);

  // Verificar se é uma data futura (mentoria agendada)
  const isFutureDate = diffInMillis < -3600000; // -1 hora em millisegundos

  if (isFutureDate) {
    // Formatar data futura (mentoria agendada) - PADRÃO BRASILEIRO
    const day = messageDate.getDate().toString().padStart(2, '0');
    const month = (messageDate.getMonth() + 1).toString().padStart(2, '0');
    const year = messageDate.getFullYear();
    const hours = messageDate.getHours().toString().padStart(2, '0');
    const minutes = messageDate.getMinutes().toString().padStart(2, '0');

    // Se for no mesmo ano
    if (year === now.getFullYear()) {
      // Se não for meia-noite, mostrar com horário
      if (hours !== '00' || minutes !== '00') {
        return `${day}/${month} às ${hours}:${minutes}`;
      } else {
        return `${day}/${month}`;
      }
    } else {
      // Anos diferentes
      if (hours !== '00' || minutes !== '00') {
        return `${day}/${month}/${year} às ${hours}:${minutes}`;
      } else {
        return `${day}/${month}/${year}`;
      }
    }
  }

  // Datas no passado (mensagens e mentorias finalizadas)

  // Mensagens muito recentes (menos de 1 minuto)
  if (diffInMillis < 60000 && diffInMillis >= 0) {
    return 'Agora';
  }

  // Menos de 1 hora
  if (diffInHours < 1 && diffInMillis >= 0) {
    const minutes = Math.floor(diffInMillis / 60000);
    return `${minutes} min atrás`;
  }

  // Verificar se é hoje
  const isToday = messageDate.toDateString() === now.toDateString();

  if (isToday) {
    // Se foi hoje, mostrar apenas a hora (se não for meia-noite)
    const hours = messageDate.getHours();
    const minutes = messageDate.getMinutes();

    if (hours === 0 && minutes === 0) {
      // Se for exatamente meia-noite, mostrar como data do dia anterior
      const day = messageDate.getDate().toString().padStart(2, '0');
      const month = (messageDate.getMonth() + 1).toString().padStart(2, '0');
      return `${day}/${month}`;
    } else {
      // Mostrar horário no formato brasileiro
      const hourStr = hours.toString().padStart(2, '0');
      const minuteStr = minutes.toString().padStart(2, '0');
      return `${hourStr}:${minuteStr}`;
    }
  }

  // Verificar se é ontem
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = messageDate.toDateString() === yesterday.toDateString();

  if (isYesterday) {
    return 'Ontem';
  }

  // Esta semana (menos de 7 dias) - dias da semana em português
  if (diffInHours < 168 && diffInMillis >= 0) {
    const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return daysOfWeek[messageDate.getDay()];
  }

  // Formatação para datas mais antigas - SEMPRE PADRÃO BRASILEIRO
  const day = messageDate.getDate().toString().padStart(2, '0');
  const month = (messageDate.getMonth() + 1).toString().padStart(2, '0');
  const year = messageDate.getFullYear();

  // Mesmo ano - mostrar DD/MM
  if (year === now.getFullYear()) {
    return `${day}/${month}`;
  }

  // Anos diferentes - mostrar DD/MM/AAAA (ano completo para maior clareza)
  return `${day}/${month}/${year}`;
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'EM_ANDAMENTO': return 'mdi-circle';
    case 'AGENDADA': return 'mdi-clock-outline';
    case 'FINALIZADA': return 'mdi-check-circle';
    case 'CANCELADA': return 'mdi-cancel';
    default: return 'mdi-circle-outline';
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'EM_ANDAMENTO': return 'success';
    case 'AGENDADA': return 'warning';
    case 'FINALIZADA': return 'info';
    case 'CANCELADA': return 'error';
    default: return 'grey';
  }
};

// Handlers
const handleChatBack = () => {
  chatStore.selectedChat = null;
  if (!mdAndUp.value) {
    drawer.value = true;
  }
};

const handleMessageReceived = (message) => {
  // O store já cuida de atualizar as mensagens
  // Aqui podemos adicionar lógica adicional se necessário
};

const refreshChats = async () => {
  await chatStore.loadMentorias();
};

const markAllAsRead = () => {
  chatStore.allChats.forEach(chat => {
    chatStore.unreadMessages.set(chat.id, 0);
  });
};

const toggleDrawer = () => {
  drawer.value = !drawer.value;
  drawerExpanded.value = !drawerExpanded.value;
};

const close = () => {
  chatStore.selectedChat = null;
  selectChat.value = null
  emit('close');
};

// Lifecycle
onMounted(() => {
  // Se o chat não estiver inicializado, inicializar
  if (!chatStore.isConnected && authStore.isAuthenticated) {
    chatStore.initialize(authStore.userId);
  }
});

// Watch para quando o diálogo abrir
watch(visible, (newValue) => {
  if (newValue && !chatStore.isConnected && authStore.isAuthenticated) {
    chatStore.initialize(authStore.userId);
  }
});
</script>

<style scoped>
.chat-dialog :deep(.v-overlay__content) {
  margin: 0;
  height: 100vh;
  max-height: 100vh;
}

.chat-list-container {
  flex: 1;
  height: 100%;
  display: flex;
  overflow: hidden;
}

.chat-sidebar {
  overflow: hidden !important;
  border-right: 1px solid #e0e0e0;
  background-color: #f8f9fa;
}

.chat-sidebar :deep(.v-navigation-drawer__content) {
  height: 100vh !important;
  top: 0 !important;
  height: calc(100% - 0px) !important;
}

.chat-dialog :deep(.v-navigation-drawer.chat-sidebar) {
  height: 100vh !important;
  top: 0 !important;
  height: calc(100% - 0px) !important;
}

.sidebar-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-title {
  font-size: 18px;
  font-weight: 500;
}

.search-container {
  padding: 12px;
  background-color: #f8f9fa;
}

.search-field :deep(.v-field) {
  border-radius: 20px;
  background-color: white;
}

.filters-container {
  padding: 0 12px 8px 12px;
  background-color: #f8f9fa;
}

.filter-chips {
  justify-content: flex-start;
}

.chat-list {
  background-color: white;
  overflow-y: auto !important;
  height: calc(97% - 180px);
}

.empty-chats {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.chat-item {
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 12px 16px;
}

.chat-item:hover {
  background-color: #f5f5f5;
}

.chat-item.has-unread {
  background-color: #f0f7ff;
}

.chat-item.chat-active {
  border-left: 3px solid #4caf50;
}

.chat-avatar {
  position: relative;
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background-color: #4caf50;
  border: 2px solid white;
  border-radius: 50%;
}

.chat-title {
  font-weight: 500;
  font-size: 16px;
  display: flex;
  align-items: center;
}

.chat-subtitle {
  margin-top: 4px;
}

.subtitle-line {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #667781;
  margin-bottom: 2px;
}

.role-text {
  font-weight: 500;
}

.last-message {
  font-size: 13px;
  color: #667781;
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  min-width: 60px;
}

.chat-time {
  font-size: 12px;
  color: #667781;
  white-space: nowrap;
}

.status-icon {
  opacity: 0.7;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
  padding-top: 0 !important;
}

.empty-chat-area {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 20px;
  position: relative;
  min-height: 100vh;
}

/* Animação de fundo */
.background-animation {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  pointer-events: none;
}

.floating-bubble {
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  animation: float 15s infinite linear;
}

.bubble-1 {
  width: 80px;
  height: 80px;
  left: 10%;
  animation-delay: -5s;
}

.bubble-2 {
  width: 120px;
  height: 120px;
  left: 20%;
  animation-delay: -1s;
}

.bubble-3 {
  width: 60px;
  height: 60px;
  left: 60%;
  animation-delay: -8s;
}

.bubble-4 {
  width: 100px;
  height: 100px;
  left: 80%;
  animation-delay: -3s;
}

@keyframes float {
  0% {
    opacity: 0;
    transform: translateY(100vh) rotate(0deg);
  }

  10% {
    opacity: 1;
  }

  90% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translateY(-100px) rotate(360deg);
  }
}

/* Conteúdo principal */
.empty-content {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  padding: inherit
}

.main-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

/* Ícone principal */
.icon-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.main-icon {
  z-index: 2;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2));
  font-size: 48px !important;
}

.icon-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }

  100% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
}

/* Texto principal */
.text-content {
  text-align: center;
  color: white;
  margin-bottom: 4px;
}

.welcome-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  background: linear-gradient(45deg, #fff, #f0f0f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-subtitle {
  font-size: 0.95rem;
  opacity: 0.9;
  line-height: 1.4;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  margin: 0 auto;
}

/* Grid de recursos */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  width: 100%;
  max-width: 700px;
}

.feature-card {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  position: relative;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.feature-card:hover::before {
  transform: scaleX(1);
}

.feature-content {
  padding: 16px !important;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.feature-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(103, 126, 234, 0.1);
  border-radius: 10px;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.feature-card:hover .feature-icon-wrapper {
  background: rgba(103, 126, 234, 0.2);
  transform: scale(1.1);
}

.feature-text {
  flex: 1;
}

.v-badge-custom {
  bottom: calc(100% - 10px) !important;
  left: calc(100% - 0px) !important;
}

.feature-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 4px;
  line-height: 1.2;
}

.feature-description {
  font-size: 0.8rem;
  color: #718096;
  line-height: 1.3;
  margin: 0;
}

/* Call to action */
.cta-section {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

.cta-button {
  font-size: 0.95rem !important;
  font-weight: 600 !important;
  padding: 0 24px !important;
  height: 44px !important;
  border-radius: 22px !important;
  text-transform: none !important;
  box-shadow: 0 6px 24px rgba(103, 126, 234, 0.3) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(103, 126, 234, 0.4) !important;
}

/* Responsividade */
@media (max-width: 960px) {
  .empty-chat-area {
    padding: 24px 16px;
    min-height: calc(100vh - 64px);
  }

  .main-content {
    gap: 16px;
  }

  .welcome-title {
    font-size: 1.3rem;
  }

  .welcome-subtitle {
    font-size: 0.9rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .feature-content {
    padding: 14px !important;
  }

  .icon-wrapper {
    width: 70px;
    height: 70px;
  }

  .icon-pulse {
    width: 70px;
    height: 70px;
  }

  .main-icon {
    font-size: 40px !important;
  }
}

@media (max-width: 600px) {
  .empty-chat-area {
    padding: 20px 12px;
  }

  .main-content {
    gap: 14px;
  }

  .welcome-title {
    font-size: 1.2rem;
  }

  .welcome-subtitle {
    font-size: 0.85rem;
  }

  .feature-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 12px !important;
  }

  .feature-icon-wrapper {
    width: 36px;
    height: 36px;
  }

  .cta-button {
    width: 100%;
    max-width: 240px;
    height: 40px !important;
    font-size: 0.9rem !important;
  }
}

/* Melhorias gerais */
.mentoring-chat {
  height: 100%;
  background: white;
  border-radius: 0;
}

.mobile-drawer-toggle {
  z-index: 1000;
  margin: 16px;
}

@media (max-width: 960px) {
  .chat-sidebar.drawer-expanded {
    width: 100% !important;
  }

  .sidebar-header {
    padding: 8px 12px;
  }

  .chat-item {
    padding: 16px;
  }

  .empty-content {
    padding: 20px;
  }

  .empty-features {
    margin-top: 24px;
  }
}
</style>
