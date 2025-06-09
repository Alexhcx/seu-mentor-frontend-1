<template>
  <div class="pa-4">
    <h1 class="titulo text-h4 mb-6 font-weight-bold">Minhas Disponibilidades</h1>

    <v-row>
      <v-col cols="12">
        <v-card class="mb-4" elevation="2">
          <v-card-title class="text-h6 font-weight-bold">
            <v-icon class="mr-2">mdi-calendar-clock</v-icon>
            Adicionar Nova Disponibilidade
          </v-card-title>

          <v-card-text>
            <v-form @submit.prevent="submitAddAvailability">
              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="localNewAvailabilityForm.disciplineId"
                    :items="disciplinesProp"
                    item-title="disciplineName" item-value="disciplineId"   label="Disciplina"
                    variant="outlined"
                    required
                    :error-messages="formErrors.disciplineId"
                  ></v-select>
                </v-col>

                <v-col cols="12" md="6">
                  <v-select
                    v-model="localNewAvailabilityForm.dayOfWeek"
                    :items="diasDaSemanaProp"
                    item-title="text"
                    item-value="value"
                    label="Dia da Semana"
                    variant="outlined"
                    required
                  ></v-select>
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    type="time"
                    v-model="localNewAvailabilityForm.startTime"
                    label="Horário de Início"
                    variant="outlined"
                    required
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    type="time"
                    v-model="localNewAvailabilityForm.endTime"
                    label="Horário de Fim"
                    variant="outlined"
                    required
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="4">
                  <v-select
                    v-model="localNewAvailabilityForm.tutoringClassType"
                    :items="tiposTutoriaProp"
                    item-title="text"
                    item-value="value"
                    label="Tipo de Tutoria"
                    variant="outlined"
                    required
                  ></v-select>
                </v-col>

                <v-col cols="12" class="text-center">
                  <v-btn
                    type="submit"
                    color="primary"
                    size="large"
                    :loading="isAddingAvailabilityProp"
                    :disabled="isAddingAvailabilityProp"
                  >
                    Adicionar Disponibilidade
                  </v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
        </v-card>
        <v-card>
          <h2 class="lista-disponibilidade">Minha lista de Disponibilidades</h2>
        </v-card>
        <v-card v-if="isLoadingAvailabilitiesProp" class="text-center pa-6">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <p class="mt-2">Carregando suas disponibilidades...</p>
        </v-card>
        <template v-else-if="mentorAvailabilitiesProp.length > 0">
          <v-card
            v-for="availability in mentorAvailabilitiesProp"
            :key="availability.id"
            class="mb-4"
            elevation="2"
            :color="availability.isAvailable ? 'surface' : 'grey-lighten-3'"
          >
            <v-card-title class="d-flex justify-space-between align-center">
              <span class="text-h6">{{ availability.discipline.name || availability.discipline.disciplineName }}</span>
              <v-chip
                :color="availability.isAvailable ? 'success' : 'error'"
                size="small"
              >
                {{ availability.isAvailable ? 'Disponível' : 'Indisponível' }}
              </v-chip>
            </v-card-title>

            <v-card-text>
              <v-row>
                <v-col cols="12" md="8">
                  <p><v-icon class="mr-1">mdi-calendar</v-icon> <strong>Dia:</strong> {{ formatDayOfWeek(availability.dayOfWeek) }}</p>
                  <p><v-icon class="mr-1">mdi-clock-outline</v-icon> <strong>Horário:</strong> {{ availability.startTime }} - {{ availability.endTime }}</p>
                  <p><v-icon class="mr-1">mdi-school</v-icon> <strong>Tipo:</strong> {{ availability.tutoringClassType }}</p>
                </v-col>

                <v-col cols="12" md="4" class="d-flex justify-end align-center">
                  <v-btn
                    :color="availability.isAvailable ? 'error' : 'success'"
                    variant="tonal"
                    class="mr-2"
                    :loading="isUpdatingAvailabilityIdProp === availability.id"
                    :disabled="isUpdatingAvailabilityIdProp === availability.id || isDeletingAvailabilityIdProp === availability.id"
                    @click="submitToggleAvailabilityStatus(availability)"
                  >
                    {{ availability.isAvailable ? 'Desativar' : 'Ativar' }}
                  </v-btn>

                  <v-btn
                    color="error"
                    variant="text"
                    :loading="isDeletingAvailabilityIdProp === availability.id"
                    :disabled="isDeletingAvailabilityIdProp === availability.id || isUpdatingAvailabilityIdProp === availability.id"
                    @click="submitDeleteAvailability(availability.id, (availability.discipline.name || availability.discipline.disciplineName))"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </template>

        <v-card v-else class="text-center pa-6">
          <v-icon size="large" color="grey" class="mb-2">mdi-information-outline</v-icon>
          <p class="text-h6 text-medium-emphasis">Você ainda não cadastrou nenhuma disponibilidade como mentor.</p>
        </v-card>
      </v-col>
    </v-row>
    <v-alert v-if="localFormErrorMessage" type="error" density="compact" class="mt-4" closable @click:close="localFormErrorMessage = ''">
        {{ localFormErrorMessage }}
    </v-alert>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue';

const props = defineProps({
  mentorAvailabilitiesProp: { type: Array, default: () => [] },
  disciplinesProp: { type: Array, default: () => [] },
  isLoadingAvailabilitiesProp: { type: Boolean, default: false },
  isAddingAvailabilityProp: { type: Boolean, default: false },
  isUpdatingAvailabilityIdProp: { type: [String, Number], default: null },
  isDeletingAvailabilityIdProp: { type: [String, Number], default: null },
  formatDayOfWeek: { type: Function, required: true },
  diasDaSemanaProp: { type: Array, required: true },
  tiposTutoriaProp: { type: Array, required: true },
});

const emit = defineEmits(['add-availability', 'toggle-availability-status', 'delete-availability']);

const localFormErrorMessage = ref('');

const localNewAvailabilityForm = ref({
  disciplineId: null,
  dayOfWeek: 'SEGUNDA_FEIRA',
  startTime: '09:00',
  endTime: '10:00',
  tutoringClassType: 'ONLINE'
});

const formErrors = reactive({
    disciplineId: '',
});

const resetForm = () => {
    localNewAvailabilityForm.value = {
        disciplineId: null,
        dayOfWeek: 'SEGUNDA_FEIRA',
        startTime: '09:00',
        endTime: '10:00',
        tutoringClassType: 'ONLINE'
    };
    formErrors.disciplineId = '';
    localFormErrorMessage.value = '';
};

// Novo método para pré-selecionar disciplina
const preSelectDiscipline = (disciplineId, disciplineName) => {
  console.log(`[ProfileSectionDisponibilidades] Pré-selecionando disciplina: ID ${disciplineId}, Nome: ${disciplineName}`);
  
  // Converte para número se necessário
  const numericDisciplineId = typeof disciplineId === 'string' ? parseInt(disciplineId) : disciplineId;
  
  // Verifica se a disciplina existe na lista
  const disciplineExists = props.disciplinesProp.some(disc => disc.disciplineId === numericDisciplineId);
  
  if (disciplineExists) {
    localNewAvailabilityForm.value.disciplineId = numericDisciplineId;
    console.log(`[ProfileSectionDisponibilidades] Disciplina ${disciplineName} (ID: ${numericDisciplineId}) pré-selecionada com sucesso!`);
  } else {
    console.warn(`[ProfileSectionDisponibilidades] Disciplina com ID ${numericDisciplineId} não encontrada na lista de disciplinas disponíveis.`);
    console.log('[ProfileSectionDisponibilidades] Disciplinas disponíveis:', props.disciplinesProp);
  }
};

// Watch para reagir a mudanças nas disciplinas (caso ainda não tenham sido carregadas)
watch(() => props.disciplinesProp, (newDisciplines) => {
  if (newDisciplines && newDisciplines.length > 0) {
    console.log('[ProfileSectionDisponibilidades] Disciplinas carregadas:', newDisciplines);
  }
}, { deep: true });

const submitAddAvailability = async () => {
  localFormErrorMessage.value = '';
  formErrors.disciplineId = '';
  let hasError = false;

  if (!localNewAvailabilityForm.value.disciplineId) {
    formErrors.disciplineId = "Por favor, selecione uma disciplina.";
    hasError = true;
  }
  if (!localNewAvailabilityForm.value.dayOfWeek ||
      !localNewAvailabilityForm.value.startTime || !localNewAvailabilityForm.value.endTime ||
      !localNewAvailabilityForm.value.tutoringClassType) {
    localFormErrorMessage.value = "Por favor, preencha todos os campos obrigatórios da nova disponibilidade.";
    hasError = true;
  }

  if (hasError) return;

  const payload = {
    dayOfWeek: localNewAvailabilityForm.value.dayOfWeek,
    startTime: `${localNewAvailabilityForm.value.startTime}:00`,
    endTime: `${localNewAvailabilityForm.value.endTime}:00`,
    tutoringClassType: localNewAvailabilityForm.value.tutoringClassType,
  };

  const selectedDisciplineIdValue = localNewAvailabilityForm.value.disciplineId;

  if (selectedDisciplineIdValue === null || selectedDisciplineIdValue === undefined) {
      formErrors.disciplineId = "Disciplina inválida ou não selecionada.";
      return;
  }

  payload.disciplineId = Number(selectedDisciplineIdValue);

  if (isNaN(payload.disciplineId)) {
      formErrors.disciplineId = "O ID da disciplina selecionada não é válido. Verifique se a lista de disciplinas foi carregada corretamente.";
      return;
  }

  emit('add-availability', payload);

};

const submitToggleAvailabilityStatus = (availability) => {
  const newStatus = !availability.isAvailable;
  emit('toggle-availability-status', { availability, newStatus });
};

const submitDeleteAvailability = (availabilityId, disciplineName) => {
  const nameToDisplay = disciplineName || 'esta disciplina';
  if (!window.confirm(`Tem certeza que deseja excluir a disponibilidade para ${nameToDisplay}? Esta ação não pode ser desfeita.`)) {
    return;
  }
  emit('delete-availability', { availabilityId, disciplineName: nameToDisplay });
};

// Expõe os métodos para o componente pai
defineExpose({
  resetForm,
  preSelectDiscipline
});

onMounted(() => {
  console.log('[ProfileSectionDisponibilidades] Componente montado');
});

</script>

<style scoped>
.titulo {
  padding: 20px;
  text-align: center;
}

.lista-disponibilidade {
  padding: 20px;
  text-align: center;
}
</style>