interface ChatHistoryMessage {
  id?: string;
  message: string;
  content?: string;
  senderId: string | number;
  senderName?: string;
  timestamp?: string;
  createdAt?: string;
  tutoringId: string | number;
}

interface ChatHistoryResponse {
  data: ChatHistoryMessage[];
}

export const getChatHistoryByTutoringId = async (tutoringId: string | number): Promise<ChatHistoryResponse> => {
  // Implementation
  throw new Error('Not implemented');
}; 