import { apiClient, errorMessage } from './client';
import { authStore } from './auth-store';
import type { components } from './generated/schema';

export type Me = components['schemas']['Me'];

/** Authenticates and returns the resulting identity. Deliberately role-
 * agnostic — which access_level a given app accepts differs (the portal
 * rejects AGENT, the field app requires it), so that gate lives in each
 * app's own AuthContext, not here. Callers that reject the returned role
 * should call authStore.clear() themselves before surfacing the error, same
 * as any other post-login validation failure. */
export async function login(email: string, password: string): Promise<Me> {
  const { data, error } = await apiClient.POST('/api/v1/auth/login', {
    body: { email, password },
  });
  if (error) throw new Error(errorMessage(error));
  authStore.setTokens(data.access, data.refresh);
  return me();
}

export async function logout(): Promise<void> {
  const refresh = authStore.getRefreshToken();
  try {
    if (refresh) {
      await apiClient.POST('/api/v1/auth/logout', { body: { refresh } });
    }
  } finally {
    authStore.clear();
  }
}

export async function me(): Promise<Me> {
  const { data, error } = await apiClient.GET('/api/v1/auth/me');
  if (error) throw new Error(errorMessage(error));
  return data;
}

/** access_level as returned by /auth/me — mirrors the backend's roles
 * (see V2_ARCHITECTURE.md §8, plus REVENUE_OFFICER added later: a read-only,
 * single-consultant-scoped account — see SubConsultantViewSet.revenue_officers).
 * Field agents don't use this frontend.
 *
 * The RBAC expansion (2026-09-11, see docs/RBAC_EXPANSION_DESIGN.md and the
 * FRONTEND_HANDOFF_RBAC doc on the backend side) added everything from
 * COUNCIL_IGR_HEAD down — the four council-tier roles built out in the
 * portal so far, the platform-tier (council=null) roles and RATEPAYER/
 * RATEPAYER_PROXY are typed here for exhaustiveness but have no UI yet. */
export type AccessLevel =
  | 'COUNCIL_ADMIN'
  | 'CONSULTANT'
  | 'AGENT'
  | 'GLOBAL_VIEW'
  | 'REVENUE_OFFICER'
  | 'COUNCIL_IGR_HEAD'
  | 'COUNCIL_TREASURY'
  | 'COUNCIL_AUDITOR'
  | 'COUNCIL_IT'
  | 'CONSULTANT_STAFF'
  | 'AGENT_SUPERVISOR'
  | 'SUPER_ADMIN'
  | 'PLATFORM_ADMIN'
  | 'DEVOPS_ADMIN'
  | 'BD_VIEW'
  | 'COMPLIANCE_VIEW'
  | 'FINANCE_ADMIN'
  | 'SUPPORT_ADMIN'
  | 'ANALYTICS_VIEW'
  | 'EXTERNAL_AUDITOR'
  | 'RATEPAYER'
  | 'RATEPAYER_PROXY';
