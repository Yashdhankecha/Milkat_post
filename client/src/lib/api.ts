// API client for Nestly Estate backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

console.log('API Base URL configured as:', API_BASE_URL);

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  errors?: any;
  message?: string;
  status?: string;
  httpStatus?: number;
  httpStatusText?: string;
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

  // Check if server is reachable
  async checkServerConnection(): Promise<boolean> {
    try {
      console.log('Checking server connection to:', `${this.baseURL.replace('/api', '')}/health`);
      const response = await fetch(`${this.baseURL.replace('/api', '')}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout for health check
      });
      const isOk = response.ok;
      console.log('Server connection check result:', isOk ? 'SUCCESS' : 'FAILED');
      return isOk;
    } catch (error) {
      console.error('Server connection check failed:', error);
      return false;
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
      
      console.log('API Request:', {
        url,
        method: options.method || 'GET',
        hasToken: !!this.token,
        bodyType: options.body ? (options.body instanceof FormData ? 'FormData' : 'JSON') : 'none'
      });
      
      const headers: Record<string, string> = {};
    
    // Copy existing headers if they exist
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else {
        Object.assign(headers, options.headers);
      }
    }

    // Only set Content-Type for JSON requests (not for FormData)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
        // Add 30 second timeout for all requests (increased for file uploads)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
      
        clearTimeout(timeoutId);

        console.log('API Response:', {
          url,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });

        const data = await response.json();

      if (!response.ok) {
        console.log('[API] Error response data:', data);
        return {
          error: data.message || data.error || 'Request failed',
          errors: data.errors || null,
          status: 'error',
          httpStatus: response.status,
          httpStatusText: response.statusText
        };
      }

      return {
        data: data.data || data,
        message: data.message,
        status: data.status || 'success'
      };
      } catch (error) {
        console.error('API Request Error:', {
          url,
          error: error instanceof Error ? error.message : 'Unknown error',
          type: error instanceof Error ? error.constructor.name : 'Unknown'
        });
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
    console.log('API Client: Verifying OTP for phone:', phone, 'with OTP:', otp, 'and role:', role);
    const requestData = { phone, otp, role };
    console.log('API Client: Request data:', requestData);
    
    const result = await this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
    
    console.log('API Client: OTP verification result:', result);
    return result;
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
    const payload = { phone, fullName, role };
    console.log('[API] signUpWithSMSForNewRole payload:', payload);
    return this.request('/auth/signup-new-role', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async debugSignup(phone: string, fullName: string, role: string) {
    const payload = { phone, fullName, role };
    console.log('[API] debugSignup payload:', payload);
    return this.request('/auth/debug-signup', {
      method: 'POST',
      body: JSON.stringify(payload),
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

  async submitContactForm(formData: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  }) {
    return this.request('/inquiries/contact', {
      method: 'POST',
      body: JSON.stringify(formData),
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

  async getMyProjects() {
    return this.request('/projects/my/projects', {
      headers: {
        'X-Requested-Role': 'developer'
      }
    });
  }

  async createProject(projectData: any) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
      headers: {
        'X-Requested-Role': 'developer'
      }
    });
  }

  async updateProject(projectId: string, projectData: any) {
    return this.request(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
      headers: {
        'X-Requested-Role': 'developer'
      }
    });
  }

  async deleteProject(projectId: string) {
    return this.request(`/projects/${projectId}`, {
      method: 'DELETE',
    });
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

  // Likes endpoints
  async getLikes(params?: any) {
    // Use the my-likes endpoint for getting user's likes (backend gets user from token)
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/likes/my-likes${queryString}`);
  }

  async likeProperty(propertyId: string) {
    return this.request('/likes', {
      method: 'POST',
      body: JSON.stringify({ propertyId }),
    });
  }

  async unlikeProperty(propertyId: string) {
    return this.request(`/likes/${propertyId}`, {
      method: 'DELETE',
    });
  }

  async checkIfLiked(propertyId: string) {
    return this.request(`/likes/check/${propertyId}`);
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

  // User management methods
  async getUsers(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/users${queryString}`);
  }

  async updateUser(id: string, updates: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Project management methods
  async updateProject(id: string, updates: any) {
    return this.request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Developer management methods
  async updateDeveloper(id: string, updates: any) {
    return this.request(`/developers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Support ticket methods
  async getSupportTickets(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/support/tickets${queryString}`);
  }

  async updateSupportTicket(id: string, updates: any) {
    return this.request(`/support/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Cloudinary upload methods
  async uploadSingleFile(file: File, documentType?: string) {
    // First check if server is reachable
    const isServerReachable = await this.checkServerConnection();
    if (!isServerReachable) {
      return {
        error: 'Cannot connect to server. Please ensure the backend server is running on http://localhost:5000',
        status: 'error'
      };
    }

    const formData = new FormData();
    formData.append('file', file);
    if (documentType) {
      formData.append('documentType', documentType);
    }

    const headers: HeadersInit = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    if (documentType) {
      headers['X-Upload-Type'] = 'society-document';
    }

    // Don't set Content-Type header - let browser set it for FormData
    const url = `${this.baseURL}/upload/single`;
    
    console.log('Upload request details:', {
      url,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      documentType,
      hasToken: !!this.token
    });
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      console.log('Upload response status:', response.status, response.statusText);
      
      let data;
      try {
        data = await response.json();
        console.log('Upload response data:', data);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        return {
          error: 'Invalid response from server',
          status: 'error'
        };
      }

      if (!response.ok) {
        console.error('Upload failed:', {
          status: response.status,
          statusText: response.statusText,
          data
        });
        return {
          error: data.message || data.error || `Upload failed with status ${response.status}`,
          status: 'error'
        };
      }

      // For upload responses, we need to handle the nested structure
      if (data.success && data.data) {
        return {
          data: data.data, // This gives us { media: { url: ... } }
          message: data.message,
          status: data.status || 'success'
        };
      }
      
      return {
        data: data.data || data,
        message: data.message,
        status: data.status || 'success'
      };
    } catch (error) {
      console.error('Upload network error:', error);
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 'error'
      };
    }
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

  async uploadSocietyDocuments(files: File[], documentType: string = 'general') {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('documents', file);
    });
    formData.append('type', documentType);

    return this.request('/upload/society-documents', {
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

  async getMySocieties(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/societies/my/societies${queryString}`);
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

  async getMyDeveloperProfile() {
    return this.request('/developers/my/profile');
  }

  async createDeveloper(developer: any) {
    return this.request('/developers', {
      method: 'POST',
      body: JSON.stringify(developer),
    });
  }

  // Inquiries endpoints
  // Upload endpoints
  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return this.request('/upload/single', {
      method: 'POST',
      body: formData,
    });
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

  // Convenience methods for HTTP verbs
  async get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Society management methods
  async createSociety(societyData: any) {
    console.log('Creating society - API URL:', `${this.baseURL}/societies`);
    
    // FIX: Remove any _id or id fields to prevent ObjectId casting errors
    const sanitizedData = { ...societyData };
    delete sanitizedData._id;
    delete sanitizedData.id;
    
    console.log('Society data being sent (sanitized):', sanitizedData);
    
    return this.request('/societies', {
      method: 'POST',
      body: JSON.stringify(sanitizedData),
    });
  }

  async updateSociety(id: string, updates: any) {
    // FIX: Remove any _id or id fields to prevent ObjectId casting errors
    const sanitizedUpdates = { ...updates };
    delete sanitizedUpdates._id;
    delete sanitizedUpdates.id;
    
    return this.request(`/societies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sanitizedUpdates),
    });
  }

  async deleteSociety(id: string) {
    return this.request(`/societies/${id}`, {
      method: 'DELETE',
    });
  }

  async getSocietyMembers(societyId: string) {
    return this.request(`/societies/${societyId}/members?_t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
  }

  // Invitation methods
  async sendInvitation(data: {
    society_id: string;
    invitedPhone: string;
    invitedName?: string;
    invitedEmail?: string;
    invitationType: 'society_member' | 'broker' | 'developer';
    message?: string;
  }) {
    console.log('Sending invitation with data:', data);
    
    try {
      const response = await this.request('/invitations/send', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      console.log('Invitation response:', response);
      return response;
    } catch (error) {
      console.error('Invitation request failed:', error);
      throw error;
    }
  }

  async getSentInvitations(params?: string) {
    console.log('Getting sent invitations with params:', params);
    return this.request(`/invitations/sent${params || ''}`, {
      method: 'GET',
    });
  }

  async getReceivedInvitations(params?: string) {
    return this.request(`/invitations/received${params || ''}`, {
      method: 'GET',
    });
  }

  async getMyInvitations(status?: string) {
    const queryParam = status ? `?status=${status}` : '';
    return this.request(`/invitations/my${queryParam}`, {
      method: 'GET',
    });
  }

  async respondToInvitation(invitationId: string, response: 'accept' | 'reject') {
    console.log(`Responding to invitation ${invitationId} with ${response}`);
    return this.request('/invitations/respond', {
      method: 'POST',
      body: JSON.stringify({ invitationId, response }),
    });
  }

  async acceptInvitation(invitationId: string, responseMessage?: string) {
    return this.request(`/invitations/${invitationId}/accept`, {
      method: 'POST',
      body: JSON.stringify({ responseMessage }),
    });
  }

  async declineInvitation(invitationId: string, responseMessage?: string) {
    return this.request(`/invitations/${invitationId}/decline`, {
      method: 'POST',
      body: JSON.stringify({ responseMessage }),
    });
  }

  async cancelInvitation(invitationId: string) {
    return this.request(`/invitations/${invitationId}/cancel`, {
      method: 'POST',
    });
  }


  async markNotificationAsRead(notificationId: string) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/mark-all-read', {
      method: 'PUT',
    });
  }

  async deleteNotification(notificationId: string) {
    return this.request(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  // Redevelopment project methods
  async getRedevelopmentProjects(queryParams?: string) {
    const endpoint = queryParams ? `/redevelopment-projects${queryParams}` : '/redevelopment-projects';
    return this.request(endpoint);
  }

  async getRedevelopmentProject(id: string) {
    return this.request(`/global-redevelopment/projects/${id}`);
  }

  async createRedevelopmentProject(projectData: any) {
    return this.request('/redevelopment-projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async updateRedevelopmentProject(id: string, updates: any) {
    return this.request(`/redevelopment-projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async updateRedevelopmentProjectStatus(id: string, status: string) {
    return this.request(`/redevelopment-projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async deleteRedevelopmentProject(id: string) {
    return this.request(`/redevelopment-projects/${id}`, {
      method: 'DELETE',
    });
  }

  async addProjectUpdate(id: string, updateData: any) {
    return this.request(`/redevelopment-projects/${id}/updates`, {
      method: 'POST',
      body: JSON.stringify(updateData),
    });
  }

  async addProjectQuery(id: string, queryData: any) {
    return this.request(`/redevelopment-projects/${id}/queries`, {
      method: 'POST',
      body: JSON.stringify(queryData),
    });
  }

  async submitVote(id: string, voteData: any) {
    return this.request(`/redevelopment-projects/${id}/vote`, {
      method: 'POST',
      body: JSON.stringify(voteData),
    });
  }

  async getVotingResults(id: string, session?: string) {
    const queryParams = session ? `?session=${session}` : '';
    return this.request(`/redevelopment-projects/${id}/voting-results${queryParams}`);
  }

  // Developer proposal methods
  async getDeveloperProposals(queryParams?: string) {
    const endpoint = queryParams ? `/developer-proposals${queryParams}` : '/developer-proposals';
    return this.request(endpoint);
  }

  async getDeveloperProposal(id: string) {
    return this.request(`/developer-proposals/${id}`);
  }

  async createDeveloperProposal(proposalData: any) {
    return this.request('/developer-proposals', {
      method: 'POST',
      body: JSON.stringify(proposalData),
    });
  }

  async updateDeveloperProposal(id: string, updates: any) {
    return this.request(`/developer-proposals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteDeveloperProposal(id: string) {
    return this.request(`/developer-proposals/${id}`, {
      method: 'DELETE',
    });
  }

  async evaluateProposal(id: string, evaluationData: any) {
    return this.request(`/developer-proposals/${id}/evaluate`, {
      method: 'POST',
      body: JSON.stringify(evaluationData),
    });
  }

  async selectProposal(id: string) {
    return this.request(`/developer-proposals/${id}/select`, {
      method: 'POST',
    });
  }


  async approveProposal(id: string, comments?: string) {
    return this.request(`/developer-proposals/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comments }),
    });
  }

  async rejectProposal(id: string, reason: string) {
    return this.request(`/developer-proposals/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getProposalComparison(projectId: string) {
    return this.request(`/developer-proposals/project/${projectId}/comparison`);
  }

  // Member Voting methods
  async submitMemberVote(voteData: any) {
    return this.request('/member-votes', {
      method: 'POST',
      body: JSON.stringify(voteData),
    });
  }

  async submitMemberVotesBatch(votesData: any[]) {
    return this.request('/member-votes/batch', {
      method: 'POST',
      body: JSON.stringify({ votes: votesData }),
    });
  }

  async getProjectVotes(projectId: string, session?: string, includeDetails?: boolean) {
    const params = new URLSearchParams();
    if (session) params.append('session', session);
    if (includeDetails) params.append('includeDetails', 'true');
    const queryParams = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/member-votes/project/${projectId}${queryParams}`);
  }

  async getMyVote(projectId: string, session: string) {
    return this.request(`/member-votes/my-vote/${projectId}/${session}`);
  }

  async getMyVotingHistory(projectId?: string) {
    const queryParams = projectId ? `?projectId=${projectId}` : '';
    return this.request(`/member-votes/my-votes${queryParams}`);
  }

  async getVotingStatistics(projectId: string, session?: string) {
    const queryParams = session ? `?session=${session}` : '';
    return this.request(`/member-votes/stats/${projectId}${queryParams}`);
  }

  async verifyVote(voteId: string) {
    return this.request(`/member-votes/${voteId}/verify`, {
      method: 'POST',
    });
  }

  // Member Queries methods
  async submitQuery(queryData: {
    societyId: string;
    queryText: string;
    category?: string;
    priority?: string;
  }) {
    return this.request('/queries', {
      method: 'POST',
      body: JSON.stringify(queryData),
    });
  }

  async getMyQueries(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/queries/my${queryString}`);
  }

  async getSocietyQueries(societyId: string, params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/queries/society/${societyId}${queryString}`);
  }

  async getSocietyDocuments(societyId: string, timestamp?: number) {
    const queryString = timestamp ? `?_t=${timestamp}` : '';
    return this.request(`/societies/${societyId}/documents${queryString}`);
  }

  // Redevelopment project document methods
  async addProjectDocument(projectId: string, documentData: any) {
    return this.request(`/redevelopment-projects/${projectId}/documents`, {
      method: 'POST',
      body: JSON.stringify(documentData),
    });
  }

  async deleteProjectDocument(projectId: string, documentId: string) {
    return this.request(`/redevelopment-projects/${projectId}/documents/${documentId}`, {
      method: 'DELETE',
    });
  }

  async respondToQuery(queryId: string, responseText: string) {
    return this.request(`/queries/${queryId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ responseText }),
    });
  }

  async updateQueryStatus(queryId: string, status: string) {
    return this.request(`/queries/${queryId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getQueryStatistics(societyId: string) {
    return this.request(`/queries/society/${societyId}/statistics`);
  }

  async upvoteQuery(queryId: string) {
    return this.request(`/queries/${queryId}/upvote`, {
      method: 'POST',
    });
  }

  async removeUpvote(queryId: string) {
    return this.request(`/queries/${queryId}/upvote`, {
      method: 'DELETE',
    });
  }

  // Inquiry endpoints
  async createInquiry(inquiryData: any) {
    return this.request('/inquiries', {
      method: 'POST',
      body: JSON.stringify(inquiryData),
    });
  }

  async getMyInquiries(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/inquiries/my${queryString}`);
  }

  async getMyPropertyInquiries(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/inquiries/my-properties${queryString}`);
  }

  async getMyProjectInquiries(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/inquiries/my-projects${queryString}`);
  }

  async getPropertyInquiries(propertyId: string, params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/inquiries/property/${propertyId}${queryString}`);
  }

  async respondToInquiry(inquiryId: string, response: string) {
    return this.request(`/inquiries/${inquiryId}/respond`, {
      method: 'PUT',
      body: JSON.stringify({ response }),
    });
  }

  async updateInquiryStatus(inquiryId: string, status: string) {
    return this.request(`/inquiries/${inquiryId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async getInquiry(inquiryId: string) {
    return this.request(`/inquiries/${inquiryId}`);
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
