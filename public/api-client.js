"use strict";
(() => {
  // public/api-client.ts
  var ApiError = class extends Error {
    constructor(code, message, status) {
      super(message);
      this.code = code;
      this.status = status;
    }
  };
  var Client = class {
    csrf = "";
    user = null;
    async fetchApi(route, init = {}) {
      let response;
      try {
        response = await fetch("/api" + route, { ...init, credentials: "same-origin", signal: AbortSignal.timeout(3e4) });
      } catch (error) {
        const message = error instanceof Error && error.name === "TimeoutError" ? "GRAM-PULSE services timed out. Retry in a moment." : "Unable to reach the GRAM-PULSE API. Check the deployment and retry.";
        throw new ApiError(error instanceof Error && error.name === "TimeoutError" ? "TIMEOUT" : "OFFLINE", message, 0);
      }
      let result;
      try {
        result = await response.json();
      } catch {
        throw new ApiError("INVALID_RESPONSE", `The API returned an unreadable response (HTTP ${response.status}). Check the Vercel Function logs.`, response.status);
      }
      if (!response.ok || !result.success) {
        const failure = result.success ? void 0 : result.error;
        throw new ApiError(failure?.code || "HTTP_ERROR", failure?.message || `GRAM-PULSE API request failed (HTTP ${response.status}).`, response.status);
      }
      return { response, result };
    }
    async request(route, method = "GET", body) {
      const headers = {};
      if (this.csrf) headers["X-CSRF-Token"] = this.csrf;
      if (body !== void 0) headers["Content-Type"] = "application/json";
      const { result } = await this.fetchApi(route, { method, headers, body: body === void 0 ? void 0 : JSON.stringify(body) });
      return result.data;
    }
    async page(route) {
      const { result } = await this.fetchApi(route);
      if (!result.pagination) throw new ApiError("INVALID_RESPONSE", "The API response is missing pagination details.", 502);
      return { data: result.data, pagination: result.pagination };
    }
    async authenticate() {
      const s = await this.request("/auth/me");
      this.user = s.user;
      this.csrf = s.csrf;
      return s.user;
    }
    async login(email, password) {
      const s = await this.request("/auth/login", "POST", { email, password });
      this.user = s.user;
      this.csrf = s.csrf;
      return s.user;
    }
    async logout() {
      await this.request("/auth/logout", "POST");
      this.user = null;
      this.csrf = "";
    }
    state() {
      return this.request("/state");
    }
    async upload(file) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) throw new ApiError("INVALID_IMAGE", "Choose JPEG, PNG or WebP up to 8 MB.", 400);
      const headers = { "Content-Type": file.type };
      if (this.csrf) headers["X-CSRF-Token"] = this.csrf;
      const { result } = await this.fetchApi("/uploads", { method: "POST", headers, body: file });
      return result.data;
    }
  };
  window.api = new Client();
})();
