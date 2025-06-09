<template>
  <div class="pa-4">
    <h1 class="titulo text-h4 mb-6 font-weight-bold">Gerenciamento de Conta</h1>

    <v-row class="box">
      <v-col cols="12">
        <v-card class="mb-4" elevation="2">
          <v-card-title class="text-h6 font-weight-bold">
            <v-icon class="mr-2">mdi-lock</v-icon>
            Alterar Senha
          </v-card-title>

          <v-card-text>
            <v-form @submit.prevent="submitChangePassword">
              <v-text-field
                v-model="localPasswordForm.oldPassword"
                label="Senha Atual"
                type="password"
                variant="outlined"
                required
              ></v-text-field>

              <v-text-field
                v-model="localPasswordForm.newPassword"
                label="Nova Senha"
                type="password"
                variant="outlined"
                required
                hint="A senha deve ter pelo menos 8 caracteres"
              ></v-text-field>

              <div class="text-center mt-4">
                <v-btn
                  type="submit"
                  color="primary"
                  :loading="isLoadingProp"
                  :disabled="isLoadingProp"
                >
                  Alterar Senha
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12">
        <v-card class="mb-4" elevation="2" color="error-lighten-5" border="error">
          <v-card-title class="text-h6 font-weight-bold text-error">
            <v-icon class="mr-2" color="error">mdi-alert-circle</v-icon>
            Excluir Conta
          </v-card-title>

          <v-card-text>
            <p class="mb-4">
              <strong>Atenção:</strong>
            </p>

            <div class="text-center">
              <v-btn
                color="error"
                variant="flat"
                :loading="isDeletingAccountProp"
                :disabled="isDeletingAccountProp"
                @click="confirmAndDeleteAccount"
              >
                Excluir Minha Conta
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  isLoadingProp: { type: Boolean, default: false },
  isDeletingAccountProp: { type: Boolean, default: false }
});

const emit = defineEmits(['change-password', 'delete-account']);

const localPasswordForm = ref({ oldPassword: '', newPassword: '' });

const submitChangePassword = () => {
  emit('change-password', { ...localPasswordForm.value });
  localPasswordForm.value.oldPassword = '';
  localPasswordForm.value.newPassword = '';
};

const confirmAndDeleteAccount = () => {
  if (!window.confirm("ATENÇÃO! Tem certeza que deseja excluir sua conta? Todos os seus dados serão perdidos permanentemente.")) {
    return;
  }
  if (!window.confirm("Esta é sua última chance. Confirmar exclusão da conta?")) {
    return;
  }
  emit('delete-account');
};
</script>

<style scoped>
.titulo {
  padding: 20px;
  text-align: center;
}

.box {
  width: 950px;
  justify-self: center;
}
</style>
