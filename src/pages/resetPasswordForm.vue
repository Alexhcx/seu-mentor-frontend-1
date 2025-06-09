<template>
  <section>
    <h1 class="titulo">
      Redefinir Senha
    </h1>
  </section>
 <v-form class="form">
    <v-row class="box">

      <v-col
        cols="12"
      >
        <v-text-field
          v-model="token"
          :rules="[validation.required]"
          label="Token"
          data-vv-name="token"
          variant="solo-filled"
          required

        ></v-text-field>
      </v-col>

      <v-col
        cols="12"
      >
        <v-text-field
        v-model="password"
        :rules="[validation.required]"
        type="password"
        label="Nova Senha"
        data-vv-name="Senha"
        variant="solo-filled"
        required
        ></v-text-field>
      </v-col>

      <v-col cols="12" class="text-center">
        <v-btn class="btn" color="primary" size="large" @click="redefinirSenha">Redefinir Senha</v-btn>
      </v-col>
    </v-row>
  </v-form>
</template>

<script lang="ts">
import { resetPassword } from '@/services/authService';

export default {
  name: "resetPasswordForm",
  data() {
    return {
      token: "",
      password: "",
      validation: {
        required: (value: string) => !!value || 'Campo é obrigatório',
      }
    };
  },
  mounted() {
    const tokenFromURL = this.$route.query.token;
    if (typeof tokenFromURL === 'string') {
      this.token = tokenFromURL;
      console.log('[resetPasswordForm] Token carregado da URL:', this.token);
    } else {
      console.warn('[resetPasswordForm] Token ausente na URL');
    }
  },
  methods: {
    async redefinirSenha() {
      if (this.token && this.password) {
        try {
          const response = await resetPassword({
            token: this.token,
            newPassword: this.password,
          });

          console.log("✅ Senha redefinida com sucesso!", response);
          this.$router.push('/login');
        } catch (error: any) {
          console.error("❌ Erro ao redefinir senha:", error.response?.data || error.message);
        }
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
  max-width: 450px;
}

.btn {
  margin-bottom: 10px;
  border-radius: 12px;
  border: 20px;
  font-family: 'Advent Pro';
}

</style>
