// src/lib/api.ts

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

/**
 * Reads the admin secret that was stored in sessionStorage at login.
 * Falls back to empty string if not found (will result in a 401 from backend).
 */
function getSecret(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("adminSecret") ?? "";
}

/**
 * Central fetch wrapper for all admin API calls.
 * Automatically attaches the Authorization header and the backend base URL.
 * Throws a descriptive error if the response is not ok.
 */
export async function adminFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${BACKEND_URL}${endpoint}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${getSecret()}`,
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(url, { ...options, headers });

  // If the backend returns 401, the session has expired — redirect to login
  if (response.status === 401) {
    sessionStorage.removeItem("adminSecret");
    // Delete the middleware cookie
    document.cookie = "adminAuth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    
    window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error ?? `Error ${response.status}`);
  }

  return response.json();
}