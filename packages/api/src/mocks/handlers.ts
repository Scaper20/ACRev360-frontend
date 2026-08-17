import { http, HttpResponse } from 'msw';
import { API_BASE_URL } from '../client';

/**
 * Secondary dev aid — not the primary verification path (the live backend
 * at API_BASE_URL is confirmed reachable and is what real testing targets).
 * Useful for fast, offline iteration on a single component without waiting
 * on Render's cold start. Extend with more handlers as components need them;
 * there's no attempt here to mock all 46 endpoints.
 */
export const handlers = [
  http.get(`${API_BASE_URL}/api/v1/health`, () => HttpResponse.json({ status: 'ok', service: 'ACRev360 API (mock)' })),

  http.post(`${API_BASE_URL}/api/v1/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { username: string; password: string };
    if (body.username === 'admin' && body.password === 'mock-password') {
      return HttpResponse.json({ access: 'mock-access-token', refresh: 'mock-refresh-token' });
    }
    return HttpResponse.json({ error: 'Username or password is incorrect' }, { status: 401 });
  }),

  http.get(`${API_BASE_URL}/api/v1/auth/me`, () =>
    HttpResponse.json({
      id: 1,
      username: 'admin',
      full_name: 'Mock Council Admin',
      email: 'admin@example.test',
      phone: '08000000000',
      council: 1,
      council_code: 'KAC',
      role: 1,
      role_name: 'COUNCIL_ADMIN',
      consultant: null,
      access_level: 'COUNCIL_ADMIN',
    }),
  ),
];
