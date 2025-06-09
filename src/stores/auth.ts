// src/stores/auth.ts
import { defineStore } from 'pinia';
import {
  loginUser as apiLogin,
  registerUser as apiRegister,
} from '@/services/authService';
import router from '@/router';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('authToken') || null,
    userId: localStorage.getItem('userId') || null,
  }),
  getters: {
    isAuthenticated: (state) => {
      console.log('[Getter] isAuthenticated - state.token:', state.token, 'Retorno:', !!state.token);
      return !!state.token;
    },
    getCurrentToken: (state) => {
      console.log('[Getter] getCurrentToken - state.token:', state.token);
      return state.token;
    },
    getCurrentUserId: (state) => {
      console.log('[Getter] getCurrentUserId - state.userId:', state.userId);
      return state.userId;
    },
  },
  actions: {
    async login(credentials: Record<string, string>) {
      try {
        const response = await apiLogin(credentials);
        console.log('[Action login] Resposta da API:', response); // Log da resposta completa

        if (response.data && response.data.token && response.data.userId) {
          console.log('[Action login] Sucesso! Token:', response.data.token, 'UserId:', response.data.userId);
          this.token = response.data.token;
          this.userId = String(response.data.userId); // userId da API é número

          localStorage.setItem('authToken', this.token);
          localStorage.setItem('userId', this.userId);

          console.log('[Action login] Estado do store atualizado - this.token:', this.token, 'this.userId:', this.userId);
          console.log('[Action login] localStorage authToken:', localStorage.getItem('authToken'));
          return response.data;
        } else {
          console.error('[Action login] Token ou userId ausente na resposta da API:', response.data);
          this.logout();
          throw new Error('Token ou userId ausente na resposta do login.');
        }
      } catch (error: any) {
        console.error("[Action login] Erro:", error.response ? error.response.data : error.message);
        this.logout();
        throw error.response ? error.response.data : new Error('Erro ao fazer login');
      }
    },
    async register(userData: Record<string, string>) {
      try {
        const response = await apiRegister(userData);
        console.log('[Action register] Resposta da API:', response); 

        if (response.data && response.data.token && response.data.userId) {
          console.log('[Action register] Sucesso! Token:', response.data.token, 'UserId:', response.data.userId);
          this.token = response.data.token;
          this.userId = String(response.data.userId);

          localStorage.setItem('authToken', this.token);
          localStorage.setItem('userId', this.userId);

          console.log('[Action register] Estado do store atualizado - this.token:', this.token, 'this.userId:', this.userId);
          return response.data;
        } else {
          console.error('[Action register] Token ou userId ausente na resposta da API:', response.data);
          throw new Error('Token ou userId ausente na resposta do registro.');
        }
      } catch (error: any) {
        console.error("[Action register] Erro:", error.response ? error.response.data : error.message);
        throw error.response ? error.response.data : new Error('Erro ao registrar');
      }
    },
    logout() {
      console.log('[Action logout] Deslogando...');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      this.token = null;
      this.userId = null;
      if (router.currentRoute.value.path !== '/login' && router.currentRoute.value.path !== '/teste-api') {
        router.push('/login');
      }
    },
    initializeAuth() {
      console.log('[Action initializeAuth] Inicializando autenticação...');
      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');
      if (token && userId) {
        this.token = token;
        this.userId = userId;
        console.log('[Action initializeAuth] Estado carregado do localStorage - Token:', this.token, 'UserId:', this.userId);
      } else {
        console.log('[Action initializeAuth] Nenhum token/userId encontrado no localStorage.');
      }
    },
  },
});
