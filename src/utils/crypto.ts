// Generate random IDs
const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'; // no confusable chars

export function generateId(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => ALPHABET[b % ALPHABET.length])
    .join('');
}

export function generateFeedId(): string {
  return generateId(8);
}

export function generateWriteKey(): string {
  return generateId(12);
}

export async function hashWriteKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyWriteKey(key: string, hash: string): Promise<boolean> {
  const keyHash = await hashWriteKey(key);
  return keyHash === hash;
}
