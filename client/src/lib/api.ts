// API client for Nestly Estate backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  status?: string;
}

class ApiClient {
  private baseURL: string;
  public token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Get token from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.message || data.error || 'Request failed',
          status: 'error'
        };
      }

      return {
        data: data.data || data,
        message: data.message,
        status: data.status || 'success'
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 'error'
      };
    }
  }

  // Auth endpoints
  async sendOTP(phone: string, role?: string) {
    const body: any = { phone };
    if (role) {
      body.role = role;
    }
    return this.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async verifyOTP(phone: string, otp: string, role?: string) {
    const body: any = { phone, otp };
    if (role) {
      body.role = role;
    }
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async register(phone: string, otp: string, fullName: string, role: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, fullName, role }),
    });
  }

  async login(phone: string, otp: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async refreshToken() {
    return this.request('/auth/refresh', {
      method: 'POST',
    });
  }

  async signUpWithSMSForNewRole(phone: string, fullName: string, role: string) {
    return this.request('/auth/signup-new-role', {
      method: 'POST',
      body: JSON.stringify({ phone, fullName, role }),
    });
  }

  async getProfile() {
    return this.request('/users/profile');
  }

  async updateProfile(updates: any) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Properties endpoints
  async getProperties(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/properties${queryString}`);
  }

  async getProperty(id: string) {
    return this.request(`/properties/${id}`);
  }

  async createProperty(property: any) {
    return this.request('/properties', {
      method: 'POST',
      body: JSON.stringify(property),
    });
  }

  async updateProperty(id: string, updates: any) {
    return this.request(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProperty(id: string) {
    return this.request(`/properties/${id}`, {
      method: 'DELETE',
    });
  }

  // Projects endpoints
  async getProjects(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/projects${queryString}`);
  }

  async getProject(id: string) {
    return this.request(`/projects/${id}`);
  }

  // Societies endpoints
  async getSocieties(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/societies${queryString}`);
  }

  async getSociety(id: string) {
    return this.request(`/societies/${id}`);
  }

  // Brokers endpoints
  async getBrokers(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/brokers${queryString}`);
  }

  async getBroker(id: string) {
    return this.request(`/brokers/${id}`);
  }

  // Developers endpoints
  async getDevelopers(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/developers${queryString}`);
  }

  async getDeveloper(id: string) {
    return this.request(`/developers/${id}`);
  }

  // Inquiries endpoints
  async createInquiry(inquiry: any) {
    return this.request('/inquiries', {
      method: 'POST',
      body: JSON.stringify(inquiry),
    });
  }

  async getInquiries() {
    return this.request('/inquiries');
  }

  // Upload endpoints
  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    // Don't set Content-Type for FormData, let browser set it with boundary

    const url = `${this.baseURL}/upload`;
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.message || data.error || 'Upload failed',
        status: 'error'
      };
    }

    return {
      data: data.data || data,
      message: data.message,
      status: data.status || 'success'
    };
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
