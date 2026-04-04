import Link from 'next/link'

interface BlogFooterProps {
  lang?: 'pt-BR' | 'en'
}

export function BlogFooter({ lang = 'pt-BR' }: BlogFooterProps) {
  const isPtBr = lang === 'pt-BR'
  const year = new Date().getFullYear()

  return (
    <footer style={{ background: '#000', color: '#fff', padding: '3.5rem 1.5rem 2rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '200px 1fr',
            gap: '3rem',
            marginBottom: '2.5rem',
          }}
          className="footer-grid"
        >
          {/* Logo + wordmark */}
          <div>
            <img
              src="/brand/chattie-wordmark.png"
              alt="Chattie"
              style={{
                height: 36,
                filter: 'invert(1)',
                opacity: 0.9,
                marginBottom: '1rem',
              }}
            />
            <p style={{ fontSize: '0.82rem', color: '#777', lineHeight: 1.6 }}>
              {isPtBr
                ? 'O AI SDR criado para prospecção B2B no LinkedIn.'
                : 'The AI SDR built for LinkedIn B2B prospecting.'}
            </p>
          </div>

          {/* Link columns */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '2rem',
            }}
          >
            <div>
              <h4 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#555', marginBottom: '1rem' }}>
                Blog
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Link href="/pt-br/blog" style={linkStyle}>{isPtBr ? 'Artigos PT-BR' : 'PT-BR Articles'}</Link>
                <Link href="/blog" style={linkStyle}>{isPtBr ? 'Artigos EN' : 'EN Articles'}</Link>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#555', marginBottom: '1rem' }}>
                {isPtBr ? 'Produto' : 'Product'}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <a href="https://trychattie.com/#como-funciona" target="_blank" rel="noopener noreferrer" style={linkStyle}>{isPtBr ? 'Como funciona' : 'How it works'}</a>
                <a href="https://trychattie.com/#pricing" target="_blank" rel="noopener noreferrer" style={linkStyle}>{isPtBr ? 'Preços' : 'Pricing'}</a>
                <a href="https://trychattie.com/#sandbox" target="_blank" rel="noopener noreferrer" style={linkStyle}>Sandbox</a>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#555', marginBottom: '1rem' }}>
                {isPtBr ? 'Empresa' : 'Company'}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <a href="https://trychattie.com" target="_blank" rel="noopener noreferrer" style={linkStyle}>{isPtBr ? 'Site principal' : 'Main site'}</a>
                <a href="https://www.linkedin.com/company/trychattie" target="_blank" rel="noopener noreferrer" style={linkStyle}>LinkedIn</a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.78rem',
            color: '#555',
            borderTop: '1px solid #1f1f1f',
            paddingTop: '2rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span>© {year} Chattie. {isPtBr ? 'Todos os direitos reservados.' : 'All rights reserved.'}</span>
          <span>{isPtBr ? 'Feito para founders que vendem pelo LinkedIn.' : 'Built for founders who sell on LinkedIn.'}</span>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  )
}

const linkStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: '#ccc',
  textDecoration: 'none',
  display: 'block',
  transition: 'color 0.15s',
}
