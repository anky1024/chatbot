import { v4 as uuidv4 } from 'uuid';
import type { User, Account, Chat, UsageLog } from '../types';
import { encrypt, decrypt } from './crypto';

// ============================================================
// Simulated Database Layer (localStorage-based persistence)
// In production, this would be replaced with Prisma + PostgreSQL
// ============================================================

const KEYS = {
  USERS: 'nexus_users',
  ACCOUNTS: 'nexus_accounts',
  ACTIVE_SESSION: 'nexus_active_session',
  CHATS: 'nexus_chats',
  USAGE: 'nexus_usage',
  SETTINGS: 'nexus_settings',
};

// --- User Management ---
export function getUsers(): User[] {
  const data = localStorage.getItem(KEYS.USERS);
  return data ? JSON.parse(data) : [];
}

export function saveUser(user: User): void {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === user.id);
  if (idx >= 0) {
    users[idx] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
}

export function getUserById(id: string): User | null {
  return getUsers().find(u => u.id === id) || null;
}

export function getUserByEmail(email: string): User | null {
  return getUsers().find(u => u.email === email) || null;
}

// --- Account Management (Multi-Account) ---
export function getAccounts(): Account[] {
  const data = localStorage.getItem(KEYS.ACCOUNTS);
  return data ? JSON.parse(data) : [];
}

export function saveAccount(account: Account): void {
  const accounts = getAccounts();
  const idx = accounts.findIndex(a => a.userId === account.userId);
  if (idx >= 0) {
    accounts[idx] = account;
  } else {
    accounts.push(account);
  }
  localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
}

export function removeAccount(userId: string): void {
  const accounts = getAccounts().filter(a => a.userId !== userId);
  localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
}

// --- Session Management ---
export function getActiveSession(): string | null {
  return localStorage.getItem(KEYS.ACTIVE_SESSION);
}

export function setActiveSession(userId: string | null): void {
  if (userId) {
    localStorage.setItem(KEYS.ACTIVE_SESSION, userId);
  } else {
    localStorage.removeItem(KEYS.ACTIVE_SESSION);
  }
}

// --- Chat Management ---
export function getChats(userId: string): Chat[] {
  const data = localStorage.getItem(`${KEYS.CHATS}_${userId}`);
  return data ? JSON.parse(data) : [];
}

export function saveChat(userId: string, chat: Chat): void {
  const chats = getChats(userId);
  const idx = chats.findIndex(c => c.id === chat.id);
  if (idx >= 0) {
    chats[idx] = chat;
  } else {
    chats.push(chat);
  }
  localStorage.setItem(`${KEYS.CHATS}_${userId}`, JSON.stringify(chats));
}

export function deleteChat(userId: string, chatId: string): void {
  const chats = getChats(userId).filter(c => c.id !== chatId);
  localStorage.setItem(`${KEYS.CHATS}_${userId}`, JSON.stringify(chats));
}

export function createNewChat(userId: string): Chat {
  const chat: Chat = {
    id: uuidv4(),
    userId,
    title: 'New Chat',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
  };
  saveChat(userId, chat);
  return chat;
}

// --- Usage Tracking ---
export function getUsageLog(userId: string): UsageLog {
  const data = localStorage.getItem(`${KEYS.USAGE}_${userId}`);
  const today = new Date().toISOString().split('T')[0];
  
  if (data) {
    const log: UsageLog = JSON.parse(data);
    if (log.date !== today) {
      // Reset daily counter
      const newLog: UsageLog = {
        userId,
        date: today,
        messageCount: 0,
        tokenCount: 0,
        lastReset: new Date().toISOString(),
      };
      localStorage.setItem(`${KEYS.USAGE}_${userId}`, JSON.stringify(newLog));
      return newLog;
    }
    return log;
  }
  
  const newLog: UsageLog = {
    userId,
    date: today,
    messageCount: 0,
    tokenCount: 0,
    lastReset: new Date().toISOString(),
  };
  localStorage.setItem(`${KEYS.USAGE}_${userId}`, JSON.stringify(newLog));
  return newLog;
}

export function incrementUsage(userId: string, tokens: number = 1): UsageLog {
  const log = getUsageLog(userId);
  log.messageCount += 1;
  log.tokenCount += tokens;
  localStorage.setItem(`${KEYS.USAGE}_${userId}`, JSON.stringify(log));
  return log;
}

// --- Settings ---
export function getSettings(userId: string): { customApiKey: string; apiKeyProvider: string; useCustomKey: boolean } {
  const data = localStorage.getItem(`${KEYS.SETTINGS}_${userId}`);
  if (data) {
    const settings = JSON.parse(data);
    if (settings.customApiKey) {
      try {
        settings.customApiKey = decrypt(settings.customApiKey);
      } catch {
        settings.customApiKey = '';
      }
    }
    return settings;
  }
  return { customApiKey: '', apiKeyProvider: 'openai', useCustomKey: false };
}

export function saveSettings(userId: string, settings: { customApiKey: string; apiKeyProvider: string; useCustomKey: boolean }): void {
  const toSave = {
    ...settings,
    customApiKey: settings.customApiKey ? encrypt(settings.customApiKey) : '',
  };
  localStorage.setItem(`${KEYS.SETTINGS}_${userId}`, JSON.stringify(toSave));
}

// --- API Key Router ---
export function getApiKey(userId: string): string {
  const settings = getSettings(userId);
  if (settings.useCustomKey && settings.customApiKey) {
    return settings.customApiKey;
  }
  // Fallback to system default (simulated)
  return 'sk-default-system-key-' + userId.slice(0, 8);
}
