export interface ResponsePayload {
  code: number;
  msg: string;
}

export interface TokenResponse extends ResponsePayload {
  token?: string;
}

export interface TaskPayload extends ResponsePayload{
  [key: string]: any;
}
