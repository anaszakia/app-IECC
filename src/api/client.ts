import { API_BASE_URL } from '../constants/config';

let currentAuthToken: string | null = null;

export function setApiAuthToken(token: string | null) {
  currentAuthToken = token;
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const isFormData = options.body instanceof FormData;
  
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'X-Client-App': 'IECC-Mobile-App-v1.0',
    ...(currentAuthToken ? { 'Authorization': `Bearer ${currentAuthToken}` } : {}),
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string> || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const text = await response.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text || `HTTP Error ${response.status}` };
    }
    return { ok: response.ok, status: response.status, data };
  } catch (error: any) {
    return { ok: false, status: 500, error: error.message || 'Koneksi ke server gagal', data: { message: error.message } };
  }
}

export const ApiService = {
  // 1. Mobile Login
  login: (email: string, password: string) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // 2. Citizen Report (SOS / Multimedia)
  reportIncident: (formData: any) =>
    apiRequest('/incidents', {
      method: 'POST',
      body: formData instanceof FormData ? formData : JSON.stringify(formData),
    }),

  // 2b. Riwayat & Monitoring Status Laporan Warga
  getMyIncidents: () =>
    apiRequest('/incidents'),

  getIncidentDetail: (ulid: string) =>
    apiRequest(`/incidents/${ulid}`),

  // 3. Field Officer Tasks
  getFieldTasks: (unitParam?: number | string) => {
    if (!unitParam) return apiRequest('/field/tasks');
    const paramKey = typeof unitParam === 'number' || /^\d+$/.test(String(unitParam)) ? 'unit_id' : 'unit_ulid';
    return apiRequest(`/field/tasks?${paramKey}=${unitParam}`);
  },

  // 4. Accept Task
  acceptTask: (assignmentUlid: string) =>
    apiRequest(`/field/assignments/${assignmentUlid}/accept`, {
      method: 'POST',
    }),

  // 5. Reject Task
  rejectTask: (assignmentUlid: string, reason: string) =>
    apiRequest(`/field/assignments/${assignmentUlid}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  // 6. Update Field Status (EN_ROUTE, ARRIVED, HANDLING, RESOLVED)
  updateStatus: (assignmentUlid: string, status: string, lat?: number, lng?: number, note?: string) =>
    apiRequest(`/field/assignments/${assignmentUlid}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, lat, lng, note }),
    }),

  // 7. Send Live GPS Location
  sendLocation: (unitUlid: string, lat: number, lng: number, speed?: number, heading?: number) =>
    apiRequest(`/field/units/${unitUlid}/location`, {
      method: 'POST',
      body: JSON.stringify({ lat, lng, speed_kmh: speed, heading }),
    }),

  // 7b. Get Medical Facilities (Hospitals & Puskesmas)
  getFacilities: () =>
    apiRequest('/field/facilities'),

  // 8. Pre-Arrival Patient Handover (IGD RS)
  submitHandover: (assignmentUlid: string, handoverData: any) =>
    apiRequest(`/field/assignments/${assignmentUlid}/patient-handover`, {
      method: 'POST',
      body: JSON.stringify(handoverData),
    }),

  // 9. Update Unit Operational Status (AVAILABLE, BUSY, OFFLINE, MAINTENANCE)
  updateUnitStatus: (unitUlid: string, status: string, crewReady?: boolean) =>
    apiRequest(`/field/units/${unitUlid}/operational-status`, {
      method: 'POST',
      body: JSON.stringify({ status, crew_ready: crewReady }),
    }),
};
