import { describe, expect, it } from 'vitest';
import { sha256Hex } from './hash';

describe('sha256Hex', () => {
  it('matches the known SHA-256 test vector for an empty string', async () => {
    expect(await sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('matches the known SHA-256 test vector for "abc"', async () => {
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('is deterministic', async () => {
    expect(await sha256Hex('12345678901')).toBe(await sha256Hex('12345678901'));
  });

  it('produces a different digest for a different input', async () => {
    expect(await sha256Hex('12345678901')).not.toBe(await sha256Hex('12345678902'));
  });

  it('never returns the plaintext input', async () => {
    const nin = '12345678901';
    expect(await sha256Hex(nin)).not.toContain(nin);
  });
});
