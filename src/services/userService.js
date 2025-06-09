// src/services/userService.js
import apiClient from "./api";

// USER DATA
// GET /api/v1/users/{id}: mostra os dados do usuario
export const getUserData = (id) => {
  return apiClient.get(`/users/${id}`); // No change
};

// PUT /api/v1/users/{id}: atualiza os dados do usuario
export const updateUserData = (id, userData) => {
  return apiClient.put(`/users/${id}`, userData); // No change
};

// POST /api/v1/users/{id}/change-password: troca senha do usuario
export const changePassword = (id, passwordData) => {
  return apiClient.post(`/users/${id}/change-password`, passwordData); // No change
};

// DELETE /api/v1/users/{id}: deleta o usuário.
export const deleteUser = (id) => {
  return apiClient.delete(`/users/${id}`); // No change
};

// MENTOR AVAILABILITY
// GET /api/v1/tutoring/mentors/{mentorId}/availabilities: mostra todos os horários disponíveis do usuário mentor
export const getMentorAvailability = (mentorId) => {
  return apiClient.get(`/tutoring/mentors/${mentorId}/availabilities`); // Updated path
};

// POST /api/v1/tutoring/mentors/{mentorId}/availabilities: marca um horário de disponibilidade para ser mentor
export const addMentorAvailability = (mentorId, availabilityData) => {
  return apiClient.post(`/tutoring/mentors/${mentorId}/availabilities`, availabilityData); // Updated path
};

// PATCH /api/v1/tutoring/mentors/{mentorId}/availabilities/{availabilityId}/status: atualiza o status de uma disponibilidade
export const updateAvailabilityStatus = (
  mentorId,
  availabilityId,
  statusData
) => {
  return apiClient.patch(
    `/tutoring/mentors/${mentorId}/availabilities/${availabilityId}/status`, // Updated path
    statusData
  );
};

// DELETE /api/v1/tutoring/mentors/{mentorId}/availabilities/{availabilityId}: deleta uma disponibilidade
export const deleteAvailability = (mentorId, availabilityId) => {
  return apiClient.delete(`/tutoring/mentors/${mentorId}/availabilities/${availabilityId}`); // Updated path
};

// TUTORING SESSIONS (Mentoring and Participation)
// GET /api/v1/tutoring/{id}/mentoring-sessions: mostra todas as mentorias que ele é mentor
export const getUserMentoringSessions = (userId) => {
  return apiClient.get(`/tutoring/${userId}/mentoring-sessions`); // Updated path
};

// GET /api/v1/tutoring/{id}/participation-sessions: mostra todas as mentorias que o usuário participa
export const getUserParticipationSessions = (userId) => {
  return apiClient.get(`/tutoring/${userId}/participation-sessions`); // Updated path
};

// GET /api/v1/tutoring/users/{userId}/disciplines/{disciplineId}/available-tutorings: mostra todas as mentorias disponíveis para participação de outros mentores
export const getAvailableTutoringSessions = (userId, disciplineId, date) => {
  return apiClient.get(`/tutoring/users/${userId}/disciplines/${disciplineId}/available-tutorings`, { // New specific path
    params: {
      date: date, // Expects date in "AAAA-MM-DD" format
    },
  });
};

// POST /api/v1/tutoring/schedule: Agenda uma nova mentoria
export const scheduleTutoringSession = (scheduleData) => {
  return apiClient.post(`/tutoring/schedule`, scheduleData); // New endpoint
};

// PUT /api/v1/tutoring/{id}/confirm: Confirma e atualiza os dados da mentoria
export const confirmTutoringSession = (tutoringId, confirmationData) => {
  return apiClient.put(`/tutoring/${tutoringId}/confirm`, confirmationData); // Path was /tutoring/{id}/confirm, changed {id} to {tutoringId} for clarity
};

// POST /api/v1/tutoring/{tutoringId}/participants: Adiciona um participante a uma mentoria
export const joinTutoringSession = (tutoringId, participantData) => { // participantData should be { userId: Long, topic: String }
  return apiClient.post(`/tutoring/${tutoringId}/participants`, participantData);
};

// DELETE /api/v1/tutoring/{tutoringId}/participants/{userId}: remove um participante de uma mentoria (mentorado saindo)
export const leaveTutoringSession = (tutoringId, userId) => {
  return apiClient.delete(`/tutoring/${tutoringId}/participants/${userId}`);
};

// DELETE /api/v1/tutoring/users/{userId}/tutoring/{tutoringId}/cancel-by-mentor: Cancela uma mentoria (pelo mentor)
export const cancelMentorTutoringSession = (
  userId,
  tutoringId,
  deactivateAvailability = false
) => {
  return apiClient.delete(
    `/tutoring/users/${userId}/tutoring/${tutoringId}/cancel-by-mentor`, // Path was /tutoring/users/{userId}/tutoring/{tutoringId}/cancel-by-mentor
    {
      params: {
        deactivateAvailability: deactivateAvailability,
      },
    }
  );
};
