<template>
  <v-app>
    <router-view /> <AppSnackbar />

    <ChatManager 
      v-if="isUserAuthenticated" 
      @messageReceived="handleGlobalChatMessage"
      @connectionChanged="handleGlobalChatConnection"
    />
    </v-app>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useAuthStore } from '@/stores/auth'; 
import AppSnackbar from '@/components/AppSnackbar.vue';
import ChatManager from '@/components/chat/ChatManager.vue'; 

export default defineComponent({
  name: 'App',
  components: {
    AppSnackbar,
    ChatManager,
  },
  setup() {
    const authStore = useAuthStore();

    const isUserAuthenticated = computed(() => authStore.isAuthenticated);
    const handleGlobalChatMessage = ({ message, mentoria }: any) => {
    };

    const handleGlobalChatConnection = (connected: boolean) => {
    };

    return {
      isUserAuthenticated,
      handleGlobalChatMessage,
      handleGlobalChatConnection,
    };
  },
});
</script>

<style>
/* Seus estilos globais, se houver */
</style>