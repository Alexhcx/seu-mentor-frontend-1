import apiClient from './api';

// GET /api/v1/tutoring/{id}
export const getTutoringById = (id) => {
  return apiClient.get(`/tutoring/${id}`);
};

// GET /api/v1/tutoring
export const getAllTutorings = (params) => {
  // params: { mentorId, disciplineId, status }
  return apiClient.get('/tutoring', { params });
};

// GET /api/v1/tutoring/ratings
export const getAllTutoringRatings = () => {
  return apiClient.get('/tutoring/ratings');
};

// GET /api/v1/tutoring/by-date
export const getTutoringsAndAvailabilitiesByDate = (date) => {
  // date in 'AAAA-MM-DD' format
  return apiClient.get('/tutoring/by-date', { params: { date } });
};

// GET /api/v1/tutoring/users/{userId}/disciplines/{disciplineId}/available-tutorings
export const getAvailableTutoringsForUserAndDiscipline = (userId, disciplineId, date) => {
  // date in 'AAAA-MM-DD' format
  return apiClient.get(`/tutoring/users/${userId}/disciplines/${disciplineId}/available-tutorings`, { params: { date } });
};

// POST /api/v1/tutoring/schedule
export const scheduleTutoring = (requestData) => {
  // requestData should match ScheduleTutoringRequest.java
  // Expected: { mentorId, disciplineId, menteeId, topic, tutoringDate, startTime, endTime, tutoringClassType }
  return apiClient.post('/tutoring/schedule', requestData);
};

// POST /api/v1/tutoring/{tutoringId}/participants
export const addParticipant = (tutoringId, requestData) => {
  // requestData should match AddParticipantRequest.java
  // Expected: { userId, topic }
  return apiClient.post(`/tutoring/${tutoringId}/participants`, requestData);
};

// POST /api/v1/tutoring/{tutoringId}/ratings
export const addTutoringRating = (tutoringId, requestData) => {
  // requestData should match TutoringRatingRequest.java
  // Expected: { mentorRating, review }
  // raterUserId is handled by backend via Authentication
  return apiClient.post(`/tutoring/${tutoringId}/ratings`, requestData);
};

// PUT /api/v1/tutoring/{id}/confirm
export const confirmAndUpdatetutoring = (id, requestData) => {
  // requestData should match ConfirmTutoringRequest.java
  // Expected: { local (optional), linkVideo (optional), maxParticipants, isChatEnable }
  // 'local' is for PRESENCIAL, 'linkVideo' for ONLINE. The backend service handles this logic.
  return apiClient.put(`/tutoring/${id}/confirm`, requestData);
};

// PATCH /api/v1/tutoring/{id}/status
export const updateTutoringStatus = (id, requestData) => {
  // requestData should match UpdateTutoringStatusRequest.java
  // Expected: { status }
  return apiClient.patch(`/tutoring/${id}/status`, requestData);
};

// DELETE /api/v1/tutoring/ratings/{ratingId}
export const deleteTutoringRating = (ratingId) => {
  return apiClient.delete(`/tutoring/ratings/${ratingId}`);
};

// DELETE /api/v1/tutoring/users/{userId}/tutoring/{tutoringId}/cancel-by-mentor
export const cancelMentorTutoring = (userId, tutoringId, deactivateAvailability = false) => {
  return apiClient.delete(`/tutoring/users/${userId}/tutoring/${tutoringId}/cancel-by-mentor`, {
    params: { deactivateAvailability },
  });
};

// DELETE /api/v1/tutoring/{tutoringId}/participants/{userId}
export const leaveTutoring = (tutoringId, userId) => {
  return apiClient.delete(`/tutoring/${tutoringId}/participants/${userId}`);
};
