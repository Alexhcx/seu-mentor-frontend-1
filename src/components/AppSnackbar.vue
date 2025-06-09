<template>
  <v-snackbar
    v-model="snackbar.show"
    :timeout="snackbar.timeout"
    :color="snackbar.color"
    :multi-line="snackbar.multiLine"
    :vertical="snackbar.vertical"
    class="custom-snackbar-top-center" >
    {{ snackbar.message }}
    <template v-slot:actions>
      <v-btn
        :color="snackbar.color === 'error' ? 'white' : 'black'"
        variant="text"
        @click="snackbar.show = false"
      >
        Fechar
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script lang="ts">
import { defineComponent, reactive } from 'vue';

interface SnackbarOptions {
  show: boolean;
  message: string;
  color: string;
  timeout: number;
  multiLine: boolean;
  vertical: boolean;
}

const snackbar = reactive<SnackbarOptions>({
  show: false,
  message: '',
  color: '',
  timeout: 3000,
  multiLine: false,
  vertical: false,
});

export function showSnackbar(
  message: string,
  color: string = 'success', // 'success', 'error', 'warning', 'info' ou qualquer cor Vuetify
  timeout: number = 3000,
  multiLine: boolean = false,
  vertical: boolean = false
) {
  snackbar.message = message;
  snackbar.color = color;
  snackbar.timeout = timeout;
  snackbar.multiLine = multiLine;
  snackbar.vertical = vertical;
  snackbar.show = true;
}

export default defineComponent({
  name: 'AppSnackbar',
  setup() {
    return {
      snackbar,
    };
  },
});
</script>

<style scoped>
.v-snackbar.custom-snackbar-top-center {
  top: 20px !important;
  bottom: auto !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  max-width: 90% !important;
  width: auto !important;
}

.v-snackbar__content {
  justify-content: center;
}

.v-snackbar__actions {
  padding-left: 8px;
}
</style>
