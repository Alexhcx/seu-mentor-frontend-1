<template>
  <v-app>
    <router-view /> <AppSnackbar />

    <ChatManager 
      v-if="isUserAuthenticated" 
      @connection-changed="handleGlobalChatConnection"
      @message-received="handleGlobalChatMessage"
    />
    </v-app>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useAuthStore } from '@/stores/auth'; 
import AppSnackbar from '@/components/AppSnackbar.vue';
import ChatManager from '@/components/chat/ChatManager.vue'; 

interface ChatMessage {
  message: string;
  mentoria: string;
}

export default defineComponent({
  name: 'App',
  components: {
    AppSnackbar,
    ChatManager,
  },
  setup() {
    const authStore = useAuthStore();

    const isUserAuthenticated = computed(() => authStore.isAuthenticated);
    const handleGlobalChatMessage = ({ message, mentoria }: ChatMessage): void => {
      // Handle chat message
      console.log('New chat message:', { message, mentoria });
    };

    const handleGlobalChatConnection = (connected: boolean): void => {
      // Handle connection status change
      console.log('Chat connection status:', connected);
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