import { create } from 'zustand';
import { Database } from '../lib/supabase/database.types';

type Chat = Database['public']['Tables']['chats']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];

type ChatState = {
  activeChat: Chat | null;
  messages: Message[];
  isTyping: boolean;
  setActiveChat: (chat: Chat | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setIsTyping: (isTyping: boolean) => void;
  updateLoveMeter: (value: number) => void;
};

export const useChatStore = create<ChatState>((set) => ({
  activeChat: null,
  messages: [],
  isTyping: false,
  setActiveChat: (chat) => set({ activeChat: chat }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  setIsTyping: (isTyping) => set({ isTyping }),
  updateLoveMeter: (value) => set((state) => ({ 
    activeChat: state.activeChat ? { ...state.activeChat, love_meter: value } : null 
  })),
}));