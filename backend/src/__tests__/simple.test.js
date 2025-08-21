// Simple test to verify Jest is working
describe('Basic test setup', () => {
  it('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle promises', async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });

  it('should test PDF validation logic', () => {
    const isPdf = (filename) => filename.endsWith('.pdf');
    const isValidSize = (size) => size <= 10 * 1024 * 1024;

    expect(isPdf('document.pdf')).toBe(true);
    expect(isPdf('document.txt')).toBe(false);
    expect(isValidSize(5 * 1024 * 1024)).toBe(true); // 5MB
    expect(isValidSize(15 * 1024 * 1024)).toBe(false); // 15MB
  });
});