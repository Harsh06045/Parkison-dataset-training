/**
 * NeuroFusionAI API Client
 * Configured for backend communication with fallback demo data engine.
 * Allows Python backend models (FastAPI / Flask / PyTorch / PennyLane) to be connected seamlessly.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    try {
      this.token = localStorage.getItem("neurofusion_token");
    } catch {
      this.token = null;
    }
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("neurofusion_token", token);
    } else {
      localStorage.removeItem("neurofusion_token");
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    // If endpoint is relative or full URL
    if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
      return endpoint;
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
    const url = new URL(`${this.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`, origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  public async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers = {}, ...customConfig } = options;

    const authHeaders: Record<string, string> = {};
    if (this.token) {
      authHeaders["Authorization"] = `Bearer ${this.token}`;
    }

    const isFormData = customConfig.body instanceof FormData;
    const reqHeaders: Record<string, string> = {};
    if (!isFormData) {
      reqHeaders["Content-Type"] = "application/json";
    }
    if (this.token) {
      reqHeaders["Authorization"] = `Bearer ${this.token}`;
    }
    if (headers && typeof headers === "object") {
      Object.assign(reqHeaders, headers);
    }

    const config: RequestInit = {
      ...customConfig,
      headers: reqHeaders,
    };

    const url = this.buildUrl(endpoint, params);

    try {
      // #region agent log
      fetch('http://127.0.0.1:7451/ingest/387c6a68-d642-4114-8036-03f042aad885',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0eaf95'},body:JSON.stringify({sessionId:'0eaf95',location:'frontend/src/services/apiClient.ts:request',message:'request_start',data:{url,method:config.method||'GET',endpoint,baseUrl:this.baseUrl,isFormData},timestamp:Date.now(),hypothesisId:'B',runId:'conn-check'})}).catch(()=>{});
      // #endregion
      const response = await fetch(url, config);
      const contentType = response.headers.get("content-type") || "";
      // #region agent log
      fetch('http://127.0.0.1:7451/ingest/387c6a68-d642-4114-8036-03f042aad885',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0eaf95'},body:JSON.stringify({sessionId:'0eaf95',location:'frontend/src/services/apiClient.ts:response',message:'request_response',data:{url,ok:response.ok,status:response.status,contentType},timestamp:Date.now(),hypothesisId:'F',runId:'conn-check'})}).catch(()=>{});
      // #endregion

      if (!response.ok) {
        let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.message || errorData.detail) {
            errorMessage = errorData.message || errorData.detail;
          }
        } catch {
          // Non-JSON response
        }
        throw new Error(errorMessage);
      }

      if (!contentType.includes("application/json")) {
        throw new Error(`Expected JSON from ${url}, got ${contentType || "unknown"} (${response.status})`);
      }

      return (await response.json()) as T;
    } catch (err: any) {
      // #region agent log
      fetch('http://127.0.0.1:7451/ingest/387c6a68-d642-4114-8036-03f042aad885',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0eaf95'},body:JSON.stringify({sessionId:'0eaf95',location:'frontend/src/services/apiClient.ts:catch',message:'request_failed',data:{url,endpoint,error:String(err?.message||err)},timestamp:Date.now(),hypothesisId:'B',runId:'conn-check'})}).catch(()=>{});
      // #endregion
      throw err;
    }
  }

  public get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>(endpoint, { method: "GET", params });
  }

  public post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    const isFormData = data instanceof FormData;
    return this.request<T>(endpoint, {
      method: "POST",
      body: isFormData ? data : JSON.stringify(data),
      ...options,
    });
  }

  public put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  public delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
