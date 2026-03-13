// @ts-nocheck
// src/api/apiClient.js
const API_BASE_URL = import.meta.env.VITE_API_URL;

class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  getToken() {
    return localStorage.getItem("accessToken");
  }

  setToken(token) {
    if (token) {
      localStorage.setItem("accessToken", token);
    } else {
      localStorage.removeItem("accessToken");
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config = {
      ...options,
      headers: { ...options.headers },
    };

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        this.setToken(null);
        window.location.href = "/login";
        throw new Error("Sesión expirada. Por favor inicia sesión nuevamente.");
      }

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: "Error desconocido" }));
        throw new Error(
          error.error || error.message || `HTTP ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  // ============ AUTHENTICATION ============

  async login(credentials) {
    const response = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    if (response.token) this.setToken(response.token);
    return response;
  }

  async register(userData) {
    const response = await this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
    if (response.token) this.setToken(response.token);
    return response;
  }

  async logout() {
    try {
      await this.request("/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      this.setToken(null);
    }
  }

  async me() {
    return this.request("/auth/me");
  }

  // ============ CARD CONFIGURATION ============

  async getConfig() {
    return this.request("/config");
  }

  async updateConfig(data) {
    return this.request("/config", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // ============ GAS STATIONS ============

  async getStations(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/stations${query ? `?${query}` : ""}`);
  }

  async getStation(id) {
    return this.request(`/stations/${id}`);
  }

  async createStation(data) {
    return this.request("/stations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateStation(id, data) {
    return this.request(`/stations/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteStation(id) {
    return this.request(`/stations/${id}`, { method: "DELETE" });
  }

  // ============ FUEL EXPENSES ============

  async getExpenses(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/expenses${query ? `?${query}` : ""}`);
  }

  async getExpense(id) {
    return this.request(`/expenses/${id}`);
  }

  async createExpense(data) {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined) {
        if (key === "receipt" && data[key] instanceof File) {
          formData.append("receipt", data[key]);
        } else {
          formData.append(key, data[key]);
        }
      }
    });
    return this.request("/expenses", { method: "POST", body: formData });
  }

  async updateExpense(id, data) {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined) {
        if (key === "receipt" && data[key] instanceof File) {
          formData.append("receipt", data[key]);
        } else {
          formData.append(key, data[key]);
        }
      }
    });
    return this.request(`/expenses/${id}`, { method: "PUT", body: formData });
  }

  async deleteExpense(id) {
    return this.request(`/expenses/${id}`, { method: "DELETE" });
  }

  async getExpenseStats(cycleId) {
    return this.request(`/expenses/stats/${cycleId}`);
  }

  // ============ UTILITY FUNCTIONS ============

  getImageUrl(filename) {
    if (!filename) return null;
    return `${this.baseURL.replace("/api", "")}/api/uploads/${filename}`;
  }

  async uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);
    return this.request("/upload", { method: "POST", body: formData });
  }

    // ============ ANALYTICS ============

  async getAnalyticsCycles(months = 6) {
    return this.request(`/analytics/cycles?months=${months}`);
  }

  async getAnalyticsStations(cycleId = null) {
    const query = cycleId ? `?cycleId=${cycleId}` : "";
    return this.request(`/analytics/stations${query}`);
  }

  async getAnalyticsSummary() {
    return this.request("/analytics/summary");
  }
}

export const apiClient = new ApiClient(API_BASE_URL);