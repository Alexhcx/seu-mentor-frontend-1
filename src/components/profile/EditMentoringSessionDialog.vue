<template>
  <v-dialog :model-value="visible" @update:model-value="$emit('update:visible', $event)" max-width="600px" persistent scrollable>
    <v-card>
      <v-card-title class="bg-primary">
        <span class="text-h5">{{ editingSession ? 'Editar Detalhes da Mentoria' : 'Carregando...' }}</span>
      </v-card-title>
      <v-card-text class="pt-4">
        <v-form ref="editFormRef" @submit.prevent="submitForm">
          <p v-if="editingSession && editingSession.disciplineName" class="text-subtitle-1 mb-4">
            Mentoria de: <strong>{{ editingSession.disciplineName }}</strong>
          </p>
          <v-text-field
            v-model="formData.local"
            label="Local da Mentoria (opcional)"
            placeholder="Ex: Sala B203, Bloco B ou 'Online'"
            prepend-icon="mdi-map-marker-outline"
            variant="outlined"
            class="mb-3"
            clearable
            density="comfortable"
          ></v-text-field>

          <v-text-field
            v-model="formData.linkVideo"
            label="Link da Videochamada (opcional)"
            placeholder="Ex: https://meet.google.com/abc-def-ghi"
            prepend-icon="mdi-video-outline"
            variant="outlined"
            class="mb-3"
            clearable
            density="comfortable"
          ></v-text-field>

          <v-text-field
            v-model.number="formData.maxParticipants"
            label="Máximo de Participantes"
            type="number"
            :rules="[rules.required, rules.positiveInteger]"
            prepend-icon="mdi-account-group-outline"
            variant="outlined"
            class="mb-3"
            density="comfortable"
            min="1"
          ></v-text-field>

          <v-switch
            v-model="formData.isChatEnable"
            label="Habilitar Chat da Mentoria"
            color="primary"
            inset
            density="comfortable"
          ></v-switch>
        </v-form>
      </v-card-text>
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn color="grey-darken-1" variant="text" @click="$emit('close')" :disabled="loading">Cancelar</v-btn>
        <v-btn color="primary" variant="elevated" @click="submitForm" :loading="loading">Salvar Alterações</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, reactive, nextTick } from 'vue';

const props = defineProps({
  visible: Boolean,
  editingSession: { 
    type: Object,
    default: () => null,
  },
  loading: Boolean, 
});

const emit = defineEmits(['update:visible', 'save', 'close']);

const editFormRef = ref(null);
const formData = reactive({
  local: '',
  linkVideo: '',
  maxParticipants: 1,
  isChatEnable: true,
});

const rules = {
  required: value => (value !== null && value !== undefined && value !== '') || 'Campo obrigatório.',
  positiveInteger: value => {
    const num = Number(value);
    return Number.isInteger(num) && num > 0 || 'Deve ser um número inteiro positivo.';
  }
};

watch(() => props.editingSession, (newSession) => {
  if (newSession) {
    formData.local = newSession.local || '';
    formData.linkVideo = newSession.linkVideo || '';
    formData.maxParticipants = newSession.maxParticipants > 0 ? newSession.maxParticipants : 1;
    formData.isChatEnable = typeof newSession.isChatEnable === 'boolean' ? newSession.isChatEnable : true;
    nextTick(() => {
      if (editFormRef.value) {
        editFormRef.value.resetValidation();
      }
    });
  } else {
    formData.local = '';
    formData.linkVideo = '';
    formData.maxParticipants = 1;
    formData.isChatEnable = true;
  }
}, { immediate: true, deep: true });

async function submitForm() {
  if (editFormRef.value) {
    const { valid } = await editFormRef.value.validate();
    if (valid) {
      const payload = {
        local: formData.local || null, 
        linkVideo: formData.linkVideo || null,
        maxParticipants: Number(formData.maxParticipants),
        isChatEnable: formData.isChatEnable,
      };
      emit('save', payload);
    }
  }
}
</script>

<style scoped>
.v-card-title {
  color: white;
}
</style>
