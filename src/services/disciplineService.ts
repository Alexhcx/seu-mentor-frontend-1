interface Discipline {
  disciplineId: number;
  disciplineName: string;
  description: string;
  courseAreaId: number;
  courseName: string;
}

interface DisciplineResponse {
  data: Discipline[];
}

interface DisciplineParams {
  courseAreaId?: number;
}

export const getAllDisciplines = async (params?: DisciplineParams): Promise<DisciplineResponse> => {
  // Implementation using params
  console.log('Fetching disciplines with params:', params);
  throw new Error('Not implemented');
}; 