<template>
  <div class="chat-notifications-refactored">
    <v-snackbar
      v-model="chatStore.showNotification"
      :timeout="4000"
      location="top right"
      color="primary"
      class="message-notification-toast"
    >
      <div class="notification-toast-content">
        <v-avatar size="32" class="mr-3">
          <v-img :src="chatStore.lastNotification?.avatar || '/placeholder-user.jpg'" />
        </v-avatar>
        <div class="notification-toast-text">
          <div class="notification-toast-title">{{ chatStore.lastNotification?.title }}</div>
          <div class="notification-toast-message">{{ chatStore.lastNotification?.message }}</div>
        </div>
      </div>
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="openAndHandleNotificationChat"
          size="small"
        >
          Responder
        </v-btn>
        <v-btn
          icon
          @click="chatStore.showNotification = false"
          size="small"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { useChatStore } from '@/stores/chat'; // Ensure this path is correct for your project structure

const chatStore = useChatStore();

const openAndHandleNotificationChat = async () => {
  // This logic is similar to what's in ChatManager.vue [cite: 185, 186]
  // It ensures the component can directly trigger the correct actions in the store.
  if (chatStore.lastNotification && chatStore.lastNotification.chatId) { [cite: 81]
    const chat = chatStore.allChats.find(c => c.id === chatStore.lastNotification.chatId); [cite: 80]
    if (chat) {
      await chatStore.selectChat(chat); [cite: 76]
      // Ensure chat list/dialog is open to show the selected chat
      if (!chatStore.chatListOpen) { [cite: 85]
        chatStore.toggleChatList(); [cite: 85]
      }
    }
  }
  chatStore.showNotification = false; // Hide the notification after handling [cite: 82]
};

// No watchers are needed here as v-model="chatStore.showNotification" handles visibility,
// and the content is directly bound to chatStore.lastNotification.
// The sound playing is handled by the store's `showMessageNotification` action,
// which sets `showNotification` to true and calls `playNotificationSound`. [cite: 52, 82, 83]
</script>

<style scoped>
/* Styles can be adapted from your original ChatNotification or ChatManager */
.message-notification-toast {
  z-index: 2000; /* Ensure it's above other elements */
}

.notification-toast-content {
  display: flex;
  align-items: center;
  min-width: 300px;
}

.notification-toast-text {
  flex: 1;
  min-width: 0; /* Important for text-overflow to work in a flex child */
}

.notification-toast-title {
  font-weight: 500;
  font-size: 14px;
  line-height: 1.2;
  margin-bottom: 2px;
}

.notification-toast-message {
  font-size: 13px;
  opacity: 0.9;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px; /* Adjust as needed */
}

/* Example media query, adapt if necessary from your original styles */
@media (max-width: 600px) {
  .notification-toast-content {
    min-width: 250px;
  }
  .notification-toast-message {
    max-width: 150px;
  }
}
</style>