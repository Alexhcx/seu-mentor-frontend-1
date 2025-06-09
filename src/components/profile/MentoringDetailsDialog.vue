<template>
  <v-dialog :model-value="visible" @update:model-value="$emit('update:visible', $event)" max-width="600">
    <v-card>
      <v-card-title class="headline d-flex justify-space-between align-center">
        Detalhes da Mentoria
        <v-btn icon flat @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text v-if="sessionDetails">
        <v-row>
          <v-col cols="12">
            <p class="text-h6 mb-2">{{ sessionDetails.disciplineName }}</p>
            <v-chip
              :color="getStatusColor(sessionDetails.status)"
              size="small"
              class="ml-0"
              label
            >
              {{ sessionDetails.status }}
            </v-chip>
            <v-chip
              size="small"
              :color="sessionDetails.tutoringClassType === 'ONLINE' ? 'info' : 'success'"
              class="ml-2"
              label
            >
              {{ sessionDetails.tutoringClassType }}
            </v-chip>
          </v-col>
          <v-col cols="12">
            <v-list dense>
              <v-list-item>
                <v-list-item-title class="font-weight-bold">Data:</v-list-item-title>
                <v-list-item-subtitle>{{ formatDate(sessionDetails.tutoringDate) }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title class="font-weight-bold">Horário:</v-list-item-title>
                <v-list-item-subtitle>{{ sessionDetails.startTime }} - {{ sessionDetails.endTime }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item v-if="sessionDetails.local">
                <v-list-item-title class="font-weight-bold">Local:</v-list-item-title>
                <v-list-item-subtitle>{{ sessionDetails.local }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item v-if="sessionDetails.linkVideo">
                <v-list-item-title class="font-weight-bold">Link de Acesso:</v-list-item-title>
                <v-list-item-subtitle>
                  <a :href="sessionDetails.linkVideo" target="_blank" rel="noopener noreferrer" class="text-decoration-none">
                    Acessar Sala da Mentoria <v-icon small>mdi-open-in-new</v-icon>
                  </a>
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title class="font-weight-bold">Máx. Participantes:</v-list-item-title>
                <v-list-item-subtitle>{{ sessionDetails.maxParticipants }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title class="font-weight-bold">Chat:</v-list-item-title>
                <v-list-item-subtitle>{{ sessionDetails.isChatEnable ? 'Habilitado' : 'Desabilitado' }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>

            <div v-if="sessionDetails.participants && sessionDetails.participants.length > 0" class="mt-4">
              <p class="font-weight-bold">Participantes Inscritos ({{ sessionDetails.participants.length }}):</p>
              <v-list density="compact" lines="one" class="py-0">
                <v-list-item
                  v-for="p in sessionDetails.participants"
                  :key="p.userId"
                  :title="p.userName"
                  :subtitle="p.topic ? `Tópico: ${p.topic}` : 'Tópico não especificado'"
                  prepend-icon="mdi-account-circle-outline"
                  class="px-1"
                ></v-list-item>
              </v-list>
            </div>
            <p v-else class="mt-4 text-medium-emphasis"><em>Nenhum participante inscrito.</em></p>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-text v-else>
        <p>Nenhum detalhe de mentoria disponível.</p>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="$emit('close')">Fechar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  sessionDetails: {
    type: Object,
    default: null,
  },
  formatDate: {
    type: Function,
    required: true,
  },
  getStatusColor: {
    type: Function,
    required: true,
  },
});

const emit = defineEmits(['update:visible', 'close']);
</script>
