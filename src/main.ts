/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'
import { useAuthStore } from '@/stores/auth'
import { useProfileImage } from '@/stores/useProfileImage'
import { mask } from "vue-the-mask"


import App from './App.vue'


import { createApp, type Directive } from 'vue'

import "./styles/main.css"

const app = createApp(App)
app.directive("mask", mask as Directive)

registerPlugins(app)

const initializeStores = async () => {
  try {

    const authStore = useAuthStore()
    await authStore.initializeAuth()
    
    
    const profileImageStore = useProfileImage()
    
    profileImageStore.startAutoCacheCleanup(60)
    
    profileImageStore.updateCacheConfig({
      defaultExpirationMinutes: 10080, 
      renewalMarginMinutes: 10      
    })
    
    console.log('✅ Stores inicializados com sucesso')
  } catch (error) {
    console.error('❌ Erro ao inicializar stores:', error)
  }
}

app.mount('#app')

initializeStores()