import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { User, Account } from '../types';
import * as storage from '../lib/storage';
import { hashString } from '../lib/crypto';

interface AuthState {
  currentUser: User | null;
  accounts: Account[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  loginWithOAuth: (provider: 'google' | 'github') => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  switchAccount: (userId: string) => void;
  loadSession: () => void;
  clearError: () => void;
}

// Simulated password store (in production, this would be server-side)
const PASSWORD_HASHES: Record<string, string> = {};

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  accounts: [],
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const user = storage.getUserByEmail(email);
    if (!user) {
      set({ isLoading: false, error: 'Account not found. Please register first.' });
      return;
    }
    
    const storedHash = PASSWORD_HASHES[email] || hashString('password');
    const inputHash = hashString(password);
    
    if (storedHash !== inputHash && password !== 'password') {
      // For demo purposes, accept any password for existing users
    }
    
    // Create/update account session
    const account: Account = {
      id: uuidv4(),
      userId: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      provider: user.provider,
      token: 'jwt-' + uuidv4(),
      lastActive: new Date().toISOString(),
    };
    
    storage.saveAccount(account);
    storage.setActiveSession(user.id);
    
    set({
      currentUser: user,
      accounts: storage.getAccounts(),
      isAuthenticated: true,
      isLoading: false,
    });
  },

  loginWithOAuth: async (provider: 'google' | 'github') => {
    set({ isLoading: true, error: null });
    
    // Simulate OAuth flow
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const mockOAuthUsers = {
      google: {
        email: 'user@gmail.com',
        name: 'Alex Chen',
        avatar: 'https://api.dicebear.com/avataaars.svg?seed=google&backgroundColor=b6e3f4',
      },
      github: {
        email: 'dev@github.com',
        name: 'Sarah Dev',
        avatar: 'https://api.dicebear.com/avataaars.svg?seed=github&backgroundColor=c0aede',
      },
    };
    
    const oauthUser = mockOAuthUsers[provider];
    let user = storage.getUserByEmail(oauthUser.email);
    
    if (!user) {
      user = {
        id: uuidv4(),
        email: oauthUser.email,
        name: oauthUser.name,
        avatar: oauthUser.avatar,
        provider,
        joinedAt: new Date().toISOString(),
      };
      storage.saveUser(user);
    }
    
    const account: Account = {
      id: uuidv4(),
      userId: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      provider,
      token: 'oauth-' + uuidv4(),
      lastActive: new Date().toISOString(),
    };
    
    storage.saveAccount(account);
    storage.setActiveSession(user.id);
    
    set({
      currentUser: user,
      accounts: storage.getAccounts(),
      isAuthenticated: true,
      isLoading: false,
    });
  },

  register: async (email: string, password: string, name: string) => {
    set({ isLoading: true, error: null });
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const existing = storage.getUserByEmail(email);
    if (existing) {
      set({ isLoading: false, error: 'An account with this email already exists.' });
      return;
    }
    
    const user: User = {
      id: uuidv4(),
      email,
      name,
      avatar: `https://api.dicebear.com/avataaars.svg?seed=${email}&backgroundColor=b6e3f4`,
      provider: 'email',
      joinedAt: new Date().toISOString(),
    };
    
    storage.saveUser(user);
    PASSWORD_HASHES[email] = hashString(password);
    
    const account: Account = {
      id: uuidv4(),
      userId: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      provider: 'email',
      token: 'jwt-' + uuidv4(),
      lastActive: new Date().toISOString(),
    };
    
    storage.saveAccount(account);
    storage.setActiveSession(user.id);
    
    set({
      currentUser: user,
      accounts: storage.getAccounts(),
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: () => {
    storage.setActiveSession(null);
    set({
      currentUser: null,
      isAuthenticated: false,
    });
  },

  switchAccount: (userId: string) => {
    const user = storage.getUserById(userId);
    if (user) {
      storage.setActiveSession(userId);
      set({
        currentUser: user,
        isAuthenticated: true,
      });
    }
  },

  loadSession: () => {
    const activeUserId = storage.getActiveSession();
    if (activeUserId) {
      const user = storage.getUserById(activeUserId);
      if (user) {
        set({
          currentUser: user,
          accounts: storage.getAccounts(),
          isAuthenticated: true,
        });
        return;
      }
    }
    set({ isLoading: false });
  },

  clearError: () => set({ error: null }),
}));
