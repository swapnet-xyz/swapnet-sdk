import Axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from "axios";

export type Headers = {
  ["Content-Type"]?: string;
  ["request-id"]?: string;
} | Record<string, string>;

export interface IRequest {
  method: "get" | "post";
  path: string;
  baseUrl: string;
  headers: Headers;
  params: any;
  body?: any;
}

export interface IResponse {
  status: number;
  headers: any;
  body?: any;
}

export class AxiosWrapper {
  constructor(private readonly _axiosInstance: AxiosInstance) {}

  public async sendAsync(request: IRequest): Promise<IResponse> {
    const { method, path, baseUrl, headers, params, body } = request;

    let axiosResponse: AxiosResponse;
    try {
      switch (method) {
        case "post":
          axiosResponse = await this._axiosInstance.post(path, body, {
            baseURL: baseUrl,
            headers,
            params,
          });
          break;
        case "get":
        default:
          axiosResponse = await this._axiosInstance.get(path, {
            baseURL: baseUrl,
            params,
            headers,
          });
          break;
      }
    } catch (error: any) {
      if (!error.response) {
        throw error;
      }
      axiosResponse = error.response;
    }
    return {
      status: axiosResponse.status,
      headers: axiosResponse.headers,
      body: axiosResponse.data,
    };
  }
}

const axiosInstanceConfig: AxiosRequestConfig = {
  timeout: 60000,
};
const axiosInstance = Axios.create(axiosInstanceConfig);
export const axiosWrapper = new AxiosWrapper(axiosInstance);

export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

