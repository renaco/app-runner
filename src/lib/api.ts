import type { ClubRun, MemberProfile, RunPayload, RunScope } from '../types/club.ts';

async function apiRequest<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof payload?.error === 'string'
        ? payload.error
        : `Request failed with status ${response.status}.`;
    throw new Error(message);
  }
  return payload as T;
}

export function fetchMemberProfile(token: string) {
  return apiRequest<MemberProfile>('/api/me', token);
}

export function saveMemberProfile(
  token: string,
  data: { displayName: string; pacePreference: string }
) {
  return apiRequest<MemberProfile>('/api/me', token, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function fetchClubRuns(
  token: string,
  filters: {
    scope: RunScope;
    terrain?: string;
    paceTier?: string;
    search?: string;
  }
) {
  const params = new URLSearchParams();
  params.set('scope', filters.scope);
  if (filters.terrain && filters.terrain !== 'all') {
    params.set('terrain', filters.terrain);
  }
  if (filters.paceTier && filters.paceTier !== 'all') {
    params.set('paceTier', filters.paceTier);
  }
  if (filters.search && filters.search.trim()) {
    params.set('search', filters.search.trim());
  }
  return apiRequest<{ runs: ClubRun[] }>(`/api/runs?${params.toString()}`, token);
}

export function createClubRunApi(token: string, data: RunPayload) {
  return apiRequest<{ run: ClubRun }>('/api/runs', token, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateClubRunApi(token: string, runId: number, data: RunPayload) {
  return apiRequest<{ run: ClubRun }>(`/api/runs/${runId}`, token, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteClubRunApi(token: string, runId: number) {
  return apiRequest<{ deleted: boolean; id: number }>(`/api/runs/${runId}`, token, {
    method: 'DELETE',
  });
}

export function joinClubRunApi(token: string, runId: number, note: string | null) {
  return apiRequest<{ run: ClubRun }>(`/api/runs/${runId}/rsvp`, token, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
}

export function leaveClubRunApi(token: string, runId: number) {
  return apiRequest<{ run: ClubRun }>(`/api/runs/${runId}/rsvp`, token, {
    method: 'DELETE',
  });
}
