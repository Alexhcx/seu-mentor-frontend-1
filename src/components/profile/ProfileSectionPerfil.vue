<template>
  <div class="pa-4">
    <h1 class="titulo text-h4 mb-6 font-weight-bold">Meu Perfil</h1>

    <v-row>
      <v-col cols="12" md="4">
        <v-card class="mb-4" elevation="2">
          <v-card-title class="text-h6 font-weight-bold">
            Informações Pessoais
          </v-card-title>

          <v-card-text>
            <v-list>
              <v-list-item prepend-icon="mdi-account">
                <template v-slot:title>
                  <span class="text-subtitle-2 text-medium-emphasis">Nome Completo</span>
                </template>
                <template v-slot:subtitle>
                  {{ localUserData ? `${localUserData.firstName} ${localUserData.lastName}` : '-' }}
                </template>
              </v-list-item>

              <v-list-item prepend-icon="mdi-email">
                <template v-slot:title>
                  <span class="text-subtitle-2 text-medium-emphasis">Email</span>
                </template>
                <template v-slot:subtitle>
                  {{ localUserData?.email || '-' }}
                </template>
              </v-list-item>

              <v-list-item prepend-icon="mdi-cake-variant">
                <template v-slot:title>
                  <span class="text-subtitle-2 text-medium-emphasis">Data de Nascimento</span>
                </template>
                <template v-slot:subtitle>
                  {{ localUserData?.birthday ? formatDate(localUserData.birthday) : '-' }}
                </template>
              </v-list-item>

              <v-list-item prepend-icon="mdi-card-account-details">
                <template v-slot:title>
                  <span class="text-subtitle-2 text-medium-emphasis">CPF</span>
                </template>
                <template v-slot:subtitle>
                  {{ localUserData?.cpf || '-' }}
                </template>
              </v-list-item>

              <v-list-item prepend-icon="mdi-phone">
                <template v-slot:title>
                  <span class="text-subtitle-2 text-medium-emphasis">Telefone</span>
                </template>
                <template v-slot:subtitle>
                  {{ localUserData?.phone || '-' }}
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <v-card elevation="2">
          <v-card-title class="text-h6 font-weight-bold">
            Atualizar Perfil
          </v-card-title>

          <v-card-text>
            <v-form @submit.prevent="submitUpdateProfile">
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="editableProfileForm.profileImg"
                    label="URL da Imagem de Perfil"
                    variant="outlined"
                    prepend-inner-icon="mdi-image"
                    :disabled="!isEditing"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="editableProfileForm.phone"
                    label="Telefone"
                    variant="outlined"
                    prepend-inner-icon="mdi-phone"
                    :disabled="!isEditing"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    type="date"
                    v-model="editableProfileForm.birthday"
                    label="Data de Nascimento"
                    variant="outlined"
                    prepend-inner-icon="mdi-calendar"
                    :disabled="!isEditing"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="editableProfileForm.city"
                    label="Cidade"
                    variant="outlined"
                    prepend-inner-icon="mdi-city"
                    :disabled="!isEditing"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="editableProfileForm.state"
                    label="Estado"
                    variant="outlined"
                    prepend-inner-icon="mdi-map-marker"
                    :disabled="!isEditing"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="editableProfileForm.country"
                    label="País"
                    variant="outlined"
                    prepend-inner-icon="mdi-earth"
                    :disabled="!isEditing"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="editableProfileForm.courseName"
                    label="Curso"
                    variant="outlined"
                    prepend-inner-icon="mdi-book-open-variant"
                    :disabled="!isEditing"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="editableProfileForm.semester"
                    label="Semestre"
                    variant="outlined"
                    prepend-inner-icon="mdi-calendar-clock"
                    :disabled="!isEditing"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="editableProfileForm.university"
                    label="Universidade"
                    variant="outlined"
                    prepend-inner-icon="mdi-school"
                    :disabled="!isEditing"
                  ></v-text-field>
                </v-col>

                <v-col
                  cols="12"
                  class="btn"
                  v-if="!isEditing"
                >
                  <v-btn
                    append-icon="mdi mdi-square-edit-outline"
                    variant="text"
                    size="small"
                    color="primary"
                    @click="isEditing = true"
                  >
                    Alterar dados
                  </v-btn>
                </v-col>

                <v-col cols="12" class="text-center" v-if="isEditing">
                  <v-btn
                    type="submit"
                    color="primary"
                    size="large"
                    :loading="isLoading"
                    :disabled="isLoading"
                  >
                    Atualizar Perfil
                  </v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';

const props = defineProps({
  userDataProp: { type: Object, default: null },
  initialProfileFormData: { type: Object, required: true },
  isLoading: { type: Boolean, default: false },
  formatDate: { type: Function, required: true }
});

const emit = defineEmits(['update-profile', 'profile-updated']);

const localUserData = ref(null); // For display
const editableProfileForm = ref({
  profileImg: '', birthday: '', phone: '', city: '', state: '',
  country: '', courseName: '', semester: '', university: ''
});

// Nova variável de estado para controlar a visibilidade do botão "Atualizar Perfil"
const isEditing = ref(false);

// Initialize form and local user data when props are available/updated
watch(() => props.userDataProp, (newVal) => {
  localUserData.value = newVal ? JSON.parse(JSON.stringify(newVal)) : null;
}, { immediate: true, deep: true });

watch(() => props.initialProfileFormData, (newVal) => {
    if (newVal) {
        // Ensure birthday is formatted as YYYY-MM-DD for the date input
        const birthdayDate = newVal.birthday ? new Date(newVal.birthday.split('/').reverse().join('-')) : null;
        editableProfileForm.value = {
            ...newVal,
            birthday: birthdayDate ? birthdayDate.toISOString().split('T')[0] : ''
        };
    }
}, { immediate: true, deep: true });


const submitUpdateProfile = () => {
  emit('update-profile', { ...editableProfileForm.value });
  isEditing.value = false; // Opcional: Oculta o botão novamente após a submissão
};
</script>

<style scoped>
.titulo {
  padding: 20px;
  text-align: center;
}

.btn {
  display: flex;
  justify-content: end;
}
</style>
