/**
 * Markdown Renderer for Chat Messages
 * Uses react-markdown for proper markdown rendering
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MessageMarkdown({ content }) {
  if (!content) return null;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Headings
        h1: ({ node, ...props }) => (
          <h1 className="text-xl font-bold mt-4 mb-2 text-gray-900" {...props} />
        ),
        h2: ({ node, ...props }) => (
          <h2 className="text-lg font-bold mt-3 mb-2 text-gray-900" {...props} />
        ),
        h3: ({ node, ...props }) => (
          <h3 className="text-base font-semibold mt-3 mb-1 text-gray-900" {...props} />
        ),

        // Paragraphs
        p: ({ node, ...props }) => (
          <p className="mb-2 leading-relaxed" {...props} />
        ),

        // Lists
        ul: ({ node, ...props }) => (
          <ul className="list-disc ml-5 my-2 space-y-1" {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className="list-decimal ml-5 my-2 space-y-1" {...props} />
        ),
        li: ({ node, ...props }) => (
          <li className="leading-relaxed" {...props} />
        ),

        // Text formatting
        strong: ({ node, ...props }) => (
          <strong className="font-bold text-gray-900" {...props} />
        ),
        em: ({ node, ...props }) => (
          <em className="italic" {...props} />
        ),

        // Code
        code: ({ node, inline, ...props }) => (
          inline ? (
            <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props} />
          ) : (
            <code className="block bg-gray-100 p-2 rounded text-sm font-mono my-2 overflow-x-auto" {...props} />
          )
        ),

        // Links
        a: ({ node, ...props }) => (
          <a className="text-indigo-600 hover:text-indigo-700 underline" {...props} />
        ),

        // Blockquotes
        blockquote: ({ node, ...props }) => (
          <blockquote className="border-l-4 border-gray-300 pl-4 my-2 italic text-gray-700" {...props} />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
