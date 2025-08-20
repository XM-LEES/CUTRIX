import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { APIResponse, ApiConfig } from '../types';

class ApiService {
  private instance: AxiosInstance;

  constructor(config: ApiConfig) {
    this.instance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        // 可以在这里添加token等
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse<APIResponse>) => {
        return response;
      },
      (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
      }
    );
  }

  // 通用GET请求
  async get<T>(url: string): Promise<T> {
    const response = await this.instance.get<APIResponse<T>>(url);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Request failed');
  }

  // 通用POST请求
  async post<T>(url: string, data: any): Promise<T> {
    const response = await this.instance.post<APIResponse<T>>(url, data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Request failed');
  }

  // 通用PUT请求
  async put<T>(url: string, data: any): Promise<T> {
    const response = await this.instance.put<APIResponse<T>>(url, data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Request failed');
  }

  // 通用DELETE请求
  async delete<T>(url: string): Promise<T> {
    const response = await this.instance.delete<APIResponse<T>>(url);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Request failed');
  }

  // 获取Axios实例（用于特殊请求）
  getInstance(): AxiosInstance {
    return this.instance;
  }
}

// 创建API实例
export const apiService = new ApiService({
  baseURL: '/api', // Vite 代理会处理这个路径
  timeout: 10000,
});

export default ApiService;