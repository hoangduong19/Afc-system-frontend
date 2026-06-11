/**
 * Central API utility for FMC Level 5 Frontend.
 * Uses the NEXT_PUBLIC_API_URL configured in the .env file.
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

/**
 * A wrapper around the native fetch API that handles:
 * - Prepending the backend base URL
 * - Appending query parameters
 * - Default headers (JSON content type, API Keys if needed)
 * - Basic error handling
 */
export async function fetchApi<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, headers, ...restOptions } = options;

  // 1. Build URL with query parameters if present
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

  // 2. Set default headers
  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...headers,
  };

  // 3. Make fetch request
  const response = await fetch(url, {
    headers: defaultHeaders,
    ...restOptions,
  });

  // 4. Handle HTTP Errors
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

  // 5. Return JSON payload (or empty response if status is 204 No Content)
  if (response.status === 204) {
    return {} as T;
  }
  
  return response.json() as Promise<T>;
}
