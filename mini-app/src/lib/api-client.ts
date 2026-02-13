import axios, { AxiosInstance } from 'axios';
import { TelegramAuth } from './telegram-auth';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_BACKEND_URL + '/api',
    });

    this.client.interceptors.request.use((config) => {
      const token = TelegramAuth.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          TelegramAuth.clearToken();
          window.location.href = '/';
        }
        return Promise.reject(error);
      },
    );
  }

  // Projects
  async getProjects() {
    const { data } = await this.client.get('/projects');
    return data.projects;
  }

  async createProject(params: { name: string; description?: string }) {
    const { data } = await this.client.post('/projects', params);
    return data;
  }

  async getProject(id: string) {
    const { data } = await this.client.get(`/projects/${id}`);
    return data;
  }

  // Knowledge
  async uploadDocument(params: {
    projectId: string;
    filename: string;
    contentType: string;
  }) {
    const { data } = await this.client.post('/knowledge/upload', params);
    return data;
  }

  async confirmUpload(documentId: string) {
    const { data } = await this.client.post(
      `/knowledge/${documentId}/confirm`,
    );
    return data;
  }

  async getDocuments(projectId: string) {
    const { data } = await this.client.get('/knowledge/documents', {
      params: { projectId },
    });
    return data.documents;
  }

  // Tests
  async generateTests(params: {
    projectId: string;
    topics: string[];
    difficulty: string;
    count: number;
  }) {
    const { data } = await this.client.post('/tests/generate', params);
    return data;
  }

  async getTests(projectId: string, status?: string) {
    const { data } = await this.client.get('/tests', {
      params: { projectId, status },
    });
    return data.tests;
  }

  async getTest(testId: string) {
    const { data } = await this.client.get(`/tests/${testId}`);
    return data;
  }

  async publishTest(testId: string) {
    const { data } = await this.client.post(`/tests/${testId}/publish`);
    return data;
  }

  // Homework
  async submitHomework(payload: any) {
    const { data } = await this.client.post('/homework/submit', payload);
    return data;
  }

  async getStudentHomework(projectId: string) {
    const { data } = await this.client.get('/homework/student', {
      params: { projectId },
    });
    return data.submissions;
  }

  async getAdminHomework(projectId: string, status?: string) {
    const { data } = await this.client.get('/homework/admin', {
      params: { projectId, status },
    });
    return data.submissions;
  }

  async reviewHomework(submissionId: string, payload: any) {
    const { data } = await this.client.post(
      `/homework/${submissionId}/review`,
      payload,
    );
    return data;
  }

  // User Profile
  async getMe() {
    const { data } = await this.client.get('/users/me');
    return data;
  }

  async updateProfile(params: { firstName?: string; lastName?: string; position?: string }) {
    const { data } = await this.client.put('/users/profile', params);
    return data;
  }

  // Admin: Students
  async getAllUsers() {
    const { data } = await this.client.get('/users/all');
    return data.users;
  }

  async getStudentStats(userId: string, projectId: string) {
    const { data } = await this.client.get(`/users/${userId}/stats`, {
      params: { projectId },
    });
    return data;
  }

  async assignStudentToProject(userId: string, projectId: string) {
    const { data } = await this.client.post(`/users/${userId}/assign/${projectId}`);
    return data;
  }

  async removeStudentFromProject(userId: string, projectId: string) {
    const { data } = await this.client.delete(`/users/${userId}/assign/${projectId}`);
    return data;
  }

  // Homework Assignments
  async createHomeworkAssignment(params: {
    projectId: string;
    title: string;
    instructions: string;
    dueAt?: string;
  }) {
    const { data } = await this.client.post('/homework/assignments', params);
    return data;
  }

  async getHomeworkAssignments(projectId: string) {
    const { data } = await this.client.get('/homework/assignments', {
      params: { projectId },
    });
    return data.assignments;
  }

  // Analytics
  async getAnalyticsSummary(projectId: string) {
    const { data } = await this.client.get('/analytics/summary', {
      params: { projectId },
    });
    return data;
  }

  async getLeaderboard(projectId: string, period: string) {
    const { data } = await this.client.get('/analytics/leaderboard', {
      params: { projectId, period },
    });
    return data;
  }
}

export const apiClient = new ApiClient();
