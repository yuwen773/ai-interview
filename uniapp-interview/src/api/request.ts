import Taro from '@tarojs/taro';

const baseURL = process.env.API_BASE_URL || 'http://localhost:8080/api';

interface RequestOptions {
  timeout?: number;
  header?: Record<string, string>;
  responseType?: 'text' | 'arraybuffer' | 'blob';
}

class Request {
  async get<T>(url: string, config?: RequestOptions): Promise<T> {
    return Taro.request({
      url: `${baseURL}${url}`,
      method: 'GET',
      ...config,
    }).then(res => this.handleResponse<T>(res.data));
  }

  async post<T>(url: string, data?: any, config?: RequestOptions): Promise<T> {
    return Taro.request({
      url: `${baseURL}${url}`,
      method: 'POST',
      data,
      ...config,
    }).then(res => this.handleResponse<T>(res.data));
  }

  async delete<T>(url: string, config?: RequestOptions): Promise<T> {
    return Taro.request({
      url: `${baseURL}${url}`,
      method: 'DELETE',
      ...config,
    }).then(res => this.handleResponse<T>(res.data));
  }

  async put<T>(url: string, data?: any, config?: RequestOptions): Promise<T> {
    return Taro.request({
      url: `${baseURL}${url}`,
      method: 'PUT',
      data,
      ...config,
    }).then(res => this.handleResponse<T>(res.data));
  }

  async upload<T>(url: string, filePath: string): Promise<T> {
    return Taro.uploadFile({
      url: `${baseURL}${url}`,
      filePath,
      name: 'file',
    }).then(res => this.handleResponse<T>(JSON.parse(res.data)));
  }

  private handleResponse<T>(result: any): T {
    if (result.code === 200) {
      return result.data;
    }
    throw new Error(result.message || '请求失败');
  }
}

export default new Request();
