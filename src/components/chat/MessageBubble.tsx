import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, User, Bot } from 'lucide-react';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

function CodeBlock({ className, children, ...props }: any) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-3 rounded-lg overflow-hidden border border-gray-700/50">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800/80 border-b border-gray-700/50">
        <span className="text-xs text-gray-400 font-mono">{match?.[1] || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-400 hover:text-white hover:bg-gray-700 transition"
        >
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={match?.[1] || 'text'}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: '1rem',
          background: 'rgba(17, 24, 39, 0.8)',
          fontSize: '0.875rem',
        }}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
}

export default function MessageBubble({ role, content, isStreaming }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex gap-3 py-4 px-4 md:px-0 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-indigo-600' : 'bg-gradient-to-br from-purple-600 to-indigo-600'
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 max-w-[85%] ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block text-left rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-800/50 text-gray-100 border border-gray-700/50'
        }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
          ) : (
            <div className="prose prose-inverse prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  code: ({ className, children, ...props }) => {
                    const isInline = !className;
                    if (isInline) {
                      return (
                        <code className="px-1.5 py-0.5 bg-gray-700/50 rounded text-indigo-300 text-xs font-mono" {...props}>
                          {children}
                        </code>
                      );
                    }
                    return <CodeBlock className={className} {...props}>{children}</CodeBlock>;
                  },
                  p: ({ children }) => <p className="mb-2 last:mb-0 text-sm leading-relaxed">{children}</p>,
                  h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-white">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-bold mb-2 text-white">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-bold mb-1 text-white">{children}</h3>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 text-sm">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 text-sm">{children}</ol>,
                  li: ({ children }) => <li className="text-sm">{children}</li>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-indigo-500 pl-3 my-2 text-gray-400 italic">
                      {children}
                    </blockquote>
                  ),
                  pre: ({ children }) => <>{children}</>,
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">
                      {children}
                    </a>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-indigo-400 animate-pulse ml-0.5 rounded-sm" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
