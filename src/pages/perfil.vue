<template>
  <v-container fluid class="pa-0">
    <v-row no-gutters>
      <v-col cols="12" md="3" lg="2" class="profile-sidebar">
        <UserProfileSidebar :user-data="userData" :menu-items="menuItems" :active-section="activeSection"
          @update:active-section="newSection => activeSection = newSection" />
      </v-col>

      <v-col cols="12" md="9" lg="10" class="profile-content">
        <v-card class="h-100" elevation="1">
          <v-alert v-if="errorMessage" type="error" variant="tonal" closable class="ma-4"
            @click:close="errorMessage = ''">
            {{ errorMessage }}
          </v-alert>

          <v-alert v-if="successMessage" type="success" variant="tonal" closable class="ma-4"
            @click:close="successMessage = ''">
            {{ successMessage }}
          </v-alert>

          <ProfileSectionInicio v-if="activeSection === 'inicio'"
            :mentoring-sessions-as-mentor="mentoringSessionsAsMentor"
            :participation-sessions="participationSessions"
            :is-loading-mentoring-sessions-as-mentor="isLoadingMentoringSessionsAsMentor"
            :is-loading-participation-sessions="isLoadingParticipationSessions"
            :editable-tutoring-status-for-mentor="editableTutoringStatusForMentor"
            :format-date="formatDate"
            :get-status-color="getStatusColor"
            @open-confirmation-form="openConfirmationForm"/>

          <ProfileSectionPerfil v-else-if="activeSection === 'perfil'" :user-data-prop="userData"
            :initial-profile-form-data="profileForm" :is-loading="isLoading" :format-date="formatDate"
            @update-profile="handleUpdateProfile" @profile-updated="fetchUserData"
            @operation-success="handleOperationSuccess" @operation-error="handleOperationError" />

          <ProfileSectionMentoriasMentorado v-else-if="activeSection === 'mentorias-mentorado'"
            :participation-sessions="participationSessions"
            :is-loading-participation-sessions="isLoadingParticipationSessions"
            :format-date="formatDate"
            :get-status-color="getStatusColor"
            @operation-success="handleOperationSuccess"
            @operation-error="handleOperationError"
            @session-left="handleSessionLeftMentorado"
            @refresh-sessions="fetchParticipationSessions"
          />

          <ProfileSectionMentoriasMentor v-else-if="activeSection === 'mentorias-mentor'"
            :mentoring-sessions-as-mentor="mentoringSessionsAsMentor"
            :is-loading-mentoring-sessions-as-mentor="isLoadingMentoringSessionsAsMentor"
            :editable-tutoring-status-for-mentor="editableTutoringStatusForMentor" :format-date="formatDate"
            :get-status-color="getStatusColor" @open-confirmation-form="openConfirmationForm"
            @activate-disponibilidades="activeSection = 'disponibilidades'"
            @mentoria-updated="handleMentoriaMentorAtualizada" @operation-success="handleOperationSuccess"
            @operation-error="handleOperationError" />

          <ProfileSectionDisponibilidades v-else-if="activeSection === 'disponibilidades'"
            ref="disponibilidadesComponent"
            :mentor-availabilities-prop="mentorAvailabilities" :disciplines-prop="disciplines"
            :is-loading-availabilities-prop="isLoadingAvailabilities"
            :is-adding-availability-prop="isAddingAvailability"
            :is-updating-availability-id-prop="isUpdatingAvailabilityId"
            :is-deleting-availability-id-prop="isDeletingAvailabilityId" :format-day-of-week="formatDayOfWeek"
            :dias-da-semana-prop="diasDaSemana" :tiposTutoria-prop="tiposTutoria"
            @add-availability="handleAddAvailability" @toggle-availability-status="handleToggleAvailabilityStatus"
            @delete-availability="handleDeleteAvailability" @availabilities-updated="fetchMentorAvailabilities"
            @operation-success="handleOperationSuccess" @operation-error="handleOperationError" />

          <ProfileSectionConta v-else-if="activeSection === 'conta'" :is-loading-prop="isLoading"
            :is-deleting-account-prop="isDeletingAccount" @change-password="handleChangePassword"
            @delete-account="handleDeleteAccount" @operation-success="handleOperationSuccess"
            @operation-error="handleOperationError" />
        </v-card>
      </v-col>
    </v-row>

    <MentoriaConfirmationDialog
      v-if="editingTutoringSession"
      v-model="isConfirmationDialogVisible"
      :session-data="editingTutoringSession"
      :is-confirming="isConfirmingSession"
      @confirm="handleConfirmTutoringSession"
      @close="isConfirmationDialogVisible = false"
    />

  </v-container>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

import {
  getUserData,
  updateUserData,
  changePassword,
  getMentorAvailability,
  updateAvailabilityStatus,
  getUserParticipationSessions,
  getUserMentoringSessions,
  addMentorAvailability,
  deleteAvailability,
  deleteUser,
  confirmTutoringSession
} from '@/services/userService';
import { getAllDisciplines } from '@/services/disciplineService';

import ChatManager from '@/components/chat/ChatManager.vue';

import UserProfileSidebar from '@/components/profile/UserProfileSidebar.vue';
import ProfileSectionInicio from '@/components/profile/ProfileSectionInicio.vue';
import ProfileSectionPerfil from '@/components/profile/ProfileSectionPerfil.vue';
import ProfileSectionMentoriasMentorado from '@/components/profile/ProfileSectionMentoriasMentorado.vue';
import ProfileSectionMentoriasMentor from '@/components/profile/ProfileSectionMentoriasMentor.vue';
import ProfileSectionDisponibilidades from '@/components/profile/ProfileSectionDisponibilidades.vue';
import ProfileSectionConta from '@/components/profile/ProfileSectionConta.vue';
import MentoriaConfirmationDialog from '@/components/profile/MentoriaConfirmationDialog.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const userData = ref(null);
const mentorAvailabilities = ref([]);
const participationSessions = ref([]);
const mentoringSessionsAsMentor = ref([]);
const disciplines = ref([]);

const activeSection = ref('inicio');
const isLoading = ref(false);
const isLoadingAvailabilities = ref(false);
const isLoadingParticipationSessions = ref(false);
const isLoadingMentoringSessionsAsMentor = ref(false);
const isUpdatingAvailabilityId = ref(null);
const isDeletingAvailabilityId = ref(null);
const isAddingAvailability = ref(false);
const isDeletingAccount = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const disponibilidadesComponent = ref(null);

// Estado para o MentoriaConfirmationDialog
const editingTutoringSession = ref(null);
const isConfirmationDialogVisible = ref(false);
const isConfirmingSession = ref(false);

const profileForm = ref({
  profileImg: '', birthday: '', phone: '', city: '', state: '',
  country: '', courseName: '', semester: '', university: ''
});

const menuItems = [
  { title: 'Início', value: 'inicio', icon: 'mdi-view-dashboard' },
  { title: 'Meu Perfil', value: 'perfil', icon: 'mdi-account' },
  { title: 'Mentorias (Mentorado)', value: 'mentorias-mentorado', icon: 'mdi-school' },
  { title: 'Mentorias (Mentor)', value: 'mentorias-mentor', icon: 'mdi-school' },
  { title: 'Disponibilidades', value: 'disponibilidades', icon: 'mdi-calendar-clock' },
  { title: 'Conta', value: 'conta', icon: 'mdi-cog' },
];

const handleOperationSuccess = (message) => {
  successMessage.value = message;
  errorMessage.value = '';
  setTimeout(() => successMessage.value = '', 5000);
};

const handleOperationError = (message) => {
  errorMessage.value = message;
  successMessage.value = '';
  setTimeout(() => errorMessage.value = '', 7000);
};

const fetchUserData = async () => {
  isLoading.value = true;
  try {
    const response = await getUserData(authStore.userId);
    userData.value = response.data;
    for (const key in profileForm.value) {
      if (response.data && response.data.hasOwnProperty(key)) {
        profileForm.value[key] = response.data[key];
      } else {
        profileForm.value[key] = '';
      }
    }
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    handleOperationError('Não foi possível carregar os dados do usuário.');
  } finally {
    isLoading.value = false;
  }
};

const fetchMentorAvailabilities = async () => {
  isLoadingAvailabilities.value = true;
  try {
    const availabilitiesResponse = await getMentorAvailability(authStore.userId);
    mentorAvailabilities.value = availabilitiesResponse.data;
  } catch (error) {
    console.error('Erro ao buscar disponibilidades do mentor:', error);
    handleOperationError('Não foi possível carregar as disponibilidades.');
  } finally {
    isLoadingAvailabilities.value = false;
  }
};

const fetchParticipationSessions = async () => {
  isLoadingParticipationSessions.value = true;
  try {
    const response = await getUserParticipationSessions(authStore.userId);
    participationSessions.value = response.data;
  } catch (error) {
    console.error('Erro ao buscar sessões de participação:', error);
    handleOperationError('Não foi possível carregar suas participações em mentorias.');
  } finally {
    isLoadingParticipationSessions.value = false;
  }
};

const fetchMentoringSessionsAsMentor = async () => {
  isLoadingMentoringSessionsAsMentor.value = true;
  try {
    const response = await getUserMentoringSessions(authStore.userId);
    mentoringSessionsAsMentor.value = response.data;
  } catch (error) {
    console.error('Erro ao buscar sessões como mentor:', error);
    handleOperationError('Não foi possível carregar suas mentorias (como mentor).');
  } finally {
    isLoadingMentoringSessionsAsMentor.value = false;
  }
};

const fetchDisciplines = async () => {
  try {
    const response = await getAllDisciplines();
    disciplines.value = response.data;
  } catch (error) {
    console.error('Erro ao buscar disciplinas:', error);
    handleOperationError('Não foi possível carregar as disciplinas.');
  }
};

const handleUrlParams = () => {
  const section = route.query.section;
  const disciplineId = route.query.disciplineId;
  const disciplineName = route.query.disciplineName;

  if (section) {
    activeSection.value = section;
  }

  if (section === 'disponibilidades' && disciplineId && disciplineName) {
    const tryPreSelectDiscipline = () => {
      if (disponibilidadesComponent.value &&
          typeof disponibilidadesComponent.value.preSelectDiscipline === 'function' &&
          disciplines.value.length > 0) {
        disponibilidadesComponent.value.preSelectDiscipline(parseInt(disciplineId), disciplineName);
        return true;
      }
      return false;
    };

    if (!tryPreSelectDiscipline()) {
      nextTick(() => {
        if (!tryPreSelectDiscipline()) {
          setTimeout(() => {
            tryPreSelectDiscipline();
          }, 500);
        }
      });
    }
  }
};

watch(() => disciplines.value, (newDisciplines) => {
  if (newDisciplines && newDisciplines.length > 0) {
    const section = route.query.section;
    const disciplineId = route.query.disciplineId;
    const disciplineName = route.query.disciplineName;

    if (section === 'disponibilidades' && disciplineId && disciplineName &&
        activeSection.value === 'disponibilidades') {
      nextTick(() => {
        if (disponibilidadesComponent.value &&
            typeof disponibilidadesComponent.value.preSelectDiscipline === 'function') {
          disponibilidadesComponent.value.preSelectDiscipline(parseInt(disciplineId), disciplineName);
        }
      });
    }
  }
}, { deep: true });

const handleUpdateProfile = async (profileDataToUpdate) => {
  if (!authStore.userId) return;
  isLoading.value = true;
  try {
    const response = await updateUserData(authStore.userId, profileDataToUpdate);
    userData.value = response.data;
    for (const key in profileForm.value) {
      if (response.data && response.data.hasOwnProperty(key)) {
        profileForm.value[key] = response.data[key];
      }
    }
    handleOperationSuccess('Perfil atualizado com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    handleOperationError(error.response?.data?.message || error.response?.data || 'Erro ao atualizar perfil. Tente novamente.');
  } finally {
    isLoading.value = false;
  }
};

const handleChangePassword = async (passwordData) => {
  if (!authStore.userId) return;
  isLoading.value = true;
  try {
    await changePassword(authStore.userId, passwordData);
    handleOperationSuccess('Senha alterada com sucesso!');
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    let apiErrorMessage = error.response?.data?.message || error.response?.data || 'Erro ao alterar senha.';
    if (error.response?.status === 400 && error.response?.data === "A senha antiga está incorreta.") {
      apiErrorMessage = "A senha antiga está incorreta.";
    } else if (typeof error.response?.data === 'string' && error.response.data.includes("A nova senha deve ter pelo menos 8 caracteres")) {
      apiErrorMessage = "A nova senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais.";
    }
    handleOperationError(apiErrorMessage);
  } finally {
    isLoading.value = false;
  }
};

const handleToggleAvailabilityStatus = async ({ availability, newStatus }) => {
  if (!authStore.userId) return;
  isUpdatingAvailabilityId.value = availability.id;
  try {
    const response = await updateAvailabilityStatus(authStore.userId, availability.id, { isAvailable: newStatus });

    if (response && response.data) {
      const index = mentorAvailabilities.value.findIndex(a => a.id === response.data.id);
      if (index !== -1) {
        mentorAvailabilities.value[index] = response.data;
      } else {
        await fetchMentorAvailabilities();
      }
      handleOperationSuccess(`Status da disponibilidade para ${availability.discipline.name || availability.discipline.disciplineName} atualizado!`);
    } else {
      await fetchMentorAvailabilities();
       handleOperationSuccess(`Status atualizado! Atualizando lista...`);
    }
  } catch (error) {
    console.error('Erro ao atualizar status da disponibilidade:', error);
    handleOperationError(error.response?.data?.message || 'Erro ao atualizar status da disponibilidade.');
  } finally {
    isUpdatingAvailabilityId.value = null;
  }
};

const handleAddAvailability = async (availabilityData) => {
  if (!authStore.userId) return;
  isAddingAvailability.value = true;
  try {
    const response = await addMentorAvailability(authStore.userId, availabilityData);

    if (response && response.data) {
      mentorAvailabilities.value.push(response.data);
      handleOperationSuccess('Nova disponibilidade adicionada com sucesso!');
    } else {
      await fetchMentorAvailabilities();
      handleOperationSuccess('Nova disponibilidade adicionada! Atualizando lista...');
    }

    // Reset do formulário após adicionar com sucesso
    if (disponibilidadesComponent.value && typeof disponibilidadesComponent.value.resetForm === 'function') {
      disponibilidadesComponent.value.resetForm();
    }
  } catch (error) {
    console.error('Erro ao adicionar disponibilidade:', error);
    handleOperationError(error.response?.data?.message || 'Erro ao adicionar disponibilidade.');
  } finally {
    isAddingAvailability.value = false;
  }
};

const handleDeleteAvailability = async ({ availabilityId, disciplineName }) => {
  if (!authStore.userId) return;
  isDeletingAvailabilityId.value = availabilityId;
  try {
    await deleteAvailability(authStore.userId, availabilityId);

    mentorAvailabilities.value = mentorAvailabilities.value.filter(a => a.id !== availabilityId);
    handleOperationSuccess(`Disponibilidade para ${disciplineName} excluída com sucesso!`);
  } catch (error) {
    console.error('Erro ao excluir disponibilidade:', error);
    handleOperationError(error.response?.data?.message || 'Erro ao excluir disponibilidade.');
  } finally {
    isDeletingAvailabilityId.value = null;
  }
};

const openConfirmationForm = (session) => {
  editingTutoringSession.value = session;
  isConfirmationDialogVisible.value = true;
};

const handleConfirmTutoringSession = async (sessionDataFromDialog) => {
  if (!editingTutoringSession.value || !editingTutoringSession.value.id) return;
  isConfirmingSession.value = true;
  try {
    const updatedSession = await confirmTutoringSession(editingTutoringSession.value.id, sessionDataFromDialog);

    const index = mentoringSessionsAsMentor.value.findIndex(s => s.id === updatedSession.data.id);
    if (index !== -1) {
      mentoringSessionsAsMentor.value[index] = updatedSession.data;
    } else {
      fetchMentoringSessionsAsMentor();
    }

    handleOperationSuccess('Mentoria atualizada com sucesso!');
    isConfirmationDialogVisible.value = false;
    editingTutoringSession.value = null;

  } catch (error) {
    console.error('Erro ao confirmar/atualizar mentoria:', error);
    handleOperationError(error.response?.data?.message || 'Erro ao confirmar/atualizar mentoria.');
  } finally {
    isConfirmingSession.value = false;
  }
};

const handleMentoriaMentorAtualizada = (sessaoAtualizadaDoServidor) => {
  const index = mentoringSessionsAsMentor.value.findIndex(s => s.id === sessaoAtualizadaDoServidor.id);
  if (index !== -1) {
    mentoringSessionsAsMentor.value[index] = sessaoAtualizadaDoServidor;
  } else {
    fetchMentoringSessionsAsMentor();
  }
};

const handleSessionLeftMentorado = (tutoringId) => {
  participationSessions.value = participationSessions.value.filter(session => session.id !== tutoringId);
};

const handleDeleteAccount = async () => {
  if (!authStore.userId) return;
  isDeletingAccount.value = true;
  try {
    await deleteUser(authStore.userId);
    handleOperationSuccess('Conta excluída com sucesso. Você será redirecionado.');
    setTimeout(() => {
      authStore.logout();
      router.push('/login');
    }, 2000);
  } catch (error) {
    console.error('Erro ao excluir conta:', error);
    handleOperationError(error.response?.data?.message || 'Erro ao excluir sua conta.');
    isDeletingAccount.value = false;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  if (String(dateString).includes('/') && String(dateString).length === 10) {
      const parts = String(dateString).split('/');
      if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
          return dateString;
      }
  }
  try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) throw new Error("Data inválida");

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
  } catch (e) {
      return dateString;
  }
};

const formatDayOfWeek = (day) => {
  const days = {
    "SEGUNDA_FEIRA": "Segunda-feira", "TERCA_FEIRA": "Terça-feira",
    "QUARTA_FEIRA": "Quarta-feira", "QUINTA_FEIRA": "Quinta-feira",
    "SEXTA_FEIRA": "Sexta-feira", "SABADO": "Sábado", "DOMINGO": "Domingo"
  };
  return days[day] || day;
};

const getStatusColor = (status) => {
  const statusColors = {
    'AGENDADA_ALUNO': 'warning',
    'PENDENTE_CONFIRMACAO_MENTOR': 'warning',
    'PENDENTE': 'warning',
    'CONFIRMADA': 'success',
    'EM_ANDAMENTO': 'primary',
    'CONCLUIDA': 'info',
    'CANCELADA': 'error'
  };
  return statusColors[status] || 'grey';
};

const diasDaSemana = [
  { value: 'SEGUNDA_FEIRA', text: 'Segunda-feira' }, { value: 'TERCA_FEIRA', text: 'Terça-feira' },
  { value: 'QUARTA_FEIRA', text: 'Quarta-feira' }, { value: 'QUINTA_FEIRA', text: 'Quinta-feira' },
  { value: 'SEXTA_FEIRA', text: 'Sexta-feira' }, { value: 'SABADO', text: 'Sábado' },
  { value: 'DOMINGO', text: 'Domingo' }
];

const tiposTutoria = [
  { value: 'ONLINE', text: 'Online' }, { value: 'PRESENCIAL', text: 'Presencial' }
];

const editableTutoringStatusForMentor = ['AGENDADA_ALUNO', 'PENDENTE_CONFIRMACAO_MENTOR', 'PENDENTE'];

watch(editingTutoringSession, (newValue) => {
  if (isConfirmationDialogVisible.value && !newValue) {
    isConfirmationDialogVisible.value = false;
  } else if (!isConfirmationDialogVisible.value && newValue) {
    isConfirmationDialogVisible.value = true;
  }
});

watch(isConfirmationDialogVisible, (newValue) => {
  if (!newValue && editingTutoringSession.value !== null) {
    editingTutoringSession.value = null;
  }
});

watch(() => route.query, () => {
  handleUrlParams();
}, { deep: true });

onMounted(async () => {
  if (authStore.userId) {
    await Promise.all([
      fetchUserData(),
      fetchMentorAvailabilities(),
      fetchParticipationSessions(),
      fetchMentoringSessionsAsMentor(),
      fetchDisciplines()
    ]);
    handleUrlParams();
  } else {
    router.push('/login');
  }
});
</script>

<style scoped>
.profile-sidebar {
  min-height: calc(100vh - 64px);
}

.profile-sidebar-card {
  position: sticky;
  top: 64px;
}

.profile-content {
  min-height: calc(100vh - 64px);
}

.h-100 {
  height: 100%;
}
</style>
