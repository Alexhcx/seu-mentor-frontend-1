<template>
  <v-container fluid>
    <h1 class="titulo text-h4 mb-6 font-weight-bold">Agendamento de Mentorias</h1>

    <v-row>
      <v-col cols="12" md="4" lg="3">
        <AgendamentoFilters
          :filtros="filtros"
          :disciplinas="disciplinas"
          :carregando-disciplinas="carregandoDisciplinas"
          :data-selecionada="dataSelecionada"
          :tipos-mentoria="tiposMentoria"
          :data-minima="dataMinima"
          :data-maxima="dataMaxima"
          @update:disciplina="handleDisciplinaChange"
          @update:tipo="filtros.tipo = $event"
          @update:data-selecionada="handleDataChange"
          @limpar-filtros="limparFiltros"
          @limpar-data="limparData"
        />
      </v-col>

      <v-col cols="12" md="8" lg="9">
        <AgendamentoMentoriasList
          :mentorias-filtradas="mentoriasFiltradas"
          :mentoria-selecionada="mentoriaSelecionada"
          :disciplina-selecionada="disciplinaSelecionada"
          :data-selecionada="dataSelecionada"
          :carregando="carregandoMentorias"
          :formatar-data="formatarData"
          :current-user-id="authStore.userId"
          :agendando="agendando"
          :saindo-mentoria="saindoMentoria"
          :mentor-average-rating="mentorAverageRating"
          @selecionar-mentoria="selecionarMentoria"
          @limpar-filtros="limparFiltros"
          @limpar-data="limparData"
          @limpar-disciplina="limparDisciplina"
          @agendar="agendarMentoria"
          @sair-mentoria="sairMentoria"
        />
      </v-col>
    </v-row>

    <AgendamentoConfirmationDialog
      :visible="dialogConfirmacao"
      :mentoria="mentoriaSelecionada"
      :disciplina-selecionada="disciplinaSelecionada"
      :data-selecionada="dataSelecionada"
      :topico="topicoMentoria"
      :confirmando="agendando"
      :formatar-data="formatarData"
      :mentor-average-rating="mentorAverageRating"
      @update:visible="dialogConfirmacao = $event"
      @update:topico="topicoMentoria = $event"
      @confirmar="confirmarAgendamento"
      @cancelar="cancelarAgendamento"
    />
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { getAllDisciplines } from '@/services/disciplineService';
import { getAvailableTutoringsForUserAndDiscipline, scheduleTutoring, addParticipant, leaveTutoring } from '@/services/tutoringService';
import { getMentorAverageRating } from '@/services/tutoringRatingService'
import { showSnackbar } from '@/components/AppSnackbar.vue';

// Importar os componentes
import AgendamentoFilters from '@/components/agendamento/AgendamentoFilters.vue';
import AgendamentoMentoriasList from '@/components/agendamento/AgendamentoMentoriasList.vue';
import AgendamentoConfirmationDialog from '@/components/agendamento/AgendamentoConfirmationDialog.vue';

const router = useRouter();
const authStore = useAuthStore();

// Estado
const mentorias = ref([]);
const disciplinas = ref([]);
const disciplinaSelecionada = ref(null);
const dataSelecionada = ref(null);
const carregandoDisciplinas = ref(false);
const carregandoMentorias = ref(false);
const mentoriaSelecionada = ref(null);
const agendando = ref(false);
const saindoMentoria = ref(false);
const dialogConfirmacao = ref(false);
const topicoMentoria = ref('');
const mentorAverageRating = ref(null); // Novo estado para a nota média do mentor

// Filtros
const filtros = ref({
  disciplina: null,
  tipo: null
});

// Constantes
const tiposMentoria = [
  { title: 'Online', value: 'ONLINE' },
  { title: 'Presencial', value: 'PRESENCIAL' }
];

const hoje = new Date();
const dataMinima = hoje.toISOString().split('T')[0];
const dataMax = new Date(hoje);
dataMax.setMonth(dataMax.getMonth() + 3);
const dataMaxima = dataMax.toISOString().split('T')[0];

const initializeDate = () => {
  try {
    const hoje = new Date();
    if (isNaN(hoje.getTime())) {
      throw new Error('Data atual inválida');
    }
    return hoje.toISOString().split('T')[0];
  } catch (error) {
    console.error('Erro ao inicializar data:', error);
    return '2024-01-01';
  }
};

dataSelecionada.value = initializeDate();

// Computed properties
const mentoriasFiltradas = computed(() => {
  let resultado = [...mentorias.value];

  // Filtrar por tipo de mentoria
  if (filtros.value.tipo) {
    resultado = resultado.filter(m => m.tutoringClassType === filtros.value.tipo);
  }

  return resultado;
});

// Métodos
const buscarDisciplinas = async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login');
    showSnackbar('Você precisa estar logado para ver as disciplinas.', 'warning');
    return;
  }

  carregandoDisciplinas.value = true;
  try {
    const response = await getAllDisciplines();
    disciplinas.value = response.data;
  } catch (error) {
    console.error('Erro ao buscar disciplinas:', error);
    showSnackbar('Erro ao carregar lista de disciplinas.', 'error');
  } finally {
    carregandoDisciplinas.value = false;
  }
};

const buscarMentorias = async (disciplineId, date) => {
  if (!authStore.isAuthenticated || !disciplineId || !date) return;

  carregandoMentorias.value = true;
  try {
    let dataFormatada;
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      dataFormatada = date;
    } else if (typeof date === 'string') {
      const dateParts = date.split('/');
      if (dateParts.length === 3) {
        dataFormatada = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
      } else {
        dataFormatada = date;
      }
    } else if (date instanceof Date) {
      if (isNaN(date.getTime())) {
        console.error('Data inválida:', date);
        return;
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      dataFormatada = `${year}-${month}-${day}`;
    } else {
      console.error('Formato de data inválido:', date);
      return;
    }

    console.log('Buscando mentorias para:', { disciplineId, date: dataFormatada });

    const response = await getAvailableTutoringsForUserAndDiscipline(
      authStore.userId,
      disciplineId,
      dataFormatada
    );
    mentorias.value = response.data || [];

    if (mentorias.value.length === 0) {
      showSnackbar(`Nenhuma mentoria encontrada para ${formatarData(dataFormatada)}`, 'info');
    }
  } catch (error) {
    console.error('Erro ao buscar mentorias:', error);
    const errorMessage = error.response?.data?.message || 'Erro ao carregar mentorias disponíveis. Tente novamente mais tarde.';
    showSnackbar(errorMessage, 'error');
    mentorias.value = [];
  } finally {
    carregandoMentorias.value = false;
  }
};

const handleDisciplinaChange = (disciplineId) => {
  filtros.value.disciplina = disciplineId;

  if (disciplineId) {
    disciplinaSelecionada.value = disciplinas.value.find(d => d.disciplineId === disciplineId);
    if (dataSelecionada.value) {
      buscarMentorias(disciplineId, dataSelecionada.value);
    }
  } else {
    disciplinaSelecionada.value = null;
    mentorias.value = [];
  }

  mentoriaSelecionada.value = null;
};

const handleDataChange = (novaData) => {
  dataSelecionada.value = novaData;

  if (disciplinaSelecionada.value && novaData) {
    buscarMentorias(disciplinaSelecionada.value.disciplineId, novaData);
  }

  mentoriaSelecionada.value = null;
};

const selecionarMentoria = (mentoria) => {
  mentoriaSelecionada.value = mentoria;
};

const limparFiltros = () => {
  filtros.value.disciplina = null;
  filtros.value.tipo = null;
  disciplinaSelecionada.value = null;
  dataSelecionada.value = new Date().toISOString().split('T')[0];
  mentorias.value = [];
  mentoriaSelecionada.value = null;
  showSnackbar('Filtros limpos!', 'info');
};

const limparDisciplina = () => {
  filtros.value.disciplina = null;
  disciplinaSelecionada.value = null;
  mentorias.value = [];
  mentoriaSelecionada.value = null;
};

const limparData = () => {
  dataSelecionada.value = new Date().toISOString().split('T')[0];

  if (disciplinaSelecionada.value) {
    buscarMentorias(disciplinaSelecionada.value.disciplineId, dataSelecionada.value);
  }

  mentoriaSelecionada.value = null;
};

const agendarMentoria = (mentoria) => {
  if (!authStore.isAuthenticated) {
    router.push('/login');
    showSnackbar('Você precisa estar logado para agendar uma mentoria.', 'warning');
    return;
  }

  if (!mentoria) {
    showSnackbar('Selecione uma mentoria para agendar.', 'warning');
    return;
  }

  if (!mentoriaSelecionada.value || mentoriaSelecionada.value.id !== mentoria.id) {
    mentoriaSelecionada.value = mentoria;
  }

  dialogConfirmacao.value = true;
};

const confirmarAgendamento = async () => {
  if (!mentoriaSelecionada.value || !authStore.userId || !disciplinaSelecionada.value) {
    showSnackbar('Erro interno: dados da mentoria ou usuário ausentes.', 'error');
    return;
  }

  agendando.value = true;
  try {
    const mentoria = mentoriaSelecionada.value;
    const isScheduling = mentoria.status === 'A_MARCAR';

    if (isScheduling) {
      if (!dataSelecionada.value) {
        showSnackbar('Erro: Nenhuma data selecionada para agendamento.', 'error');
        return;
      }

      let dataFormatada;
      if (typeof dataSelecionada.value === 'string') {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dataSelecionada.value)) {
          showSnackbar('Erro: Formato de data inválido.', 'error');
          return;
        }
        dataFormatada = dataSelecionada.value;
      } else if (dataSelecionada.value instanceof Date) {
        if (isNaN(dataSelecionada.value.getTime())) {
          showSnackbar('Erro: Data inválida selecionada.', 'error');
          return;
        }
        dataFormatada = dataSelecionada.value.toISOString().split('T')[0];
      } else {
        showSnackbar('Erro: Tipo de data inválido.', 'error');
        return;
      }

      const payload = {
        mentorId: mentoria.mentorId,
        disciplineId: disciplinaSelecionada.value.disciplineId,
        menteeId: parseInt(authStore.userId),
        topic: topicoMentoria.value || null,
        tutoringDate: dataFormatada,
        startTime: mentoria.startTime,
        endTime: mentoria.endTime,
        tutoringClassType: mentoria.tutoringClassType
      };

      console.log('Agendando mentoria com payload:', payload);

      await scheduleTutoring(payload);
      showSnackbar('Mentoria agendada com sucesso! Aguarde a confirmação do mentor.', 'success', 5000);
    } else {
      const payload = {
        userId: parseInt(authStore.userId),
        topic: mentoria.status === 'EM_ANDAMENTO' ? null : (topicoMentoria.value || null)
      };

      await addParticipant(mentoria.id, payload);
      showSnackbar('Você foi adicionado à mentoria com sucesso!', 'success', 5000);
    }

    dialogConfirmacao.value = false;
    mentoriaSelecionada.value = null;
    topicoMentoria.value = '';

    if (disciplinaSelecionada.value && dataSelecionada.value) {
      await buscarMentorias(disciplinaSelecionada.value.disciplineId, dataSelecionada.value);
    }
  } catch (error) {
    console.error('Erro ao agendar/participar da mentoria:', error);
    const errorMessage = error.response?.data?.message || 'Erro ao processar solicitação. Tente novamente.';
    showSnackbar(errorMessage, 'error', 5000);
  } finally {
    agendando.value = false;
  }
};

const cancelarAgendamento = () => {
  dialogConfirmacao.value = false;
  topicoMentoria.value = '';
};

const sairMentoria = async (mentoria) => {
  if (!mentoria || !authStore.userId) {
    showSnackbar('Erro interno: dados da mentoria ou usuário ausentes.', 'error');
    return;
  }

  if (!window.confirm('Tem certeza que deseja sair desta mentoria? Esta ação não pode ser desfeita.')) {
    return;
  }

  saindoMentoria.value = true;
  try {
    await leaveTutoring(mentoria.id, parseInt(authStore.userId));
    showSnackbar('Você saiu da mentoria com sucesso!', 'success');

    await forcarRefreshMentorias();

  } catch (error) {
    console.error('Erro ao sair da mentoria:', error);
    const errorMessage = error.response?.data?.message || 'Erro ao sair da mentoria. Tente novamente.';
    showSnackbar(errorMessage, 'error');
  } finally {
    saindoMentoria.value = false;
  }
};

const forcarRefreshMentorias = async () => {
  if (!disciplinaSelecionada.value || !dataSelecionada.value) return;

  console.log('=== FORÇANDO REFRESH COMPLETO ===');

  mentorias.value = [];
  mentoriaSelecionada.value = null;

  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    carregandoMentorias.value = true;
    const response = await getAvailableTutoringsForUserAndDiscipline(
      authStore.userId,
      disciplinaSelecionada.value.disciplineId,
      dataSelecionada.value
    );

    console.log('Dados recarregados:', response.data);
    mentorias.value = response.data || [];

  } catch (error) {
    console.error('Erro ao forçar refresh:', error);
  } finally {
    carregandoMentorias.value = false;
  }

  console.log('=== FIM REFRESH COMPLETO ===');
};

const formatarData = (dataString) => {
  if (!dataString) return '';

  if (dataString instanceof Date) {
    if (isNaN(dataString.getTime())) {
      console.warn('formatarData: data inválida:', dataString);
      return 'Data inválida';
    }
    return dataString.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  if (typeof dataString !== 'string') {
    console.warn('formatarData: entrada inválida:', dataString);
    return 'Data inválida';
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataString)) {
    return dataString;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(dataString)) {
    const [year, month, day] = dataString.split('-').map(Number);
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  }

  const data = new Date(dataString + 'T00:00:00');

  if (isNaN(data.getTime())) {
    console.warn('formatarData: não foi possível converter a data:', dataString);
    return dataString;
  }

  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Watchers
watch(() => filtros.value.disciplina, (newDisciplineId) => {
  if (newDisciplineId && disciplinaSelecionada.value && dataSelecionada.value) {
    buscarMentorias(newDisciplineId, dataSelecionada.value);
  }
});

// Novo watcher para buscar a avaliação do mentor
watch(mentoriaSelecionada, async (newMentoria) => {
  mentorAverageRating.value = null; // Limpa a avaliação anterior
  if (newMentoria && newMentoria.mentorId) {
    try {
      const response = await getMentorAverageRating(newMentoria.mentorId);
      mentorAverageRating.value = response.data.averageRating;
    } catch (error) {
      console.error('Erro ao buscar avaliação média do mentor:', error);
      mentorAverageRating.value = null;
    }
  }
});

onMounted(async () => {
  await buscarDisciplinas();

  const disciplineIdFromQuery = router.currentRoute.value.query.disciplineId;
  if (disciplineIdFromQuery && disciplinas.value.length > 0) {
    const disciplineId = parseInt(disciplineIdFromQuery);
    filtros.value.disciplina = disciplineId;
    handleDisciplinaChange(disciplineId);
  }
});
</script>

<style scoped>
.titulo {
  text-align: center;
  padding: 20px;
  font-family: 'Advent Pro';
}
</style>
