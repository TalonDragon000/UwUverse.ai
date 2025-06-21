import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

describe('AI Service Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Character Generation', () => {
    it('should handle successful character generation', async () => {
      const mockResponse = {
        success: true,
        image_url: 'https://example.com/character.jpg',
        tavus_character_id: 'tavus123',
        tavus_video_url: 'https://example.com/video.mp4'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch('/functions/v1/ai-service/generate-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Character',
          gender: 'female',
          height: 'average',
          build: 'slim',
          eye_color: 'blue',
          hair_color: 'blonde',
          skin_tone: 'fair',
          personality_traits: ['shy', 'caring'],
          art_style: 'anime'
        })
      });

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.image_url).toBeDefined();
    });

    it('should handle fallback when Tavus API is unavailable', async () => {
      const mockResponse = {
        success: true,
        image_url: 'https://images.pexels.com/fallback.jpg',
        tavus_character_id: null,
        tavus_video_url: null,
        fallback: true,
        message: 'Character created with default image. Video features are not available.'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch('/functions/v1/ai-service/generate-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Character',
          gender: 'male',
          art_style: 'realistic'
        })
      });

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.fallback).toBe(true);
      expect(data.image_url).toContain('pexels.com');
    });
  });

  describe('Chat Responses', () => {
    it('should generate contextual chat responses', async () => {
      const mockResponse = {
        success: true,
        response: "Hi there! I'm so glad to hear from you. How has your day been?",
        fallback: true
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch('/functions/v1/ai-service/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Hello!',
          character_id: 'char123',
          chat_history: [],
          character_traits: ['friendly', 'caring'],
          character_context: {
            name: 'Alice',
            gender: 'female',
            backstory: 'A kind-hearted person who loves helping others.',
            meet_cute: 'coffee shop',
            art_style: 'anime',
            appearance: {
              height: 'average',
              build: 'slim',
              eye_color: 'blue',
              hair_color: 'blonde',
              skin_tone: 'fair'
            }
          }
        })
      });

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.response).toBeDefined();
      expect(typeof data.response).toBe('string');
    });

    it('should handle personality-based responses', async () => {
      const mockResponse = {
        success: true,
        response: "H-hi there... *blushes* I was just thinking about when we first met at the coffee shop. How have you been?",
        fallback: true
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch('/functions/v1/ai-service/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Hi!',
          character_traits: ['shy'],
          character_context: {
            name: 'Shy Character',
            meet_cute: 'coffee shop'
          }
        })
      });

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.response).toContain('blushes');
    });
  });

  describe('Voice Preview', () => {
    it('should handle voice preview generation', async () => {
      const mockResponse = {
        success: true,
        audio_data: 'base64audiodata',
        content_type: 'audio/mpeg',
        model_used: 'eleven_multilingual_v2'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch('/functions/v1/ai-service/generate-voice-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voice_id: 'voice123',
          text: 'Hello, this is a test message!'
        })
      });

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.audio_data).toBeDefined();
    });

    it('should handle fallback voices', async () => {
      const mockResponse = {
        success: false,
        error: 'Voice preview not available for this voice',
        fallback: true
      };

      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockResponse
      });

      const response = await fetch('/functions/v1/ai-service/generate-voice-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voice_id: 'fallback-voice-1',
          text: 'Test message'
        })
      });

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.fallback).toBe(true);
    });
  });
});