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
    }}>

      {/* ── Inner grid: logo + 4 columns ─────────────────────────────── */}
      <div className="footer-inner-grid">

        {/* Logo — full mark with mascot, same as main site */}
        <a
          href={isPtBr ? 'https://trychattie.com/pt-br' : 'https://trychattie.com'}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'block' }}
        >
          <Image
            src="/brand/chattie-fullmark.png"
            alt="Chattie"
            width={140}
            height={40}
            style={{ height: 40, width: 'auto', filter: 'invert(1)', display: 'block' }}
          />
        </a>

        {/* 4 columns */}
        <div className="footer-cols">

          <div className="footer-col">
            <h4>{isPtBr ? 'Blog' : 'Blog'}</h4>
            <Col links={[
              { label: isPtBr ? 'Artigos PT-BR' : 'PT-BR Articles', href: '/pt-br/blog' },
              { label: isPtBr ? 'Artigos EN' : 'EN Articles',       href: '/blog' },
              { label: 'LinkedIn',       href: isPtBr ? '/pt-br/blog/categoria/linkedin'       : '/blog/category/linkedin' },
              { label: 'Social Selling', href: isPtBr ? '/pt-br/blog/categoria/social-selling' : '/blog/category/social-selling' },
              { label: isPtBr ? 'IA para Vendas' : 'AI for Sales',  href: isPtBr ? '/pt-br/blog/categoria/ia-para-vendas' : '/blog/category/ai-for-sales' },
            ]} />
          </div>

          <div className="footer-col">
            <h4>{isPtBr ? 'Recursos' : 'Resources'}</h4>
            <Col links={[
              { label: isPtBr ? 'Checklist de Prospecção' : 'Prospecting Checklist', href: isPtBr ? '/pt-br/recursos/checklist-prospeccao-linkedin'  : '/resources/linkedin-prospecting-checklist' },
              { label: isPtBr ? 'Templates de Mensagem'  : 'Connection Templates',   href: isPtBr ? '/pt-br/recursos/templates-mensagem-linkedin'     : '/resources/linkedin-connection-templates' },
              { label: isPtBr ? 'Script de Follow-up'    : 'Follow-up Script',       href: isPtBr ? '/pt-br/recursos/script-follow-up-linkedin'       : '/resources/linkedin-followup-script' },
            ]} />
          </div>

          <div className="footer-col">
            <h4>{isPtBr ? 'Produto' : 'Product'}</h4>
            <Col links={[
              { label: isPtBr ? 'Conhecer o Chattie' : 'Try Chattie', href: isPtBr ? 'https://trychattie.com/pt-br' : 'https://trychattie.com', external: true },
              { label: isPtBr ? 'Preços'             : 'Pricing',     href: isPtBr ? 'https://trychattie.com/pt-br#pricing' : 'https://trychattie.com/#pricing', external: true },
              { label: 'LinkedIn', href: 'https://www.linkedin.com/company/trychattie', external: true },
            ]} />
          </div>

          <div className="footer-col">
            <h4>Legal</h4>
            <Col links={[
              { label: isPtBr ? 'Privacidade' : 'Privacy', href: 'https://trychattie.com/privacy', external: true },
              { label: isPtBr ? 'Termos'      : 'Terms',   href: 'https://trychattie.com/terms',   external: true },
            ]} />
          </div>

        </div>
      </div>

      {/* ── Bottom bar ────────────────────────────────────────────────── */}
      <div className="footer-bottom">
        <span>© {year} Chattie. {isPtBr ? 'Todos os direitos reservados.' : 'All rights reserved.'}</span>
        <span>
          {isPtBr
            ? 'Automações enviam mensagens. O Chattie conversa. ✦'
            : 'Automation just sends messages. Chattie, actually talks. ✦'}
        </span>
      </div>

      {/* ── Decorative giant wordmark — same effect as main site ──────── */}
      <div
        aria-hidden="true"
        className="footer-wordmark"
      >
        <Image
          src="/brand/chattie-wordmark.png"
          alt=""
          width={1600}
          height={300}
          style={{ width: '100%', height: 'auto', filter: 'invert(1)', opacity: 0.18, display: 'block' }}
        />
      </div>

      <style>{`
        .footer-inner-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 180px 1fr;
          gap: 3rem;
          position: relative;
          z-index: 1;
        }
        .footer-cols {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
        }
        .footer-col h4 {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #555;
          margin-bottom: 1rem;
        }
        .footer-col a {
          display: block;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
          color: #ccc;
          text-decoration: none;
          transition: color 0.15s;
        }
        .footer-col a:hover { color: #fff; text-decoration: underline; }
        .footer-bottom {
          max-width: 1200px;
          margin: 2.5rem auto 0;
          padding-top: 2rem;
          border-top: 1px solid #1f1f1f;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.78rem;
          color: #555;
          flex-wrap: wrap;
          gap: 0.5rem;
          position: relative;
          z-index: 1;
        }
        .footer-wordmark {
          width: 140%;
          margin-left: -20%;
          margin-top: 2rem;
          margin-bottom: -7rem;
          pointer-events: none;
          user-select: none;
          display: block;
          -webkit-mask-image: linear-gradient(to bottom, black 30%, transparent 100%);
          mask-image: linear-gradient(to bottom, black 30%, transparent 100%);
        }
        @media (max-width: 1000px) {
          .footer-inner-grid { grid-template-columns: 1fr; }
          .footer-cols { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .footer-cols { grid-template-columns: 1fr; }
          .footer-bottom { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </footer>
  )
}

function Col({ links }: { links: { label: string; href: string; external?: boolean }[] }) {
  return (
    <>
      {links.map((l) =>
        l.external ? (
          <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">
            {l.label}
          </a>
        ) : (
          <Link key={l.href} href={l.href}>
            {l.label}
          </Link>
        )
      )}
    </>
  )
}
