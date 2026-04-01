import axios from 'axios';

// Token is set by AuthSync component from NextAuth session — NOT localStorage.
// NextAuth stores the JWT in a server-side cookie; the access token is
// extracted into the session object and synced here via setAuthToken().
let _authToken: string | null = null;

export function setAuthToken(token: string | null) {
  _authToken = token;
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
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api;
