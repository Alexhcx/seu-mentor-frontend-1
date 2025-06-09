<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="600px" persistent>
    <v-card v-if="editingTutoringSessionProp">
      <v-card-title class="text-h5 font-weight-bold">
        Confirmar/Editar Mentoria: {{ editingTutoringSessionProp.disciplineName }}
      </v-card-title>

      <v-card-text>
        <v-form @submit.prevent="submitConfirmSession">
          <v-row>
            <v-col cols="12" v-if="editingTutoringSessionProp.tutoringClassType === 'PRESENCIAL'">
              <v-text-field
                v-model="localConfirmationForm.local"
                label="Local da Mentoria"
                variant="outlined"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12" v-if="editingTutoringSessionProp.tutoringClassType === 'ONLINE'">
              <v-text-field
                v-model="localConfirmationForm.linkVideo"
                label="Link da Videochamada"
                variant="outlined"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model.number="localConfirmationForm.maxParticipants"
                label="Máximo de Participantes"
                type="number"
                min="1"
                variant="outlined"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-switch
                v-model="localConfirmationForm.isChatEnable"
                label="Habilitar chat durante a mentoria"
                color="primary"
              ></v-switch>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="grey-darken-1"
          variant="text"
          @click="$emit('update:modelValue', false)"
          :disabled="isConfirmingSessionProp"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="isConfirmingSessionProp"
          :disabled="isConfirmingSessionProp"
          @click="submitConfirmSession"
        >
          Salvar e Confirmar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false }, 
  editingTutoringSessionProp: { type: Object, default: null },
  isConfirmingSessionProp: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue', 'confirm-session', 'session-confirmed']);

const localConfirmationForm = ref({
  local: '',
  linkVideo: '',
  maxParticipants: 5,
  isChatEnable: true
});

watch(() => props.editingTutoringSessionProp, (session) => {
  if (session) {
    localConfirmationForm.value.local = session.local || '';
    localConfirmationForm.value.linkVideo = session.linkVideo || '';
    localConfirmationForm.value.maxParticipants = session.maxParticipants || 5;
    localConfirmationForm.value.isChatEnable = session.isChatEnable === undefined ? true : session.isChatEnable;
  } else {
    localConfirmationForm.value = {
      local: '',
      linkVideo: '',
      maxParticipants: 5,
      isChatEnable: true
    };
  }
}, { immediate: true });

const submitConfirmSession = () => {
  const payload = {
    local: localConfirmationForm.value.local,
    linkVideo: localConfirmationForm.value.linkVideo,
    maxParticipants: parseInt(localConfirmationForm.value.maxParticipants, 10) || 5,
    isChatEnable: localConfirmationForm.value.isChatEnable
  };
  emit('confirm-session', payload);
};
</script>
