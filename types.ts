
export enum Role {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  thinking?: string;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export type ModelID = 
  | 'gemini-3-flash-preview' 
  | 'gemini-3-pro-preview' 
  | 'gpt-4o' 
  | 'claude-3-5-sonnet' 
  | 'llama-3-1-405b' 
  | 'deepseek-v3';

export interface AppState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isSidebarOpen: boolean;
  isLoading: boolean;
  modelType: ModelID;
  useThinking: boolean;
}
