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
        // 优先返回后端自定义的错误信息
        const errorMessage = error.response?.data?.error || error.message || 'Request failed';
        console.error('API Error:', errorMessage);
        return Promise.reject(new Error(errorMessage));
      }
    );
  }

  // 通用GET请求
  async get<T>(url: string): Promise<T> {
    const response = await this.instance.get<APIResponse<T>>(url);
    // **修改**: 只要 success 为 true 就认为成功，即使 data 不存在或为 null/[]
    if (response.data.success) {
      return response.data.data as T;
    }
    throw new Error(response.data.error || 'Request failed');
  }

  // 通用POST请求
  async post<T>(url: string, data: any): Promise<T> {
    const response = await this.instance.post<APIResponse<T>>(url, data);
    // **修改**: 只要 success 为 true 就认为成功
    if (response.data.success) {
      return response.data.data as T;
    }
    throw new Error(response.data.error || 'Request failed');
  }

  // 通用PUT请求
  async put<T>(url: string, data: any): Promise<T> {
    const response = await this.instance.put<APIResponse<T>>(url, data);
    // **修改**: 只要 success 为 true 就认为成功
    if (response.data.success) {
      return response.data.data as T;
    }
    throw new Error(response.data.error || 'Request failed');
  }

  // 通用DELETE请求
  async delete<T>(url: string): Promise<T> {
    const response = await this.instance.delete<APIResponse<T>>(url);
    // **修改**: 只要 success 为 true 就认为成功，data 字段不是必须的
    if (response.data.success) {
      return (response.data.data ?? null) as T; // 返回 data 或 null
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
  baseURL: '/api',
  timeout: 10000,
});

export default ApiService;