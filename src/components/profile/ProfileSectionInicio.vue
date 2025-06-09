<template>
  <div class="pa-4">
    <h1 class="titulo text-h4 mb-6 font-weight-bold">Painel de Mentorias</h1>

    <v-row>
      <v-col cols="12" md="6">
        <v-card class="mb-4" elevation="2">
          <v-card-title class="text-h5 font-weight-bold bg-primary text-white">
            <v-icon class="mr-2">mdi-school</v-icon>
            Mentor
          </v-card-title>

          <v-card-text class="pa-0">
            <v-list v-if="!isLoadingMentoringSessionsAsMentor && mentoringSessionsAsMentor.length > 0">
              <v-list-item
                v-for="session in mentoringSessionsAsMentor"
                :key="session.id"
                :title="session.disciplineName"
                :subtitle="`${formatDate(session.tutoringDate)} às ${session.startTime} - ${session.endTime}`"
              >
                <template v-slot:prepend>
                  <v-avatar color="primary" variant="tonal">
                    <v-icon>mdi-book-education</v-icon>
                  </v-avatar>
                </template>

                <template v-slot:append>
                  <v-chip
                    :color="getStatusColor(session.status)"
                    size="small"
                    class="mr-2"
                  >
                    {{ session.status }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>

            <v-progress-circular
              v-else-if="isLoadingMentoringSessionsAsMentor"
              indeterminate
              color="primary"
              class="ma-4"
            ></v-progress-circular>

            <v-card-text v-else class="text-center pa-6 text-medium-emphasis">
              <v-icon size="large" class="mb-2">mdi-information-outline</v-icon>
              <p>Você não tem mentorias agendadas como mentor.</p>
            </v-card-text>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card class="mb-4" elevation="2">
          <v-card-title class="text-h5 font-weight-bold bg-primary text-white">
            <v-icon class="mr-2">mdi-school</v-icon>
            Mentorado
          </v-card-title>

          <v-card-text class="pa-0">
            <v-list v-if="!isLoadingParticipationSessions && participationSessions.length > 0">
              <v-list-item
                v-for="session in participationSessions"
                :key="session.id"
                :title="session.disciplineName"
                :subtitle="`${formatDate(session.tutoringDate)} às ${session.startTime} - ${session.endTime}`"
              >
                <template v-slot:prepend>
                  <v-avatar color="primary" variant="tonal">
                    <v-icon>mdi-book-education</v-icon>
                  </v-avatar>
                </template>

                <template v-slot:append>
                  <v-chip
                    :color="getStatusColor(session.status)"
                    size="small"
                  >
                    {{ session.status }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>

            <v-progress-circular
              v-else-if="isLoadingParticipationSessions"
              indeterminate
              color="primary"
              class="ma-4"
            ></v-progress-circular>

            <v-card-text v-else class="text-center pa-6 text-medium-emphasis">
              <v-icon size="large" class="mb-2">mdi-information-outline</v-icon>
              <p>Você não está participando de mentorias no momento.</p>
            </v-card-text>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
// As props já estão corretamente definidas aqui
defineProps({
  mentoringSessionsAsMentor: { type: Array, default: () => [] },
  participationSessions: { type: Array, default: () => [] },
  isLoadingMentoringSessionsAsMentor: { type: Boolean, default: false },
  isLoadingParticipationSessions: { type: Boolean, default: false },
  editableTutoringStatusForMentor: { type: Array, default: () => [] },
  formatDate: { type: Function, required: true },
  getStatusColor: { type: Function, required: true }
});

// Os emits também estão corretos
defineEmits(['open-confirmation-form']);
</script>

<style scoped>
.titulo {
  padding: 20px;
  text-align: center;
}

/* Adicione este estilo para garantir que o título do card tenha a cor de texto branca */
.bg-primary {
  background-color: var(--v-theme-primary); /* Garante que pegue a cor do tema */
  color: white !important; /* Força o texto a ser branco */
}
</style>
