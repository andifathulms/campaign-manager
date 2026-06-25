import axios from 'axios';

// Token is set by AuthSync component from NextAuth session — NOT localStorage.
// NextAuth stores the JWT in a server-side cookie; the access token is
// extracted into the session object and synced here via setAuthToken().
let _authToken: string | null = null;

export function setAuthToken(token: string | null) {
  _authToken = token;
}

// Active tenant for consultants (the candidate switcher). Sent as X-Tenant-ID;
// the backend validates it against the user's agency. Also mirrored onto the
// global axios defaults so raw-axios hooks (e.g. useCandidate) pick it up too.
let _activeTenantId: string | null = null;

export function setActiveTenant(id: string | null) {
  _activeTenantId = id;
  if (id) {
    axios.defaults.headers.common['X-Tenant-ID'] = id;
  } else {
    delete axios.defaults.headers.common['X-Tenant-ID'];
  }
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (_authToken) {
    config.headers.Authorization = `Bearer ${_authToken}`;
  }
  if (_activeTenantId) {
    config.headers['X-Tenant-ID'] = _activeTenantId;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api;
