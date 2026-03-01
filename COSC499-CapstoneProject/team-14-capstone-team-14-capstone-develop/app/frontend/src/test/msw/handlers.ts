// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';
import { API_BASE } from '../../api/axiosInstance';

/* ------------------------------------------------------------------ */
/* Fake in-memory DB just for tests                                    */
/* ------------------------------------------------------------------ */
interface User {
  email: string;
  name: string;
  password: string;
}
const users: User[] = [];

/* ------------------------------------------------------------------ */
/* Request handlers consumed by @mswjs/node → setupServer(...)        */
/* ------------------------------------------------------------------ */
export const handlers = [
  /* ──────────────  REGISTER  ─────────────────────────────────────── */
  http.post(`${API_BASE}/auth/register/`, async ({ request }) => {
    const body = (await request.json()) as User;

    if (users.some((u) => u.email === body.email)) {
      return HttpResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      );
    }
    users.push(body);
    return HttpResponse.json(
      { success: true, data: { message: 'Registered' } },
      { status: 201 }
    );
  }),

  /* ───────────────  LOGIN / TOKEN  ───────────────────────────────── */
  http.post(`${API_BASE}/auth/token/`, async ({ request }) => {
    const { email, password } = (await request.json()) as {
      email: string;
      password: string;
    };

    // special case for the "admin / password" demo user
    if (email === 'admin' && password === 'password') {
      return HttpResponse.json(
        {
          success: true,
          data: {
            access: 'fake-access-token',
            refresh: 'fake-refresh-token',
            user: { email },
          },
        },
        { status: 200 }
      );
    }

    // otherwise only allow if they signed up earlier in this session
    if (!users.find((u) => u.email === email && u.password === password)) {
      return HttpResponse.json(
        { detail: 'No active account found with the given credentials' },
        { status: 401 }
      );
    }

    return HttpResponse.json(
      {
        success: true,
        data: {
          access: 'fake-access-token',
          refresh: 'fake-refresh-token',
          user: { email },
        },
      },
      { status: 200 }
    );
  }),

  /* ──────────── VERIFY EMAIL TOKEN ───────────────────────────────── */
  http.post(`${API_BASE}/auth/verify-email/`, async ({ request }) => {
    const { token } = (await request.json()) as { token: string };

    if (token === 'good-token') {
      return HttpResponse.json(
        { success: true, data: { message: 'Email verified successfully!' } },
        { status: 200 }
      );
    }
    if (token === 'bad-token') {
      return HttpResponse.json(
        { success: false, error: 'Invalid verification token' },
        { status: 400 }
      );
    }
    if (token === 'expired-token') {
      return HttpResponse.json(
        { success: false, error: 'Verification link has expired' },
        { status: 400 }
      );
    }
    // fallback for anything else
    return HttpResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 400 }
    );
  }),

  http.post(`${API_BASE}/variants/:id/update_order/`, async () => {
    return HttpResponse.json({ success: true }, { status: 200 });
  }),
];

export const resetUsers = () => {
  users.length = 0;
};
