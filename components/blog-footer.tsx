import Link from 'next/link'
import Image from 'next/image'

interface BlogFooterProps {
  lang?: 'pt-BR' | 'en'
}

export function BlogFooter({ lang = 'pt-BR' }: BlogFooterProps) {
  const isPtBr = lang === 'pt-BR'
  const year = new Date().getFullYear()

  return (
    <footer style={{
      background: '#000',
      color: '#fff',
      padding: '3.5rem 1.5rem 2rem',
      overflow: 'hidden',
      position: 'relative',
      borderTop: '4px solid #E57B33',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Inner: logo + 4 columns — identical to main site */}
        <div className="footer-inner-grid">

          {/* Logo */}
          <a href="https://trychattie.com" target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
            <Image
              src="/brand/chattie-wordmark.png"
              alt="Chattie"
              width={120}
              height={34}
              style={{ height: 34, width: 'auto', filter: 'invert(1)', display: 'block' }}
            />
          </a>

          {/* 3 columns */}
          <div className="footer-cols">

            <div>
              <h4 style={colHead}>Blog</h4>
              <Col links={[
                { label: isPtBr ? 'Artigos PT-BR' : 'PT-BR Articles', href: '/pt-br/blog', external: false },
                { label: isPtBr ? 'Artigos EN' : 'EN Articles', href: '/blog', external: false },
                { label: 'LinkedIn', href: isPtBr ? '/pt-br/blog/categoria/linkedin' : '/blog/category/linkedin', external: false },
                { label: 'Social Selling', href: isPtBr ? '/pt-br/blog/categoria/social-selling' : '/blog/category/social-selling', external: false },
              ]} />
            </div>

            <div>
              <h4 style={colHead}>{isPtBr ? 'Produto' : 'Product'}</h4>
              <Col links={[
                { label: isPtBr ? 'Conhecer o Chattie' : 'Try Chattie', href: 'https://trychattie.com', external: true },
                { label: isPtBr ? 'Preços' : 'Pricing', href: 'https://trychattie.com/#pricing', external: true },
                { label: 'LinkedIn', href: 'https://www.linkedin.com/company/trychattie', external: true },
              ]} />
            </div>

            <div>
              <h4 style={colHead}>Legal</h4>
              <Col links={[
                { label: isPtBr ? 'Privacidade' : 'Privacy', href: 'https://trychattie.com/privacy', external: true },
                { label: isPtBr ? 'Termos' : 'Terms', href: 'https://trychattie.com/terms', external: true },
              ]} />
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

      {/* Decorative wordmark — fills bottom, same as main site */}
      <div
        aria-hidden="true"
        style={{
          width: '140%',
          marginLeft: '-20%',
          marginTop: '2rem',
          marginBottom: '-7rem',
          pointerEvents: 'none',
          userSelect: 'none',
          display: 'block',
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
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }
        .footer-col-link { color: #ccc; text-decoration: none; font-size: 0.875rem; display: block; margin-bottom: 0.5rem; transition: color 0.15s; }
        .footer-col-link:hover { color: #fff; text-decoration: underline; }
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

function Col({ links }: { links: { label: string; href: string; external: boolean }[] }) {
  return (
    <div>
      {links.map((l) =>
        l.external ? (
          <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="footer-col-link">
            {l.label}
          </a>
        ) : (
          <Link key={l.href} href={l.href} className="footer-col-link">
            {l.label}
          </Link>
        )
      )}
    </div>
  )
}

const colHead: React.CSSProperties = {
  fontSize: '0.72rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#555',
  marginBottom: '1rem',
}
