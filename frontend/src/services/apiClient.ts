const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('sop_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errJson = await response.json();
      errorMsg = errJson.error || errorMsg;
    } catch {
      // Non-json error
    }

    // If the token is expired/invalid, clear stored auth so the user is
    // redirected to the login page instead of silently seeing empty data.
    if (response.status === 401) {
      localStorage.removeItem('sop_token');
      localStorage.removeItem('sop_user');
      localStorage.removeItem('sop_layout');
      // Force a page reload so the RoleGuard redirects to /login
      window.location.href = '/login';
    }

    throw new ApiError(errorMsg, response.status);
  }

  return response.json() as Promise<T>;
}

