import { describe, it, expect, vi, beforeEach } from 'vitest';
import { subscribeToNewsletter } from '../../src/lib/services/newsletter';

// Mock Supabase client
vi.mock('../../src/lib/supabase/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }
}));

describe('Supabase Client Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Newsletter Service', () => {
    it('should successfully subscribe to newsletter', async () => {
      const { supabase } = await import('../../src/lib/supabase/supabaseClient');
      
      // Mock successful response
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: '123', email: 'test@example.com', confirmed: false },
            error: null
          })
        })
      });
      
      (supabase.from as any).mockReturnValue({
        insert: mockInsert
      });

      const result = await subscribeToNewsletter('test@example.com');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Successfully subscribed to newsletter!');
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          email: 'test@example.com',
          confirmation_token: expect.any(String)
        })
      ]);
    });

    it('should handle duplicate email subscription', async () => {
      const { supabase } = await import('../../src/lib/supabase/supabaseClient');
      
      // Mock duplicate email error
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockRejectedValue({
            code: '23505' // unique_violation
          })
        })
      });
      
      (supabase.from as any).mockReturnValue({
        insert: mockInsert
      });

      const result = await subscribeToNewsletter('existing@example.com');

      expect(result.success).toBe(false);
      expect(result.message).toBe('This email is already subscribed to our newsletter.');
    });

    it('should handle general subscription errors', async () => {
      const { supabase } = await import('../../src/lib/supabase/supabaseClient');
      
      // Mock general error
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockRejectedValue({
            code: 'NETWORK_ERROR'
          })
        })
      });
      
      (supabase.from as any).mockReturnValue({
        insert: mockInsert
      });

      const result = await subscribeToNewsletter('test@example.com');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to subscribe to newsletter. Please try again.');
    });
  });
});