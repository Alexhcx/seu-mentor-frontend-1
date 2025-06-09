<template>
  <footer app class="footer">
    <v-container>
      <v-row
        class="d-flex align-center"
        align="center"
        justify="space-between"
      >
        <v-col cols="12" sm="4" class="text-center text-sm-left mb-4 mb-sm-0">
          <img src="../assets/logo.png" alt="Logo" class="logo" />
        </v-col>

        <v-col cols="12" sm="8" class="info text-center text-sm-left">
          <div class="info-item">
            <v-icon class="me-2" icon="mdi-instagram" /> @seumentor
          </div>
          <div class="info-item">
            <v-icon class="me-2" icon="mdi-email-outline" /> seumentor@contato.com.br
          </div>
          <div class="info-item">
            <v-icon class="me-2" icon="mdi-whatsapp" /> (62) 4004-2950
          </div>
        </v-col>
      </v-row>
    </v-container>
  </footer>
</template>

<script lang="ts">
export default {
  name: "AppFooter"
}
</script>

<style scoped>
.footer {
  background-color: #EBECEE;
  color: #001229;
  padding-top: 20px;
  padding-bottom: 20px;
  position: sticky;
  top: 100%;
}

.logo {
  height: 90px;
  max-width: 150px;
}

.info {
  font-size: 16px;
}

.info-item {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (min-width: 600px) {
  .info-item {
    justify-content: flex-start;
  }
}
</style>
