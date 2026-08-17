/**
 * The backend's Payer model field is literally named `nin_bvn_hash` with no
 * hashing logic anywhere server-side (verified directly against
 * apps/registry/services.py and models.py) — it's a plain passthrough
 * CharField. To make the field live up to its name and keep the plaintext
 * NIN/BVN off the wire entirely (stronger than the prototype's approach,
 * where the server hashed a plaintext value it had already received), hash
 * it client-side before sending. SHA-256 without a salt is weak against a
 * targeted rainbow-table attack on structured IDs like NIN — same
 * acknowledged weakness as the rest of this system's hashing (see TDD.md) —
 * this isn't pretending to fix that, only avoiding transmitting the
 * plaintext at all.
 */
export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
