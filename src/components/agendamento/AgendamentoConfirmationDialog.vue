<template>
  <v-dialog :model-value="visible" @update:model-value="$emit('update:visible', $event)" max-width="500px" persistent>
    <v-card>
      <v-card-title class="text-h5 bg-primary text-white">
        {{ isScheduling ? 'Agendar Nova Mentoria' : 'Participar da Mentoria' }}
      </v-card-title>
      <v-card-text class="pt-4">
        <div v-if="isScheduling">
          <p>Você está agendando uma nova mentoria de <strong>{{ mentoria?.disciplineName || disciplinaSelecionada?.disciplineName }}</strong>.</p>
          <p class="mt-2">Data: <strong>{{ dataSelecionada ? formatarData(dataSelecionada) : 'Data não selecionada' }}</strong></p>
          <p>Horário: <strong>{{ mentoria?.startTime }} - {{ mentoria?.endTime }}</strong></p>
          <p>Tipo: <strong>{{ mentoria?.tutoringClassType }}</strong></p>
        </div>
        <div v-else>
          <p>Você está se inscrevendo na mentoria de <strong>{{ mentoria?.disciplineName || disciplinaSelecionada?.disciplineName }}</strong>.</p>
          <p class="mt-2">Data: <strong>{{ mentoria ? formatarData(mentoria.tutoringDate) : '' }}</strong></p>
          <p>Horário: <strong>{{ mentoria?.startTime }} - {{ mentoria?.endTime }}</strong></p>
          <p v-if="mentoria?.mentorName">Mentor: <strong>{{ mentoria.mentorName }}</strong></p>
        </div>

        <v-text-field
          v-if="!isEmAndamento"
          :model-value="topico"
          @update:model-value="$emit('update:topico', $event)"
          label="Tópico específico (opcional)"
          placeholder="Ex: Tenho dúvidas sobre o capítulo 3"
          variant="outlined"
          class="mt-4"
        ></v-text-field>

        <v-alert
          v-if="isEmAndamento"
          type="info"
          variant="tonal"
          class="mt-4"
        >
          Esta mentoria já está em andamento. Você pode participar, mas não poderá especificar um tópico.
        </v-alert>
      </v-card-text>
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn 
          color="grey-darken-1" 
          variant="text" 
          @click="$emit('cancelar')" 
          :disabled="confirmando"
        >
          Cancelar
        </v-btn>
        <v-btn 
          color="primary" 
          variant="elevated" 
          @click="$emit('confirmar')" 
          :loading="confirmando"
        >
          {{ isScheduling ? 'Agendar' : 'Participar' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  mentoria: {
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
  topico: {
    type: String,
    default: ''
  },
  confirmando: {
    type: Boolean,
    default: false
  },
  formatarData: {
    type: Function,
    required: true
  }
});

defineEmits([
  'update:visible',
  'update:topico',
  'confirmar',
  'cancelar'
]);

const isScheduling = computed(() => {
  return props.mentoria?.status === 'A_MARCAR';
});

const isEmAndamento = computed(() => {
  return props.mentoria?.status === 'EM_ANDAMENTO';
});
</script>

<style scoped>
.v-card-title.bg-primary {
  color: white;
}
</style>
