<template>
  <section>
    <h1 class="titulo">Comece a sua Jornada!</h1>
  </section>
  <v-form class="form" @submit.prevent="cadastrar"> <div class="box">
      <v-row>
        <v-col cols="6">
          <v-text-field
            v-model="firstName"
            :rules="[validation.required]"
            label="Nome"
            data-vv-name="nome"
            variant="solo-filled"
            required
          ></v-text-field>
        </v-col>

        <v-col cols="6">
          <v-text-field
            v-model="lastName"
            :rules="[validation.required]"
            label="Sobrenome"
            data-vv-name="sobreNome"
            variant="solo-filled"
            required
          ></v-text-field>
        </v-col>

        <v-col cols="6">
          <v-text-field
            v-model="cpf"
            :rules="[validation.required, validation.cpf]"
            label="CPF"
            data-vv-name="cpf"
            variant="solo-filled"
            required
            v-mask="'###.###.###-##'"
          ></v-text-field>
        </v-col>

        <v-col cols="6">
          <v-text-field
            v-model="phone"
            :rules="[validation.required, validation.celular]"
            label="Celular"
            data-vv-name="celular"
            variant="solo-filled"
            required
            v-mask="'(##)#####-####'"
          ></v-text-field>
        </v-col>

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
            :rules="[validation.required, validation.password]"
            type="password"
            label="Senha"
            data-vv-name="Senha"
            variant="solo-filled"
            required
          ></v-text-field>
        </v-col>

        <v-col cols="12" class="text-center">
          <v-btn class="btn-cadastre" color="primary" size="large" type="submit">Finalizar</v-btn> </v-col>
      </v-row>
    </div>
  </v-form>
</template>

<script lang="ts">
import { validarCelular, validarCPF, validarEmail } from "@/utils/validations.util";
import { useAuthStore } from '@/stores/auth';
import { showSnackbar } from '@/components/AppSnackbar.vue'; // Importe a função do snackbar

export default {
  name: "cadastre",
  data() {
    return {
      firstName: "",
      lastName: "",
      email: "",
      cpf: "",
      phone: "",
      password: "",
      validation: {
        required: (value: string) => !!value || "Campo é obrigatório",
        email: (value: string) => validarEmail(value) || "Email inválido",
        celular: (value: string) => validarCelular(value) || "Celular inválido",
        cpf: (value: string) => validarCPF(value) || "CPF inválido",
        password: (value: string) => (value && value.length >= 8) || "A senha deve ter no mínimo 8 caracteres"
      }
    };
  },
  methods: {
    async cadastrar() {
      // Validação básica do formulário antes de tentar cadastro
      // Você pode usar ref para acessar o estado de validação do v-form
      // Por enquanto, uma validação manual simples
      if (
        !this.firstName || !this.lastName || !this.email || !this.phone || !this.password || !this.cpf ||
        !validarEmail(this.email) || !validarCPF(this.cpf) || !validarCelular(this.phone) || this.password.length < 8
      ) {
        showSnackbar('Por favor, preencha todos os campos corretamente.', 'error');
        return;
      }

      try {
        await useAuthStore().register({ // Chame useAuthStore() aqui
          firstName: this.firstName,
          lastName: this.lastName,
          email: this.email,
          cpf: this.cpf,
          phone: this.phone,
          password: this.password,
        });
        showSnackbar('Cadastro realizado com sucesso!', 'success', 5000); // Exibe por mais tempo
        this.$router.push('/perfil'); // Redireciona para a página de login
      } catch (error: any) {
        console.error("❌ Erro ao cadastrar:", error);
        const errorMessage = error.response?.data?.message || 'Erro ao cadastrar. Tente novamente.';
        showSnackbar(errorMessage, 'error');
      }
    }
  }
}
</script>

<style scoped>

.titulo{
  padding: 20px;
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
  padding:50px;
  max-width: 800px;
}

.btn-cadastre {
  border-radius: 12px;
  border: 20px;
  font-family: 'Advent Pro';
}

</style>
