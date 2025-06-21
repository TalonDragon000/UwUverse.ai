import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../../src/stores/authStore';
import { useCharacterStore } from '../../src/stores/characterStore';
import { useChatStore } from '../../src/stores/chatStore';

describe('Zustand Stores', () => {
  beforeEach(() => {
    // Reset stores before each test
    useAuthStore.getState().clearAuth();
    useCharacterStore.getState().resetCharacterCreationData();
    useChatStore.getState().setActiveChat(null);
    useChatStore.getState().setMessages([]);
  });

  describe('AuthStore', () => {
    it('should set session correctly', () => {
      const mockSession = { user: { id: '123', email: 'test@example.com' } } as any;
      
      useAuthStore.getState().setSession(mockSession);
      
      expect(useAuthStore.getState().session).toEqual(mockSession);
    });

    it('should clear auth correctly', () => {
      const mockSession = { user: { id: '123', email: 'test@example.com' } } as any;
      const mockUser = { id: '123', email: 'test@example.com' };
      
      useAuthStore.getState().setSession(mockSession);
      useAuthStore.getState().setUser(mockUser);
      useAuthStore.getState().clearAuth();
      
      expect(useAuthStore.getState().session).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('CharacterStore', () => {
    it('should update character creation data', () => {
      const characterData = { name: 'Test Character', gender: 'female' as const };
      
      useCharacterStore.getState().updateCharacterCreationData(characterData);
      
      expect(useCharacterStore.getState().characterCreationData).toEqual(characterData);
    });

    it('should add character to list', () => {
      const mockCharacter = {
        id: '123',
        name: 'Test Character',
        gender: 'female',
        user_id: 'user123',
        created_at: new Date().toISOString()
      } as any;
      
      useCharacterStore.getState().addCharacter(mockCharacter);
      
      expect(useCharacterStore.getState().characters).toContain(mockCharacter);
    });

    it('should reset character creation data', () => {
      useCharacterStore.getState().updateCharacterCreationData({ name: 'Test' });
      useCharacterStore.getState().resetCharacterCreationData();
      
      expect(useCharacterStore.getState().characterCreationData).toEqual({});
    });
  });

  describe('ChatStore', () => {
    it('should set active chat', () => {
      const mockChat = {
        id: '123',
        user_id: 'user123',
        character_id: 'char123',
        love_meter: 50,
        created_at: new Date().toISOString()
      } as any;
      
      useChatStore.getState().setActiveChat(mockChat);
      
      expect(useChatStore.getState().activeChat).toEqual(mockChat);
    });

    it('should add message to list', () => {
      const mockMessage = {
        id: '123',
        chat_id: 'chat123',
        sender: 'user' as const,
        content: 'Hello!',
        created_at: new Date().toISOString()
      } as any;
      
      useChatStore.getState().addMessage(mockMessage);
      
      expect(useChatStore.getState().messages).toContain(mockMessage);
    });

    it('should update love meter', () => {
      const mockChat = {
        id: '123',
        user_id: 'user123',
        character_id: 'char123',
        love_meter: 50,
        created_at: new Date().toISOString()
      } as any;
      
      useChatStore.getState().setActiveChat(mockChat);
      useChatStore.getState().updateLoveMeter(75);
      
      expect(useChatStore.getState().activeChat?.love_meter).toBe(75);
    });

    it('should set typing state', () => {
      useChatStore.getState().setIsTyping(true);
      expect(useChatStore.getState().isTyping).toBe(true);
      
      useChatStore.getState().setIsTyping(false);
      expect(useChatStore.getState().isTyping).toBe(false);
    });
  });
});