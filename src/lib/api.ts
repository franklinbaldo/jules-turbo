import { z } from "zod";
import { ListActivitiesResponseSchema, ListSessionsResponseSchema, ListSourcesResponseSchema, SessionSchema } from "./schema";

export const JULES_API_BASE = "https://jules.googleapis.com/v1alpha";

export class ApiError extends Error {
  public status: number;
  public code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export async function fetchJson(
  url: string,
  apiKey: string,
  options: RequestInit = {}
) {
  const headers = new Headers(options.headers);
  headers.set("x-goog-api-key", apiKey);
  if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error = data.error || {};
    throw new ApiError(
        response.status, 
        error.status || "UNKNOWN", 
        error.message || response.statusText
    );
  }

  return response.json();
}

// Typed API wrappers
export const api = {
  sources: {
    list: async (apiKey: string, pageSize = 30, pageToken?: string) => {
      const params = new URLSearchParams({ pageSize: pageSize.toString() });
      if (pageToken) params.set("pageToken", pageToken);
      
      const data = await fetchJson(`${JULES_API_BASE}/sources?${params}`, apiKey);
      return ListSourcesResponseSchema.parse(data);
    }
  },
  sessions: {
    list: async (apiKey: string, pageSize = 30, pageToken?: string) => {
      const params = new URLSearchParams({ pageSize: pageSize.toString() });
      if (pageToken) params.set("pageToken", pageToken);
      
      const data = await fetchJson(`${JULES_API_BASE}/sessions?${params}`, apiKey);
      return ListSessionsResponseSchema.parse(data);
    },
    get: async (apiKey: string, name: string) => {
      const data = await fetchJson(`${JULES_API_BASE}/${name}`, apiKey);
      return SessionSchema.parse(data);
    },
    create: async (apiKey: string, payload: unknown) => {
      const data = await fetchJson(`${JULES_API_BASE}/sessions`, apiKey, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return SessionSchema.parse(data);
    },
    sendMessage: async (apiKey: string, name: string, message: string) => {
        const data = await fetchJson(`${JULES_API_BASE}/${name}:sendMessage`, apiKey, {
            method: "POST",
            body: JSON.stringify({ prompt: message }),
        });
        return data;
    },
    approvePlan: async (apiKey: string, name: string) => {
         const data = await fetchJson(`${JULES_API_BASE}/${name}:approvePlan`, apiKey, {
            method: "POST",
            body: JSON.stringify({}),
        });
        return data;
    }
  },
  activities: {
    list: async (apiKey: string, sessionName: string, pageSize = 50, pageToken?: string) => {
      const params = new URLSearchParams({ pageSize: pageSize.toString() });
      if (pageToken) params.set("pageToken", pageToken);
      
      const data = await fetchJson(`${JULES_API_BASE}/${sessionName}/activities?${params}`, apiKey);
      return ListActivitiesResponseSchema.parse(data);
    }
  }
};
