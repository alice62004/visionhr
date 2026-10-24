import axiosClient from '../utils/axiosClient';

export interface SmtpConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  user: string;
  pass: string;
  from?: string;
}

export interface SmtpStatus {
  connected?: boolean;
  isConfigured: boolean;
  user: string;
  rawUser: string;
  host: string;
  port: number;
  networkIp?: string;
  appUrl?: string;
  config?: SmtpConfig;
}

export const getSmtpStatus = async (): Promise<SmtpStatus> => {
  const { data } = await axiosClient.get('/settings/smtp');
  return data;
};

export const saveSmtpConfig = async (payload: SmtpConfig): Promise<{ success: boolean; message: string }> => {
  const { data } = await axiosClient.post('/settings/smtp', payload);
  return data;
};

export const sendTestEmail = async (to: string): Promise<any> => {
  const { data } = await axiosClient.post('/settings/test-email', { to });
  return data;
};
