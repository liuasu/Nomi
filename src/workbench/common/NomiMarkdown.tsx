import ReactMarkdown, { type Components } from 'react-markdown'

/**
 * Token-styled Markdown renderer.
 *
 * react-markdown emits bare HTML tags that, after Tailwind's preflight reset,
 * render with no hierarchy — so every tag is explicitly mapped to design-system
 * tokens here (font sizes, ink ladder, mono code, accent links). Used by the
 * file preview; the creation chat panel has its own legacy inline mapping that
 * should later fold into this (tracked separately).
 */
const components: Components = {
  h1: ({ node: _n, ...p }) => <h1 className="text-[20px] font-semibold leading-snug text-nomi-ink mt-4 mb-2 first:mt-0" {...p} />,
  h2: ({ node: _n, ...p }) => <h2 className="text-[16px] font-semibold leading-snug text-nomi-ink mt-4 mb-2 first:mt-0" {...p} />,
  h3: ({ node: _n, ...p }) => <h3 className="text-[14px] font-semibold leading-snug text-nomi-ink mt-3 mb-1.5 first:mt-0" {...p} />,
  p: ({ node: _n, ...p }) => <p className="text-[14px] leading-relaxed text-nomi-ink-80 my-2" {...p} />,
  ul: ({ node: _n, ...p }) => <ul className="list-disc pl-5 my-2 text-[14px] leading-relaxed text-nomi-ink-80" {...p} />,
  ol: ({ node: _n, ...p }) => <ol className="list-decimal pl-5 my-2 text-[14px] leading-relaxed text-nomi-ink-80" {...p} />,
  li: ({ node: _n, ...p }) => <li className="my-0.5" {...p} />,
  a: ({ node: _n, ...p }) => <a className="text-nomi-accent underline underline-offset-2" target="_blank" rel="noreferrer" {...p} />,
  blockquote: ({ node: _n, ...p }) => <blockquote className="border-l-2 border-nomi-line pl-3 my-2 text-nomi-ink-60" {...p} />,
  hr: ({ node: _n, ...p }) => <hr className="border-nomi-line my-3" {...p} />,
  code: ({ node: _n, className, children, ...p }) => {
    const isBlock = String(className || '').includes('language-')
    return isBlock
      ? <code className={`font-nomi-mono text-[12.5px] ${className || ''}`.trim()} {...p}>{children}</code>
      : <code className="font-nomi-mono text-[12.5px] bg-nomi-ink-05 rounded-nomi-sm px-1 py-0.5" {...p}>{children}</code>
  },
  pre: ({ node: _n, ...p }) => <pre className="bg-nomi-ink-05 rounded-nomi-sm p-3 my-2 overflow-auto text-nomi-ink-80" {...p} />,
}

export function NomiMarkdown({ children }: { children: string }): JSX.Element {
  return <ReactMarkdown components={components}>{children}</ReactMarkdown>
}
