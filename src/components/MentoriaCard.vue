<template>
  <v-card class="mb-4" elevation="10">
    <v-card-text>
      <strong>{{ mentoria.titulo }}</strong>
      <p><strong>Data:</strong> {{ mentoria.data }}</p>
      <p><strong>Horário de início:</strong> {{ mentoria.horaInicio }}</p>
      <p><strong>Horário de término:</strong> {{ mentoria.horaFim }}</p>
      <p><strong>Tipo:</strong> {{ mentoria.tipo }}</p>
      <p><strong>Local:</strong> {{ mentoria.local }}</p>
      <p><strong>Status:</strong> {{ mentoria.status }}</p>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn icon>
        <v-icon>mdi-open-in-new</v-icon>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  name: "MentoriaCard",
  props: {
    mentoria: {
      type: Object,
      required: true
    }
  }
};
</script>
