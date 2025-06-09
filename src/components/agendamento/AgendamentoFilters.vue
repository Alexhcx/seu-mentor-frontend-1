<template>
  <v-card class="mb-4" elevation="2">
    <v-card-title class="text-h6 font-weight-bold">
      <v-icon class="mr-2">mdi-filter</v-icon>
      Filtros
    </v-card-title>
    <v-card-text>
      <v-select :model-value="filtros.disciplina" @update:model-value="$emit('update:disciplina', $event)"
        :items="disciplinas" item-title="disciplineName" item-value="disciplineId" label="Disciplina" variant="outlined"
        clearable density="comfortable" class="mb-3" :loading="carregandoDisciplinas"></v-select>

      <v-select :model-value="filtros.tipo" @update:model-value="$emit('update:tipo', $event)" :items="tiposMentoria"
        label="Tipo de Mentoria" variant="outlined" clearable density="comfortable" class="mb-3"></v-select>

      <v-btn block color="primary" class="mt-2" @click="$emit('limpar-filtros')" prepend-icon="mdi-refresh">
        Limpar Filtros
      </v-btn>
    </v-card-text>
  </v-card>

  <v-card elevation="2">
    <v-card-title class="text-h6 font-weight-bold">
      <v-icon class="mr-2">mdi-calendar</v-icon>
      Selecionar Data
    </v-card-title>
    <v-card-text>
      <!-- Botão para abrir o seletor de data -->
      <v-menu v-model="menuAberto" :close-on-content-click="false" transition="scale-transition" offset-y
        min-width="auto">
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" variant="outlined" block class="mb-3" :color="dataSelecionada ? 'primary' : 'default'"
            prepend-icon="mdi-calendar">
            {{ dataSelecionada ? formatarDataBotao(dataSelecionada) : 'Selecionar Data' }}
          </v-btn>
        </template>

        <!-- Conteúdo do menu customizado -->
        <v-card min-width="320" max-width="400">
          <v-card-title class="text-center bg-primary text-white">
            <v-btn icon variant="text" color="white" size="small" @click="navegarMes(-1)" :disabled="!podeNavegar(-1)">
              <v-icon>mdi-chevron-left</v-icon>
            </v-btn>

            <span class="flex-grow-1">
              {{ formatarMesAno(mesAtual, anoAtual) }}
            </span>

            <v-btn icon variant="text" color="white" size="small" @click="navegarMes(1)" :disabled="!podeNavegar(1)">
              <v-icon>mdi-chevron-right</v-icon>
            </v-btn>
          </v-card-title>

          <v-card-text class="pa-0">
            <!-- Cabeçalho dos dias da semana -->
            <v-row no-gutters class="bg-grey-lighten-4">
              <v-col v-for="dia in diasSemana" :key="dia" cols="auto"
                class="text-center py-2 text-caption font-weight-bold" style="width: 14.28%">
                {{ dia }}
              </v-col>
            </v-row>

            <!-- Grid do calendário -->
            <div class="calendar-grid">
              <v-btn v-for="dia in diasCalendario" :key="`${dia.data}-${dia.mes}`"
                :variant="dia.selecionado ? 'flat' : 'text'"
                :color="dia.selecionado ? 'primary' : (dia.hoje ? 'secondary' : 'default')"
                :disabled="dia.desabilitado || dia.outroMes" size="small" class="calendar-day" :class="{
                  'text-grey-lighten-1': dia.outroMes,
                  'font-weight-bold': dia.hoje,
                  'elevation-2': dia.selecionado
                }" @click="selecionarDia(dia)">
                {{ dia.numero }}
              </v-btn>
            </div>
          </v-card-text>

          <v-card-actions class="justify-space-between">
            <v-btn variant="text" color="error" @click="limparSelecao" :disabled="!dataSelecionada">
              Limpar
            </v-btn>

            <v-btn variant="text" @click="irParaHoje">
              Hoje
            </v-btn>

            <v-btn variant="flat" color="primary" @click="menuAberto = false">
              Fechar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-menu>

      <!-- Chip da data selecionada -->
      <v-chip v-if="dataSelecionada" color="primary" size="small" class="mt-2" closable
        @click:close="$emit('limpar-data')">
        {{ formatarDataChip(dataSelecionada) }}
      </v-chip>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, watch, defineProps, defineEmits } from 'vue';

const props = defineProps({
  filtros: {
    type: Object,
    required: true
  },
  disciplinas: {
    type: Array,
    default: () => []
  },
  carregandoDisciplinas: {
    type: Boolean,
    default: false
  },
  dataSelecionada: {
    type: [String, Date],
    default: null
  },
  tiposMentoria: {
    type: Array,
    required: true
  }
  // Removidas dataMinima e dataMaxima
});

const emit = defineEmits([
  'update:disciplina',
  'update:tipo',
  'update:data-selecionada',
  'limpar-filtros',
  'limpar-data'
]);

const handleDateChange = (date) => {
  emit('update:data-selecionada', date);
};

const formatarDataChip = (data) => {
  if (!data) return '';

  // Se é uma string no formato YYYY-MM-DD, converter diretamente
  if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data)) {
    const [year, month, day] = data.split('-').map(Number);
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun',
      'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    return `${String(day).padStart(2, '0')} ${meses[month - 1]} ${year}`;
  }

  return data;
};

// Adicionar aos dados reativos
const menuAberto = ref(false);
const mesAtual = ref(new Date().getMonth());
const anoAtual = ref(new Date().getFullYear());

const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Computed properties
const diasCalendario = computed(() => {
  const primeiroDia = new Date(anoAtual.value, mesAtual.value, 1);
  const ultimoDia = new Date(anoAtual.value, mesAtual.value + 1, 0);
  const primeiroDiaSemana = primeiroDia.getDay();

  const dias = [];

  // Dias do mês anterior
  const mesAnterior = new Date(anoAtual.value, mesAtual.value, 0);
  for (let i = primeiroDiaSemana - 1; i >= 0; i--) {
    const dia = mesAnterior.getDate() - i;
    dias.push({
      numero: dia,
      data: `${anoAtual.value}-${String(mesAtual.value).padStart(2, '0')}-${String(dia).padStart(2, '0')}`,
      mes: mesAtual.value - 1,
      outroMes: true,
      desabilitado: true,
      selecionado: false,
      hoje: false
    });
  }

  // Dias do mês atual
  for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
    // Criar a data string diretamente sem conversões que possam causar problemas de timezone
    const dataString = `${anoAtual.value}-${String(mesAtual.value + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

    // Para comparações, usar a mesma lógica de criação de data
    const dataParaComparacao = new Date(anoAtual.value, mesAtual.value, dia);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const ehHoje = dataParaComparacao.getTime() === hoje.getTime();

    // Verificar se está dentro do range permitido
    const dataMinObj = new Date();
    dataMinObj.setHours(0, 0, 0, 0); // Hoje às 00:00
    const dataMaxObj = new Date();
    dataMaxObj.setMonth(dataMaxObj.getMonth() + 1); // 1 mês à frente
    dataMaxObj.setHours(0, 0, 0, 0);

    const desabilitado = dataParaComparacao < dataMinObj || dataParaComparacao > dataMaxObj;

    dias.push({
      numero: dia,
      data: dataString,
      mes: mesAtual.value,
      outroMes: false,
      desabilitado,
      selecionado: props.dataSelecionada === dataString,
      hoje: ehHoje
    });
  }

  // Completar com dias do próximo mês se necessário
  const totalDias = dias.length;
  const diasRestantes = 42 - totalDias; // 6 semanas * 7 dias

  for (let dia = 1; dia <= diasRestantes && dias.length < 42; dia++) {
    dias.push({
      numero: dia,
      data: `${anoAtual.value}-${String(mesAtual.value + 2).padStart(2, '0')}-${String(dia).padStart(2, '0')}`,
      mes: mesAtual.value + 1,
      outroMes: true,
      desabilitado: true,
      selecionado: false,
      hoje: false
    });
  }

  return dias;
});

// Métodos
const navegarMes = (direcao) => {
  if (direcao === 1) {
    if (mesAtual.value === 11) {
      mesAtual.value = 0;
      anoAtual.value++;
    } else {
      mesAtual.value++;
    }
  } else {
    if (mesAtual.value === 0) {
      mesAtual.value = 11;
      anoAtual.value--;
    } else {
      mesAtual.value--;
    }
  }
};

const podeNavegar = (direcao) => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const umMesAFrente = new Date();
  umMesAFrente.setMonth(umMesAFrente.getMonth() + 1);

  if (direcao === 1) {
    const proximoMes = new Date(anoAtual.value, mesAtual.value + 1, 1);
    return proximoMes <= umMesAFrente;
  } else {
    const mesAnterior = new Date(anoAtual.value, mesAtual.value - 1, 1);
    return mesAnterior >= new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  }
};

const selecionarDia = (dia) => {
  if (dia.desabilitado || dia.outroMes) return;

  // Usar a data que já está corretamente formatada no objeto dia
  handleDateChange(dia.data);
  menuAberto.value = false;
};

const limparSelecao = () => {
  emit('limpar-data');
  menuAberto.value = false;
};

const irParaHoje = () => {
  const hoje = new Date();
  mesAtual.value = hoje.getMonth();
  anoAtual.value = hoje.getFullYear();

  // Selecionar hoje automaticamente já que está sempre no range permitido
  const hojeString = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  handleDateChange(hojeString);
  menuAberto.value = false;
};

const formatarMesAno = (mes, ano) => {
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return `${meses[mes]} ${ano}`;
};

const formatarDataBotao = (data) => {
  if (!data) return '';
  
  // Se é uma string no formato YYYY-MM-DD, converter diretamente
  if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data)) {
    const [year, month, day] = data.split('-').map(Number);
    const meses = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    return `${String(day).padStart(2, '0')} de ${meses[month - 1]} de ${year}`;
  }
  
  return data;
};

// Watch para atualizar o mês/ano quando a data selecionada mudar externamente
watch(() => props.dataSelecionada, (novaData) => {
  if (novaData) {
    const [year, month] = novaData.split('-').map(Number);
    anoAtual.value = year;
    mesAtual.value = month - 1;
  }
});
</script>

<style scoped>
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  padding: 8px;
}

.calendar-day {
  aspect-ratio: 1;
  min-width: 36px;
  min-height: 36px;
  border-radius: 50% !important;
}

.calendar-day:hover:not(:disabled) {
  transform: scale(1.1);
  transition: transform 0.2s ease;
}
</style>