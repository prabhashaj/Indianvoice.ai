/**
 * VoxSales AI — API Client
 * Typed fetch wrapper around the FastAPI backend.
 * Base URL read from VITE_API_URL env var (defaults to http://localhost:8000).
 */

const BASE = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:8000";

// ─── Token storage ────────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  return localStorage.getItem("voxsales_access_token");
}
export function getRefreshToken(): string | null {
  return localStorage.getItem("voxsales_refresh_token");
}
export function setTokens(access: string, refresh: string) {
  localStorage.setItem("voxsales_access_token", access);
  localStorage.setItem("voxsales_refresh_token", refresh);
}
export function clearTokens() {
  localStorage.removeItem("voxsales_access_token");
  localStorage.removeItem("voxsales_refresh_token");
}
export function isLoggedIn(): boolean {
  return !!getAccessToken();
}

// ─── Core request ─────────────────────────────────────────────────────────────

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  // Auto-refresh on 401
  if (res.status === 401 && retry) {
    const refreshed = await tryRefresh();
    if (refreshed) return request<T>(path, options, false);
    clearTokens();
    window.location.href = "/login";
    throw new ApiError(401, "Session expired");
  }

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      msg = body.detail ?? msg;
    } catch {}
    throw new ApiError(res.status, msg);
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

async function tryRefresh(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: rt }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

// ─── Shorthand methods ────────────────────────────────────────────────────────

const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (body: { full_name: string; email: string; password: string; workspace_name?: string }) =>
    api.post<{ access_token: string; refresh_token: string }>("/auth/register", body),
  login: (email: string, password: string) =>
    api.post<{ access_token: string; refresh_token: string }>("/auth/login", { email, password }),
  me: () => api.get<{ id: string; email: string; full_name: string; workspace_id: string; role: string }>("/auth/me"),
};

// ─── Agents ───────────────────────────────────────────────────────────────────

export type AgentDTO = {
  id: string; workspace_id: string; name: string; description: string;
  status: "Active" | "Paused" | "Draft"; voice: string; languages: string[];
  industry: string; objective: string; tone: string; opening_script: string;
  qualification_criteria: string; objection_playbook: Record<string, string>;
  business_info: Record<string, string>; total_calls: number; conversion_rate: number;
};

export const agentsApi = {
  list: () => api.get<AgentDTO[]>("/agents"),
  get: (id: string) => api.get<AgentDTO>(`/agents/${id}`),
  create: (body: Partial<AgentDTO>) => api.post<AgentDTO>("/agents", body),
  update: (id: string, body: Partial<AgentDTO>) => api.put<AgentDTO>(`/agents/${id}`, body),
  setStatus: (id: string, status: string) =>
    api.patch<{ id: string; status: string }>(`/agents/${id}/status?status=${status}`, {}),
  delete: (id: string) => api.delete(`/agents/${id}`),
  chat: (id: string, messages: Array<{ role: string; content: string }>) =>
    api.post<{ reply: string; agent_name: string }>(`/agents/${id}/chat`, { messages }),
};

// ─── Campaigns ────────────────────────────────────────────────────────────────

export type CampaignDTO = {
  id: string; workspace_id: string; agent_id: string | null;
  name: string; audience: string; objective: string;
  status: "Draft" | "Scheduled" | "Running" | "Paused" | "Completed" | "Failed";
  schedule: { days: string[]; start: string; end: string; timezone: string };
  total_leads: number; completed: number; connected: number;
  interested: number; qualified: number; meetings: number; total_calls: number;
};

export const campaignsApi = {
  list: () => api.get<CampaignDTO[]>("/campaigns"),
  get: (id: string) => api.get<CampaignDTO>(`/campaigns/${id}`),
  create: (body: Partial<CampaignDTO>) => api.post<CampaignDTO>("/campaigns", body),
  update: (id: string, body: Partial<CampaignDTO>) => api.put<CampaignDTO>(`/campaigns/${id}`, body),
  setStatus: (id: string, status: string) =>
    api.patch(`/campaigns/${id}/status?status=${status}`, {}),
  launch: (id: string) => api.post(`/campaigns/${id}/launch`, {}),
  delete: (id: string) => api.delete(`/campaigns/${id}`),
};

// ─── Leads ────────────────────────────────────────────────────────────────────

export type LeadDTO = {
  id: string; workspace_id: string; campaign_id: string | null; agent_id: string | null;
  name: string; company: string; title: string; phone: string; email: string;
  location: string; industry: string;
  status: "New" | "Contacted" | "Interested" | "Qualified" | "Meeting" | "Not Interested" | "Do Not Contact";
  do_not_contact: boolean; consent_given: boolean;
  intent_score: number; lead_score: number; sentiment: string;
  pain_points: string[]; objections: string[]; summary: string;
  next_action: string; notes: string; owner: string;
};

export const leadsApi = {
  list: (params?: { campaign_id?: string; status?: string; search?: string; skip?: number; limit?: number }) => {
    const q = new URLSearchParams(params as Record<string, string>);
    return api.get<LeadDTO[]>(`/leads?${q}`);
  },
  get: (id: string) => api.get<LeadDTO>(`/leads/${id}`),
  create: (body: Partial<LeadDTO>) => api.post<LeadDTO>("/leads", body),
  update: (id: string, body: Partial<LeadDTO>) => api.patch<LeadDTO>(`/leads/${id}`, body),
  delete: (id: string) => api.delete(`/leads/${id}`),
  importCsv: async (file: File, campaign_id?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    const token = getAccessToken();
    const url = campaign_id ? `${BASE}/leads/import?campaign_id=${campaign_id}` : `${BASE}/leads/import`;
    const res = await fetch(url, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "CSV import failed" }));
      throw new ApiError(res.status, err.detail ?? "CSV import failed");
    }
    return res.json() as Promise<{ imported: number; errors: any[]; campaign_id: string | null }>;
  },
};

// ─── Calls ────────────────────────────────────────────────────────────────────

export type TranscriptLine = {
  id: string; speaker: "AI" | "Customer"; text: string;
  offset_seconds: number; is_highlight: boolean;
};
export type CallDTO = {
  id: string; workspace_id: string; campaign_id: string | null;
  agent_id: string | null; lead_id: string | null; livekit_room_name: string;
  status: string; outcome: string; duration_seconds: number;
  sentiment: string; intent_score: number; lead_score: number;
  summary: string; analysis: string[]; topics: string[];
  objections: string[]; next_action: string; transcript: TranscriptLine[];
};

export const callsApi = {
  list: (params?: { campaign_id?: string; lead_id?: string; status?: string; limit?: number }) => {
    const q = new URLSearchParams(params as Record<string, string>);
    return api.get<CallDTO[]>(`/calls?${q}`);
  },
  get: (id: string) => api.get<CallDTO>(`/calls/${id}`),
};

// ─── Follow-ups ───────────────────────────────────────────────────────────────

export type FollowUpDTO = {
  id: string; workspace_id: string; lead_id: string | null; call_id: string | null;
  reason: string; action: string; priority: "High" | "Medium" | "Low";
  status: "Pending" | "Completed" | "Cancelled";
  due_at: string | null; completed_at: string | null;
};

export const followUpsApi = {
  list: (status?: string) =>
    api.get<FollowUpDTO[]>(`/follow-ups${status ? `?status=${status}` : ""}`),
  create: (body: Partial<FollowUpDTO>) => api.post<FollowUpDTO>("/follow-ups", body),
  complete: (id: string) => api.patch<FollowUpDTO>(`/follow-ups/${id}/complete`, {}),
};

// ─── Analytics ────────────────────────────────────────────────────────────────

export type AnalyticsSummary = {
  total_calls: number; total_connected: number; total_qualified: number;
  total_meetings: number; connect_rate: number; qualify_rate: number;
  conversion_rate: number; active_campaigns: number; total_leads: number;
};
export type TimeSeriesPoint = { label: string; calls: number; connected: number; qualified: number };
export type FunnelStage = { stage: string; value: number };
export type AgentStat = {
  agent_id: string; agent_name: string; calls: number;
  connected: number; qualified: number; meetings: number; conversion: number;
};

export const analyticsApi = {
  summary: () => api.get<AnalyticsSummary>("/analytics/summary"),
  timeseries: (days = 7) => api.get<TimeSeriesPoint[]>(`/analytics/timeseries?days=${days}`),
  funnel: () => api.get<FunnelStage[]>("/analytics/funnel"),
  agents: () => api.get<AgentStat[]>("/analytics/agents"),
};

// ─── LiveKit ──────────────────────────────────────────────────────────────────

export const livekitApi = {
  getToken: (agent_id: string, session_type = "test") =>
    api.post<{ token: string; room_name: string; livekit_url: string; call_id: string }>(
      "/livekit/token",
      { agent_id, session_type },
    ),
};

// ─── Telephony (Twilio & LiveKit SIP) ─────────────────────────────────────────

export interface TelephonyStatus {
  provider: string;
  configured: boolean;
  phone_number: string;
  account_sid: string;
  account_status: string;
  account_friendly_name: string;
}

export const telephonyApi = {
  getStatus: () => api.get<TelephonyStatus>("/telephony/status"),
  outboundCall: (to_phone: string, lead_id?: string, agent_id?: string) =>
    api.post<{ status: string; call_sid: string; to: string; from: string }>(
      "/telephony/outbound-call",
      { to_phone, lead_id, agent_id },
    ),
};

export { ApiError };
export default api;
