export type Operator = 'airtel' | 'moov' | 'unknown';

export interface SingpayInitRequest {
  numero: string;
  amount: number | string;
}

export interface SingpayInitResponse {
  success: boolean;
  message?: string;
  transactionId?: string;
  provider?: Operator;
  data?: any;
}

export interface SingpayStatusResponse {
  success: boolean;
  statusMessage?: string;
  errorType?: string;
  isTimeout?: boolean;
  message?: string;
  data?: any;
}


