import apiClient from './api';

/**
 * Fetches the chat history for a specific tutoring session.
 * @param {number | string} tutoringId - The ID of the tutoring session.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of chat messages.
 */
export const getChatHistoryByTutoringId = (tutoringId) => {
  return apiClient.get(`/chat/tutoring/${tutoringId}/history`);
};