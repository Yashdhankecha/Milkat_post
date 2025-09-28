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

  setRefreshToken(refreshToken: string | null) {
    if (refreshToken) {
      localStorage.setItem('auth_refresh_token', refreshToken);
    } else {
      localStorage.removeItem('auth_refresh_token');
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
          errors: data.errors || null,
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
    return this.request('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: localStorage.getItem('auth_refresh_token') }),
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

  // Requirements endpoints
  async getRequirements(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/requirements${queryString}`);
  }

  async getRequirement(id: string) {
    return this.request(`/requirements/${id}`);
  }

  async createRequirement(requirement: any) {
    return this.request('/requirements', {
      method: 'POST',
      body: JSON.stringify(requirement),
    });
  }

  async updateRequirement(id: string, updates: any) {
    return this.request(`/requirements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteRequirement(id: string) {
    return this.request(`/requirements/${id}`, {
      method: 'DELETE',
    });
  }

  async getMyRequirements(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/requirements/my/requirements${queryString}`);
  }

  // Inquiries endpoints
  async createInquiry(inquiry: any) {
    return this.request('/inquiries', {
      method: 'POST',
      body: JSON.stringify(inquiry),
    });
  }

  async getInquiries(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/inquiries${queryString}`);
  }


  // Shares endpoints
  async shareProperty(propertyId: string, shareMethod: string, sharedWith?: string) {
    return this.request('/shares', {
      method: 'POST',
      body: JSON.stringify({ propertyId, shareMethod, sharedWith }),
    });
  }

  async getShareCount(propertyId: string) {
    return this.request(`/shares/count/${propertyId}`);
  }

  async getShareCountByMethod(propertyId: string) {
    return this.request(`/shares/count-by-method/${propertyId}`);
  }

  async getMyShares(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/shares/my-shares${queryString}`);
  }

  // Notifications endpoints
  async getNotifications(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/notifications${queryString}`);
  }

  async markNotificationsAsRead(notificationIds?: string[]) {
    return this.request('/notifications/mark-read', {
      method: 'PATCH',
      body: JSON.stringify({ notificationIds }),
    });
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  }

  async getUnreadCount() {
    return this.request('/notifications/unread-count');
  }

  async deleteNotification(notificationId: string) {
    return this.request(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  async clearAllNotifications() {
    return this.request('/notifications', {
      method: 'DELETE',
    });
  }

  // User Roles endpoints
  async getMyRoles() {
    return this.request('/user-roles/my-roles');
  }

  async getAvailableRoles(phone: string) {
    return this.request('/user-roles/available-roles', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async switchRole(role: string) {
    return this.request('/user-roles/switch-role', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
  }

  async createRole(roleData: {
    role: string;
    fullName?: string;
    companyName?: string;
    businessType?: string;
    bio?: string;
    website?: string;
  }) {
    return this.request('/user-roles/create-role', {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
  }

  async getRoleStatistics() {
    return this.request('/user-roles/statistics');
  }

  // Cloudinary upload methods
  async uploadSingleFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return this.request('/upload/single', {
      method: 'POST',
      body: formData,
    });
  }

  async uploadMultipleFiles(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    return this.request('/upload/multiple', {
      method: 'POST',
      body: formData,
    });
  }

  async uploadProfilePicture(file: File) {
    const formData = new FormData();
    formData.append('profilePicture', file);

    return this.request('/upload/profile-picture', {
      method: 'POST',
      body: formData,
    });
  }

  async deleteMedia(mediaId: string) {
    return this.request(`/upload/${mediaId}`, {
      method: 'DELETE',
    });
  }

  async getMyMedia() {
    return this.request('/upload/my-media');
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

  // Upload multiple property images
  async uploadPropertyImages(files: File[]) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    const headers: HeadersInit = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const url = `${this.baseURL}/upload/property-images`;
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

  // Upload multiple images (general)
  async uploadImages(files: File[]) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    const headers: HeadersInit = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const url = `${this.baseURL}/upload/images`;
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
