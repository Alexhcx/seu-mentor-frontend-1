<template>
  <v-dialog :model-value="visible" @update:model-value="$emit('update:visible', $event)" max-width="500px" persistent>
    <v-card>
      <v-card-title class="text-h5 bg-error">
        Cancelar Mentoria
      </v-card-title>
      <v-card-text class="pt-4">
        <p v-if="sessionName">
          Você tem certeza que deseja cancelar a mentoria de <strong>{{ sessionName }}</strong>?
        </p>
        <p v-else>
          Você tem certeza que deseja cancelar esta mentoria?
        </p>
        <p class="mt-2 text-caption">Esta ação não poderá ser desfeita.</p>

        <v-switch
          v-model="deactivateAvailability"
          label="Desativar também a disponibilidade original associada a esta mentoria (se aplicável)"
          color="primary"
          inset
          class="mt-4"
          density="compact"
        ></v-switch>
      </v-card-text>
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn color="grey-darken-1" variant="text" @click="$emit('close')" :disabled="loading">
          Voltar
        </v-btn>
        <v-btn color="error" variant="elevated" @click="handleConfirm" :loading="loading">
          Confirmar Cancelamento
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  visible: Boolean,
  loading: Boolean,
  sessionName: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:visible', 'confirm-cancel', 'close']);

const deactivateAvailability = ref(false);

function handleConfirm() {
  emit('confirm-cancel', { deactivateAvailability: deactivateAvailability.value });
}
</script>

<style scoped>
.v-card-title.bg-error {
  color: white;
}
</style>
