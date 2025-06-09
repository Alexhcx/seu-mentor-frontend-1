import apiClient from './api';

export const registerUser = userData => {
  return apiClient.post('/auth/register', userData);
};

export const loginUser = async credentials => {
  try {
    const response = await apiClient.post('/auth/authenticate', credentials);
    if (response.data && response.data.token && response.data.userId) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('userId', response.data.userId);
    }
    return response;
  } catch (error) {
    console.error('Erro no login:', error.response ? error.response.data : error.message);
    throw error;
  }
};

export const forgotPassword = emailData => {
  return apiClient.post('/auth/forgot-password', emailData);
};

export const resetPassword = resetData => {
  return apiClient.post('/auth/reset-password', resetData);
};

export const logoutUser = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');
};
