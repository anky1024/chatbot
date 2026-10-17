import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import AccountSwitcher from '../settings/AccountSwitcher';
import {
  Plus,
  MessageSquare,
  Settings,
  Trash2,
  Edit3,
  Check,
  X,
  Zap,
  Menu,
} from 'lucide-react';
import { format, isToday, isYesterday, isWithinInterval, subDays } from 'date-fns';

interface SidebarProps {
  onOpenSettings: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ onOpenSettings, isOpen, onToggle }: SidebarProps) {
  const { currentUser } = useAuthStore();
  const { chats, activeChatId, setActiveChat, createChat, deleteChat, renameChat, loadChats, usageLog } = useChatStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    if (currentUser) {
      loadChats(currentUser.id);
    }
  }, [currentUser]);

  if (!currentUser) return null;

  const settings = JSON.parse(localStorage.getItem(`nexus_settings_${currentUser.id}`) || '{}');
  const useCustomKey = settings.useCustomKey || false;
  const dailyLimit = useCustomKey ? Infinity : 50;
  const usedMessages = usageLog?.messageCount || 0;
  const usagePercent = useCustomKey ? 0 : Math.min((usedMessages / dailyLimit) * 100, 100);

  // Group chats by date
  const today = chats.filter(c => isToday(new Date(c.updatedAt)));
  const yesterday = chats.filter(c => isYesterday(new Date(c.updatedAt)));
  const last7Days = chats.filter(c => {
    const date = new Date(c.updatedAt);
    return isWithinInterval(date, { start: subDays(new Date(), 7), end: subDays(new Date(), 2) });
  });
  const older = chats.filter(c => {
    const date = new Date(c.updatedAt);
    return !isToday(date) && !isYesterday(date) && !isWithinInterval(date, { start: subDays(new Date(), 7), end: subDays(new Date(), 2) });
  });

  const handleNewChat = () => {
    createChat(currentUser.id);
  };

  const handleRename = (chatId: string) => {
    if (editTitle.trim()) {
      renameChat(currentUser.id, chatId, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleDelete = (chatId: string) => {
    deleteChat(currentUser.id, chatId);
  };

  const ChatGroup = ({ title, items }: { title: string; items: typeof chats }) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <p className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
        {items.map(chat => (
          <div
            key={chat.id}
            className={`group flex items-center gap-2 px-3 py-2 mx-1 rounded-lg cursor-pointer transition ${
              chat.id === activeChatId
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
            }`}
            onClick={() => setActiveChat(chat.id)}
          >
            <MessageSquare className="w-4 h-4 flex-shrink-0" />
            
            {editingId === chat.id ? (
              <div className="flex-1 flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleRename(chat.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="flex-1 bg-gray-700 text-sm text-white px-2 py-0.5 rounded border border-gray-600 focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
                <button onClick={() => handleRename(chat.id)} className="p-0.5 text-green-400 hover:text-green-300">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setEditingId(null)} className="p-0.5 text-gray-500 hover:text-gray-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <span className="flex-1 text-sm truncate">{chat.title}</span>
                <div className="hidden group-hover:flex items-center gap-0.5">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setEditingId(chat.id);
                      setEditTitle(chat.title);
                    }}
                    className="p-1 rounded text-gray-500 hover:text-white hover:bg-gray-700"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleDelete(chat.id);
                    }}
                    className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-gray-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={onToggle} />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:relative z-40 h-full w-72 bg-gray-950 border-r border-gray-800 flex flex-col transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:border-0 md:overflow-hidden'
      }`}>
        {/* Header */}
        <div className="p-3 border-b border-gray-800">
          <button
            onClick={handleNewChat}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-sm font-medium transition shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
          <ChatGroup title="Today" items={today} />
          <ChatGroup title="Yesterday" items={yesterday} />
          <ChatGroup title="Last 7 Days" items={last7Days} />
          <ChatGroup title="Older" items={older} />

          {chats.length === 0 && (
            <div className="text-center py-8 px-4">
              <MessageSquare className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No conversations yet</p>
              <p className="text-xs text-gray-700 mt-1">Start a new chat to begin</p>
            </div>
          )}
        </div>

        {/* Usage bar */}
        <div className="px-3 py-2 border-t border-gray-800">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-500" />
              <span className="text-xs text-gray-400">Daily Usage</span>
            </div>
            <span className="text-xs text-gray-500">
              {useCustomKey ? '∞' : `${usedMessages}/${dailyLimit}`}
            </span>
          </div>
          {!useCustomKey && (
            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-yellow-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          )}
        </div>

        {/* Bottom section */}
        <div className="border-t border-gray-800 p-2 space-y-1">
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 transition text-sm"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          
          <AccountSwitcher />
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-20 md:hidden p-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition"
      >
        <Menu className="w-5 h-5" />
      </button>
    </>
  );
}
