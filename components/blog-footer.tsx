import Link from 'next/link'

interface BlogFooterProps {
  lang?: 'pt-BR' | 'en'
}

export function BlogFooter({ lang = 'pt-BR' }: BlogFooterProps) {
  const isPtBr = lang === 'pt-BR'
  const year = new Date().getFullYear()

  return (
    <footer style={{ background: '#000', color: '#fff', padding: '3.5rem 1.5rem 0', overflow: 'hidden', position: 'relative' }}>

      {/* Inner grid — logo + 4 columns */}
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="footer-inner-grid">

          {/* Logo */}
          <a href="https://trychattie.com" target="_blank" rel="noopener noreferrer">
            <img
              src="/brand/chattie-wordmark.png"
              alt="Chattie"
              style={{ height: 34, filter: 'invert(1)' }}
            />
          </a>

          {/* Columns */}
          <div className="footer-cols">
            {/* Product */}
            <div>
              <h4 style={colHeadStyle}>{isPtBr ? 'Produto' : 'Product'}</h4>
              <div style={colLinksStyle}>
                <a href="https://trychattie.com/#como-funciona" target="_blank" rel="noopener noreferrer" style={linkStyle} className="footer-link">{isPtBr ? 'Como funciona' : 'How it works'}</a>
                <a href="https://trychattie.com/#sandbox" target="_blank" rel="noopener noreferrer" style={linkStyle} className="footer-link">Sandbox</a>
                <a href="https://trychattie.com/#pricing" target="_blank" rel="noopener noreferrer" style={linkStyle} className="footer-link">{isPtBr ? 'Preços' : 'Pricing'}</a>
                <a href="https://trychattie.com/#changelog" target="_blank" rel="noopener noreferrer" style={linkStyle} className="footer-link">Changelog</a>
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 style={colHeadStyle}>{isPtBr ? 'Empresa' : 'Company'}</h4>
              <div style={colLinksStyle}>
                <a href="https://trychattie.com" target="_blank" rel="noopener noreferrer" style={linkStyle} className="footer-link">{isPtBr ? 'Sobre nós' : 'About us'}</a>
                <Link href={isPtBr ? '/pt-br/blog' : '/blog'} style={linkStyle} className="footer-link">Blog</Link>
                <a href="https://www.linkedin.com/company/trychattie" target="_blank" rel="noopener noreferrer" style={linkStyle} className="footer-link">LinkedIn</a>
              </div>
            </div>

            {/* Blog */}
            <div>
              <h4 style={colHeadStyle}>Blog</h4>
              <div style={colLinksStyle}>
                <Link href="/pt-br/blog" style={linkStyle} className="footer-link">PT-BR</Link>
                <Link href="/blog" style={linkStyle} className="footer-link">EN</Link>
                <Link href="/pt-br/blog?cat=linkedin" style={linkStyle} className="footer-link">LinkedIn</Link>
                <Link href="/pt-br/blog?cat=social-selling" style={linkStyle} className="footer-link">Social Selling</Link>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 style={colHeadStyle}>Legal</h4>
              <div style={colLinksStyle}>
                <a href="https://trychattie.com/privacy" target="_blank" rel="noopener noreferrer" style={linkStyle} className="footer-link">{isPtBr ? 'Privacidade' : 'Privacy'}</a>
                <a href="https://trychattie.com/terms" target="_blank" rel="noopener noreferrer" style={linkStyle} className="footer-link">{isPtBr ? 'Termos' : 'Terms'}</a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.78rem',
          color: '#555',
          borderTop: '1px solid #1f1f1f',
          paddingTop: '2rem',
          marginTop: '2.5rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}>
          <span>© {year} Chattie. {isPtBr ? 'Todos os direitos reservados.' : 'All rights reserved.'}</span>
          <span>
            {isPtBr
              ? 'Automações enviam mensagens. O Chattie conversa. ✦'
              : 'Automation just sends messages. Chattie, actually talks. ✦'}
          </span>
        </div>
      </div>

      {/* Decorative wordmark — identical to website */}
      <div
        aria-hidden="true"
        style={{
          width: '140%',
          marginLeft: '-20%',
          marginTop: '2rem',
          marginBottom: '-7rem',
          pointerEvents: 'none',
          userSelect: 'none',
          WebkitMaskImage: 'linear-gradient(to bottom, black 30%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, black 30%, transparent 100%)',
        }}
      >
        <img
          src="/brand/chattie-wordmark.png"
          alt=""
          style={{ width: '100%', height: 'auto', filter: 'invert(1)', opacity: 0.18, display: 'block' }}
        />
      </div>

      <style>{`
        .footer-inner-grid {
          display: grid;
          grid-template-columns: 180px 1fr;
          gap: 3rem;
        }
        .footer-cols {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
        }
        .footer-link:hover { color: #fff !important; text-decoration: underline; }
        @media (max-width: 900px) {
          .footer-inner-grid { grid-template-columns: 1fr !important; }
          .footer-cols { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 480px) {
          .footer-cols { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  )
}

const colHeadStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#555',
  marginBottom: '1rem',
}

const colLinksStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
}

const linkStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: '#ccc',
  textDecoration: 'none',
  display: 'block',
  transition: 'color 0.15s',
}
