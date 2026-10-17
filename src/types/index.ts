// ============================================================
// Database Schema Types (simulating Prisma/PostgreSQL models)
// ============================================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  provider: 'email' | 'google' | 'github';
  joinedAt: string;
  customApiKey?: string; // encrypted
  apiKeyProvider?: 'openai' | 'anthropic' | 'dashscope';
}

export interface Account {
  id: string;
  userId: string;
  email: string;
  name: string;
  avatar: string;
  provider: 'email' | 'google' | 'github';
  token: string;
  lastActive: string;
}

export interface Chat {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export interface Message {
  id: string;
  chatId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  tokens?: number;
}

export interface UsageLog {
  userId: string;
  date: string; // YYYY-MM-DD
  messageCount: number;
  tokenCount: number;
  lastReset: string;
}

export interface Settings {
  theme: 'dark' | 'light';
  customApiKey: string;
  apiKeyProvider: 'openai' | 'anthropic' | 'dashscope';
  useCustomKey: boolean;
  dailyLimit: number;
}

export type AuthProvider = 'email' | 'google' | 'github';
