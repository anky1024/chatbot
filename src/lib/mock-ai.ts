// ============================================================
// Mock AI Streaming Response (simulates SSE/Server-Sent Events)
// In production, this would call OpenAI/Anthropic/DashScope API
// ============================================================

const SAMPLE_RESPONSES: Record<string, string> = {
  greeting: `Hello! 👋 I'm NexusAI, your intelligent coding assistant. I can help you with:

- **Code generation** in any programming language
- **Debugging** and error analysis
- **Architecture** design and best practices
- **Documentation** and explanations

How can I assist you today?`,

  code: `Here's a clean implementation of a debounce function in TypeScript:

\`\`\`typescript
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

// Usage example
const handleSearch = debounce((query: string) => {
  console.log('Searching for:', query);
  fetchResults(query);
}, 300);
\`\`\`

### Key Features:
1. **Generic typing** — preserves parameter types
2. **Configurable delay** — adjustable wait time
3. **Context preservation** — maintains \`this\` binding

Would you like me to explain any part in more detail?`,

  architecture: `# Recommended Architecture for a Scalable Chat Application

## System Design Overview

\`\`\`
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│  API Gateway │────▶│  AI Service  │
│  (React)    │◀────│  (Edge Fn)   │◀────│  (LLM API)   │
└─────────────┘     └──────────────┘     └─────────────┘
       │                    │
       ▼                    ▼
┌─────────────┐     ┌──────────────┐
│   Zustand   │     │  PostgreSQL   │
│   Store     │     │  (Prisma)     │
└─────────────┘     └──────────────┘
\`\`\`

## Key Components:
1. **Frontend**: Next.js + React + Tailwind
2. **State**: Zustand for client state
3. **Database**: PostgreSQL with Prisma ORM
4. **Auth**: NextAuth.js with OAuth providers
5. **Streaming**: Server-Sent Events (SSE)

## Database Schema:
\`\`\`sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chats (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY,
  chat_id UUID REFERENCES chats(id),
  role VARCHAR(20),
  content TEXT,
  tokens INT,
  created_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

Would you like me to dive deeper into any specific component?`,

  default: `That's a great question! Let me break this down for you.

## Analysis

Based on your query, here are the key considerations:

1. **Performance**: We should optimize for both speed and reliability
2. **Scalability**: The solution should handle growing data gracefully
3. **Maintainability**: Clean code patterns that are easy to extend

### Recommended Approach

\`\`\`javascript
// Example implementation
const solution = {
  approach: "modular",
  pattern: "observer",
  benefits: ["flexibility", "testability", "reuse"]
};
\`\`\`

### Next Steps:
- [ ] Review the current implementation
- [ ] Identify optimization opportunities
- [ ] Implement the recommended changes
- [ ] Add comprehensive tests

Feel free to ask follow-up questions! I'm here to help. 🚀`,
};

function categorizeInput(input: string): string {
  const lower = input.toLowerCase();
  if (lower.match(/hello|hi|hey|greet/)) return 'greeting';
  if (lower.match(/code|function|implement|write|build|create|program/)) return 'code';
  if (lower.match(/architect|design|system|database|schema|structure/)) return 'architecture';
  return 'default';
}

export async function* streamAIResponse(
  userMessage: string,
  _apiKey: string
): AsyncGenerator<string, void, unknown> {
  const category = categorizeInput(userMessage);
  const response = SAMPLE_RESPONSES[category] || SAMPLE_RESPONSES.default;
  
  // Simulate streaming by yielding chunks
  const words = response.split(/(\s+)/);
  
  for (let i = 0; i < words.length; i++) {
    // Simulate network latency
    const delay = Math.random() * 30 + 10;
    await new Promise(resolve => setTimeout(resolve, delay));
    yield words[i];
  }
}

export function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
}
