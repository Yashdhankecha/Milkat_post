// API configuration and utilities
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// API client class
class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  // Get authentication headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Upload file
  async uploadFile(endpoint, file, fieldName = 'file') {
    const formData = new FormData();
    formData.append(fieldName, file);

    const headers = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  // Upload multiple files
  async uploadFiles(endpoint, files, fieldName = 'files') {
    const formData = new FormData();
    files.forEach(file => {
      formData.append(fieldName, file);
    });

    const headers = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  }
}

// Create API client instance
export const apiClient = new ApiClient();

// Auth API
export const authAPI = {
  // Send OTP
  sendOTP: (phone, role) => apiClient.post('/auth/send-otp', { phone, role }),

  // Verify OTP
  verifyOTP: (phone, otp, role) => apiClient.post('/auth/verify-otp', { phone, otp, role }),

  // Register new user
  register: (phone, fullName, role, email) => 
    apiClient.post('/auth/register', { phone, fullName, role, email }),

  // Refresh token
  refreshToken: (refreshToken) => 
    apiClient.post('/auth/refresh-token', { refreshToken }),

  // Logout
  logout: (refreshToken) => 
    apiClient.post('/auth/logout', { refreshToken }),

  // Get current user
  getCurrentUser: () => apiClient.get('/auth/me'),

  // Change password
  changePassword: (currentPassword, newPassword) => 
    apiClient.post('/auth/change-password', { currentPassword, newPassword }),
};

// User API
export const userAPI = {
  // Get user profile
  getProfile: () => apiClient.get('/users/profile'),

  // Update user profile
  updateProfile: (data) => apiClient.put('/users/profile', data),

  // Get all user profiles
  getProfiles: () => apiClient.get('/users/profiles'),

  // Switch role
  switchRole: (role) => apiClient.post('/users/switch-role', { role }),

  // Add verification document
  addVerificationDocument: (type, url) => 
    apiClient.post('/users/verification-documents', { type, url }),

  // Update notification preferences
  updateNotificationPreferences: (preferences) => 
    apiClient.put('/users/preferences/notifications', preferences),

  // Update privacy preferences
  updatePrivacyPreferences: (preferences) => 
    apiClient.put('/users/preferences/privacy', preferences),

  // Deactivate account
  deactivateAccount: () => apiClient.post('/users/deactivate'),
};

// Property API
export const propertyAPI = {
  // Get all properties
  getProperties: (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params.append(key, filters[key]);
      }
    });
    return apiClient.get(`/properties?${params.toString()}`);
  },

  // Get property by ID
  getProperty: (id) => apiClient.get(`/properties/${id}`),

  // Create property
  createProperty: (data) => apiClient.post('/properties', data),

  // Update property
  updateProperty: (id, data) => apiClient.put(`/properties/${id}`, data),

  // Delete property
  deleteProperty: (id) => apiClient.delete(`/properties/${id}`),

  // Get user's properties
  getMyProperties: (page = 1, limit = 10) => 
    apiClient.get(`/properties/my/properties?page=${page}&limit=${limit}`),

  // Add image to property
  addPropertyImage: (id, url, caption, isPrimary) => 
    apiClient.post(`/properties/${id}/images`, { url, caption, isPrimary }),

  // Set primary image
  setPrimaryImage: (id, imageId) => 
    apiClient.put(`/properties/${id}/images/${imageId}/primary`),

  // Remove image
  removeImage: (id, imageId) => 
    apiClient.delete(`/properties/${id}/images/${imageId}`),
};

// Project API
export const projectAPI = {
  // Get all projects
  getProjects: (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params.append(key, filters[key]);
      }
    });
    return apiClient.get(`/projects?${params.toString()}`);
  },

  // Get project by ID
  getProject: (id) => apiClient.get(`/projects/${id}`),

  // Create project
  createProject: (data) => apiClient.post('/projects', data),

  // Update project
  updateProject: (id, data) => apiClient.put(`/projects/${id}`, data),

  // Delete project
  deleteProject: (id) => apiClient.delete(`/projects/${id}`),

  // Get developer's projects
  getMyProjects: (page = 1, limit = 10) => 
    apiClient.get(`/projects/my/projects?page=${page}&limit=${limit}`),

  // Add floor plan
  addFloorPlan: (id, data) => 
    apiClient.post(`/projects/${id}/floor-plans`, data),
};

// Society API
export const societyAPI = {
  // Get all societies
  getSocieties: (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params.append(key, filters[key]);
      }
    });
    return apiClient.get(`/societies?${params.toString()}`);
  },

  // Get society by ID
  getSociety: (id) => apiClient.get(`/societies/${id}`),

  // Create society
  createSociety: (data) => apiClient.post('/societies', data),

  // Update society
  updateSociety: (id, data) => apiClient.put(`/societies/${id}`, data),

  // Delete society
  deleteSociety: (id) => apiClient.delete(`/societies/${id}`),

  // Get user's societies
  getMySocieties: (page = 1, limit = 10) => 
    apiClient.get(`/societies/my/societies?page=${page}&limit=${limit}`),
};

// Broker API
export const brokerAPI = {
  // Get all brokers
  getBrokers: (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params.append(key, filters[key]);
      }
    });
    return apiClient.get(`/brokers?${params.toString()}`);
  },

  // Get broker by ID
  getBroker: (id) => apiClient.get(`/brokers/${id}`),

  // Create broker profile
  createBrokerProfile: (data) => apiClient.post('/brokers', data),

  // Update broker profile
  updateBrokerProfile: (id, data) => apiClient.put(`/brokers/${id}`, data),

  // Get my broker profile
  getMyBrokerProfile: () => apiClient.get('/brokers/my/profile'),
};

// Developer API
export const developerAPI = {
  // Get all developers
  getDevelopers: (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params.append(key, filters[key]);
      }
    });
    return apiClient.get(`/developers?${params.toString()}`);
  },

  // Get developer by ID
  getDeveloper: (id) => apiClient.get(`/developers/${id}`),

  // Create developer profile
  createDeveloperProfile: (data) => apiClient.post('/developers', data),

  // Update developer profile
  updateDeveloperProfile: (id, data) => apiClient.put(`/developers/${id}`, data),

  // Get my developer profile
  getMyDeveloperProfile: () => apiClient.get('/developers/my/profile'),
};

// Upload API
export const uploadAPI = {
  // Upload single image
  uploadImage: (file) => apiClient.uploadFile('/upload/image', file, 'image'),

  // Upload multiple images
  uploadImages: (files) => apiClient.uploadFiles('/upload/images', files, 'images'),

  // Upload document
  uploadDocument: (file) => apiClient.uploadFile('/upload/document', file, 'document'),

  // Upload profile picture
  uploadProfilePicture: (file) => apiClient.uploadFile('/upload/profile-picture', file, 'profilePicture'),

  // Upload property images
  uploadPropertyImages: (files) => apiClient.uploadFiles('/upload/property-images', files, 'images'),

  // Upload project images
  uploadProjectImages: (files) => apiClient.uploadFiles('/upload/project-images', files, 'images'),

  // Upload verification documents
  uploadVerificationDocuments: (files) => apiClient.uploadFiles('/upload/verification-documents', files, 'documents'),

  // Upload society images
  uploadSocietyImages: (files) => apiClient.uploadFiles('/upload/society-images', files, 'images'),

  // Upload floor plans
  uploadFloorPlans: (files) => apiClient.uploadFiles('/upload/floor-plans', files, 'floorPlans'),
};

// Inquiry API
export const inquiryAPI = {
  // Create inquiry
  createInquiry: (data) => apiClient.post('/inquiries', data),

  // Get my inquiries
  getMyInquiries: () => apiClient.get('/inquiries/my'),
};

// Support API
export const supportAPI = {
  // Create support ticket
  createTicket: (data) => apiClient.post('/support/tickets', data),

  // Get my support tickets
  getMyTickets: () => apiClient.get('/support/tickets'),
};

export default apiClient;
