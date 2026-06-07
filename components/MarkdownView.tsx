'use client'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-6 mb-3 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mt-6 mb-2 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold text-slate-900 mt-5 mb-2 first:mt-0">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-slate-700 leading-relaxed mb-3 last:mb-0">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-900">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-slate-700">{children}</em>,
  ul: ({ children }) => (
    <ul className="list-disc pl-5 space-y-1 my-3 text-slate-700">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 space-y-1 my-3 text-slate-700">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-3 border-teal-500 pl-4 italic text-slate-700 my-3">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-slate-200 my-5" />,
  code: ({ children }) => (
    <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[0.9em] font-mono">
      {children}
    </code>
  ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto -mx-1">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b-2 border-slate-300">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-slate-100 last:border-b-0">{children}</tr>,
  th: ({ children }) => (
    <th className="text-left font-semibold text-slate-900 px-3 py-2 text-xs uppercase tracking-wide">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="px-3 py-2 text-slate-700 align-top">{children}</td>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-teal-700 underline hover:text-teal-900">
      {children}
    </a>
  ),
}

export function MarkdownView({ markdown, className }: { markdown: string; className?: string }) {
  return (
    <div className={cn('text-sm sm:text-base', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
