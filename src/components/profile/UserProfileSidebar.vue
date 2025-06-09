<template>
  <v-card class="profile-sidebar-card h-100" elevation="2">
    <div class="text-center pa-4">
      <!-- Avatar com hover effect e cursor pointer -->
      <div class="avatar-container position-relative mb-3">
        <v-avatar 
          size="120" 
          class="avatar-clickable"
          @click="openImageEditor"
        >
          <v-img
            :src="currentProfileImage || 'https://cdn.vuetifyjs.com/images/john.jpg'"
            alt="Foto de perfil"
          ></v-img>
        </v-avatar>
        
        <!-- Overlay de hover com ícone de câmera -->
        <div class="avatar-overlay" @click="openImageEditor">
          <v-icon icon="mdi-camera" size="24" color="white"></v-icon>
          <span class="text-caption text-white">Alterar foto</span>
        </div>
      </div>

      <h2 class="text-h5 font-weight-bold">
        {{ userData ? `${userData.firstName} ${userData.lastName}` : 'Carregando...' }}
      </h2>
      <p class="text-subtitle-2 text-medium-emphasis">
        {{ userData?.email || '' }}
      </p>
    </div>

    <v-divider></v-divider>

    <v-list nav>
      <v-list-item
        v-for="(item, i) in menuItems"
        :key="i"
        :value="item.value"
        :title="item.title"
        :prepend-icon="item.icon"
        :active="activeSection === item.value"
        @click="$emit('update:activeSection', item.value)"
        class="my-1"
        rounded="lg"
      ></v-list-item>
    </v-list>

    <!-- Dialog/Overlay para edição de imagem -->
    <v-dialog 
      v-model="showImageEditor" 
      max-width="500px"
      persistent
    >
      <v-card>
        <v-card-title class="text-h6 pa-4">
          <span>Alterar Foto de Perfil</span>
          <v-spacer></v-spacer>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            @click="closeImageEditor"
          ></v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pa-6">
          <ProfileImageUpload
            v-if="userData?.id"
            :userId="userData.id"
            size="large"
            @upload-success="handleUploadSuccess"
            @upload-error="handleUploadError"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Snackbar para feedback -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      :timeout="4000"
      location="bottom"
    >
      {{ snackbarMessage }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="showSnackbar = false"
        >
          Fechar
        </v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useProfileImage } from '@/stores/useProfileImage'
import ProfileImageUpload from './profileImageEditor.vue'

const props = defineProps({
  userData: {
    type: Object,
    default: null
  },
  menuItems: {
    type: Array,
    required: true
  },
  activeSection: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:activeSection'])

// Store
const profileImageStore = useProfileImage()

// Estado reativo
const showImageEditor = ref(false)
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

// Computed para imagem atual (com fallback)
const currentProfileImage = computed(() => {
  if (!props.userData?.id) return props.userData?.profileImg

  // Tentar obter do cache primeiro
  const cachedUrl = profileImageStore.getProfileImageUrl(props.userData.id)
  return cachedUrl || props.userData?.profileImg
})

// Métodos
const openImageEditor = () => {
  if (props.userData?.id) {
    showImageEditor.value = true
  }
}

const closeImageEditor = () => {
  showImageEditor.value = false
}

const handleUploadSuccess = async (response) => {
  snackbarMessage.value = 'Foto de perfil atualizada com sucesso!'
  snackbarColor.value = 'success'
  showSnackbar.value = true
  
  // Fechar o dialog após um pequeno delay
  setTimeout(() => {
    closeImageEditor()
  }, 1000)
  
  // Emitir evento para o componente pai se necessário
  emit('profile-image-updated', response)
}

const handleUploadError = (error) => {
  snackbarMessage.value = error.message || 'Erro ao fazer upload da imagem'
  snackbarColor.value = 'error'
  showSnackbar.value = true
}

// Carregar imagem do cache quando userData muda
watch(() => props.userData?.id, async (newUserId) => {
  if (newUserId) {
    try {
      // Renovar se necessário
      await profileImageStore.renewImageIfNeeded(newUserId)
    } catch (error) {
      console.log('Imagem não encontrada ou erro ao carregar:', error.message)
    }
  }
}, { immediate: true })
</script>

<style scoped>
.avatar-container {
  position: relative;
  display: inline-block;
}

.avatar-clickable {
  cursor: pointer;
  transition: all 0.3s ease;
}

.avatar-clickable:hover {
  transform: scale(1.05);
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;
  cursor: pointer;
}

.avatar-container:hover .avatar-overlay {
  opacity: 1;
}

.profile-sidebar-card {
  height: 100%;
}
</style>