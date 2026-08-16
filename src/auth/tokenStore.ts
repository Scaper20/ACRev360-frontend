// State lives in one place, persisted via sessionStorage — matching the
// prototype's session-persistence pattern (docs/TDD.md §5), ported to the SPA.
const STORAGE_KEY = "acrev360.tokens";

export interface Tokens {
  access: string;
  refresh: string;
}

let tokens: Tokens | null = readStoredTokens();
const listeners = new Set<(tokens: Tokens | null) => void>();

function readStoredTokens(): Tokens | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Tokens;
  } catch {
    return null;
  }
}

export function getTokens(): Tokens | null {
  return tokens;
}

export function setTokens(next: Tokens | null): void {
  tokens = next;
  if (next) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
  listeners.forEach((listener) => listener(tokens));
}

export function subscribeToTokens(listener: (tokens: Tokens | null) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
