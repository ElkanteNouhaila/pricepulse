import { validateUrl, validatePrice } from '../../src/utils/validation.js';

describe('Validation Utils', () => {
  describe('validateUrl', () => {
    it('accepts valid URLs', () => {
      expect(validateUrl('https://amazon.com/product')).toBe(true);
      expect(validateUrl('http://example.com')).toBe(true);
    });

    it('rejects invalid URLs', () => {
      expect(validateUrl('not-a-url')).toBe(false);
      expect(validateUrl('ftp://example.com')).toBe(false);
      expect(validateUrl('')).toBe(false);
    });
  });

  describe('validatePrice', () => {
    it('accepts valid prices', () => {
      expect(validatePrice(10.5)).toBe(true);
      expect(validatePrice('19.99')).toBe(true);
      expect(validatePrice(0.01)).toBe(true);
    });

    it('rejects invalid prices', () => {
      expect(validatePrice(-10)).toBe(false);
      expect(validatePrice(0)).toBe(false);
      expect(validatePrice('abc')).toBe(false);
      expect(validatePrice(NaN)).toBe(false);
    });
  });
});