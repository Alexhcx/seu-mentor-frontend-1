import apiClient from './api';

export const getAllDisciplines = (params = {}) => {
  return apiClient.get('/disciplines', { params });
};
