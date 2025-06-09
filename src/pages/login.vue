<template>
  <section>
    <h1 class="titulo">Faça o seu login</h1>
  </section>
  <v-form class="form" @submit.prevent="logar"> <v-row class="box">
      <v-col cols="12">
        <v-text-field
          v-model="email"
          :rules="[validation.required, validation.email]"
          label="E-mail"
          data-vv-name="email"
          variant="solo-filled"
          required
        ></v-text-field>
      </v-col>

      <v-col cols="12">
        <v-text-field
          v-model="password"
          :rules="[validation.required]"
          type="password"
          label="Senha"
          data-vv-name="Senha"
          variant="solo-filled"
          required
        ></v-text-field>
        <a
          class="esqueci-senha text-caption text-decoration-none"
          color="primary"
          href="forgotPassword"
          rel="noopener noreferrer"
        >
          Esqueci minha senha
        </a>
      </v-col>

      <v-col cols="12" class="text-center">
        <v-btn class="btn" color="primary" size="large" type="submit">Entrar</v-btn> </v-col>
    </v-row>
  </v-form>
</template>

<script lang="ts">
import { validarEmail } from '@/utils/validations.util';
import { useAuthStore } from '@/stores/auth';
import { showSnackbar } from '@/components/AppSnackbar.vue';

export default {
  name: "login",
  data() {
    return {
      email: "",
      password: "",
      validation: {
        required: (value: string) => !!value || 'Campo é obrigatorio',
        email: (value: string) => validarEmail(value) || 'Email inválido'
      }
    }
  },
  methods: {
    async logar() {
      // Validação básica do formulário antes de tentar login
      if (!this.email || !this.password || !validarEmail(this.email)) {
        showSnackbar('Por favor, preencha todos os campos corretamente.', 'error');
        return;
      }

      try {
        await useAuthStore().login({
          email: this.email,
          password: this.password,
        });
        showSnackbar('Login realizado com sucesso!', 'success');
        this.$router.push('/perfil');
      } catch (error: any) {
        console.error("❌ Erro ao logar:", error);
        const errorMessage = error.response?.data?.message || 'Erro ao fazer login. Verifique suas credenciais.';
        showSnackbar(errorMessage, 'error');
      }
    }
  }
}
</script>


<style scoped>
.titulo{
  margin-top: 50px;
  padding: 30px;
  text-align: center;
  font-family: 'Advent Pro';
  font-size: 35px;
}

.form {
  display: flex;
  justify-content: center;
  margin-bottom: 67px;
}

.box {
  max-width: 450px;
}

.btn {
  margin-bottom: 10px;
  border-radius: 12px;
  border: 20px;
  font-family: 'Advent Pro';
}

</style>
