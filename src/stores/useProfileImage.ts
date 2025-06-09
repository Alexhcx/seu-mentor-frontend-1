import { defineStore } from 'pinia'
import ProfileImageService from '@/services/profileImgService'

export const useProfileImage = defineStore('profileImage', {
  state: () => ({
    // Cache de imagens: { userId: { url, expiresAt, loading } }
    imageCache: {},
    // Configurações de cache
    cacheConfig: {
      // Tempo padrão de expiração em minutos (ajuste conforme sua API)
      defaultExpirationMinutes: 10080,
      // Margem de segurança para renovar antes da expiração (em minutos)
      renewalMarginMinutes: 60,
    },
  }),

  getters: {
    /**
     * Retorna a URL da imagem de perfil para um usuário específico
     * @param {number} userId - ID do usuário
     * @returns {string|null} URL da imagem ou null se não existir/expirada
     */
    getProfileImageUrl: (state) => (userId) => {
      const cached = state.imageCache[userId]
      if (!cached) return null
      
      // Verificar se ainda não expirou
      if (Date.now() < cached.expiresAt) {
        return cached.url
      }
      
      return null
    },

    /**
     * Verifica se uma imagem está sendo carregada
     * @param {number} userId - ID do usuário
     * @returns {boolean} true se está carregando
     */
    isImageLoading: (state) => (userId) => {
      return state.imageCache[userId]?.loading || false
    },

    /**
     * Verifica se uma imagem precisa ser renovada (está próxima da expiração)
     * @param {number} userId - ID do usuário
     * @returns {boolean} true se precisa renovar
     */
    needsRenewal: (state) => (userId) => {
      const cached = state.imageCache[userId]
      if (!cached) return false
      
      const renewalTime = cached.expiresAt - (state.cacheConfig.renewalMarginMinutes * 60 * 1000)
      return Date.now() >= renewalTime
    },

    /**
     * Retorna informações detalhadas do cache para um usuário
     * @param {number} userId - ID do usuário
     * @returns {object|null} Informações do cache ou null
     */
    getCacheInfo: (state) => (userId) => {
      const cached = state.imageCache[userId]
      if (!cached) return null
      
      return {
        url: cached.url,
        expiresAt: new Date(cached.expiresAt),
        isExpired: Date.now() >= cached.expiresAt,
        needsRenewal: Date.now() >= (cached.expiresAt - (state.cacheConfig.renewalMarginMinutes * 60 * 1000)),
        loading: cached.loading
      }
    }
  },

  actions: {
    /**
     * Faz upload de uma nova imagem de perfil
     * @param {File} file - Arquivo de imagem
     * @param {number} userId - ID do usuário
     * @returns {Promise<string>} URL da imagem uploadada
     */
    async uploadProfileImage(file, userId) {
      try {
        // Marcar como carregando
        this.setLoading(userId, true)
        
        // Fazer upload usando o service
        const response = await ProfileImageService.uploadProfileImage(file, userId)
        
        // Assumindo que a resposta contém { url, expiresIn } ou similar
        // Ajuste conforme sua API retorna
        const imageUrl = response.url || response.data?.url || response
        
        // Cachear a nova imagem
        this.cacheImage(userId, imageUrl)
        
        return imageUrl
      } catch (error) {
        // Remover estado de loading em caso de erro
        this.setLoading(userId, false)
        throw error
      }
    },

    /**
     * Obtém URL da imagem de perfil (com cache inteligente)
     * @param {number} userId - ID do usuário
     * @param {boolean} forceRefresh - Forçar busca nova (ignora cache)
     * @returns {Promise<string>} URL da imagem
     */
    async getProfileImage(userId, forceRefresh = false) {
      try {
        // Se não forçar refresh, verificar cache primeiro
        if (!forceRefresh) {
          const cachedUrl = this.getProfileImageUrl(userId)
          if (cachedUrl && !this.needsRenewal(userId)) {
            return cachedUrl
          }
        }

        // Se já está carregando, aguardar
        if (this.isImageLoading(userId)) {
          return await this.waitForLoading(userId)
        }

        // Marcar como carregando
        this.setLoading(userId, true)
        
        // Buscar nova URL
        const response = await ProfileImageService.getProfileImageUrl(userId)
        const imageUrl = response.url || response.data?.url || response
        
        // Cachear a imagem
        this.cacheImage(userId, imageUrl)
        
        return imageUrl
      } catch (error) {
        // Se erro 404 (imagem não encontrada), limpar cache
        if (error.message.includes('não encontrada')) {
          this.removeFromCache(userId)
        }
        
        this.setLoading(userId, false)
        throw error
      }
    },

    /**
     * Renova automaticamente imagens que estão próximas da expiração
     * @param {number} userId - ID do usuário
     */
    async renewImageIfNeeded(userId) {
      if (this.needsRenewal(userId) && !this.isImageLoading(userId)) {
        try {
          await this.getProfileImage(userId, true)
        } catch (error) {
          console.warn(`Falha ao renovar imagem do usuário ${userId}:`, error)
        }
      }
    },

    /**
     * Cacheia uma imagem com tempo de expiração
     * @param {number} userId - ID do usuário
     * @param {string} url - URL da imagem
     * @param {number} expirationMinutes - Minutos até expirar (opcional)
     */
    cacheImage(userId, url, expirationMinutes = null) {
      const expiration = expirationMinutes || this.cacheConfig.defaultExpirationMinutes
      const expiresAt = Date.now() + (expiration * 60 * 1000)
      
      this.imageCache[userId] = {
        url,
        expiresAt,
        loading: false,
        cachedAt: Date.now()
      }
    },

    /**
     * Define estado de loading para um usuário
     * @param {number} userId - ID do usuário
     * @param {boolean} loading - Estado de loading
     */
    setLoading(userId, loading) {
      if (!this.imageCache[userId]) {
        this.imageCache[userId] = {
          url: null,
          expiresAt: 0,
          loading: false
        }
      }
      this.imageCache[userId].loading = loading
    },

    /**
     * Aguarda o carregamento de uma imagem finalizar
     * @param {number} userId - ID do usuário
     * @returns {Promise<string>} URL da imagem quando carregamento finalizar
     */
    async waitForLoading(userId) {
      return new Promise((resolve, reject) => {
        const checkLoading = () => {
          if (!this.isImageLoading(userId)) {
            const url = this.getProfileImageUrl(userId)
            if (url) {
              resolve(url)
            } else {
              reject(new Error('Falha ao carregar imagem'))
            }
          } else {
            setTimeout(checkLoading, 100)
          }
        }
        checkLoading()
      })
    },

    /**
     * Remove imagem do cache
     * @param {number} userId - ID do usuário
     */
    removeFromCache(userId) {
      delete this.imageCache[userId]
    },

    /**
     * Limpa todo o cache de imagens
     */
    clearCache() {
      this.imageCache = {}
    },

    /**
     * Remove imagens expiradas do cache
     */
    cleanExpiredImages() {
      const now = Date.now()
      Object.keys(this.imageCache).forEach(userId => {
        if (this.imageCache[userId].expiresAt <= now) {
          delete this.imageCache[userId]
        }
      })
    },

    /**
     * Inicia limpeza automática de cache (chame na inicialização da app)
     * @param {number} intervalMinutes - Intervalo de limpeza em minutos
     */
    startAutoCacheCleanup(intervalMinutes = 10) {
      setInterval(() => {
        this.cleanExpiredImages()
      }, intervalMinutes * 60 * 1000)
    },

    /**
     * Atualiza configurações de cache
     * @param {object} config - Novas configurações
     */
    updateCacheConfig(config) {
      this.cacheConfig = { ...this.cacheConfig, ...config }
    }
  },

  // Persistir o cache no localStorage (opcional)
  persist: {
    key: 'profile-image-cache',
    storage: localStorage,
    // Apenas persistir URLs e tempos de expiração, não estados de loading
    pick: ['imageCache'],
    beforeRestore: (context) => {
      // Limpar imagens expiradas ao restaurar do localStorage
      const now = Date.now()
      Object.keys(context.store.imageCache).forEach(userId => {
        if (context.store.imageCache[userId].expiresAt <= now) {
          delete context.store.imageCache[userId]
        }
      })
    }
  }
})