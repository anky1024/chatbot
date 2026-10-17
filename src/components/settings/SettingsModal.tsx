import React, { useState, useEffect } from 'react';
import { X, Key, Shield, BarChart3, User, Calendar, Zap, Check } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import * as storage from '../../lib/storage';
import { formatDistanceToNow } from 'date-fns';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { currentUser } = useAuthStore();
  const { usageLog } = useChatStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'api' | 'usage'>('profile');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyProvider, setApiKeyProvider] = useState<'openai' | 'anthropic' | 'dashscope'>('openai');
  const [useCustomKey, setUseCustomKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (currentUser && isOpen) {
      const settings = storage.getSettings(currentUser.id);
      setApiKey(settings.customApiKey || '');
      setApiKeyProvider((settings.apiKeyProvider as any) || 'openai');
      setUseCustomKey(settings.useCustomKey);
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleSave = () => {
    storage.saveSettings(currentUser.id, {
      customApiKey: apiKey,
      apiKeyProvider,
      useCustomKey,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const dailyLimit = useCustomKey ? Infinity : 50;
  const usedMessages = usageLog?.messageCount || 0;
  const usagePercent = useCustomKey ? 0 : Math.min((usedMessages / dailyLimit) * 100, 100);

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'api' as const, label: 'API Keys', icon: Key },
    { id: 'usage' as const, label: 'Usage', icon: BarChart3 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition border-b-2 ${
                activeTab === tab.id
                  ? 'text-indigo-400 border-indigo-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-16 h-16 rounded-full bg-gray-700 ring-2 ring-gray-700"
                />
                <div>
                  <h3 className="text-lg font-semibold text-white">{currentUser.name}</h3>
                  <p className="text-sm text-gray-400">{currentUser.email}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>Joined {formatDistanceToNow(new Date(currentUser.joinedAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>

              {/* Provider badge */}
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-gray-800 rounded-full text-xs text-gray-300 capitalize">
                  {currentUser.provider === 'email' ? '📧 Email' : currentUser.provider === 'google' ? '🔵 Google' : '⚫ GitHub'}
                </span>
                <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs text-indigo-400">
                  {useCustomKey ? '⚡ Custom API Key' : '🆓 Free Tier'}
                </span>
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-800/50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">User ID</p>
                  <p className="text-sm text-gray-300 font-mono truncate">{currentUser.id}</p>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Plan</p>
                  <p className="text-sm text-gray-300">{useCustomKey ? 'Pro (Custom Key)' : 'Free Tier'}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-6">
              <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-indigo-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-indigo-300">Secure API Key Storage</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Your API key is encrypted using AES-256 before being stored locally. 
                      It never leaves your browser unencrypted.
                    </p>
                  </div>
                </div>
              </div>

              {/* Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-white">Use Custom API Key</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {useCustomKey ? 'Unlimited messages with your own key' : 'Using system default (50 msgs/day limit)'}
                  </p>
                </div>
                <button
                  onClick={() => setUseCustomKey(!useCustomKey)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    useCustomKey ? 'bg-indigo-600' : 'bg-gray-700'
                  }`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    useCustomKey ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {useCustomKey && (
                <>
                  {/* Provider selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Provider</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'openai' as const, label: 'OpenAI', emoji: '🟢' },
                        { id: 'anthropic' as const, label: 'Anthropic', emoji: '🟠' },
                        { id: 'dashscope' as const, label: 'DashScope', emoji: '🔵' },
                      ].map(p => (
                        <button
                          key={p.id}
                          onClick={() => setApiKeyProvider(p.id)}
                          className={`p-3 rounded-lg border text-sm font-medium transition ${
                            apiKeyProvider === p.id
                              ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300'
                              : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                          }`}
                        >
                          <span className="mr-1">{p.emoji}</span>
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* API Key input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">API Key</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="password"
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        placeholder={`Enter your ${apiKeyProvider} API key...`}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition font-mono text-sm"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Save button */}
              <button
                onClick={handleSave}
                className={`w-full py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  saved
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                }`}
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved Successfully
                  </>
                ) : (
                  'Save Settings'
                )}
              </button>
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="space-y-6">
              {/* Usage card */}
              <div className="p-5 bg-gray-800/50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <span className="text-sm font-medium text-white">Daily Usage</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    Resets at midnight UTC
                  </span>
                </div>

                {useCustomKey ? (
                  <div className="text-center py-4">
                    <p className="text-2xl font-bold text-green-400">∞ Unlimited</p>
                    <p className="text-xs text-gray-400 mt-1">Using your custom API key</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-end gap-1 mb-2">
                      <span className="text-3xl font-bold text-white">{usedMessages}</span>
                      <span className="text-gray-500 mb-1">/ {dailyLimit} messages</span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-yellow-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between mt-2">
                      <span className="text-xs text-gray-500">{Math.round(usagePercent)}% used</span>
                      <span className="text-xs text-gray-500">{dailyLimit - usedMessages} remaining</span>
                    </div>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-gray-800/50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-white">{usedMessages}</p>
                  <p className="text-xs text-gray-500 mt-1">Messages Today</p>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-white">{usageLog?.tokenCount || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Tokens Used</p>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-white">
                    {useCustomKey ? '∞' : dailyLimit - usedMessages}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Remaining</p>
                </div>
              </div>

              {/* Plan info */}
              <div className="p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl">
                <p className="text-sm font-medium text-indigo-300 mb-1">💡 Want unlimited messages?</p>
                <p className="text-xs text-gray-400">
                  Add your own API key in the API Keys tab to bypass the daily limit and use your preferred AI provider.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
