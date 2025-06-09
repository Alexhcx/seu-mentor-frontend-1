<template>
  <section>
    <h1 class="titulo">
      Esqueci Minha Senha
    </h1>
  </section>
 <v-form class="form">
    <v-row class="box">

      <v-col
        cols="12"
      >
        <v-text-field
          v-model="email"
          :rules="[validation.required, validation.email]"
          label="E-mail"
          data-vv-name="email"
          variant="solo-filled"
          required

        ></v-text-field>
      </v-col>

      <v-col cols="12" class="text-center">
        <v-btn class="btn" color="primary" size="large" @click="redefinir">Redefinir</v-btn>
      </v-col>
    </v-row>
  </v-form>
</template>

<script lang="ts">
import { forgotPassword } from '@/services/authService'; // ✅ Corrigido
import { validarEmail } from '@/utils/validations.util';
import { useRouter } from 'vue-router';

export default {
  name: "ForgotPassword",
  data() {
    return {
      email: "",
      forgotPasswordResponse: null as any,
      forgotPasswordError: false,
      validation: {
        required: (value: string) => !!value || 'Campo é obrigatório',
        email: (value: string) => validarEmail(value) || 'Email inválido'
      }
    };
  },
  methods: {
    async redefinir() {
      this.forgotPasswordError = false;
      this.forgotPasswordResponse = null;

      const router = useRouter(); // router estático agora

      try {
        const response = await forgotPassword({ email: this.email });
        this.forgotPasswordResponse = response;
        console.log("✅ Solicitação de redefinição enviada com sucesso!", response);
        this.$router.push('/resetPasswordForm');
      } catch (error: any) {
        this.forgotPasswordError = true;
        this.forgotPasswordResponse = error.response ? error.response.data : (error.message || error);
        console.error("❌ Erro ao solicitar redefinição de senha:", error);
      }
    }
  }
};
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
  margin-top: 40px;
  max-width: 450px;
}

.btn {
  margin-bottom: 50px;
  border-radius: 12px;
  border: 20px;
  font-family: 'Advent Pro';
}

</style>
