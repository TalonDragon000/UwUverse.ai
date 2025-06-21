import { describe, it, expect } from 'vitest';
import { cn, formatDate, formatTime, truncateText } from '../../src/lib/utils';

describe('Utils Functions', () => {
  describe('cn (className utility)', () => {
    it('should combine class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional');
    });

    it('should handle Tailwind conflicts', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2');
    });
  });

  describe('formatDate', () => {
    it('should format date string correctly', () => {
      const date = '2025-01-01T00:00:00Z';
      const formatted = formatDate(date);
      expect(formatted).toMatch(/Jan 1, 2025/);
    });

    it('should format Date object correctly', () => {
      const date = new Date('2025-01-01T00:00:00Z');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/Jan 1, 2025/);
    });
  });

  describe('formatTime', () => {
    it('should format time string correctly', () => {
      const date = '2025-01-01T14:30:00Z';
      const formatted = formatTime(date);
      expect(formatted).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
    });

    it('should format Date object correctly', () => {
      const date = new Date('2025-01-01T14:30:00Z');
      const formatted = formatTime(date);
      expect(formatted).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
    });
  });

  describe('truncateText', () => {
    it('should truncate text longer than maxLength', () => {
      const text = 'This is a very long text that should be truncated';
      const result = truncateText(text, 20);
      expect(result).toBe('This is a very long...');
      expect(result.length).toBe(23); // 20 + '...'
    });

    it('should not truncate text shorter than maxLength', () => {
      const text = 'Short text';
      const result = truncateText(text, 20);
      expect(result).toBe('Short text');
    });

    it('should handle exact length', () => {
      const text = 'Exactly twenty chars';
      const result = truncateText(text, 20);
      expect(result).toBe('Exactly twenty chars');
    });
  });
});