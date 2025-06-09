<template>
  <div class="pa-4">
    <v-row>
      <v-col cols="12" class="btn">
        <v-btn
          class="btn"
          variant="flat"
          color="primary"
          append-icon="mdi mdi-plus"
          to="/discipline"
        >
          Mentoria
        </v-btn>
      </v-col>

      <v-col cols="12">
        <v-card v-if="isLoadingParticipationSessions" class="text-center pa-6">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <p class="mt-2">Carregando suas mentorias...</p>
        </v-card>

        <template v-else-if="props.participationSessions.length > 0">
          <v-list class="bg-transparent">
            <v-list-item
              v-for="session in props.participationSessions"
              :key="session.id"
              class="mb-2"
              :class="{ 'list-item-expanded': expandedSession === session.id }"
              @click="toggleExpansion(session.id)"
            >
              <v-list-item-title class="text-subtitle-1 font-weight-medium">
                {{ session.disciplineName }}
              </v-list-item-title>

              <v-list-item-subtitle class="mt-1">
                <div class="d-flex align-center flex-wrap ga-2">
                  <v-chip
                    :color="props.getStatusColor(session.status)"
                    size="x-small"
                    label
                  >
                    {{ session.status }}
                  </v-chip>
                  <span class="text-caption">{{ session.mentorName }}</span>
                  <span class="text-caption">{{ props.formatDate(session.tutoringDate) }}</span>
                  <span class="text-caption">{{ session.startTime }}</span>
                </div>
              </v-list-item-subtitle>

              <template v-slot:append>
                <v-icon
                  :class="{ 'rotate-icon': expandedSession === session.id }"
                  class="transition-transform"
                >
                  mdi-chevron-down
                </v-icon>
              </template>

              <v-expand-transition>
                <div v-if="expandedSession === session.id" class="expansion-content mt-4">
                  <v-divider class="mb-4"></v-divider>

                  <v-row>
                    <v-col cols="12" md="6">
                      <div class="detail-item">
                        <v-icon class="mr-2" size="small">mdi-account</v-icon>
                        <strong>Mentor:</strong> {{ session.mentorName }}
                      </div>

                      <div class="detail-item">
                        <v-icon class="mr-2" size="small">mdi-calendar</v-icon>
                        <strong>Data:</strong> {{ props.formatDate(session.tutoringDate) }}
                      </div>

                      <div class="detail-item">
                        <v-icon class="mr-2" size="small">mdi-clock-outline</v-icon>
                        <strong>Horário:</strong> {{ session.startTime }} - {{ session.endTime }}
                      </div>

                      <div class="detail-item">
                        <v-icon class="mr-2" size="small">mdi-account-group</v-icon>
                        <strong>Participantes:</strong> {{ session.maxParticipants }}
                      </div>
                    </v-col>

                    <v-col cols="12" md="6">
                      <div v-if="session.local" class="detail-item">
                        <v-icon class="mr-2" size="small">mdi-map-marker</v-icon>
                        <strong>Local:</strong> {{ session.local }}
                      </div>

                      <div v-if="session.linkVideo && session.linkVideo !== 'Não se aplica'" class="detail-item">
                        <v-icon class="mr-2" size="small">mdi-video</v-icon>
                        <strong>Link:</strong>
                        <a
                          :href="session.linkVideo"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="text-decoration-none ml-1"
                          @click.stop
                        >
                          Acessar aula
                        </a>
                      </div>

                      <div class="detail-item">
                        <v-chip
                          size="small"
                          :color="session.tutoringClassType === 'ONLINE' ? 'info' : 'success'"
                          label
                        >
                          {{ session.tutoringClassType }}
                        </v-chip>
                      </div>
                    </v-col>
                  </v-row>

                  <div v-if="session.topics && session.topics.length > 0" class="topics-section mt-4">
                    <div class="topics-header mb-2">
                      <v-icon class="mr-2" size="small">mdi-tag-multiple</v-icon>
                      <strong>Tópicos:</strong>
                    </div>
                    <div class="topics-container">
                      <v-chip
                        v-for="(topic, index) in session.topics"
                        :key="index"
                        size="small"
                        color="primary"
                        variant="outlined"
                        class="ma-1"
                        label
                      >
                        {{ topic }}
                      </v-chip>
                    </div>
                  </div>

                  <v-row class="mt-4" justify="end">
                    <v-col cols="auto">
                      <v-btn
                        v-if="session.status === 'CONCLUIDA' && !hasBeenRated[session.id]"
                        color="secondary"
                        variant="flat"
                        prepend-icon="mdi-star"
                        @click.stop="openRatingDialog(session)"
                        size="small"
                        class="mr-2"
                      >
                        Avaliar Mentor
                      </v-btn>

                      <v-btn
                        v-if="session.status !== 'CONCLUIDA'"
                        color="error"
                        variant="outlined"
                        prepend-icon="mdi-logout"
                        @click.stop="handleLeaveTutoring(session.id)"
                        :loading="isLeavingTutoring === session.id"
                        :disabled="isLeavingTutoring === session.id"
                        size="small"
                      >
                        Sair da Mentoria
                      </v-btn>
                    </v-col>
                  </v-row>
                </div>
              </v-expand-transition>
            </v-list-item>
          </v-list>
        </template>

        <v-card v-else class="text-center pa-6">
          <v-icon size="x-large" color="grey-lighten-1" class="mb-3">mdi-information-outline</v-icon>
          <p class="text-h6 text-medium-emphasis">Você não está participando de nenhuma mentoria no momento.</p>
          <v-btn color="primary" class="mt-4" to="/discipline" append-icon="mdi-magnify">Encontrar Mentorias</v-btn>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="showRatingDialog" max-width="500px">
      <v-card>
        <v-card-title class="headline">Avaliar Mentoria</v-card-title>
        <v-card-text>
          <div class="text-center">
            <p class="text-h6 mb-2">Como você avalia o mentor?</p>
            <v-rating
              v-model="mentorRating"
              color="warning"
              empty-icon="mdi-star-outline"
              full-icon="mdi-star"
              half-increments
              hover
              size="48"
            ></v-rating>
            <p class="text-subtitle-1 mt-4">Comentário (opcional):</p>
            <v-textarea
              v-model="reviewComment"
              label="Deixe seu comentário aqui"
              rows="3"
              clearable
              variant="outlined"
            ></v-textarea>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeRatingDialog" :disabled="isSubmittingRating">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" @click="submitRating" :loading="isSubmittingRating">Enviar Avaliação</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="top"
      rounded="pill"
      variant="elevated"
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="snackbar.show = false"
        >
          Fechar
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { leaveTutoringSession } from '@/services/userService';
import { getTutoringRatingsByTutoringId, addTutoringRating } from '@/services/tutoringRatingService';

const props = defineProps({
  participationSessions: { type: Array, default: () => [] },
  isLoadingParticipationSessions: { type: Boolean, default: false },
  formatDate: { type: Function, required: true },
  getStatusColor: { type: Function, required: true }
});

const emit = defineEmits(['session-left', 'operation-success', 'operation-error']);

const authStore = useAuthStore();
const isLeavingTutoring = ref(null);
const expandedSession = ref(null);

// --- Novo Estado para o Pop-up de Avaliação ---
const showRatingDialog = ref(false);
const currentTutoringToRate = ref(null);
const mentorRating = ref(0); // Para a classificação por estrelas
const reviewComment = ref('');
const isSubmittingRating = ref(false);
const hasBeenRated = ref({});

// --- State for Snackbar (Toast) ---
const snackbar = ref({
  show: false,
  message: '',
  color: '',
  timeout: 5000,
});

const notifiedSessions = ref(new Set());

const upcomingMentoringSessions = computed(() => {
  const now = new Date();
  return props.participationSessions.filter(session => {
    const sessionDateTime = new Date(`${session.tutoringDate}T${session.startTime}`);
    // Considere as sessões que ainda não começaram ou estão dentro de um curto período de tempo
    // (ex: nos próximos 30 minutos ou que começaram há até 10 minutos atrás, ajuste conforme necessidade)
    const thirtyMinutesBefore = new Date(sessionDateTime.getTime() - 30 * 60 * 1000);
    const tenMinutesAfter = new Date(sessionDateTime.getTime() + 10 * 60 * 1000);

    return (sessionDateTime > now || (now >= thirtyMinutesBefore && now <= tenMinutesAfter)) &&
           session.status !== 'CANCELADA' &&
           session.status !== 'CONCLUIDA' && // As notificações são para sessões futuras ou em andamento
           session.status !== 'FINALIZADA'; // As notificações são para sessões futuras ou em andamento
  });
});

// --- Novas Funções de Avaliação ---
const openRatingDialog = async (session) => {
  currentTutoringToRate.value = session;
  mentorRating.value = 0; // Redefinir avaliação
  reviewComment.value = ''; // Redefinir comentário

  // Opcional: Verificar se já foi avaliado antes de abrir (embora o botão deva lidar com isso)
  // Isso é bom para robustez, especialmente se o estado `hasBeenRated` não for totalmente confiável.
  try {
    const response = await getTutoringRatingsByTutoringId(session.id);
    const ratings = response.data;
    if (ratings && ratings.length > 0) {
      showSnackbar('Esta mentoria já foi avaliada!', 'info');
      // Opcionalmente, você poderia preencher o diálogo com a avaliação existente para edição
      // ou apenas impedir a abertura do diálogo aqui. Por enquanto, apenas informamos.
      return;
    }
  } catch (error) {
    console.error("Erro ao verificar avaliação existente:", error);
    // Continuar abrindo o diálogo se houver um erro ao buscar,
    // assumindo que isso significa que nenhuma avaliação existe ou um problema com a API.
  }

  showRatingDialog.value = true;
};

const closeRatingDialog = () => {
  showRatingDialog.value = false;
  currentTutoringToRate.value = null;
};

const submitRating = async () => {
  if (!currentTutoringToRate.value || mentorRating.value === 0) {
    showSnackbar('Por favor, selecione uma nota para o mentor.', 'warning');
    return;
  }

  isSubmittingRating.value = true;
  try {
    const ratingData = {
      mentorRating: mentorRating.value,
      review: reviewComment.value,
      tutoringId: currentTutoringToRate.value.id // Garanta que o tutoringId seja passado
    };
    await addTutoringRating(currentTutoringToRate.value.id, ratingData);
    showSnackbar('Avaliação enviada com sucesso!', 'success');
    hasBeenRated.value[currentTutoringToRate.value.id] = true; // Marcar como avaliado
    closeRatingDialog();
    emit('refresh-sessions'); // Emitir um evento para o pai recarregar as sessões, se necessário
  } catch (error) {
    console.error("Erro ao enviar avaliação:", error);
    let errorMessage = "Ocorreu um erro ao enviar sua avaliação.";
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    }
    showSnackbar(errorMessage, 'error');
  } finally {
    isSubmittingRating.value = false;
  }
};

// Monitora as mudanças em participationSessions para inicializar `hasBeenRated`
// e potencialmente verificar avaliações existentes.
watch(() => props.participationSessions, async (newSessions) => {
  // Reinicia hasBeenRated para um novo conjunto de sessões
  hasBeenRated.value = {};
  for (const session of newSessions) {
    if (session.status === 'FINALIZADA') { // Ou 'CONCLUIDA' conforme seu código original
      try {
        const response = await getTutoringRatingsByTutoringId(session.id);
        hasBeenRated.value[session.id] = response.data && response.data.length > 0;
      } catch (error) {
        console.error(`Erro ao verificar avaliação para a mentoria ${session.id}:`, error);
        hasBeenRated.value[session.id] = false; // Assume que não foi avaliado se a chamada da API falhar
      }
    } else {
      hasBeenRated.value[session.id] = false;
    }
  }
}, { immediate: true, deep: true }); // immediate: true executa na montagem do componente


// Function to toggle expansion
const toggleExpansion = (sessionId) => {
  expandedSession.value = expandedSession.value === sessionId ? null : sessionId;
};

// Function to display the snackbar
const showSnackbar = (message, color = 'info', timeout = 5000) => {
  snackbar.value = { show: true, message, color, timeout };
};

watch(upcomingMentoringSessions, (newSessions) => {
  newSessions.forEach(session => {
    if (!notifiedSessions.value.has(session.id)) {
      // Ajuste para exibir a mensagem de notificação de forma mais robusta
      // Considerando que o status da mentoria pode não ser sempre 'FINALIZADA' aqui.
      const now = new Date();
      const sessionStart = new Date(`${session.tutoringDate}T${session.startTime}`);
      let notificationMessage = `Atenção! Mentoria de ${session.disciplineName} com ${session.mentorName}`;
      if (sessionStart > now) {
        notificationMessage += ` está prestes a começar em ${session.startTime}!`;
      } else {
        notificationMessage += ` começou às ${session.startTime}!`;
      }
      showSnackbar(notificationMessage, 'info', 10000);
      notifiedSessions.value.add(session.id);
    }
  });
  // Remover IDs de sessões que não estão mais na lista de upcoming
  const currentSessionIds = new Set(newSessions.map(s => s.id));
  notifiedSessions.value.forEach(id => {
    if (!currentSessionIds.has(id)) {
      notifiedSessions.value.delete(id);
    }
  });
}, { deep: true });

async function handleLeaveTutoring(tutoringId) {
  if (!window.confirm("Você tem certeza que deseja sair desta mentoria? Esta ação não pode ser desfeita.")) {
    return;
  }

  const userIdString = authStore.getCurrentUserId;
  if (!userIdString) {
    const errorMsg = "Não foi possível identificar o usuário. Por favor, tente fazer login novamente.";
    console.error(errorMsg);
    emit('operation-error', errorMsg);
    return;
  }

  const userId = parseInt(userIdString, 10);
  if (isNaN(userId)) {
    const errorMsg = "ID do usuário inválido. Não é possível processar a solicitação.";
    console.error(errorMsg);
    emit('operation-error', errorMsg);
    return;
  }

  isLeavingTutoring.value = tutoringId;

  try {
    await leaveTutoringSession(tutoringId, userId);
    emit('session-left', tutoringId);
    emit('operation-success', "Você saiu da mentoria com sucesso!");
  } catch (error) {
    console.error(`Erro ao sair da mentoria ID ${tutoringId} para o usuário ID ${userId}:`, error);
    let errorMessage = "Ocorreu um erro ao tentar sair da mentoria.";

    if (error.response) {
      errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
      switch(error.response.status) {
        case 400:
          errorMessage = error.response.data?.message || "Operação inválida. Verifique se você é um participante desta mentoria.";
          break;
        case 401:
          errorMessage = error.response.data?.message || "Não autorizado. Sua sessão pode ter expirado. Tente fazer login novamente.";
          break;
        case 403:
          errorMessage = error.response.data?.message || "Acesso negado. Você não tem permissão para realizar esta ação.";
          break;
        case 404:
          errorMessage = error.response.data?.message || "Mentoria ou usuário não encontrado.";
          break;
        case 500:
          errorMessage = error.response.data?.message || "Erro interno no servidor. Por favor, tente novamente mais tarde.";
          break;
      }
    } else if (error.request) {
      errorMessage = "Não foi possível conectar ao servidor. Verifique sua conexão com a internet.";
    } else {
      errorMessage = error.message || "Erro desconhecido ao processar sua solicitação.";
    }
    emit('operation-error', errorMessage);
  } finally {
    isLeavingTutoring.value = null;
  }
}
</script>

<style scoped>
.titulo {
  padding: 20px;
  text-align: center;
}

.btn {
  display: flex;
  justify-content: end;
}

.v-list-item {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 16px;
}

.v-list-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.list-item-expanded {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.rotate-icon {
  transform: rotate(180deg);
}

.transition-transform {
  transition: transform 0.3s ease;
}

.expansion-content {
  padding: 0 16px;
}

.detail-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 0.875rem;
}

.topics-section {
  margin-top: 16px;
}

.topics-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.topics-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.v-expand-transition-enter-active,
.v-expand-transition-leave-active {
  transition: all 0.3s ease;
}
</style>
