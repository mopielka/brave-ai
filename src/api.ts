import {ResponsePayload, TaskPayload, TokenResponse} from "./types";

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
})
