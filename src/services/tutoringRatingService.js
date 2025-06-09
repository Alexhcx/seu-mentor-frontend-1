import apiClient from './api';

//GET /api/v1/tutoring/{tutoringId}/ratings
//Lista as avaliações de uma mentoria especifica
// [
//   {
//     "id": 301,
//     "tutoringId": 150,
//     "ratedByUserId": 52,
//     "mentorRating": 5,
//     "review": "Excelente mentoria!",
//     "createdAt": "2024-05-20T16:00:00",
//     "updatedAt": "2024-05-20T16:05:00"
//   }
// ]
export const getTutoringRatingsByTutoringId = (tutoringId) => {
  return apiClient.get(`/tutoring/${tutoringId}/ratings`);
};

//GET /api/v1/tutoring/mentors/{mentorId}/average-rating
//A média de avaliações do mentor.
// {
//   "mentorId": 10,
//   "averageRating": 4.75,
//   "numberOfRatings": 20
// }
export const getMentorAverageRating = (mentorId) => {
  return apiClient.get(`/tutoring/mentors/${mentorId}/average-rating`);
};

//POST /api/v1/tutoring/{tutoringId}/ratings
//tutoringId - ID da mentoria a ser avaliada.
//Dados da avaliação (ex: { mentorRating: 5, review: "Ótima mentoria!" }).
//Adiciona uma avaliação a uma mentoria concluída.
export const addTutoringRating = (tutoringId, ratingData) => {
  return apiClient.post(`/tutoring/${tutoringId}/ratings`, ratingData);
};
