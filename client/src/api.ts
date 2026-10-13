import type { CvSummary, Job, JobDetail, Preferences, SourceStatus, Status } from './types';

export class UnauthorizedError extends Error {}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isForm = init.body instanceof FormData;
  const response = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    ...init,
    headers: isForm || !init.body ? init.headers : { 'content-type': 'application/json', ...init.headers },
  });
  if (response.status === 401 && path !== '/auth/login') throw new UnauthorizedError();
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((data as { error?: string }).error ?? `Request failed (${response.status})`);
  return data as T;
}

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

export const api = {
  me: () => call<{ authenticated: boolean }>('/auth/me'),
  login: (password: string) => call<{ authenticated: boolean }>('/auth/login', json('POST', { password })),
  logout: () => call('/auth/logout', { method: 'POST' }),

  jobs: () => call<{ fresh: Job[]; board: Job[] }>('/jobs'),
  job: (id: string) => call<JobDetail>(`/jobs/${id}`),
  updateJob: (id: string, changes: { status?: Status; notes?: string }) => call<Job>(`/jobs/${id}`, json('PATCH', changes)),
  addJob: (job: { title: string; company: string; url: string; location: string; notes: string; status: Status }) =>
    call<Job>('/jobs', json('POST', job)),

  profile: () => call<{ cv: CvSummary | null }>('/profile'),
  uploadCv: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return call<{ cv: CvSummary | null }>('/profile/cv', { method: 'POST', body: form });
  },
  deleteCv: () => call<{ cv: null }>('/profile/cv', { method: 'DELETE' }),

  settings: () => call<Preferences>('/settings'),
  saveSettings: (prefs: Preferences) => call<Preferences>('/settings', json('PUT', prefs)),

  sources: () => call<SourceStatus[]>('/sources'),
  scan: () => call('/scan', { method: 'POST' }),
};
