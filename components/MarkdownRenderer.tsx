
import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

/**
 * A simplified Markdown-like renderer. 
 * In a real-world app, we would use react-markdown, 
 * but for this single-file requirement, we'll use regex for basic formatting.
 */
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const parseMarkdown = (text: string) => {
    // Escape HTML
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<div class="relative group">
        <div class="absolute right-2 top-2 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity uppercase">${lang || 'code'}</div>
        <pre class="bg-zinc-900 border border-zinc-800 p-4 rounded-lg overflow-x-auto my-4 text-sm font-mono text-blue-400"><code>${code.trim()}</code></pre>
      </div>`;
    });

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-zinc-800 px-1.5 py-0.5 rounded text-pink-400 text-sm font-mono">$1</code>');

    // Lists
    html = html.replace(/^\s*[-*+]\s+(.*)$/gm, '<li class="ml-4 list-disc">$1</li>');
    
    // Line breaks
    html = html.replace(/\n/g, '<br />');

    return html;
  };

  return (
    <div 
      className="markdown-content text-zinc-200 leading-relaxed break-words whitespace-pre-wrap"
      dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
    />
  );
};

export default MarkdownRenderer;
