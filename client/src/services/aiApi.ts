import axiosClient from '../utils/axiosClient';

export const askAIAgent = async ({ question }: { question: string }): Promise<{ answer: string }> => {
  const { data } = await axiosClient.post('/ai/ask', { question });
  return data;
};
