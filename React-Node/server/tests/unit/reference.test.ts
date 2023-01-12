import '../setup';
import { makeReference } from '../../src/utils/reference';

describe('makeReference', () => {
  it('should format reference with zero-padded journal and article IDs', () => {
    expect(makeReference(1, 1)).toBe('SJP-01-00001');
  });

  it('should pad journal ID to 2 digits', () => {
    expect(makeReference(3, 42)).toBe('SJP-03-00042');
  });

  it('should pad article ID to 5 digits', () => {
    expect(makeReference(12, 999)).toBe('SJP-12-00999');
  });

  it('should handle large IDs without truncating', () => {
    expect(makeReference(99, 100000)).toBe('SJP-99-100000');
  });
});
