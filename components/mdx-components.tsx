import type { MDXComponents } from 'mdx/types'
import Link from 'next/link'
import Image from 'next/image'

function CalloutBox({ children, type = 'info' }: { children: React.ReactNode; type?: 'info' | 'cta' | 'tip' }) {
  const styles: Record<string, React.CSSProperties> = {
    info: { background: '#E4C1F9', borderColor: '#000' },
    cta: { background: '#E57B33', borderColor: '#000', color: '#FAFBF3' },
    tip: { background: '#66BAC6', borderColor: '#000' },
  }
  return (
    <div
      style={{
        border: '2px solid #000',
        boxShadow: '4px 4px 0 #000',
        padding: '1.25rem 1.5rem',
        margin: '2rem 0',
        ...styles[type],
      }}
    >
      {children}
    </div>
  )
}

export function getMdxComponents(): MDXComponents {
  return {
    CalloutBox,
    h1: (props) => <h1 className="text-4xl font-black mb-4 leading-tight" {...props} />,
    h2: (props) => (
      <h2
        className="text-2xl font-extrabold mt-10 mb-4 border-b-2 border-black pb-2"
        {...props}
      />
    ),
    h3: (props) => <h3 className="text-xl font-bold mt-6 mb-3" {...props} />,
    p: (props) => <p className="mb-5 leading-relaxed text-[1.0625rem]" {...props} />,
    ul: (props) => <ul className="list-disc pl-6 mb-5 space-y-2" {...props} />,
    ol: (props) => <ol className="list-decimal pl-6 mb-5 space-y-2" {...props} />,
    li: (props) => <li className="leading-relaxed" {...props} />,
    blockquote: (props) => (
      <blockquote
        className="border-l-4 border-orange bg-orange/10 pl-4 py-3 my-6 italic"
        {...props}
      />
    ),
    code: (props) => (
      <code
        className="font-mono bg-black/10 px-1.5 py-0.5 rounded text-sm"
        {...props}
      />
    ),
    pre: (props) => (
      <pre
        className="bg-[#0B0C10] text-[#C5C6C7] p-6 my-6 overflow-x-auto border-2 border-black shadow-[4px_4px_0_black] text-sm"
        {...props}
      />
    ),
    a: ({ href, children, ...props }) => {
      if (href?.startsWith('/')) {
        return (
          <Link href={href} className="text-teal underline font-semibold hover:text-rust" {...props}>
            {children}
          </Link>
        )
      }
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-teal underline font-semibold hover:text-rust"
          {...props}
        >
          {children}
        </a>
      )
    },
    img: ({ src, alt, ...props }) => (
      <figure className="my-6">
        <img
          src={src}
          alt={alt}
          className="w-full border-2 border-black shadow-[4px_4px_0_black]"
          {...props}
        />
        {alt && <figcaption className="text-sm text-gray-600 mt-2 text-center">{alt}</figcaption>}
      </figure>
    ),
    table: (props) => (
      <div style={{ overflowX: 'auto', margin: '2rem 0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #000', fontSize: '0.9rem' }} {...props} />
      </div>
    ),
    thead: (props) => <thead style={{ background: '#000', color: '#FAFBF3' }} {...props} />,
    tbody: (props) => <tbody {...props} />,
    tr: (props) => <tr style={{ borderBottom: '1px solid #ddd' }} {...props} />,
    th: (props) => <th style={{ padding: '0.65rem 1rem', textAlign: 'left', fontFamily: "'Sherika', sans-serif", fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid #333', whiteSpace: 'nowrap' }} {...props} />,
    td: (props) => <td style={{ padding: '0.6rem 1rem', borderRight: '1px solid #e5e5e5', verticalAlign: 'top', lineHeight: 1.5 }} {...props} />,
    hr: () => <hr className="border-2 border-black my-8" />,
    strong: (props) => <strong className="font-black" {...props} />,
  }
}
