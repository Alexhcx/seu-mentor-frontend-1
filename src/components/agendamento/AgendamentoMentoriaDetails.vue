<template>
  <v-card v-if="mentoria" class="mt-4" elevation="2">
    <v-card-title class="text-h6 font-weight-bold">
      <v-icon class="mr-2">mdi-information-outline</v-icon>
      Detalhes da Mentoria
    </v-card-title>

    <v-card-text>
      <v-row>
        <v-col cols="12" md="6">
          <p><v-icon class="mr-1" small>mdi-book-open-variant</v-icon> <strong>Disciplina:</strong> {{ mentoria.disciplineName || disciplinaSelecionada?.disciplineName }}</p>
          <p v-if="mentoria.mentorName"><v-icon class="mr-1" small>mdi-account</v-icon> <strong>Mentor:</strong> {{ mentoria.mentorName }}</p>
          <p v-if="mentorAverageRating !== null">
            <v-icon class="mr-1" small>mdi-star</v-icon>
            <strong>Avaliação do Mentor:</strong> {{ mentorAverageRating ? mentorAverageRating.toFixed(2) : 'N/A' }}
          </p>
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
          <p v-if="mentoria.local"><v-icon class="mr-1" small>mdi-map-marker</v-icon> <strong>Local:</strong> {{ mentoria.local }}</p>
          <p v-if="mentoria.linkVideo">
            <v-icon class="mr-1" small>mdi-video</v-icon>
            <strong>Link:</strong>
            <a :href="mentoria.linkVideo" target="_blank" rel="noopener noreferrer" class="text-decoration-none">Acessar aula</a>
          </p>
          <p v-if="mentoria.maxParticipants">
            <v-icon class="mr-1" small>mdi-account-group</v-icon>
            <strong>Participantes:</strong> {{ mentoria.qtdParticipants || 0 }} / {{ mentoria.maxParticipants }}
          </p>
          <p v-if="mentoria.isChatEnable !== undefined">
            <v-icon class="mr-1" small>mdi-chat</v-icon>
            <strong>Chat:</strong> {{ mentoria.isChatEnable ? 'Habilitado' : 'Desabilitado' }}
          </p>
        </v-col>

        <v-col cols="12" v-if="mentoria.description">
          <p><v-icon class="mr-1" small>mdi-text-box-outline</v-icon> <strong>Descrição:</strong></p>
          <p class="pl-6">{{ mentoria.description }}</p>
        </v-col>

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
      <v-btn
        color="grey-darken-1"
        variant="text"
        @click="$emit('fechar')"
      >
        Fechar
      </v-btn>

      <v-btn
        v-if="jaParticipando"
        color="error"
        variant="outlined"
        @click="$emit('sair-mentoria')"
        :loading="saindoMentoria"
        :disabled="saindoMentoria || agendando"
        prepend-icon="mdi-exit-to-app"
      >
        Sair da Mentoria
      </v-btn>

      <v-btn
        v-else
        color="primary"
        variant="elevated"
        @click="$emit('agendar')"
        :loading="agendando"
        :disabled="agendando || !podeAgendar || saindoMentoria"
        :prepend-icon="mentoria.status === 'A_MARCAR' ? 'mdi-calendar-plus' : 'mdi-account-plus'"
      >
        {{ getActionButtonText(mentoria.status) }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  mentoria: {
    type: Object,
    default: null
  },
  disciplinaSelecionada: {
    type: Object,
    default: null
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
  formatarData: {
    type: Function,
    required: true
  },
  // NOVO: Prop para a nota média do mentor
  mentorAverageRating: {
    type: Number,
    default: null // Pode ser null se a nota ainda não foi carregada ou se não houver avaliações
  }
});

defineEmits(['fechar', 'agendar', 'sair-mentoria']);

const jaParticipando = computed(() => {
  console.log('=== DEBUG jaParticipando ===');
  console.log('mentoria.participants:', props.mentoria?.participants);
  console.log('currentUserId:', props.currentUserId);
  console.log('typeof currentUserId:', typeof props.currentUserId);

  if (!props.mentoria?.participants || !props.currentUserId) {
    console.log('Retornando false - dados ausentes');
    return false;
  }

  const currentUserIdStr = String(props.currentUserId);
  console.log('currentUserIdStr:', currentUserIdStr);

  const participando = props.mentoria.participants.some(p => {
    console.log('Comparando:', String(p.userId), '===', currentUserIdStr);
    return String(p.userId) === currentUserIdStr;
  });

  console.log('Resultado jaParticipando:', participando);
  console.log('=== FIM DEBUG jaParticipando ===');

  return participando;
});

const podeAgendar = computed(() => {
  console.log('=== DEBUG podeAgendar ===');
  console.log('mentoria:', props.mentoria);
  console.log('jaParticipando.value:', jaParticipando.value);

  if (!props.mentoria) {
    console.log('Retornando false - mentoria ausente');
    return false;
  }

  if (jaParticipando.value) {
    console.log('Retornando false - já participando');
    return false;
  }

  const status = props.mentoria.status;
  console.log('status:', status);

  // CORREÇÃO: Adicionado 'AGENDADA' à lista de status permitidos
  const statusPermitidos = [
    'A_MARCAR',
    'AGENDADA_ALUNO',
    'PENDENTE',
    'AGENDADA',
    'PENDENTE_CONFIRMACAO_MENTOR',
    'CONFIRMADA'
  ];

  if (!statusPermitidos.includes(status)) {
    console.log('Retornando false - status não permitido:', status);
    return false;
  }

  // Verificar vagas disponíveis se houver limite
  if (props.mentoria.maxParticipants) {
    const vagas = props.mentoria.maxParticipants - (props.mentoria.qtdParticipants || 0);
    console.log('vagas disponíveis:', vagas);

    if (vagas <= 0) {
      console.log('Retornando false - sem vagas');
      return false;
    }
  }

  console.log('Retornando true - pode agendar');
  console.log('=== FIM DEBUG podeAgendar ===');
  return true;
});

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
    'A_MARCAR': 'Disponível para Agendamento',
    'AGENDADA_ALUNO': 'Agendada pelo Aluno',
    'AGENDADA': 'Agendada',
    'PENDENTE_CONFIRMACAO_MENTOR': 'Pendente Confirmação',
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
