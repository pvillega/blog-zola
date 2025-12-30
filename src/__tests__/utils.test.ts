import { describe, it, expect } from 'vitest';
import { trim, toUiAmount } from '../utils/utils';

describe('trim', () => {
  it('should trim specified character from both ends', () => {
    expect(trim('###hello###', '#')).toBe('hello');
    expect(trim('...world...', '.')).toBe('world');
  });

  it('should return original string if no character to trim', () => {
    expect(trim('hello', '#')).toBe('hello');
  });

  it('should handle empty strings', () => {
    expect(trim('', '#')).toBe('');
  });

  it('should trim only from ends, not middle', () => {
    expect(trim('##he#llo##', '#')).toBe('he#llo');
  });
});

describe('toUiAmount', () => {
  it('should format billions correctly', () => {
    expect(toUiAmount(1000000000)).toBe('1B');
    expect(toUiAmount(1500000000)).toBe('1.5B');
    expect(toUiAmount(2000000000)).toBe('2B');
  });

  it('should format millions correctly', () => {
    expect(toUiAmount(1000000)).toBe('1M');
    expect(toUiAmount(1500000)).toBe('1.5M');
    expect(toUiAmount(2000000)).toBe('2M');
  });

  it('should format thousands correctly', () => {
    expect(toUiAmount(1000)).toBe('1K');
    expect(toUiAmount(1500)).toBe('1.5K');
    expect(toUiAmount(2000)).toBe('2K');
  });

  it('should format numbers under 1000 as-is', () => {
    expect(toUiAmount(500)).toBe('500');
    expect(toUiAmount(42)).toBe('42');
  });

  it('should handle zero', () => {
    expect(toUiAmount(0)).toBe(0);
  });
});
