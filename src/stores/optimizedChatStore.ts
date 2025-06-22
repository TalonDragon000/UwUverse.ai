import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Optimized chat store with selective subscriptions
interface Message {
  id: string;
  chat_id: string;
  sender: 'user' | 'character';
  content: string;
  created_at: string;
  message_type?: 'text' | 'audio_log';
}

interface Chat {
  id: string;
  user_id: string;
  character_id: string;
  love_meter: number;
  created_at: string;
}

interface ChatState {
  // Essential metadata only
  activeChat: Chat | null;
  messageIds: string[];
  messagesById: Record<string, Message>;
  isTyping: boolean;
  
  // Actions
  setActiveChat: (chat: Chat | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setIsTyping: (isTyping: boolean) => void;
  updateLoveMeter: (value: number) => void;
  
  // Selectors
  getMessages: () => Message[];
  getRecentMessages: (count: number) => Message[];
}

export const useChatStore = create<ChatState>()(
  subscribeWithSelector((set, get) => ({
    activeChat: null,
    messageIds: [],
    messagesById: {},
    isTyping: false,
    
    setActiveChat: (chat) => set({ activeChat: chat }),
    
    setMessages: (messages) => {
      const messagesById: Record<string, Message> = {};
      const messageIds: string[] = [];
      
      messages.forEach(message => {
        messagesById[message.id] = message;
        messageIds.push(message.id);
      });
      
      set({ messagesById, messageIds });
    },
    
    addMessage: (message) => set((state) => ({
      messagesById: { ...state.messagesById, [message.id]: message },
      messageIds: [...state.messageIds, message.id]
    })),
    
    setIsTyping: (isTyping) => set({ isTyping }),
    
    updateLoveMeter: (value) => set((state) => ({
      activeChat: state.activeChat ? { ...state.activeChat, love_meter: value } : null
    })),
    
    // Memoized selectors
    getMessages: () => {
      const { messageIds, messagesById } = get();
      return messageIds.map(id => messagesById[id]).filter(Boolean);
    },
    
    getRecentMessages: (count) => {
      const { messageIds, messagesById } = get();
      return messageIds
        .slice(-count)
        .map(id => messagesById[id])
        .filter(Boolean);
    }
  }))
);

// Selective subscription hooks for better performance
export const useActiveChat = () => useChatStore(state => state.activeChat);
export const useIsTyping = () => useChatStore(state => state.isTyping);
export const useMessages = () => useChatStore(state => state.getMessages());
export const useRecentMessages = (count: number) => useChatStore(state => state.getRecentMessages(count));