<template>
  <h1 class="titulo">MENTORIAS</h1>
  <v-row class="principal px-0">
    <v-col lg="3" md="4" xs="6" v-for="disciplina in filteredDisciplines" :key="disciplina.disciplineId">
      <v-card class="card mx-auto" variant="outlined" width="300">
        <v-card-title class="card-titulo">
          {{ disciplina.disciplineName }}
        </v-card-title>
        <v-card-subtitle class="card-subtitulo">
          {{ disciplina.courseName }}
        </v-card-subtitle>
        <v-img height="200px" src="../assets/ads-img.png" cover title="Imagem"></v-img>

        <v-card-text class="descricao" :title="disciplina.description">
          {{ disciplina.description }}
        </v-card-text>

        <div class="btn-card">
          <v-btn class="btn" @click="irParaSejaMentor(disciplina.disciplineId, disciplina.disciplineName)" title="Seja Mentor">
            Seja Mentor
          </v-btn>
          <v-btn class="btn" @click="irParaAgendamento(disciplina.disciplineId, disciplina.courseName)" title="Mentorias">
            Mentoria
          </v-btn>
        </div>
      </v-card>
    </v-col>
    <v-col v-if="filteredDisciplines.length === 0 && !loading">
      <p class="text-center">Nenhuma mentoria encontrada para sua pesquisa.</p>
    </v-col>
    <v-col v-if="loading">
      <p class="text-center">Carregando mentorias...</p>
    </v-col>
    <v-col v-if="error">
      <p class="text-center text-red">{{ error }}</p>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { getAllDisciplines } from '@/services/disciplineService';
import { useAuthStore } from '@/stores/auth';
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, watch } from 'vue';

interface Discipline {
  disciplineId: number;
  disciplineName: string;
  description: string;
  courseAreaId: number;
  courseName: string;
}

export default {
  name: "discipline",
  setup() {
    const authStore = useAuthStore();
    const route = useRoute();
    const router = useRouter();

    const disciplines = ref<Discipline[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const fetchDisciplines = async (courseAreaId?: number) => {
      loading.value = true;
      error.value = null;

      try {
        const params = courseAreaId ? { courseAreaId } : {};
        const response = await getAllDisciplines(params);
        disciplines.value = response.data;
        console.log("[DisciplinePage] Disciplinas carregadas:", disciplines.value);
      } catch (err: any) {
        console.error("Erro ao buscar disciplinas:", err);
        error.value =
          err.response?.data?.message ||
          err.message ||
          "Ocorreu um erro ao carregar as disciplinas.";
      } finally {
        loading.value = false;
      }
    };

    const filteredDisciplines = computed(() => {
      const searchTerm = route.query.search as string;
      if (!searchTerm) {
        return disciplines.value;
      }
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      return disciplines.value.filter(discipline =>
        discipline.disciplineName.toLowerCase().includes(lowerCaseSearchTerm) ||
        discipline.description.toLowerCase().includes(lowerCaseSearchTerm) ||
        discipline.courseName.toLowerCase().includes(lowerCaseSearchTerm)
      );
    });

    // O `watch` para `route.query.search` já está configurado para reagir às mudanças
    // e o `filteredDisciplines` computa automaticamente os resultados.
    watch(() => route.query.search, () => {
      // Não precisa de lógica aqui, pois filteredDisciplines já é reativo
      // e reflete a mudança no query parameter.
    }, { immediate: true });

    fetchDisciplines();

    const irParaAgendamento = (disciplineId: number, courseName: string) => {
      if (authStore.isAuthenticated) {
        router.push({ path: '/agendamento', query: {
          disciplineId: disciplineId.toString(),
          courseName: courseName
        }});
      } else {
        router.push('/cadastre');
      }
    };

    const irParaSejaMentor = (disciplineId: number, disciplineName: string) => {
      if (authStore.isAuthenticated) {
        router.push({
          path: '/perfil',
          query: {
            section: 'disponibilidades',
            disciplineId: disciplineId.toString(),
            disciplineName: disciplineName
          }
        });
      } else {
        router.push('/cadastre');
      }
    };

    return {
      disciplines,
      filteredDisciplines,
      loading,
      error,
      irParaAgendamento,
      irParaSejaMentor,
    };
  },
};
</script>

<style scoped>
.titulo {
  font-size: 35px;
  font-family: "Advent Pro";
  text-align: center;
  padding: 12px;
}

.principal {
  padding: 20px;
  font-family: 'Advent Pro';
}

.card {
  height: 100%;
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.card-titulo {
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 20px;
  font-family: "Advent Pro";
  padding: 12px;
  white-space: normal;
  word-break: break-word;
}

.card-subtitulo {
  padding: 10px;
}

.descricao {
  height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3; /* Limita a 3 linhas */
  -webkit-box-orient: vertical;
  line-height: 1.2em; /* Ajuste conforme necessário */
}

.btn-card {
  padding: 10px;
  display: flex;
  gap: 10px;
  justify-content: center;
}

.btn {
  align-items: center;
  border-radius: 12px;
  background-color: #004AAD;
  color: #FFFFFF;
  font-size: 12px;
  width: 120px; /* Para manter os botões com o mesmo tamanho */
}
</style>
