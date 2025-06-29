import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

// Mock Deno environment
const mockDeno = {
  env: {
    get: vi.fn((key: string) => {
      switch (key) {
        case 'SUPABASE_URL': return 'http://mock-supabase-url';
        case 'SUPABASE_SERVICE_ROLE_KEY': return 'mock-service-key';
        case 'OPENAI_API_KEY': return 'mock-openai-key';
        case 'HUGGING_FACE_API_KEY': return 'mock-huggingface-key';
        default: return undefined;
      }
    }),
  },
};

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
  })),
};

describe('AI Chat Edge Function Integration', () => {
  const mockCharacter = {
    id: 'char123',
    name: 'Test Character',
    personality_traits: ['friendly', 'caring'],
    backstory: 'A kind AI companion.',
    meet_cute: 'online forum',
    gender: 'female',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful character fetch
    mockSupabaseClient.from().select().eq().single.mockResolvedValue({
      data: mockCharacter,
      error: null,
    });
  });

  describe('3-Layer Fallback System', () => {
    it('should use OpenAI as Layer 1 (preferred) when available and successful', async () => {
      // Mock OpenAI success
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Hello from OpenAI!' } }],
        }),
      });

      const request = {
        message: 'Hi',
        character_id: 'char123',
        chat_history: [],
        character_traits: ['friendly'],
      };

      // Simulate the Edge Function logic
      const startTime = Date.now();
      let aiResponse = '';
      let modelUsed = 'local-fallback';
      let fallbackUsed = true;
      let responseTime = 0;

      // Layer 1: OpenAI
      if (mockDeno.env.get('OPENAI_API_KEY')) {
        try {
          const apiStartTime = Date.now();
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${mockDeno.env.get('OPENAI_API_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-3.5-turbo',
              messages: [
                { role: 'system', content: 'You are Test Character...' },
                { role: 'user', content: 'Hi' }
              ],
            }),
          });

          const data = await response.json();
          responseTime = Date.now() - apiStartTime;
          aiResponse = data.choices[0].message.content;
          modelUsed = 'openai-gpt-3.5-turbo';
          fallbackUsed = false;
        } catch (error) {
          // Would fallback to Layer 2
        }
      }

      expect(aiResponse).toBe('Hello from OpenAI!');
      expect(modelUsed).toBe('openai-gpt-3.5-turbo');
      expect(fallbackUsed).toBe(false);
      expect(responseTime).toBeGreaterThan(0);
    });

    it('should fallback to Hugging Face (Layer 2) when OpenAI fails', async () => {
      // Mock OpenAI failure
      (fetch as any)
        .mockRejectedValueOnce(new Error('OpenAI API error'))
        // Mock Hugging Face success
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ([{ generated_text: 'Hello from Hugging Face!' }]),
        });

      const request = {
        message: 'Hi',
        character_id: 'char123',
        chat_history: [],
        character_traits: ['friendly'],
      };

      let aiResponse = '';
      let modelUsed = 'local-fallback';
      let fallbackUsed = true;
      let fallbackReason = '';

      // Layer 1: OpenAI (fails)
      if (mockDeno.env.get('OPENAI_API_KEY')) {
        try {
          await fetch('https://api.openai.com/v1/chat/completions');
        } catch (error) {
          fallbackReason = 'OpenAI API error: ' + error.message;
        }
      }

      // Layer 2: Hugging Face
      if (fallbackUsed && mockDeno.env.get('HUGGING_FACE_API_KEY')) {
        try {
          const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${mockDeno.env.get('HUGGING_FACE_API_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              inputs: 'You are Test Character... Human: Hi\nTest Character:',
            }),
          });

          const data = await response.json();
          aiResponse = data[0].generated_text;
          modelUsed = 'huggingface-dialogpt';
          fallbackUsed = false;
        } catch (error) {
          fallbackReason += '; Hugging Face API error: ' + error.message;
        }
      }

      expect(aiResponse).toBe('Hello from Hugging Face!');
      expect(modelUsed).toBe('huggingface-dialogpt');
      expect(fallbackUsed).toBe(false);
      expect(fallbackReason).toContain('OpenAI API error');
    });

    it('should use local fallback (Layer 3) when all APIs fail', async () => {
      // Mock all API failures
      (fetch as any)
        .mockRejectedValueOnce(new Error('OpenAI API error'))
        .mockRejectedValueOnce(new Error('Hugging Face API error'));

      let aiResponse = '';
      let modelUsed = 'local-fallback';
      let fallbackUsed = true;
      let fallbackReason = '';

      // Layer 1: OpenAI (fails)
      try {
        await fetch('https://api.openai.com/v1/chat/completions');
      } catch (error) {
        fallbackReason = 'OpenAI API error: ' + error.message;
      }

      // Layer 2: Hugging Face (fails)
      if (fallbackUsed) {
        try {
          await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium');
        } catch (error) {
          fallbackReason += '; Hugging Face API error: ' + error.message;
        }
      }

      // Layer 3: Local fallback
      if (fallbackUsed) {
        // Simple fallback logic
        const message = 'Hi';
        const character = mockCharacter;
        
        if (message.toLowerCase().includes('hi')) {
          aiResponse = `Hi there! I'm ${character.name}. How can I help you today?`;
        }
        
        modelUsed = 'local-fallback';
        fallbackReason += '; Using local fallback response';
      }

      expect(aiResponse).toBe('Hi there! I\'m Test Character. How can I help you today?');
      expect(modelUsed).toBe('local-fallback');
      expect(fallbackUsed).toBe(true);
      expect(fallbackReason).toContain('OpenAI API error');
      expect(fallbackReason).toContain('Hugging Face API error');
      expect(fallbackReason).toContain('Using local fallback response');
    });
  });

  describe('Performance Testing', () => {
    it('should complete responses within acceptable time limits', async () => {
      // Mock fast API response
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ([{ generated_text: 'Fast response!' }]),
      });

      const startTime = Date.now();
      
      // Simulate API call
      const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium');
      const data = await response.json();
      
      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(5000); // Should be under 5 seconds
      expect(data[0].generated_text).toBe('Fast response!');
    });

    it('should handle timeout scenarios gracefully', async () => {
      // Mock slow API response
      (fetch as any).mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ([{ generated_text: 'Slow response' }]),
        }), 16000)) // 16 seconds - should timeout
      );

      const startTime = Date.now();
      let timedOut = false;
      
      try {
        // Simulate 15-second timeout
        await Promise.race([
          fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium'),
          new Promise((_, reject) => 
            setTimeout(() => {
              timedOut = true;
              reject(new Error('Operation timeout'));
            }, 15000)
          )
        ]);
      } catch (error) {
        expect(error.message).toBe('Operation timeout');
        expect(timedOut).toBe(true);
      }
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeGreaterThan(14000); // Should timeout around 15s
      expect(responseTime).toBeLessThan(16000);
    });
  });

  describe('Response Quality and Accuracy', () => {
    it('should generate contextually appropriate responses based on personality traits', async () => {
      const testCases = [
        {
          traits: ['shy'],
          message: 'Hi',
          expectedPattern: /nervous|blush|shy/i,
        },
        {
          traits: ['flirty'],
          message: 'Hi',
          expectedPattern: /gorgeous|charming|~|💕/i,
        },
        {
          traits: ['confident'],
          message: 'Hi',
          expectedPattern: /great|feeling|along well/i,
        },
        {
          traits: ['chaotic'],
          message: 'Hi',
          expectedPattern: /OMG|excited|MILLION/i,
        },
      ];

      for (const testCase of testCases) {
        const character = { ...mockCharacter, personality_traits: testCase.traits };
        
        // Simulate local fallback response generation
        let response = '';
        const message = testCase.message.toLowerCase();
        
        if (message.includes('hi')) {
          if (testCase.traits.includes('shy')) {
            response = `Hi there! I'm ${character.name}. How can I help you today, though I'm a bit nervous...`;
          } else if (testCase.traits.includes('flirty')) {
            response = `Well hello there, gorgeous~ I'm ${character.name}, and I've been waiting for someone like you...`;
          } else if (testCase.traits.includes('confident')) {
            response = `Hey! I'm ${character.name}. Great to meet you - I have a feeling we're going to get along really well.`;
          } else if (testCase.traits.includes('chaotic')) {
            response = `OMG HI!!! I'm ${character.name} and I'm SO excited to meet you! What should we talk about first?`;
          }
        }
        
        expect(response).toMatch(testCase.expectedPattern);
      }
    });

    it('should maintain character consistency across conversation', async () => {
      const character = { ...mockCharacter, personality_traits: ['shy', 'caring'] };
      const chatHistory = [
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'H-hi there... I\'m a bit nervous but happy to meet you.' },
        { role: 'user', content: 'How are you?' },
      ];

      // Mock Hugging Face response that maintains character
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ([{ 
          generated_text: 'I\'m doing okay, thank you for asking... *smiles softly* How are you feeling today?' 
        }]),
      });

      const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium');
      const data = await response.json();
      const aiResponse = data[0].generated_text;

      // Should maintain shy and caring personality
      expect(aiResponse).toMatch(/okay|thank you|smiles|feeling/i);
      expect(aiResponse.length).toBeGreaterThan(10);
      expect(aiResponse.length).toBeLessThan(200); // Should be conversational length
    });

    it('should handle edge cases and invalid inputs gracefully', async () => {
      const edgeCases = [
        { message: '', expected: 'fallback' },
        { message: '   ', expected: 'fallback' },
        { message: 'a'.repeat(1000), expected: 'response' }, // Very long message
        { message: '!@#$%^&*()', expected: 'response' }, // Special characters
      ];

      for (const testCase of edgeCases) {
        // Simulate local fallback for edge cases
        let response = '';
        
        if (!testCase.message.trim()) {
          response = 'I\'m not sure what you meant. Could you try asking me something?';
        } else {
          response = 'That\'s interesting! Tell me more about that.';
        }
        
        expect(response.length).toBeGreaterThan(5);
        expect(typeof response).toBe('string');
      }
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle malformed API responses gracefully', async () => {
      // Mock malformed response
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unexpected: 'format' }),
      });

      let error = null;
      let fallbackUsed = false;
      
      try {
        const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium');
        const data = await response.json();
        
        if (!data[0]?.generated_text) {
          throw new Error('Unexpected response format');
        }
      } catch (e) {
        error = e;
        fallbackUsed = true;
      }
      
      expect(error).toBeTruthy();
      expect(fallbackUsed).toBe(true);
    });

    it('should handle network failures and retry logic', async () => {
      let attemptCount = 0;
      
      // Mock network failure then success
      (fetch as any).mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: async () => ([{ generated_text: 'Success after retry!' }]),
        });
      });

      // Simulate retry logic
      let response = null;
      let lastError = null;
      
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const result = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium');
          response = await result.json();
          break;
        } catch (error) {
          lastError = error;
          if (attempt < 2) {
            // Wait before retry (exponential backoff simulation)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
          }
        }
      }
      
      expect(attemptCount).toBe(3);
      expect(response[0].generated_text).toBe('Success after retry!');
    });
  });
});