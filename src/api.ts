import {ResponsePayload, TaskPayload, TokenResponse} from "./types";
import {getEnv} from "./env";

export const getApiClient = (apiUrl: string, apiKey: string) => ({
  getTaskToken: async (taskName: string): Promise<string> => {
    const response = await fetch(`${apiUrl}/token/${taskName}`, {
      method: 'POST',
      body: JSON.stringify({apikey: apiKey}),
    });

    const data = (await response.json()) as TokenResponse;

    if (data.token) {
      return data.token;
    }

    throw new Error('Token could not be obtained: ' + JSON.stringify(data));
  },

  getTaskPayload: async (token: string): Promise<TaskPayload> => {
    const response = await fetch(`${apiUrl}/task/${token}`);

    const data = (await response.json()) as TaskPayload;
    if (data.code !== 0) {
      throw new Error('Task payload error: ' + JSON.stringify(data));
    }

    return data;
  },

  submitAnswer: async (token: string, solution: string | (any[])): Promise<void> => {
    const response = await fetch(`${apiUrl}/answer/${token}`, {
      method: 'POST',
      body: JSON.stringify({answer: solution}),
    });

    const data = (await response.json()) as ResponsePayload;
    if (data.code !== 0) {
      throw new Error('Task answer error: ' + JSON.stringify(data));
    }
  },

  request: async (path: string, payload?: Record<string, string>, method = 'POST', asJson = false): Promise<any> => {
    const queryString = new URLSearchParams(payload).toString();
    const url = apiUrl + path + (method === 'GET' ? '?' + queryString : '')
    const config = {
      method,
      body: method !== 'GET' ? (asJson ? JSON.stringify(payload) : new URLSearchParams(payload).toString()) : undefined,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }

    const response = await fetch(url, config)
    const data = (await response.json())
    if (data.code !== 0) {
      throw new Error('Custom request error: ' + JSON.stringify(data));
    }

    return data
  }
})

export const api = getApiClient(getEnv('API_URL'), getEnv('API_KEY'))
