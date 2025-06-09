<template>
  <div class="banner">
    <p class="titulo">Venha aprender e ensinar com a gente!</p>
  </div>
  <div class="info">
    <p class="segundo-titulo">Escolha o seu papel</p>
    <v-row>
      <v-col cols="12" md="6" class="colum">
        <v-card class="card mx-auto" max-width="344">
          <v-img height="100%" src="../assets/img-mentor.png" cover></v-img>
        </v-card>
        <v-btn class="btn-cadastro" color="primary" size="large" :to="mentorButtonRoute">Mentor</v-btn>
      </v-col>
      <v-col cols="12" md="6" class="colum">
        <v-card class="card mx-auto" max-width="344">
          <v-img height="100%" src="../assets/img-mentorado.png" cover></v-img>
        </v-card>
        <v-btn class="btn-cadastro" color="primary" size="large" :to="mentoredButtonRoute">Mentorado</v-btn>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

export default defineComponent({
  name: "index",
  setup() {
    const authStore = useAuthStore();

    const mentorButtonRoute = computed(() => {
      return authStore.isAuthenticated ? '/perfil' : '/cadastre';
    });

    const mentoredButtonRoute = computed(() => {
      return authStore.isAuthenticated ? '/agendamento' : '/cadastre';
    });

    return {
      mentorButtonRoute,
      mentoredButtonRoute,
    };
  },
});
</script>

<style scoped>
.banner {
  background-image: url(../assets/img-home.png);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  height: calc(100vh - 128px);
  display: flex;
  justify-content: center;
  align-items: center;
}

@media (min-width: 640px) {
  .banner {
    height: calc(100vh - 64px);
  }
}

.titulo {
  margin-top: 194px;
  text-align: center;
  font-size: 50px;
  font-family: 'Advent Pro';
  color: #FFFFFF;
  text-shadow: 3px 3px 5px #888888;
  font-weight: 500;
}

.info {
  background-color: #001229;
  color: #FFFFFF;
  justify-items: center;
}

.segundo-titulo {
  text-align: center;
  font-size: 25px;
  font-family: 'Advent Pro';
  font-weight: 600;
  padding: 30px;
}

@media (min-width: 385px) {
  .segundo-titulo {
    font-size: 35px;
  }
}

.colum {
  display: flex; /* Adicionado para centralizar o botão */
  flex-direction: column; /* Adicionado para empilhar card e botão */
  align-items: center; /* Centraliza horizontalmente */
  justify-items: center;
}

.card {
  width: 280px;
  height: 400px;
  border-radius: 15px;
}

.btn-cadastro {
  padding: 10px;
  border: none;
  border-radius: 12px;
  margin-bottom: 30px;
  margin-top: 20px;
  width: 150px;
  height: 50px;
  font-size: 16px;
  font-family: 'Advent Pro';
  font-weight: 600;
}
</style>
