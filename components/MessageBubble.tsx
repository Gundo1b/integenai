
import React from 'react';
import { Message, Role } from '../types';
import { ICONS } from '../constants';
import MarkdownRenderer from './MarkdownRenderer';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isAssistant = message.role === Role.ASSISTANT;

  return (
    <div className={`w-full py-6 sm:py-8 ${isAssistant ? 'bg-zinc-900/50' : 'bg-transparent'}`}>
      <div className="max-w-3xl mx-auto px-4 flex gap-3 sm:gap-6">
        <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center ${isAssistant ? 'bg-indigo-600 text-white' : 'bg-zinc-700 text-zinc-300'}`}>
          {isAssistant ? <ICONS.Bot /> : <ICONS.User />}
        </div>
        <div className="flex-grow min-w-0 space-y-3 sm:space-y-4">
          <div className="font-bold text-[10px] sm:text-xs text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            {isAssistant ? 'integen aichat' : 'You'}
            {isAssistant && message.isStreaming && (
              <span className="flex gap-1">
                <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </span>
            )}
          </div>
          
          {message.thinking && (
            <div className="bg-zinc-800/40 border-l-2 border-indigo-500/50 p-3 rounded-r-md">
              <div className="flex items-center gap-2 text-[10px] sm:text-xs font-medium text-indigo-400/80 mb-2">
                <ICONS.Brain />
                <span>REASONING</span>
              </div>
              <div className="text-xs sm:text-sm text-zinc-400 italic">
                {message.thinking}
              </div>
            </div>
          )}

          <div className="text-sm sm:text-base">
            <MarkdownRenderer content={message.content} />
          </div>
          
          {message.isStreaming && !message.content && (
            <div className="flex items-center gap-2 text-zinc-500 animate-pulse text-xs italic">
              Thinking...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
