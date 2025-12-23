
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './components/Sidebar';
import MessageBubble from './components/MessageBubble';
import { AppState, ChatSession, Message, Role, ModelID } from './types';
import { ICONS, APP_NAME, AVAILABLE_MODELS } from './constants';
import { sendMessageToGemini, generateTitle } from './services/gemini';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('gemini-chat-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          isLoading: false,
          isSidebarOpen: window.innerWidth > 768,
        };
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    return {
      sessions: [],
      currentSessionId: null,
      isSidebarOpen: window.innerWidth > 768,
      isLoading: false,
      modelType: 'gemini-3-flash-preview',
      useThinking: false,
    };
  });

  const [input, setInput] = useState('');
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('gemini-chat-state', JSON.stringify({
      sessions: state.sessions,
      currentSessionId: state.currentSessionId,
      modelType: state.modelType,
      useThinking: state.useThinking,
    }));
  }, [state.sessions, state.currentSessionId, state.modelType, state.useThinking]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.sessions, state.currentSessionId]);

  const currentSession = state.sessions.find(s => s.id === state.currentSessionId);
  const currentModel = AVAILABLE_MODELS.find(m => m.id === state.modelType) || AVAILABLE_MODELS[0];

  const toggleSidebar = () => {
    setState(prev => ({ ...prev, isSidebarOpen: !prev.isSidebarOpen }));
  };

  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 768) {
      setState(prev => ({ ...prev, isSidebarOpen: false }));
    }
  };

  const handleNewChat = useCallback(() => {
    const newSession: ChatSession = {
      id: uuidv4(),
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now(),
    };
    setState(prev => ({
      ...prev,
      sessions: [newSession, ...prev.sessions],
      currentSessionId: newSession.id,
    }));
    closeSidebarOnMobile();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSelectSession = (id: string) => {
    setState(prev => ({ ...prev, currentSessionId: id }));
    closeSidebarOnMobile();
  };

  const handleDeleteSession = (id: string) => {
    setState(prev => {
      const newSessions = prev.sessions.filter(s => s.id !== id);
      const newCurrentId = prev.currentSessionId === id 
        ? (newSessions.length > 0 ? newSessions[0].id : null)
        : prev.currentSessionId;
      return { ...prev, sessions: newSessions, currentSessionId: newCurrentId };
    });
  };

  const selectModel = (id: string) => {
    setState(prev => ({ ...prev, modelType: id as ModelID }));
    setIsModelSelectorOpen(false);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || state.isLoading) return;

    const userPrompt = input.trim();
    setInput('');
    
    let targetSessionId = state.currentSessionId;
    let sessionsCopy = [...state.sessions];

    if (!targetSessionId) {
      const newSession: ChatSession = {
        id: uuidv4(),
        title: 'New Chat',
        messages: [],
        createdAt: Date.now(),
      };
      targetSessionId = newSession.id;
      sessionsCopy = [newSession, ...sessionsCopy];
    }

    const userMessage: Message = {
      id: uuidv4(),
      role: Role.USER,
      content: userPrompt,
      timestamp: Date.now(),
    };

    const assistantMessage: Message = {
      id: uuidv4(),
      role: Role.ASSISTANT,
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    const targetSession = sessionsCopy.find(s => s.id === targetSessionId);
    if (!targetSession) return;
    
    const historyForApi = [...targetSession.messages, userMessage];

    setState(prev => ({
      ...prev,
      isLoading: true,
      sessions: sessionsCopy.map(s => s.id === targetSessionId ? {
        ...s,
        messages: [...s.messages, userMessage, assistantMessage]
      } : s),
      currentSessionId: targetSessionId,
    }));

    try {
      // Note: Only Gemini models actually work. Others are for UI display as requested.
      const actualModel = state.modelType.startsWith('gemini') ? state.modelType : 'gemini-3-flash-preview';
      
      await sendMessageToGemini(
        historyForApi,
        actualModel,
        (text) => {
          setState(prev => ({
            ...prev,
            sessions: prev.sessions.map(s => s.id === targetSessionId ? {
              ...s,
              messages: s.messages.map(m => m.id === assistantMessage.id ? { ...m, content: text } : m)
            } : s)
          }));
        },
        state.useThinking
      );

      if (targetSession.messages.length === 0) {
        const newTitle = await generateTitle(userPrompt);
        setState(prev => ({
          ...prev,
          sessions: prev.sessions.map(s => s.id === targetSessionId ? { ...s, title: newTitle } : s)
        }));
      }

    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setState(prev => ({
        ...prev,
        sessions: prev.sessions.map(s => s.id === targetSessionId ? {
          ...s,
          messages: s.messages.map(m => m.id === assistantMessage.id ? { 
            ...m, 
            content: `Error: ${errorMessage}. Please check your connection or API key.`,
            isStreaming: false 
          } : m)
        } : s)
      }));
    } finally {
      setState(prev => ({
        ...prev,
        isLoading: false,
        sessions: prev.sessions.map(s => s.id === targetSessionId ? {
          ...s,
          messages: s.messages.map(m => m.id === assistantMessage.id ? { ...m, isStreaming: false } : m)
        } : s)
      }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden relative">
      {/* Mobile Backdrop */}
      {state.isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity"
          onClick={toggleSidebar}
        />
      )}

      <Sidebar 
        state={state}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onToggleThinking={() => setState(prev => ({ ...prev, useThinking: !prev.useThinking }))}
        onToggleModel={() => {}} // Legacy
      />

      <main className={`flex-grow flex flex-col h-full transition-all duration-300 ${state.isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
        {/* Header */}
        <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleSidebar}
              className={`p-2 hover:bg-zinc-800 rounded-lg md:hidden ${state.isSidebarOpen ? 'text-indigo-400' : 'text-zinc-400'}`}
            >
              <ICONS.Menu />
            </button>
            <div className="relative">
              <button 
                onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-900 transition-colors group"
              >
                <span className="text-sm font-semibold text-zinc-100">integen aichat</span>
                <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-400 font-mono uppercase tracking-tighter flex items-center gap-1 group-hover:border-zinc-500">
                  {currentModel.name.split(' ').pop()}
                  <ICONS.ChevronDown />
                </span>
              </button>

              {/* Model Dropdown */}
              {isModelSelectorOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsModelSelectorOpen(false)} />
                  <div className="absolute top-full left-0 mt-2 w-72 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 border-b border-zinc-800 bg-zinc-950/50">
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Select Intelligence</h3>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto p-1.5">
                      {AVAILABLE_MODELS.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => selectModel(model.id)}
                          className={`w-full text-left p-3 rounded-lg transition-all group relative ${
                            state.modelType === model.id ? 'bg-indigo-600/10 text-white' : 'hover:bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm">{model.name}</span>
                            {!model.isAvailable && (
                              <span className="text-[8px] px-1 py-0.5 rounded bg-zinc-800 text-zinc-500 uppercase">Beta</span>
                            )}
                            {state.modelType === model.id && (
                              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-500 mt-0.5 group-hover:text-zinc-400">{model.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
             <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
             </button>
          </div>
        </header>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-grow overflow-y-auto overflow-x-hidden scroll-smooth scrollbar-thin scrollbar-thumb-zinc-800"
        >
          {(!currentSession || currentSession.messages.length === 0) ? (
            <div className="h-full flex flex-col items-center justify-center p-6 max-w-2xl mx-auto text-center space-y-6 sm:space-y-8 animate-in fade-in zoom-in duration-700">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-indigo-500/20">
                <ICONS.Sparkles />
              </div>
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">How can I answer you today?</h2>
                <p className="text-zinc-500 text-base sm:text-lg">Equipped with <span className="text-indigo-400 font-medium">{currentModel.name}</span>. Ask me anything.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {[
                  "What are the benefits of mindfulness meditation?",
                  "Explain the theory of relativity in simple terms",
                  "Give me a list of high-protein vegetarian foods",
                  "What is the history of the Silk Road?"
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                    className="p-3 sm:p-4 text-left border border-zinc-800 rounded-xl hover:bg-zinc-900 transition-all group"
                  >
                    <div className="text-sm text-zinc-200 font-medium group-hover:text-indigo-400 transition-colors line-clamp-1">{suggestion}</div>
                    <div className="text-xs text-zinc-500 mt-1">Ask this question</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              {currentSession.messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              <div className="h-32 sm:h-40 flex-shrink-0" />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="fixed bottom-0 left-0 right-0 md:relative md:bg-transparent pointer-events-none z-20">
          <div className={`transition-all duration-300 ${state.isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
            <div className="bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-transparent pt-12 pb-6 px-4 pointer-events-none">
              <div className="max-w-3xl mx-auto w-full pointer-events-auto">
                <form 
                  onSubmit={handleSubmit}
                  className="relative bg-zinc-900/80 border border-zinc-800 rounded-2xl p-1.5 sm:p-2 shadow-2xl backdrop-blur-md group focus-within:border-indigo-500/50 transition-all"
                >
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${currentModel.name}...`}
                    rows={1}
                    className="w-full bg-transparent border-none focus:ring-0 resize-none py-2.5 sm:py-3 pl-3 sm:pl-4 pr-10 sm:pr-12 text-zinc-200 placeholder-zinc-500 max-h-[150px] sm:max-h-[200px] text-sm sm:text-base"
                    style={{ height: 'auto', minHeight: '40px' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = `${target.scrollHeight}px`;
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || state.isLoading}
                    className={`absolute right-2 sm:right-3 bottom-2 sm:bottom-3 p-1.5 sm:p-2 rounded-xl transition-all ${
                      input.trim() && !state.isLoading 
                        ? 'bg-white text-black hover:bg-indigo-400' 
                        : 'bg-zinc-800 text-zinc-500 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {state.isLoading ? (
                      <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ICONS.Send />
                    )}
                  </button>
                </form>
                <div className="text-[10px] text-center mt-2 text-zinc-600 uppercase tracking-widest hidden sm:block">
                  using {currentModel.name} intelligence by {currentModel.provider}.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
