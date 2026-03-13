/**
 * Authentication API Client
 * Handles all authentication-related API calls
 */

const API_URL = import.meta.env.VITE_API_URL;

class AuthAPI {
  constructor() {
    this.baseURL = `${API_URL}/auth`;
  }

  /**
   * Get stored access token
   */
  getAccessToken() {
    return localStorage.getItem('accessToken');
  }

  /**
   * Store access token
   */
  setAccessToken(token) {
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  /**
   * Get stored refresh token
   */
  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }

  /**
   * Store refresh token
   */
  setRefreshToken(token) {
    if (token) {
      localStorage.setItem('refreshToken', token);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }

  /**
   * Clear all tokens
   */
  clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  /**
   * Store user data
   */
  setUser(user) {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }

  /**
   * Get stored user data
   */
  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  /**
   * Make authenticated request
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAccessToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      credentials: 'include', // Include cookies
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      // Token expired, try to refresh
      if (response.status === 401 && data.code === 'TOKEN_EXPIRED') {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry original request with new token
          return this.request(endpoint, options);
        } else {
          // Refresh failed, clear tokens and throw
          this.clearTokens();
          throw new Error('Session expired. Please login again.');
        }
      }

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register({ email, password, name }) {
    try {
      const data = await this.request('/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      });

      if (data.success) {
        this.setAccessToken(data.data.accessToken);
        this.setUser(data.data.user);
        // Refresh token is set via HTTP-only cookie
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Login user
   */
  async login({ email, password }) {
    try {
      const data = await this.request('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data.success) {
        this.setAccessToken(data.data.accessToken);
        this.setUser(data.data.user);
        // Refresh token is set via HTTP-only cookie
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken() {
    try {
      const data = await this.request('/refresh', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      if (data.success) {
        this.setAccessToken(data.data.accessToken);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      await this.request('/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  /**
   * Get current user profile
   */
  async getProfile() {
    try {
      const data = await this.request('/me', {
        method: 'GET',
      });

      if (data.success) {
        this.setUser(data.data.user);
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Change password
   */
  async changePassword({ currentPassword, newPassword }) {
    try {
      const data = await this.request('/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (data.success) {
        // Clear tokens as user needs to login again
        this.clearTokens();
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.getAccessToken();
  }

  /**
   * Check if user has specific role
   */
  hasRole(role) {
    const user = this.getUser();
    return user && user.role === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles) {
    const user = this.getUser();
    return user && roles.includes(user.role);
  }
}

// Export singleton instance
export const authAPI = new AuthAPI();
