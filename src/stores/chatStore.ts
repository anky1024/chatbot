import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Chat, Message, UsageLog } from '../types';
import * as storage from '../lib/storage';
import { streamAIResponse, estimateTokens } from '../lib/mock-ai';

interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
  usageLog: UsageLog | null;
  isStreaming: boolean;
  streamingContent: string;
  
  // Actions
  loadChats: (userId: string) => void;
  createChat: (userId: string) => Chat;
  deleteChat: (userId: string, chatId: string) => void;
  renameChat: (userId: string, chatId: string, title: string) => void;
  setActiveChat: (chatId: string) => void;
  sendMessage: (userId: string, content: string) => Promise<void>;
  loadUsage: (userId: string) => void;
  getActiveChat: () => Chat | null;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChatId: null,
  usageLog: null,
  isStreaming: false,
  streamingContent: '',

  loadChats: (userId: string) => {
    const chats = storage.getChats(userId);
    set({ chats: chats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) });
  },

  createChat: (userId: string) => {
    const chat = storage.createNewChat(userId);
    const chats = get().chats;
    set({ chats: [chat, ...chats], activeChatId: chat.id });
    return chat;
  },

  deleteChat: (userId: string, chatId: string) => {
    storage.deleteChat(userId, chatId);
    const chats = get().chats.filter(c => c.id !== chatId);
    const activeChatId = get().activeChatId === chatId ? (chats[0]?.id || null) : get().activeChatId;
    set({ chats, activeChatId });
  },

  renameChat: (userId: string, chatId: string, title: string) => {
    const chats = get().chats.map(c => {
      if (c.id === chatId) {
        const updated = { ...c, title };
        storage.saveChat(userId, updated);
        return updated;
      }
      return c;
    });
    set({ chats });
  },

  setActiveChat: (chatId: string) => {
    set({ activeChatId: chatId });
  },

  sendMessage: async (userId: string, content: string) => {
    let { activeChatId, chats } = get();
    
    // Create new chat if none active
    if (!activeChatId) {
      const chat = storage.createNewChat(userId);
      activeChatId = chat.id;
      chats = [chat, ...chats];
      set({ activeChatId, chats });
    }
    
    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      chatId: activeChatId,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    
    const currentChat = chats.find(c => c.id === activeChatId);
    if (!currentChat) return;
    
    const updatedChat: Chat = {
      ...currentChat,
      title: currentChat.messages.length === 0 ? content.slice(0, 50) + (content.length > 50 ? '...' : '') : currentChat.title,
      messages: [...currentChat.messages, userMessage],
      updatedAt: new Date().toISOString(),
    };
    
    storage.saveChat(userId, updatedChat);
    set({
      chats: chats.map(c => c.id === activeChatId ? updatedChat : c),
      isStreaming: true,
      streamingContent: '',
    });
    
    // Get API key
    const apiKey = storage.getApiKey(userId);
    
    // Stream AI response
    const assistantMessageId = uuidv4();
    let fullContent = '';
    
    try {
      for await (const chunk of streamAIResponse(content, apiKey)) {
        fullContent += chunk;
        set({ streamingContent: fullContent });
      }
    } catch {
      fullContent = 'Sorry, I encountered an error processing your request. Please try again.';
      set({ streamingContent: fullContent });
    }
    
    // Add assistant message
    const assistantMessage: Message = {
      id: assistantMessageId,
      chatId: activeChatId,
      role: 'assistant',
      content: fullContent,
      createdAt: new Date().toISOString(),
      tokens: estimateTokens(fullContent),
    };
    
    const finalChat: Chat = {
      ...updatedChat,
      messages: [...updatedChat.messages, assistantMessage],
      updatedAt: new Date().toISOString(),
    };
    
    storage.saveChat(userId, finalChat);
    
    // Update usage
    const usageLog = storage.incrementUsage(userId, estimateTokens(content) + estimateTokens(fullContent));
    
    set({
      chats: get().chats.map(c => c.id === activeChatId ? finalChat : c),
      isStreaming: false,
      streamingContent: '',
      usageLog,
    });
  },

  loadUsage: (userId: string) => {
    const usageLog = storage.getUsageLog(userId);
    set({ usageLog });
  },

  getActiveChat: () => {
    const { chats, activeChatId } = get();
    return chats.find(c => c.id === activeChatId) || null;
  },
}));
