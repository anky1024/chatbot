import React, { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { Sparkles, Code, Lightbulb, PenTool, ArrowDown, MessageSquare } from 'lucide-react';
import * as storage from '../../lib/storage';

export default function ChatWindow() {
  const { currentUser } = useAuthStore();
  const { chats, activeChatId, isStreaming, streamingContent, sendMessage, loadUsage } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const activeChat = chats.find(c => c.id === activeChatId);
  const messages = activeChat?.messages || [];

  // Check usage limit
  const settings = currentUser ? storage.getSettings(currentUser.id) : { useCustomKey: false };
  const usageLog = currentUser ? storage.getUsageLog(currentUser.id) : null;
  const isLimitReached = !settings.useCustomKey && (usageLog?.messageCount || 0) >= 50;

  useEffect(() => {
    if (currentUser) {
      loadUsage(currentUser.id);
    }
  }, [currentUser]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Scroll button visibility
  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = (content: string) => {
    if (currentUser && !isLimitReached) {
      sendMessage(currentUser.id, content);
    }
  };

  // Welcome screen
  if (!activeChat || messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col h-full">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-gray-300">NexusAI</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-500">
              {isLimitReached ? '⚠️ Limit reached' : '✓ Ready'}
            </span>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              How can I help you today?
            </h1>
            <p className="text-gray-400 mb-8">
              I'm NexusAI, your intelligent coding assistant. Ask me anything!
            </p>

            {/* Suggestion cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl mx-auto">
              {[
                { icon: Code, title: 'Write code', desc: 'Help me build a React component' },
                { icon: Lightbulb, title: 'Explain concept', desc: 'What is server-side rendering?' },
                { icon: PenTool, title: 'Debug issue', desc: 'Fix this TypeScript error...' },
                { icon: Sparkles, title: 'Architecture', desc: 'Design a scalable API' },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(item.desc)}
                  disabled={isLimitReached}
                  className="flex items-start gap-3 p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 rounded-xl text-left transition group disabled:opacity-50"
                >
                  <item.icon className="w-5 h-5 text-indigo-400 mt-0.5 group-hover:text-indigo-300 transition" />
                  <div>
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
        <ChatInput onSend={handleSend} isStreaming={isStreaming} disabled={isLimitReached} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full relative">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 min-w-0">
          <MessageSquare className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-300 truncate">{activeChat?.title || 'Chat'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </span>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        <div className="max-w-4xl mx-auto py-4">
          {messages.map(msg => (
            <MessageBubble key={msg.id} role={msg.role as 'user' | 'assistant'} content={msg.content} />
          ))}

          {/* Streaming message */}
          {isStreaming && streamingContent && (
            <MessageBubble role="assistant" content={streamingContent} isStreaming />
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 p-2 bg-gray-800 border border-gray-700 rounded-full shadow-lg hover:bg-gray-700 transition z-10"
        >
          <ArrowDown className="w-4 h-4 text-gray-400" />
        </button>
      )}

      <ChatInput onSend={handleSend} isStreaming={isStreaming} disabled={isLimitReached} />
    </div>
  );
}
