
import React from 'react';
import { ChatSession, AppState } from '../types';
import { ICONS, APP_NAME } from '../constants';

interface SidebarProps {
  state: AppState;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onToggleThinking: () => void;
  onToggleModel: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  state, 
  onNewChat, 
  onSelectSession, 
  onDeleteSession,
  onToggleThinking,
  onToggleModel
}) => {
  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-950 border-r border-zinc-800 transform transition-transform duration-300 ease-in-out flex flex-col ${state.isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
             <ICONS.Sparkles />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
            {APP_NAME}
          </span>
        </h1>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-200 text-sm font-medium"
        >
          <ICONS.Plus />
          New Chat
        </button>
      </div>

      {/* Session List */}
      <div className="flex-grow overflow-y-auto px-2 space-y-1 py-2">
        {state.sessions.length === 0 ? (
          <div className="px-4 py-8 text-center text-zinc-600 text-sm">
            No recent conversations
          </div>
        ) : (
          state.sessions.map((session) => (
            <div
              key={session.id}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${state.currentSessionId === session.id ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
              onClick={() => onSelectSession(session.id)}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex-shrink-0 opacity-50">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <span className="truncate text-sm font-medium">{session.title}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
              >
                <ICONS.Trash />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer / Settings */}
      <div className="p-4 border-t border-zinc-800 space-y-2">
        <button 
          onClick={onToggleModel}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-900 transition-colors text-xs font-medium text-zinc-400"
        >
          <span>Model: {state.modelType === 'gemini-3-pro-preview' ? 'Pro' : 'Flash'}</span>
          <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${state.modelType === 'gemini-3-pro-preview' ? 'bg-emerald-600' : 'bg-zinc-700'}`}>
             <div className={`w-3 h-3 bg-white rounded-full transform transition-transform ${state.modelType === 'gemini-3-pro-preview' ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </button>
        
        <button 
          onClick={onToggleThinking}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-900 transition-colors text-xs font-medium text-zinc-400"
        >
          <div className="flex items-center gap-2">
            <ICONS.Brain />
            <span>Advanced Reasoning</span>
          </div>
          <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${state.useThinking ? 'bg-emerald-600' : 'bg-zinc-700'}`}>
             <div className={`w-3 h-3 bg-white rounded-full transform transition-transform ${state.useThinking ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </button>

        <div className="px-3 pt-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
            <ICONS.User />
          </div>
          <div className="flex-grow min-w-0">
            <div className="text-sm font-medium text-zinc-200 truncate">Advanced User</div>
            <div className="text-xs text-zinc-500 truncate">Premium Account</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
