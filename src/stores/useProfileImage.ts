import { defineStore } from 'pinia'
import ProfileImageService from '@/services/profileImgService'

interface CacheConfig {
  defaultExpirationMinutes: number;
  renewalMarginMinutes: number;
}

interface ImageCacheEntry {
  url: string | null;
  expiresAt: number;
  loading: boolean;
  cachedAt?: number;
}

interface ImageCache {
  [userId: number]: ImageCacheEntry;
}

interface ProfileImageState {
  imageCache: ImageCache;
  cacheConfig: CacheConfig;
}

interface CacheInfo {
  url: string | null;
  expiresAt: Date;
  isExpired: boolean;
  needsRenewal: boolean;
  loading: boolean;
}

type ProfileImageGetters = {
  getProfileImageUrl: (state: ProfileImageState) => (userId: number) => string | null;
  isImageLoading: (state: ProfileImageState) => (userId: number) => boolean;
  needsRenewal: (state: ProfileImageState) => (userId: number) => boolean;
  getCacheInfo: (state: ProfileImageState) => (userId: number) => CacheInfo | null;
};

interface ProfileImageActions {
  uploadProfileImage(file: File, userId: number): Promise<string>;
  getProfileImage(userId: number, forceRefresh?: boolean): Promise<string>;
  renewImageIfNeeded(userId: number): Promise<void>;
  cacheImage(userId: number, url: string, expirationMinutes?: number): void;
  setLoading(userId: number, loading: boolean): void;
  waitForLoading(userId: number): Promise<string>;
  removeFromCache(userId: number): void;
  clearCache(): void;
  cleanExpiredImages(): void;
  startAutoCacheCleanup(intervalMinutes?: number): void;
  updateCacheConfig(config: Partial<CacheConfig>): void;
}

export const useProfileImage = defineStore<'profileImage', ProfileImageState, ProfileImageGetters, ProfileImageActions>('profileImage', {
  state: (): ProfileImageState => ({
    imageCache: {},
    cacheConfig: {
      defaultExpirationMinutes: 10080,
      renewalMarginMinutes: 60,
    },
  }),

  getters: {
    getProfileImageUrl: (state: ProfileImageState) => (userId: number): string | null => {
      const cached = state.imageCache[userId];
      if (!cached) return null;
      if (Date.now() < cached.expiresAt) {
        return cached.url;
      }
      return null;
    },

    isImageLoading: (state: ProfileImageState) => (userId: number): boolean => {
      return state.imageCache[userId]?.loading || false;
    },

    needsRenewal: (state: ProfileImageState) => (userId: number): boolean => {
      const cached = state.imageCache[userId];
      if (!cached) return false;
      const renewalTime = cached.expiresAt - (state.cacheConfig.renewalMarginMinutes * 60 * 1000);
      return Date.now() >= renewalTime;
    },

    getCacheInfo: (state: ProfileImageState) => (userId: number): CacheInfo | null => {
      const cached = state.imageCache[userId];
      if (!cached) return null;
      return {
        url: cached.url,
        expiresAt: new Date(cached.expiresAt),
        isExpired: Date.now() >= cached.expiresAt,
        needsRenewal: Date.now() >= (cached.expiresAt - (state.cacheConfig.renewalMarginMinutes * 60 * 1000)),
        loading: cached.loading,
      };
    }
  },

  actions: {
    async uploadProfileImage(file: File, userId: number): Promise<string> {
      this.setLoading(userId, true);
      try {
        const response = await ProfileImageService.uploadProfileImage(file, userId);
        
        const imageUrl = response.url || response.data?.url;
        
        if (!imageUrl || typeof imageUrl !== 'string') {
          throw new Error('No image URL received from server');
        }
        
        this.cacheImage(userId, imageUrl);
        
        return imageUrl;
      } catch (error: unknown) {
        throw error;
      } finally {
        this.setLoading(userId, false);
      }
    },

    async getProfileImage(userId: number, forceRefresh = false): Promise<string> {
      if (!forceRefresh) {
        const cachedUrl = this.getProfileImageUrl(userId);
        if (cachedUrl && !this.needsRenewal(userId)) {
          return cachedUrl;
        }
      }

      if (this.isImageLoading(userId)) {
        return await this.waitForLoading(userId);
      }

      this.setLoading(userId, true);
      try {
        const response = await ProfileImageService.getProfileImageUrl(userId);
        const imageUrl = response.url || response.data?.url;

        if (!imageUrl || typeof imageUrl !== 'string') {
          throw new Error('No image URL received from server');
        }
        
        this.cacheImage(userId, imageUrl);
        
        return imageUrl;
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes('não encontrada')) {
          this.removeFromCache(userId);
        }
        throw error;
      } finally {
        this.setLoading(userId, false);
      }
    },

    async renewImageIfNeeded(userId: number): Promise<void> {
      if (this.needsRenewal(userId) && !this.isImageLoading(userId)) {
        try {
          await this.getProfileImage(userId, true);
        } catch (error: unknown) {
          console.warn(`Falha ao renovar imagem do usuário ${userId}:`, error);
        }
      }
    },

    cacheImage(userId: number, url: string, expirationMinutes?: number): void {
      const expiration = expirationMinutes || this.cacheConfig.defaultExpirationMinutes;
      const expiresAt = Date.now() + (expiration * 60 * 1000);
      
      this.imageCache[userId] = {
        url,
        expiresAt,
        loading: false,
        cachedAt: Date.now()
      };
    },

    setLoading(userId: number, loading: boolean): void {
      if (!this.imageCache[userId]) {
        this.imageCache[userId] = {
          url: null,
          expiresAt: 0,
          loading: false
        };
      }
      this.imageCache[userId].loading = loading;
    },

    async waitForLoading(userId: number): Promise<string> {
      return new Promise((resolve, reject) => {
        const checkLoading = () => {
          if (!this.isImageLoading(userId)) {
            const url = this.getProfileImageUrl(userId);
            if (url) {
              resolve(url);
            } else {
              reject(new Error('Imagem não encontrada após carregamento'));
            }
            return;
          }
          setTimeout(checkLoading, 100);
        };
        checkLoading();
      });
    },

    removeFromCache(userId: number): void {
      delete this.imageCache[userId];
    },

    clearCache(): void {
      this.imageCache = {};
    },

    cleanExpiredImages(): void {
      const now = Date.now();
      Object.keys(this.imageCache).forEach(userId => {
        const cached = this.imageCache[Number(userId)];
        if (cached && now >= cached.expiresAt) {
          this.removeFromCache(Number(userId));
        }
      });
    },

    startAutoCacheCleanup(intervalMinutes = 10): void {
      setInterval(() => {
        this.cleanExpiredImages();
      }, intervalMinutes * 60 * 1000);
    },

    updateCacheConfig(config: Partial<CacheConfig>): void {
      this.cacheConfig = {
        ...this.cacheConfig,
        ...config
      };
    }
  },
})

// @ts-ignore - persist property is added by pinia-plugin-persistedstate
useProfileImage.persist = {
  key: 'profile-image-cache',
  storage: localStorage,
  paths: ['imageCache'],
};