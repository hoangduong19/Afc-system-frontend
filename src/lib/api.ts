/**
 * Central API utility for FMC Level 5 Frontend.
 * Uses the NEXT_PUBLIC_API_URL configured in the .env file.
 * 
 * Features:
 * - Auto-inject Bearer token from localStorage
 * - Auto-refresh JWT when access token expires (401)
 * - Redirect to login if refresh token also expired
 * - Optional X-API-Key from env
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Keys used in localStorage
const TOKEN_KEY = "fmc_token";
const REFRESH_TOKEN_KEY = "fmc_refresh_token";

export interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
  /** Set to true to skip the auto-refresh logic (used internally for the refresh call itself) */
  _skipRefresh?: boolean;
}

/**
 * Flag to prevent multiple simultaneous refresh requests.
 * If a refresh is already in-flight, other 401'd requests will wait for it.
 */
let refreshPromise: Promise<string | null> | null = null;

/**
 * Attempt to refresh the access token using the stored refresh token.
 * Returns the new access token, or null if refresh failed.
 */
async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      // Refresh token is also expired/invalid
      return null;
    }

    const data = await response.json();
    const newAccessToken = data.accessToken || data.token;
    const newRefreshToken = data.refreshToken;

    if (newAccessToken) {
      localStorage.setItem(TOKEN_KEY, newAccessToken);
    }
    if (newRefreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
    }

    return newAccessToken || null;
  } catch {
    return null;
  }
}

/**
 * Clear all auth tokens and redirect to login page.
 */
function handleAuthFailure(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);

  // Only redirect if not already on the login page
  if (window.location.pathname !== "/") {
    window.location.href = "/";
  }
}

/**
 * Build the headers for a request, including auth headers.
 */
function buildHeaders(customHeaders?: HeadersInit): Record<string, string> {
  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Inject Bearer token from localStorage if available
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && token !== "mock-token-bypass") {
      defaultHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  // Inject X-API-Key from env if configured
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  if (apiKey) {
    defaultHeaders["X-API-Key"] = apiKey;
  }

  return {
    ...defaultHeaders,
    ...(customHeaders as Record<string, string>),
  };
}

/**
 * Build the full URL with query parameters.
 */
function buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
  let url = `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }
  return url;
}

/**
 * A wrapper around the native fetch API that handles:
 * - Prepending the backend base URL
 * - Appending query parameters
 * - Auto-injecting JWT Bearer token
 * - Auto-refreshing expired access tokens
 * - Redirecting to login if refresh fails
 * - Optional X-API-Key header
 */
export async function fetchApi<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, headers, _skipRefresh, ...restOptions } = options;

  const url = buildUrl(endpoint, params);
  const mergedHeaders = buildHeaders(headers);

  // Make the request
  let response = await fetch(url, {
    headers: mergedHeaders,
    ...restOptions,
  });

  // If 401 and we haven't already tried refreshing, attempt token refresh
  if (response.status === 401 && !_skipRefresh && typeof window !== "undefined") {
    const token = localStorage.getItem(TOKEN_KEY);

    // Only attempt refresh if we had a real token (not mock or missing)
    if (token && token !== "mock-token-bypass") {
      // Deduplicate: if a refresh is already in progress, wait for it
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;

      if (newToken) {
        // Retry the original request with the new token
        const retryHeaders = buildHeaders(headers);
        response = await fetch(url, {
          headers: retryHeaders,
          ...restOptions,
        });
      } else {
        // Refresh failed — clear tokens and redirect to login
        handleAuthFailure();
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }
    }
  }

  // Handle HTTP Errors
  if (!response.ok) {
    let errorMessage = `API Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // JSON parsing failed, keep default message
    }
    throw new Error(errorMessage);
  }

  // Return JSON payload (or empty response if status is 204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

/**
 * Helper to store auth tokens after successful login.
 * Call this from the login page after receiving the auth response.
 */
export function storeAuthTokens(accessToken: string, refreshToken?: string): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

/**
 * Helper to clear all auth tokens (for logout).
 */
export function clearAuthTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
