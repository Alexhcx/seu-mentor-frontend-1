declare module '@/services/authService' {
  import axios from 'axios';
  export async function resetPassword(data: { token: string; newPassword: string }) {
    return axios.post('/resetPasswordForm', data);
  }
  export const registerUser: (userData: Record<string, any>) => Promise<any>;
  export const loginUser: (credentials: Record<string, any>) => Promise<any>;
  export const forgotPassword: (emailData: Record<string, any>) => Promise<any>;
  export const logoutUser: () => void;
}
