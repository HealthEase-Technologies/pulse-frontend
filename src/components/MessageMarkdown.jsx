import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MessageMarkdown({ content }) {
  if (!content) return null;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ node, ...props }) => (
          <h1 className="text-base font-bold mt-3 mb-1.5 text-white/85" {...props} />
        ),
        h2: ({ node, ...props }) => (
          <h2 className="text-sm font-bold mt-3 mb-1 text-white/80" {...props} />
        ),
        h3: ({ node, ...props }) => (
          <h3 className="text-sm font-semibold mt-2 mb-1 text-white/75" {...props} />
        ),
        p: ({ node, ...props }) => (
          <p className="mb-2 leading-relaxed text-white/75" {...props} />
        ),
        ul: ({ node, ...props }) => (
          <ul className="list-disc ml-5 my-2 space-y-1" {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className="list-decimal ml-5 my-2 space-y-1" {...props} />
        ),
        li: ({ node, ...props }) => (
          <li className="leading-relaxed text-white/70" {...props} />
        ),
        strong: ({ node, ...props }) => (
          <strong className="font-bold text-white/90" {...props} />
        ),
        em: ({ node, ...props }) => (
          <em className="italic text-white/65" {...props} />
        ),
        code: ({ node, inline, ...props }) => (
          inline ? (
            <code className="bg-white/[0.08] border border-white/[0.1] px-1.5 py-0.5 rounded text-xs font-mono text-indigo-300" {...props} />
          ) : (
            <code className="block bg-white/[0.06] border border-white/[0.08] p-3 rounded-lg text-xs font-mono my-2 overflow-x-auto text-white/70" {...props} />
          )
        ),
        a: ({ node, ...props }) => (
          <a className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2" {...props} />
        ),
        blockquote: ({ node, ...props }) => (
          <blockquote className="border-l-2 border-indigo-500/40 pl-3 my-2 italic text-white/45" {...props} />
        ),
        hr: ({ node, ...props }) => (
          <hr className="border-white/[0.08] my-3" {...props} />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
