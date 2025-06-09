<template>
  <v-card elevation="2">
    <v-card-title class="d-flex justify-space-between align-center">
      <div class="text-h6 font-weight-bold">
        <v-icon class="mr-2">mdi-school</v-icon>
        Mentorias Disponíveis
      </div>
      <div class="d-flex align-center gap-2">
        <v-chip
          v-if="dataSelecionada"
          color="info"
          size="small"
          closable
          @click:close="$emit('limpar-data')"
        >
          {{ formatarDataChip(dataSelecionada) }}
        </v-chip>
        <v-chip
          v-if="disciplinaSelecionada"
          color="primary"
          size="small"
          closable
          @click:close="$emit('limpar-disciplina')"
        >
          {{ disciplinaSelecionada.disciplineName }}
        </v-chip>
      </div>
    </v-card-title>

    <v-card-text v-if="!disciplinaSelecionada" class="text-center pa-6">
      <v-icon size="large" color="grey" class="mb-2">mdi-book-search</v-icon>
      <p class="text-h6 text-medium-emphasis">Selecione uma disciplina para ver as mentorias disponíveis.</p>
    </v-card-text>

    <v-card-text v-else-if="carregando" class="text-center pa-6">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
      <p class="mt-2">Carregando mentorias disponíveis...</p>
    </v-card-text>

    <template v-else-if="mentoriasFiltradas.length > 0">
      <v-list>
        <v-list-subheader>
          {{ mentoriasFiltradas.length }} mentorias encontradas
          <span v-if="dataSelecionada"> para {{ formatarDataChip(dataSelecionada) }}</span>
        </v-list-subheader>

        <template v-for="(mentoria, index) in mentoriasFiltradas" :key="`mentoria-${getMentoriaUniqueId(mentoria, index)}`">
          <!-- Item da mentoria -->
          <v-list-item
            :value="getMentoriaUniqueId(mentoria, index)"
            @click="toggleMentoriaDetails(mentoria, index)"
            :active="isMentoriaExpanded(mentoria, index)"
            :title="mentoria.disciplineName || disciplinaSelecionada?.disciplineName"
            :subtitle="`${formatarData(mentoria.tutoringDate)} • ${mentoria.startTime} - ${mentoria.endTime}`"
            rounded="lg"
            class="mb-2"
          >
            <template v-slot:prepend>
              <v-avatar color="primary" variant="tonal">
                <v-icon>mdi-book-education</v-icon>
              </v-avatar>
            </template>

            <template v-slot:append>
              <div class="d-flex align-center gap-2">
                <!-- Chip de participação - aparece apenas se você for participante -->
                <v-chip
                  v-if="jaParticipando(mentoria)"
                  color="success"
                  size="small"
                  prepend-icon="mdi-account-check"
                  variant="flat"
                >
                  Participando
                </v-chip>

                <v-chip
                  :color="getStatusColor(mentoria.status)"
                  size="small"
                  label
                >
                  {{ getStatusText(mentoria.status) }}
                </v-chip>
                <v-chip
                  :color="mentoria.tutoringClassType === 'ONLINE' ? 'info' : 'success'"
                  size="small"
                >
                  {{ mentoria.tutoringClassType }}
                </v-chip>
                <v-icon
                  :class="isMentoriaExpanded(mentoria, index) ? 'rotate-180' : ''"
                  class="transition-transform"
                >
                  mdi-chevron-down
                </v-icon>
              </div>
            </template>
          </v-list-item>

          <!-- Detalhes da mentoria (expandível) -->
          <v-expand-transition>
            <div v-if="isMentoriaExpanded(mentoria, index)">
              <v-card class="ma-4 mt-0" elevation="1" border>
                <v-card-title class="text-h6 font-weight-bold py-3">
                  <v-icon class="mr-2">mdi-information-outline</v-icon>
                  Detalhes da Mentoria
                </v-card-title>

                <v-card-text class="pt-0">
                  <v-row>
                    <v-col cols="12" md="6">
                      <p><v-icon class="mr-1" small>mdi-book-open-variant</v-icon> <strong>Disciplina:</strong> {{ mentoria.disciplineName || disciplinaSelecionada?.disciplineName }}</p>
                      <p v-if="mentoria.mentorName"><v-icon class="mr-1" small>mdi-account</v-icon> <strong>Mentor:</strong> {{ mentoria.mentorName }}</p>
                      <p><v-icon class="mr-1" small>mdi-calendar</v-icon> <strong>Data:</strong> {{ formatarData(mentoria.tutoringDate) }}</p>
                      <p><v-icon class="mr-1" small>mdi-clock-outline</v-icon> <strong>Horário:</strong> {{ mentoria.startTime }} - {{ mentoria.endTime }}</p>
                      <p><v-icon class="mr-1" small>mdi-flag</v-icon> <strong>Status:</strong>
                        <v-chip :color="getStatusColor(mentoria.status)" size="small" class="ml-1">
                          {{ getStatusText(mentoria.status) }}
                        </v-chip>
                      </p>
                    </v-col>

                    <v-col cols="12" md="6">
                      <p><v-icon class="mr-1" small>mdi-school</v-icon> <strong>Tipo:</strong> {{ mentoria.tutoringClassType }}</p>
                      <p v-if="mentoria.maxParticipants">
                        <v-icon class="mr-1" small>mdi-account-group</v-icon>
                        <strong>Participantes:</strong> {{ mentoria.qtdParticipants || 0 }} / {{ mentoria.maxParticipants }}
                      </p>
                      <p v-if="mentoria.mentorName && mentorAverageRating !== null">
                        <v-icon class="mr-1" small>mdi-star</v-icon>
                        <strong>Avaliação do Mentor:</strong> {{ mentorAverageRating ? mentorAverageRating.toFixed(2) : 'N/A' }}
                      </p>
                    </v-col>

                    <v-col cols="12" v-if="mentoria.description">
                      <p><v-icon class="mr-1" small>mdi-text-box-outline</v-icon> <strong>Descrição:</strong></p>
                      <p class="pl-6">{{ mentoria.description }}</p>
                    </v-col>

                    <!-- Mostrar participantes se existirem -->
                    <v-col cols="12" v-if="mentoria.participants && mentoria.participants.length > 0">
                      <p><v-icon class="mr-1" small>mdi-account-multiple</v-icon> <strong>Participantes Inscritos:</strong></p>
                      <v-list density="compact" class="pl-6">
                        <v-list-item
                          v-for="participant in mentoria.participants"
                          :key="participant.userId"
                          :title="participant.userName"
                          :subtitle="participant.topic || 'Sem tópico específico'"
                          prepend-icon="mdi-account-circle"
                        >
                          <template v-slot:append v-if="participant.userId === currentUserId">
                            <v-chip color="primary" size="small">Você</v-chip>
                          </template>
                        </v-list-item>
                      </v-list>
                    </v-col>
                  </v-row>
                </v-card-text>

                <v-card-actions class="pa-4">
                  <v-spacer></v-spacer>

                  <!-- Botão para sair da mentoria se já estiver participando -->
                  <v-btn
                    v-if="jaParticipando(mentoria)"
                    color="error"
                    variant="outlined"
                    @click="$emit('sair-mentoria', mentoria)"
                    :loading="saindoMentoria"
                    :disabled="saindoMentoria || agendando"
                    prepend-icon="mdi-exit-to-app"
                  >
                    Sair da Mentoria
                  </v-btn>

                  <!-- Botão para agendar/participar -->
                  <v-btn
                    v-else
                    color="primary"
                    variant="elevated"
                    @click="$emit('agendar', mentoria)"
                    :loading="agendando"
                    :disabled="agendando || !podeAgendar(mentoria) || saindoMentoria"
                    :prepend-icon="mentoria.status === 'A_MARCAR' ? 'mdi-calendar-plus' : 'mdi-account-plus'"
                  >
                    {{ getActionButtonText(mentoria.status) }}
                  </v-btn>
                </v-card-actions>
              </v-card>
            </div>
          </v-expand-transition>
        </template>
      </v-list>
    </template>

    <v-card-text v-else class="text-center pa-6">
      <v-icon size="large" color="grey" class="mb-2">mdi-calendar-alert</v-icon>
      <p class="text-h6 text-medium-emphasis">
        Nenhuma mentoria disponível
        <span v-if="dataSelecionada">para {{ formatarDataChip(dataSelecionada) }}</span>
        com os filtros selecionados.
      </p>
      <v-btn color="primary" class="mt-4" @click="$emit('limpar-filtros')">Limpar Filtros</v-btn>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  mentoriasFiltradas: {
    type: Array,
    required: true
  },
  mentoriaSelecionada: {
    type: Object,
    default: null
  },
  disciplinaSelecionada: {
    type: Object,
    default: null
  },
  dataSelecionada: {
    type: [String, Date],
    default: null
  },
  carregando: {
    type: Boolean,
    default: false
  },
  formatarData: {
    type: Function,
    required: true
  },
  currentUserId: {
    type: [String, Number],
    required: true
  },
  agendando: {
    type: Boolean,
    default: false
  },
  saindoMentoria: {
    type: Boolean,
    default: false
  },
  mentorAverageRating: {
    type: Number,
    default: null
  }
});

const emit = defineEmits([
  'selecionar-mentoria',
  'limpar-filtros',
  'limpar-data',
  'limpar-disciplina',
  'agendar',
  'sair-mentoria'
]);

// Função para obter um ID único para cada mentoria
const getMentoriaUniqueId = (mentoria, index) => {
  // Se tem ID válido, usar o ID. Senão, usar o índice
  return mentoria.id !== null && mentoria.id !== undefined ? mentoria.id : `index-${index}`;
};

// Função para verificar se uma mentoria específica está expandida
const isMentoriaExpanded = (mentoria, index) => {
  console.log('Verificando expansão - mentoria:', mentoria, 'index:', index, 'selecionada:', props.mentoriaSelecionada);

  // Se não há mentoria selecionada, nenhuma está expandida
  if (!props.mentoriaSelecionada) {
    return false;
  }

  // Comparar usando o mesmo critério usado para identificar as mentorias
  const currentUniqueId = getMentoriaUniqueId(mentoria, index);
  const selectedUniqueId = getMentoriaUniqueId(props.mentoriaSelecionada, props.mentoriaSelecionada._index || 0);

  return currentUniqueId === selectedUniqueId;
};

// Função para alternar os detalhes da mentoria
const toggleMentoriaDetails = (mentoria, index) => {
  console.log('=== DEBUG TOGGLE MENTORIA ===');
  console.log('Objeto mentoria completo:', mentoria);
  console.log('mentoria.id:', mentoria.id);
  console.log('index:', index);
  console.log('props.mentoriaSelecionada:', props.mentoriaSelecionada);

  // Criar uma cópia da mentoria com o índice para referência
  const mentoriaComIndex = {
    ...mentoria,
    _index: index
  };

  // Se a mentoria clicada já está expandida, fechar
  if (isMentoriaExpanded(mentoria, index)) {
    console.log('Fechando mentoria');
    emit('selecionar-mentoria', null);
  } else {
    // Senão, expandir apenas esta mentoria
    console.log('Expandindo mentoria:', getMentoriaUniqueId(mentoria, index));
    emit('selecionar-mentoria', mentoriaComIndex);
  }
  console.log('=== FIM DEBUG ===');
};

const formatarDataChip = (data) => {
  if (!data) return '';

  // Se já é uma string no formato correto DD/MM/YYYY, retornar
  if (typeof data === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
    return data;
  }

  // Se é uma string no formato YYYY-MM-DD, converter sem timezone
  if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data)) {
    const [year, month, day] = data.split('-').map(Number);
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  }

  // Para outros casos, tentar converter
  const date = new Date(data);
  if (isNaN(date.getTime())) {
    console.warn('formatarDataChip: data inválida:', data);
    return '';
  }

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const jaParticipando = (mentoria) => {
  if (!mentoria?.participants || !props.currentUserId) {
    return false;
  }

  const currentUserIdStr = String(props.currentUserId);
  return mentoria.participants.some(p => String(p.userId) === currentUserIdStr);
};

const podeAgendar = (mentoria) => {
  if (!mentoria) return false;
  if (jaParticipando(mentoria)) return false;

  const statusPermitidos = [
    'A_MARCAR',
    'AGENDADA_ALUNO',
    'PENDENTE',
    'AGENDADA',
    'PENDENTE_CONFIRMACAO_MENTOR',
    'CONFIRMADA'
  ];

  if (!statusPermitidos.includes(mentoria.status)) return false;

  // Verificar vagas disponíveis se houver limite
  if (mentoria.maxParticipants) {
    const vagas = mentoria.maxParticipants - (mentoria.qtdParticipants || 0);
    if (vagas <= 0) return false;
  }

  return true;
};

const getStatusColor = (status) => {
  const colors = {
    'A_MARCAR': 'warning',
    'AGENDADA_ALUNO': 'info',
    'AGENDADA': 'success',
    'PENDENTE_CONFIRMACAO_MENTOR': 'warning',
    'CONFIRMADA': 'success',
    'EM_ANDAMENTO': 'primary',
    'CONCLUIDA': 'grey',
    'CANCELADA': 'error'
  };
  return colors[status] || 'grey';
};

const getStatusText = (status) => {
  const texts = {
    'A_MARCAR': 'Disponível',
    'AGENDADA_ALUNO': 'Agendada',
    'AGENDADA': 'Agendada',
    'PENDENTE_CONFIRMACAO_MENTOR': 'Pendente',
    'CONFIRMADA': 'Confirmada',
    'EM_ANDAMENTO': 'Em Andamento',
    'CONCLUIDA': 'Concluída',
    'CANCELADA': 'Cancelada'
  };
  return texts[status] || status;
};

const getActionButtonText = (status) => {
  if (status === 'A_MARCAR') {
    return 'Agendar Mentoria';
  } else if (status === 'EM_ANDAMENTO') {
    return 'Participar (Sem Tópico)';
  } else {
    return 'Participar da Mentoria';
  }
};
</script>

<style scoped>
.transition-transform {
  transition: transform 0.2s ease-in-out;
}

.rotate-180 {
  transform: rotate(180deg);
}
</style>
